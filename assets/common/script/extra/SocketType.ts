

/**
 * WebSocket 客户端配置项
 */
export interface WsClientConfig {
    url: string;               // 服务器主机地址
    token: string;              // 身份验证令牌
    maxReconnectAttempts?: number; // 最大重连尝试次数
    reconnectBaseDelay?: number;   // 基础重连延迟时间（毫秒）
    heartbeatInterval?: number;    // 心跳检测间隔（毫秒）
  }
  
  /**
   * WebSocket 通用消息结构
   */
  export interface WsMessage<T = any> {
    code: string;          // 状态码 1:成功.2.失败。string
    errMsg: string;        // 响应message
    msgId: string;         // 消息id string
    msgType: string;       // 响应消息类型 string
    time: number;          // 响应时间戳 long
    traceId: string;       // traceId
    ip: string;            // 当前业务处理服务器ip
    msgBody: any;          // 响应体，jsonString。见具体接口       // 扩展字段，兼容不同消息格式
  }

  export interface WsResMessage {
    code: string;          // 状态码 1:成功.2.失败。string
    errMsg: string;        // 响应message
    msgId: string;         // 消息id string
    msgType: string;       // 响应消息类型 string
    time: number;          // 响应时间戳 long
    traceId: string;       // traceId
    ip: string;            // 当前业务处理服务器ip
    msgBody: any;          // 响应体，jsonString。见具体接口
}

