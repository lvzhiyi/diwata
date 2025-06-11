import { Game, game, sys, SystemEvent } from "cc";
import { WsMessage, WsClientConfig } from "./SocketType";
import { DEBUG } from "cc/env";


/**
 * WebSocket 客户端事件类型定义
 */
type EventMap = {
    open: () => void;          // 连接成功事件
    close: (reason: string) => void; // 连接关闭事件
    error: (error: Error) => void; // 错误发生事件
    message: <T = any>(message: WsMessage<T>) => void; // 消息接收事件
};

/**
 * WebSocket 客户端核心类
 * 功能特性：
 * 1. 自动重连机制（指数退避策略）
 * 2. 心跳保活机制
 * 3. 连接状态管理
 * 4. 事件驱动架构
 */
export class SocketConnect {
    // region 成员变量
    private socket: WebSocket | null = null;     // WebSocket 实例
    private reconnectAttempts = 0;              // 当前重连尝试次数
    private timers: number[] = [];               // 定时器集合（用于清理）
    private heartbeatTimer: number | null = null; // 心跳定时器ID
    private lastActivity = 0;                    // 最后活跃时间戳（用于心跳检测）
    private listeners = new Map<string, Set<Function>>(); // 事件监听器集合
    private isAppForeground = true;
    private serverDisconnected = false;//服务器主动断开连接
    // endregion

    // region 构造函数
    constructor(private config: WsClientConfig) {
        // 合并默认配置与用户配置
        this.config = {
            maxReconnectAttempts: 5,     // 默认最多重试5次
            reconnectBaseDelay: 3000,    // 基础重连延迟3秒
            heartbeatInterval: 5000,    // 默认心跳间隔15秒
            ...config
        };
    }
    // endregion

    // region 公开方法
    /**
     * 建立 WebSocket 连接
     */
    connect(): void {
        this.disconnect(); // 确保清理现有连接
        console.log('[WebSocket] 连接中');
        // 构造符合协议要求的 WS 地址
        const url = this.config.url;
        this.socket = new WebSocket(url);
        // 绑定原生事件处理器
        this.socket.onopen = () => this.handleOpen();
        this.socket.onmessage = (e) => this.handleMessage(e);
        this.socket.onclose = (e) => this.handleClose(e);
        this.socket.onerror = (e) => this.handleError(e);
    }

    /**
     * 发送消息
     * @param type 消息类型（对应协议文档中的 msgType）
     * @param data 消息体数据
     * @returns 生成的消息ID（可用于追踪）
     */
    send<T>(type: string, data: T): string {
        if (!this.isConnected) throw new Error('连接未就绪');

        // 生成唯一消息ID（基于时间戳和随机数）
        const msgId = this.generateMsgId();
        const message = JSON.stringify({
            msgId,
            msgType: type,
            msgBody: data
        });

        this.socket?.send(message);
        return msgId;
    }

    /**
     * 注册事件监听器
     * @param event 事件类型
     * @param listener 监听回调函数
     */
    on<K extends keyof EventMap>(event: K, listener: EventMap[K]): void {
        const listeners = this.listeners.get(event) || new Set();
        listeners.add(listener);
        this.listeners.set(event, listeners);
    }

    /**
     * 移除事件监听器
     * @param event 事件类型
     * @param listener 可选，指定要移除的监听器
     */
    off<K extends keyof EventMap>(event: K, listener?: EventMap[K]): void {
        if (!listener) {
            this.listeners.delete(event);
            return;
        }
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.delete(listener);
        }
    }

    /**
     * 主动断开连接
     */
    disconnect(): void {
        this.stopHeartbeat();    // 停止心跳检测
        this.clearTimers();      // 清理所有定时器
        this.socket?.close();    // 关闭WebSocket连接
        this.socket = null;      // 释放实例引用
        // this.reconnectAttempts = 0; // 重置重连计数器
    }
    // endregion

    // region 私有方法 - 事件处理
    /**
     * 处理连接成功事件
     */
    private handleOpen() {
        this.lastActivity = Date.now(); // 记录活跃时间
        this.reconnectAttempts = 0;     // 重置重连计数器
        this.startHeartbeat();          // 启动心跳检测
        this.emit('open');              // 触发开放事件
        console.log('[WebSocket] 连接成功');
        this.serverDisconnected = false;//连接成功需要重置状态
    }

    /**
     * 处理消息接收事件
     * @param event 原始消息事件
     */
    private handleMessage(event: MessageEvent) {
        try {
            // 解析消息（兼容纯文本心跳响应）
            const message = this.parseMessage(event.data);
            this.updateActivity(); // 更新最后活跃时间
            if(message !=null){
                this.emit('message', message); // 触发消息事件
            }
        } catch (error) {
            this.emit('error', error as Error); // 触发解析错误
        }
    }

    /**
     * 解析原始消息数据
     * @param data 原始消息字符串
     * @returns 标准化消息对象
     */
    private parseMessage(data: string): WsMessage {
        const resMessage:WsMessage = JSON.parse(data)
        // 处理纯文本心跳响应（根据协议文档）
        if (resMessage.msgBody === 'ALIVE') {
            if (DEBUG) {
                console.log('[WebSocket] 收到心跳响应');
            }
            return null;
        }else if(resMessage.msgType === 'SINGLE_OFFLINE_RES'){
            this.serverDisconnected = true;//服务器主动断开连接
            this.emit('close', '服务器主动断开连接');
        }
        return resMessage;
    }

    /**
     * 处理连接关闭事件
     * @param event 关闭事件对象
     */
    private handleClose(event: CloseEvent) {
        this.emit('close', event.reason); // 传递关闭原因
        // 非正常关闭时触发重连
        if (!event.wasClean) {
            console.log('[WebSocket] ',this.reconnectAttempts);
            this.scheduleReconnect();
        }
    }

    /**
     * 处理错误事件
     */
    private handleError(event: Event) {
        this.emit('error', new Error('WebSocket错误发生'));
        console.log('[WebSocket] WebSocket错误发生');
    }
    // endregion

    // region 心跳管理
    /**
     * 启动心跳检测
     */
    private startHeartbeat() {
        this.stopHeartbeat(); // 确保清理旧定时器

        // 立即发送首个心跳包（快速建立活性检测）
        this.sendHeartbeat();

        // 设置周期性心跳检测
        this.heartbeatTimer = window.setInterval(() => {
            // 检测心跳超时（允许两倍间隔时间）
            if (Date.now() - this.lastActivity > this.config.heartbeatInterval! * 2) {
                this.handleConnectionLost();
                return;
            }
            this.sendHeartbeat();
        }, this.config.heartbeatInterval);
    }

    /**
     * 发送心跳请求（符合协议规范）
     */
    private sendHeartbeat() {
        if (this.isConnected) {
            // 发送标准心跳消息结构
            try {
                const msgId = this.send('HEART_BEAT_REQ', { ping: 'ping' });
                // console.log(`[WebSocket] 心跳消息已发送: ${msgId}`);
            } catch (error) {
                console.error('[WebSocket] 心跳消息发送失败，尝试重连', error);
                this.handleConnectionLost();
            }
        }
    }
    /**
     * 停止心跳检测
     */
    private stopHeartbeat() {
        if (this.heartbeatTimer !== null) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * 更新最后活跃时间
     */
    private updateActivity() {
        this.lastActivity = Date.now();
    }

    /**
     * 处理连接丢失
     */
    private handleConnectionLost() {
        this.emit('error', new Error('连接丢失'));
        console.log('[WebSocket] 连接丢失');
        this.disconnect();
        this.scheduleReconnect();
    }
    // endregion

    // region 重连管理
    /**
     * 调度重连（指数退避算法）
     */
    private scheduleReconnect() {
        // 如果是服务器告诉客户端断开连接，则不进行重连
        if (this.serverDisconnected){
            console.log('[WebSocket] 服务器主动断开连接，不进行重连');
            return;
        } 
        // 超过最大重连次数则放弃
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) return;

        // 计算退避延迟时间（最大值限制为30秒）
        const delay = Math.min(
            this.config.reconnectBaseDelay! * Math.pow(2, this.reconnectAttempts),
            30000
        );
        this.reconnectAttempts++;
        // console.log('[WebSocket] 重连中',this.reconnectAttempts);
        // 设置重连定时器
        const timer = window.setTimeout(() => this.connect(), delay);
        this.timers.push(timer);
    }
    // endregion

    // region 工具方法
    /**
     * 生成唯一消息ID（基于时间戳和随机数）
     */
    private generateMsgId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 清理所有定时器
     */
    private clearTimers() {
        this.timers.forEach(t => clearTimeout(t));
        this.timers = [];
    }

    /**
     * 触发事件通知
     * @param event 事件类型
     * @param args 事件参数
     */
    private emit<K extends keyof EventMap>(event: K, ...args: Parameters<EventMap[K]>) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(fn => (fn as any)(...args));
        }
    }

    /**
     * 获取当前连接状态
     */
    get isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    private initAppStateListener() {
        // 适配Cocos多平台的事件监听
        if (sys.isBrowser) {
            // Web 平台使用 visibilitychange
            document.addEventListener('visibilitychange', () => {
                this.handleVisibilityChange(document.visibilityState === 'visible');
            });
        } else {
            // 通用事件监听（兼容所有平台）
            game.on(Game.EVENT_HIDE, this.onAppBackground, this);
            game.on(Game.EVENT_SHOW, this.onAppForeground, this);
        }
    }

    private handleVisibilityChange(visible: boolean) {
        if (visible) {
            this.onAppForeground();
        } else {
            this.onAppBackground();
        }
    }

    private onAppForeground() {
        console.log('[App] 回到前台');
        this.isAppForeground = true;
        // 延迟检测确保组件已恢复
        setTimeout(() => {
            if (!this.isConnected) {
                console.log('[Network] 触发前台重连');
                this.connect();
            }
        }, 1000);
    }

    private onAppBackground() {
        console.log('[App] 进入后台');
        this.isAppForeground = false;

        // 原生平台可能需要主动关闭连接
        if (sys.isNative) {
            this.socket?.close();
        }
    }
}