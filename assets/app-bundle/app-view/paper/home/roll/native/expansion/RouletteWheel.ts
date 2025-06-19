import { _decorator, Component, Node, Label, tween, UITransform, view, instantiate, Prefab, Vec3, Sprite, Color, input, Input, EventTouch, math } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('RouletteWheel')
export class RouletteWheel extends Component {
  @property(Node)
  private wheelNode: Node = null;

  @property(Node)
  private ItemNode: Node = null;

  // swiper相关属性
  private items: Node[] = [];

  private dataList: number[] = [];

  private currentRotation: number = 0;

  private isAnimating: boolean = false;
  
  // 弧形参数
  // 弧形半径
  private readonly ARC_RADIUS = 350;

  // 总弧度135度
  private readonly ARC_DEGREE = 135;

  // 可视区域宽度
  private readonly VIEW_WIDTH = 750;

  // 数据间的角度间隔（整个圆周分配给所有数据）
  // 360度 / 11个数据项
  private readonly DATA_ANGLE_STEP = 360 / 11;
  
  // 触摸相关
  private startTouchX: number = 0;

  private isTouching: boolean = false;

  protected onLoad(): void {
    this.initData();
    this.createItems();
    this.updateItemsPosition();
    this.registerTouchEvents();
    this.setupViewClipping();
  }

  /**
   * 初始化数据：x1, x2, x4, x8, ..., x1024
   */
  private initData(): void {
    this.dataList = [];

    for (let i = 0; i <= 10; i++) {
      const data = Math.pow(2, i);
      this.dataList.push(data);
    }
  }

  /**
   * 创建item节点
   */
  private createItems(): void {
    if (!this.ItemNode || !this.wheelNode) {
      console.error('ItemNode或wheelNode未设置');

      return;
    }

    // 只创建和数据量相等的item数量
    const totalItems = this.dataList.length;
    
    for (let i = 0; i < totalItems; i++) {
      const item = instantiate(this.ItemNode);
      item.setParent(this.wheelNode);
      //   // 设置item的label文本
      const label = item.getChildByName('text').getComponent(Label);

      if (label) {
        label.string = `x${this.dataList[i]}`;
        label.node.active = true;
      }
      
      this.items.push(item);
    }

    // 隐藏原始模板节点
    this.ItemNode.active = false;
  }

  /**
   * 设置可视区域裁剪
   */
  private setupViewClipping(): void {
    // 设置wheelNode的可视区域
    const uiTransform = this.wheelNode.getComponent(UITransform);

    if (uiTransform) {
      uiTransform.width = this.VIEW_WIDTH;
      // 设置合适的高度
      uiTransform.height = 400; 
    }
  }

  /**
   * 更新所有item的位置
   */
  private updateItemsPosition(): void {
    const totalItems = this.items.length;
    
    for (let i = 0; i < totalItems; i++) {
      const item = this.items[i];
      
      // 计算当前item的角度位置
      // 每个数据项在圆周上均匀分布，加上当前旋转偏移
      const itemAngle = (i * this.DATA_ANGLE_STEP) + this.currentRotation;
      
      // 检查item是否在可视范围内
      const normalizedAngle = this.normalizeAngle(itemAngle);
      const isVisible = this.isItemVisible(normalizedAngle);
      
      if (isVisible) {
        item.active = true;
        this.setItemPosition(item, normalizedAngle);
      } else {
        item.active = false;
      }
    }
  }

  /**
   * 将角度标准化到-180到180范围
   */
  private normalizeAngle(angle: number): number {
    let normalized = ((angle % 360) + 360) % 360;

    if (normalized > 180) {
      normalized -= 360;
    }

    return normalized;
  }

  /**
   * 判断item是否在可视范围内
   */
  private isItemVisible(angle: number): boolean {
    // 可视范围：-67.5度到+67.5度（总共135度）
    // 67.5度
    const halfArc = this.ARC_DEGREE / 2;
    
    // 判断是否在-67.5到+67.5度范围内
    return Math.abs(angle) <= halfArc;
  }

  /**
   * 设置单个item的位置（弧形排列）
   */
  private setItemPosition(item: Node, angle: number): void {
    // 将角度转换为弧度
    const radian = (angle * Math.PI) / 180;
    
    // 计算上半圆弧形位置
    // 以底部中心为原点，弧形向上弯曲
    const x = Math.sin(radian) * this.ARC_RADIUS;
    // 整体向下移动100像素
    const y = Math.cos(radian) * this.ARC_RADIUS - 200;
    
    item.setPosition(x, y, 0);
    
    // 根据距离中心的角度调整缩放和透明度
    const distanceFromCenter = Math.abs(angle);
    const maxDistance = this.ARC_DEGREE / 2;
    const distanceRatio = Math.min(distanceFromCenter / maxDistance, 1);
    
    // 缩放：中心最大(1.0)，边缘最小(0.6)
    const scale = 1.0 - (distanceRatio * 0.4);
    item.setScale(scale, scale, 1);
    
    // 透明度：中心最亮(255)，边缘较暗(150)
    const opacity = 255 - (distanceRatio * 105);
    const sprite = item.getComponent(Sprite);

    if (sprite) {
      const color = sprite.color.clone();
      color.a = opacity;
      sprite.color = color;
    }
  }

  /**
   * 注册触摸事件
   */
  private registerTouchEvents(): void {
    this.node.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  private onTouchStart(event: EventTouch): void {
    if (this.isAnimating) return;
    
    this.isTouching = true;
    this.startTouchX = event.getLocationX();
  }

  private onTouchMove(event: EventTouch): void {
    if (!this.isTouching || this.isAnimating) return;
    
    // 可以添加实时拖拽效果
    const currentX = event.getLocationX();
    const deltaX = currentX - this.startTouchX;
    
    // 实时旋转效果（可选）
    // const rotationDelta = (deltaX / this.VIEW_WIDTH) * this.ARC_DEGREE;
    // this.currentRotation = this.currentRotation + rotationDelta * 0.1;
    // this.updateItemsPosition();
  }

  private onTouchEnd(event: EventTouch): void {
    if (!this.isTouching || this.isAnimating) return;
    
    this.isTouching = false;
    const endTouchX = event.getLocationX();
    const deltaX = endTouchX - this.startTouchX;
    
    // 判断滑动方向和距离
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // 向右滑动，逆时针旋转
        this.rotateToNext(1);
        // this.jumpToData(this.dataList[0]);
      } else {
        // 向左滑动，顺时针旋转
        this.rotateToNext(-1);
      }
    }
  }

  /**
   * 旋转到下一个位置
   * @param direction 方向：1为顺时针，-1为逆时针
   */
  public rotateToNext(direction: number): void {
    if (this.isAnimating) return;
    
    // 每次旋转一个item的角度
    const targetRotation = this.currentRotation + (direction * this.DATA_ANGLE_STEP);
    this.animateToRotation(targetRotation);
  }

  /**
   * 动画旋转到目标角度
   */
  private animateToRotation(targetRotation: number): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    const startRotation = this.currentRotation;
    
    tween({ rotation: startRotation })
      .to(0.3, { rotation: targetRotation }, {
        onUpdate: (target) => {
          this.currentRotation = target.rotation;
          this.updateItemsPosition();
        }
      })
      .call(() => {
        this.isAnimating = false;
        // 标准化旋转角度，避免角度过大
        this.currentRotation = ((targetRotation % 360) + 360) % 360;
        
        // 打印当前中心item的值
        const currentData = this.getCurrentData();
        console.log('滑动完成后的中心item值:', currentData);
      })
      .start();
  }

  /**
   * 向左滑动（顺时针旋转）
   */
  public swipeLeft(): void {
    this.rotateToNext(1);
  }

  /**
   * 向右滑动（逆时针旋转）
   */
  public swipeRight(): void {
    this.rotateToNext(-1);
  }

  /**
   * 获取当前中心item的数据
   */
  public getCurrentData(): number {
    // 根据当前旋转角度计算中心item
    const centerItemIndex = Math.round(-this.currentRotation / this.DATA_ANGLE_STEP);
    const dataIndex = ((centerItemIndex % this.dataList.length) + this.dataList.length) % this.dataList.length;

    return this.dataList[dataIndex];
  }

  /**
   * 跳转到指定的数据
   */
  public jumpToData(targetData: number): void {
    const targetIndex = this.dataList.findIndex(data => data === targetData);

    if (targetIndex !== -1) {
      const targetRotation = -targetIndex * this.DATA_ANGLE_STEP;
      this.animateToRotation(targetRotation);
    }
  }
    
  update(deltaTime: number) {
    // 可以在这里添加其他更新逻辑
  }
}
