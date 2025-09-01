import { _decorator, Component, Node, Label, tween, Vec3, UIOpacity, instantiate, Prefab, Widget } from 'cc';

const { ccclass, property } = _decorator;

interface ToastOptions {
  /** toast显示持续时间 */
  duration?: number;
  /** 淡入动画时间 */
  fadeInTime?: number;
  /** 淡出动画时间 */
  fadeOutTime?: number;
  /** toast显示位置偏移 */
  offset?: Vec3;
  /** 自定义prefab路径 */
  prefab?: Prefab;
  /** Label节点名称 */
  labelNodeName?: string;
  /** 直接传入的节点，如果传入则无需通过prefab创建 */
  node?: Node;
}

interface ToastItem {
  /** toast节点实例 */
  node: Node;
  /** 显示文本的Label组件 */
  label: Label;
  /** 控制透明度的组件 */
  uiOpacity: UIOpacity;
  /** toast的配置选项 */
  options: ToastOptions;
  /** 显示的文本内容 */
  text: string;
}

interface QueuedToast {
  /** 待显示的文本内容 */
  text: string;
  /** toast的配置选项 */
  options?: ToastOptions;
}

@ccclass('ToastManager')
export class ToastManager extends Component {
  /** 单例实例 */
  private static _instance: ToastManager = null;

  /** Toast中Label节点的名称 */
  @property({ tooltip: 'Toast中Label节点的名称' })
  private labelNodeName = 'text';

  /** 默认的Toast预制体 */
  @property(Prefab)
  private defaultPrefab: Prefab = null;

  /** 最大同时显示的toast数量 */
  @property({ tooltip: '最大同时显示的toast数量' })
  private maxVisibleToasts = 3;

  /** 两次toast显示的最小间隔(秒) */
  @property({ tooltip: '两次toast显示的最小间隔(秒)' })
  private minShowInterval = 0.1;

  /** Toast的默认配置选项 */
  private defaultOptions: ToastOptions = {
    duration: 1.5,
    fadeInTime: 0.2,
    fadeOutTime: 0.2,
    offset: new Vec3(0, 0, 0)
  };

  /** 向上滑动的距离 */
  private readonly slideDistance = 100;

  /** 当前正在显示的toast列表 */
  private activeToasts: ToastItem[] = [];

  /** toast之间的垂直间距 */
  private toastSpacing = 120;

  /** 预制体缓存 */
  private prefabCache: Map<string, Prefab> = new Map();

  /** 待显示的消息队列 */
  private messageQueue: QueuedToast[] = [];

  /** 是否正在处理队列 */
  private isProcessingQueue = false;

  /** 上一次显示toast的时间戳 */
  private lastShowTime = 0;

  public static get inst(): ToastManager {
    return ToastManager._instance;
  }

  protected onLoad(): void {
    // 初始化单例实例
    if (ToastManager._instance === null) {
      ToastManager._instance = this;
    }

    // 确保ToastManager节点设置正确
    const widget = this.getComponent(Widget);

    if (widget) {
      widget.enabled = false;
    }

    // 设置节点属性
    this.node.setPosition(0, 0, 0);
  }

  protected onDestroy(): void {
    // 清理资源
    if (ToastManager._instance === this) {
      ToastManager._instance = null;
    }

    this.activeToasts.forEach(toast => {
      toast.node.destroy();
    });
    this.activeToasts = [];
    this.prefabCache.clear();
    this.messageQueue = [];
  }

  /**
   * 检查是否可以显示新的toast
   * @returns 是否可以显示新的toast
   */
  private shouldShowToast(): boolean {
    const now = Date.now();

    // 检查时间间隔和最大显示数量限制
    if (now - this.lastShowTime < this.minShowInterval * 1000) {
      return false;
    }

    return this.activeToasts.length < this.maxVisibleToasts;
  }

  /**
   * 处理消息队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0) {
      if (this.shouldShowToast()) {
        const { text, options } = this.messageQueue.shift();
        const toastItem = await this.createToastNode(text, options || {});

        if (toastItem) {
          this.lastShowTime = Date.now();
          this.activeToasts.push(toastItem);
          this.updateToastPositions();
          this.displayToast(toastItem);
        }
      } else {
        // 等待一段时间后再次检查
        await new Promise(resolve => setTimeout(resolve, this.minShowInterval * 1000));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * 创建toast节点
   * @param text 显示的文本内容
   * @param options 配置选项
   * @returns Promise<ToastItem>
   */
  private async createToastNode(text: string, options: ToastOptions): Promise<ToastItem> {
    let node: Node;
    let label: Label = null;
    
    // 如果直接传入了节点，使用传入的节点
    if (options.node) {
      node = options.node;
    } else {
      // 通过预制体创建节点
      let prefab: Prefab;
      
      if (options.prefab) {
        prefab = options.prefab;
      } else {
        prefab = this.defaultPrefab;
      }

      if (!prefab) {
        console.error('找不到可用的Toast预制体');

        return null;
      }

      node = instantiate(prefab);
    }

    node.active = true;
    node.parent = this.node;

    // 检查并禁用Widget组件，防止其影响位置
    const widget = node.getComponent(Widget);

    if (widget) {
      widget.enabled = false;
    }

    // 设置初始位置
    const mergedOptions = { ...this.defaultOptions, ...options };
    node.position = mergedOptions.offset;
    
    // 只有在非直接传入节点时才需要查找并设置Label
    if (!options.node) {
      // 获取并设置Label组件
      const labelNodeName = options.labelNodeName || this.labelNodeName;
      label = this.findChild(node, labelNodeName)?.getComponent(Label);

      if (!label) {
        console.error(`找不到Label组件，节点名称: ${labelNodeName}`);
        node.destroy();

        return null;
      }

      label.string = text;
    }
    
    // 获取UIOpacity组件
    let uiOpacity = node.getComponent(UIOpacity);
    
    // 如果节点没有UIOpacity组件，自动添加一个
    if (!uiOpacity) {
      uiOpacity = node.addComponent(UIOpacity);
    }

    uiOpacity.opacity = 0;
    
    return {
      node,
      label,
      uiOpacity,
      options: mergedOptions,
      text
    };
  }

  /**
   * 更新所有toast的位置
   */
  private updateToastPositions(): void {
    this.activeToasts.forEach((toast, index) => {
      const baseOffset = toast.options.offset;
      // 计算实际的Y轴位置：基础偏移 + 间距
      const actualY = baseOffset.y + (this.activeToasts.length - 1 - index) * this.toastSpacing;
      // 使用setPosition方法设置位置
      toast.node.setPosition(baseOffset.x, actualY, baseOffset.z);
    });
  }

  /**
   * 显示toast动画
   * @param toastItem 要显示的toast项
   */
  private async displayToast(toastItem: ToastItem): Promise<void> {
    if (!toastItem) return;

    const {
      node, uiOpacity, options 
    } = toastItem;
    const mergedOptions = { ...this.defaultOptions, ...options };

    // 执行淡入动画
    await new Promise<void>((resolve) => {
      tween(uiOpacity)
        .to(mergedOptions.fadeInTime, { opacity: 255 })
        .call(() => resolve())
        .start();
    });

    // 等待显示时间
    await new Promise<void>((resolve) => {
      this.scheduleOnce(() => resolve(), mergedOptions.duration);
    });

    // 执行向上滑动和淡出动画
    await new Promise<void>((resolve) => {
      const startPos = node.position;
      const endPos = new Vec3(
        startPos.x,
        startPos.y + this.slideDistance,
        startPos.z
      );

      // 同步执行位置和透明度动画
      tween(node)
        .to(mergedOptions.fadeOutTime, { position: endPos })
        .start();

      tween(uiOpacity)
        .to(mergedOptions.fadeOutTime, { opacity: 0 })
        .call(() => {
          const index = this.activeToasts.indexOf(toastItem);

          if (index > -1) {
            this.activeToasts.splice(index, 1);
            node.destroy();
            this.updateToastPositions();
          }

          resolve();
        })
        .start();
    });
  }

  /**
   * 根据名称查找节点，支持查找孙节点
   * @param node 起始节点
   * @param name 要查找的节点名称
   * @returns 找到的节点，未找到返回null
   */
  private findChild(node: Node, name: string): Node {
    if (!node) return null;
    
    // 先查找直接子节点
    const child = node.getChildByName(name);
    if (child) return child;
    
    // 递归查找所有子节点
    for (let i = 0; i < node.children.length; i++) {
      const result = this.findChild(node.children[i], name);
      if (result) return result;
    }
    
    return null;
  }

  /**
   * 显示Toast消息
   * @param text Toast显示的文本内容
   * @param options Toast的配置选项
   */
  public async show(text: string, options?: ToastOptions): Promise<void> {
    // 将消息加入队列
    this.messageQueue.push({ text, options });
    
    // 限制队列长度，防止内存占用过大
    if (this.messageQueue.length > this.maxVisibleToasts * 2) {
      this.messageQueue = this.messageQueue.slice(-this.maxVisibleToasts * 2);
    }
    
    // 开始处理队列
    this.processQueue();
  }
} 