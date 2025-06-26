import { _decorator, Component, Node, Label, tween, UITransform, view, instantiate, Prefab, Vec3, Sprite, Color, input, Input, EventTouch, math, SpriteFrame } from 'cc';
import { app } from 'db://assets/app/app';

const { ccclass, property } = _decorator;

@ccclass('RouletteWheel')
export class RouletteWheel extends Component {
  @property(Node)
  private wheelNode: Node = null;

  @property(Node)
  private ItemNode: Node = null;

  @property(SpriteFrame)
  private chooseSprite: SpriteFrame = null;

  @property(SpriteFrame)
  private unChooseSprite: SpriteFrame = null;

  // swiper相关属性
  private items: Node[] = [];

  private dataList: number[] = [];

  private currentRotation: number = 0;

  private isAnimating: boolean = false;
  
  // 弧形参数
  // 圆形半径 (直径580/2)
  private readonly CIRCLE_RADIUS = 290;

  // 可视区域宽度
  private readonly VIEW_WIDTH = 530;

  // 根据弦长530和半径290计算弧度角度: 2*arcsin(530/(2*290)) ≈ 132度
  private readonly ARC_ANGLE = 132;

  // item间距设置为360度/11个item，实现无缝循环
  private readonly ITEM_SPACING = 360 / 11;
  
  // 触摸相关
  private startTouchX: number = 0;

  private isTouching: boolean = false;

  protected onLoad(): void {
    app.manager.event.on('multipleIndexChange', this.multipleIndexChange, this);
    this.initData();
    this.createItems();
    this.updateItemsPosition();
    this.registerTouchEvents();
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

    // 创建所有数据对应的item
    const totalItems = this.dataList.length;
    
    for (let i = 0; i < totalItems; i++) {
      const item = instantiate(this.ItemNode);
      item.setParent(this.wheelNode);
      
      // 设置item的label文本
      const label = item.getChildByName('text')?.getComponent(Label);

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
   * 更新所有item的位置
   */
  private updateItemsPosition(): void {
    const totalItems = this.items.length;
    
    for (let i = 0; i < totalItems; i++) {
      const item = this.items[i];
      
      // 计算当前item的角度位置（基于整体旋转）
      const itemAngle = (i * this.ITEM_SPACING) + this.currentRotation;
      
      // 检查item是否在可视范围内
      const normalizedAngle = this.normalizeAngle(itemAngle);
      const isVisible = this.isItemVisible(normalizedAngle);
      
      if (isVisible) {
        item.active = true;
        this.setItemPosition(item, normalizedAngle);
        this.setItemSelectedState(item, normalizedAngle);
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
    // 66度
    const halfArc = this.ARC_ANGLE / 2;

    return Math.abs(angle) <= halfArc;
  }

  /**
   * 设置单个item的位置（弧形排列）
   */
  private setItemPosition(item: Node, angle: number): void {
    // 将角度转换为弧度
    const radian = (angle * Math.PI) / 180;
    
    // 计算弧形位置 (上半圆弧)
    const x = Math.sin(radian) * this.CIRCLE_RADIUS;
    const y = Math.cos(radian) * this.CIRCLE_RADIUS;
    
    item.setPosition(x, y, 0);
    
    // 让item旋转垂直对应圆心的角度
    // 在弧形上，每个点的切线方向就是垂直于半径的方向
    item.setRotationFromEuler(0, 0, -angle);
  }

  /**
   * 设置item的选中状态
   */
  private setItemSelectedState(item: Node, angle: number): void {
    // 安全地获取或添加Sprite组件
    let sprite = item.getComponent(Sprite);

    if (!sprite) {
      sprite = item.addComponent(Sprite);
    }

    // 判断是否为中心item（角度接近0度）
    // 容错范围
    const isSelected = Math.abs(angle) <= 16;
    
    if (isSelected) {
      // 选中状态，使用chooseSprite，保持原始大小
      if (this.chooseSprite) {
        sprite.spriteFrame = this.chooseSprite;
      }

      item.setScale(1.0, 1.0, 1.0);
    } else {
      // 未选中状态，使用unChooseSprite，缩放为0.8倍
      if (this.unChooseSprite) {
        sprite.spriteFrame = this.unChooseSprite;
      }

      item.setScale(0.8, 0.8, 1.0);
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
        // 向右滑动
        this.rotateToNext(1);
      } else {
        // 向左滑动
        this.rotateToNext(-1);
      }
    }
  }

  /**
   * 旋转到下一个位置
   */
  public rotateToNext(direction: number): void {
    if (this.isAnimating) return;
    
    // 计算目标旋转角度
    const targetRotation = this.currentRotation + (direction * this.ITEM_SPACING);
    
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
        
        const currentData = this.getCurrentData();
        console.log('当前选中的倍数:', currentData);
      })
      .start();
  }

  /**
   * 获取当前中心item的数据
   */
  public getCurrentData(): number {
    // 基于当前旋转角度计算中心item
    const centerItemIndex = Math.round(-this.currentRotation / this.ITEM_SPACING);
    const dataIndex = ((centerItemIndex % this.dataList.length) + this.dataList.length) % this.dataList.length;

    return this.dataList[dataIndex];
  }

  /**
   * 跳转到指定的数据
   */
  public jumpToData(targetData: number): void {
    const targetIndex = this.dataList.findIndex(data => data === targetData);
    if (targetIndex === -1) return;

    const currentData = this.getCurrentData();
    const currentIndex = this.dataList.findIndex(data => data === currentData);
    if (currentIndex === -1) return;

    if (targetData === currentData) return;

    // 计算两个方向的旋转步数
    let directSteps = targetIndex - currentIndex;
    const totalItems = this.dataList.length;
    
    // 计算通过循环的步数
    let wrapSteps: number;

    if (directSteps > 0) {
      // 目标在右边，也可以向左循环
      wrapSteps = directSteps - totalItems;
    } else {
      // 目标在左边，也可以向右循环  
      wrapSteps = directSteps + totalItems;
    }
    
    // 选择步数更少（绝对值更小）的路径
    const rotationSteps = Math.abs(directSteps) <= Math.abs(wrapSteps) ? directSteps : wrapSteps;
    
    // 计算目标旋转角度
    const targetRotation = this.currentRotation - (rotationSteps * this.ITEM_SPACING);
    
    // 使用动画跳转
    this.animateToRotation(targetRotation);
  }
    
  public multipleIndexChange(index: number): void {
    const safeIndex = ((index % this.dataList.length) + this.dataList.length) % this.dataList.length;
    this.jumpToData(this.dataList[safeIndex]);
  }

  update(deltaTime: number) {
    // 可以在这里添加其他更新逻辑
  }
}
