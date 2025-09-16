// eslint-disable-next-line max-len
import { _decorator, Component, Node, Label, tween, UITransform, view, instantiate, Prefab, Vec3, Sprite, Color, input, Input, EventTouch, math, sp, SpriteFrame, TweenEasing } from 'cc';
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

  // 动画相关属性
  private isAnimating: boolean = false;

  // 动画持续时间
  private animationDuration: number = 0.6;
 
  // 缓动类型
  private easingType: TweenEasing = 'backOut';
 
  // 是否启用过冲效果
  private enableOvershoot: boolean = true;
 
  // 过冲量（0-1之间）
  private overshootAmount: number = 0.5; 
  
  // 弧形参数
  // 圆环半径 (直径 780)
  private readonly ARC_RADIUS = 395;

  // 触摸区域宽度，用于换算滑动距离到旋转角度
  private readonly VIEW_WIDTH = 750;

  // 数据间角度步长，运行时根据数据量计算
  private DATA_ANGLE_STEP: number = 0;
  
  // 触摸相关
  private startTouchX: number = 0;

  private isTouching: boolean = false;

  protected onLoad(): void {
    app.manager.event.on('multipleIndexChange', this.multipleIndexChange, this);
    this.initData();
    this.createItems();
    this.updateItemsPosition();
    // 启用触摸滑动
    this.setupViewClipping();
  }

  /**
   * 初始化数据：x1, x2, x4, x8, ..., x1024
   */
  private initData(): void {
    // 固定数据序列
    this.dataList = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 1, 2, 512, 1024];

    // 根据数据数量动态计算角度步长
    this.DATA_ANGLE_STEP = 360 / this.dataList.length;
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
        // 根据数值大小动态设置字体大小
        const value = this.dataList[i];

        if (value < 10) {
          label.fontSize = 42;
        } else if (value < 100) {
          label.fontSize = 30;
        } else if (value < 1000) {
          label.fontSize = 24;
        } else {
          label.fontSize = 18;
        }

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
      
      // 每个数据项在圆周上均匀分布，加上当前旋转偏移
      const itemAngle = (i * this.DATA_ANGLE_STEP) + this.currentRotation;
      
      item.active = true;
      this.setItemPosition(item, itemAngle);
    }

    // 更新选中 / 未选中精灵
    const selectedIndex = ((Math.round(-this.currentRotation / this.DATA_ANGLE_STEP) % this.dataList.length) + this.dataList.length) % this.dataList.length;

    for (let i = 0; i < totalItems; i++) {
      const sprite = this.items[i].getComponent(Sprite);
      if (!sprite) continue;

      if (i === selectedIndex) {
        this.items[i].setScale(1.2, 1.2, 1);
        this.items[i].getChildByName('text').getComponent(Label).isBold = true;
        if (this.chooseSprite) sprite.spriteFrame = this.chooseSprite;
      } else {
        this.items[i].getChildByName('text').getComponent(Label).isBold = false;
        this.items[i].setScale(1, 1, 1);
        if (this.unChooseSprite) sprite.spriteFrame = this.unChooseSprite;
      }
    }
  }

  /**
   * 设置单个item的位置（弧形排列）
   */
  private setItemPosition(item: Node, angle: number): void {
    // 将角度转换为弧度
    const radian = (angle * Math.PI) / 180;
    
    // 圆心在节点原点，顺时针方向为正
    const x = Math.sin(radian) * this.ARC_RADIUS;
    const y = Math.cos(radian) * this.ARC_RADIUS;
    
    item.setPosition(x, y, 0);
    
    // 让 item 随圆环旋转，保持朝向一致
    // 这里选择让文字始终朝向圆心外侧，因此旋转角度取 -angle
    item.eulerAngles = new Vec3(0, 0, -angle);
    
    // 若需按距离中心调整透明度或缩放，可在此处添加逻辑
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

  private animateToRotation(targetRotation: number): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    const startRotation = this.currentRotation;
    
    // 计算过冲角度（如果需要）
    let finalTargetRotation = targetRotation;

    if (this.enableOvershoot && this.easingType.includes('back')) {
      const overshootAngle = this.DATA_ANGLE_STEP * this.overshootAmount;
      finalTargetRotation = targetRotation + overshootAngle;
    }
    
    // 使用弹性缓动函数，创建更自然的旋转效果
    tween({ rotation: startRotation })
      .to(this.animationDuration, { rotation: finalTargetRotation }, {
        easing: this.easingType, 
        onUpdate: (target) => {
          this.currentRotation = target.rotation;
          this.updateItemsPosition();
        }
      })
      .call(() => {
        // 如果启用了过冲，需要平滑回到最终位置
        if (this.enableOvershoot && this.easingType.includes('back')) {
          this.smoothReturnToTarget(targetRotation);
        } else {
          this.finishAnimation(targetRotation);
        }
      })
      .start();
  }

  /**
   * 平滑回到目标位置
   */
  private smoothReturnToTarget(targetRotation: number): void {
    const startRotation = this.currentRotation;
    const returnDuration = 0.15; 
      
    tween({ rotation: startRotation })
      .to(returnDuration, { rotation: targetRotation }, {
        easing: 'quadOut', 
        onUpdate: (target) => {
          this.currentRotation = target.rotation;
          this.updateItemsPosition();
        }
      })
      .call(() => {
        this.finishAnimation(targetRotation);
      })
      .start();
  }

  /**
   * 完成动画
   */
  private finishAnimation(targetRotation: number): void {
    this.isAnimating = false;
    // 标准化旋转角度，避免角度过大
    this.currentRotation = ((targetRotation % 360) + 360) % 360;
    
    // 打印当前中心item的值
    const currentData = this.getCurrentData();
    console.log('滑动完成后的中心item值:', currentData);
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
    
    if (targetIndex === -1) {
      return;
    }

    // 获取当前中心item的数据值
    const currentData = this.getCurrentData();
    const currentIndex = this.dataList.findIndex(data => data === currentData);
    
    if (currentIndex === -1) {
      console.warn('无法获取当前数据');

      return;
    }

    // 如果已经在目标位置，不需要旋转
    if (targetData === currentData) {
      return;
    }

    // 根据数值大小关系决定旋转方向
    let rotationSteps: number;

    if (targetData > currentData) {
      // 目标值更大，逆时针旋转
      rotationSteps = -(targetIndex - currentIndex);
    } else {
      // 目标值更小，顺时针旋转
      rotationSteps = currentIndex - targetIndex;
    }
    
    // 计算目标旋转角度
    const targetRotation = this.currentRotation + (rotationSteps * this.DATA_ANGLE_STEP);
    
    console.log(`从${currentData}跳转到${targetData}，旋转步骤：${rotationSteps}（${rotationSteps > 0 ? '顺时针' : '逆时针'}）`);
    
    this.animateToRotation(targetRotation);
  }
    
  public multipleIndexChange(index: number): void {
    this.jumpToData(this.dataList[index]);
  }

  /**
   * 设置动画参数
   * @param duration 动画持续时间
   * @param easing 缓动类型
   * @param enableOvershoot 是否启用过冲效果
   * @param overshootAmount 过冲量（0-1之间）
   */
  public setAnimationParams(
    duration: number = 0.6, 
    easing: TweenEasing = 'backOut', 
    enableOvershoot: boolean = true,
    overshootAmount: number = 0.1
  ): void {
    this.animationDuration = duration;
    this.easingType = easing;
    this.enableOvershoot = enableOvershoot;
    this.overshootAmount = Math.max(0, Math.min(1, overshootAmount));
  }

  /**
   * 获取可用的缓动类型列表
   */
  public getAvailableEasingTypes(): string[] {
    return [
      // 弹性回弹效果
      'backOut',     
      // 弹性进出效果
      'backInOut',   
      // 弹性振荡效果
      'elasticOut',  
      // 弹性振荡进出效果
      'elasticInOut',
      // 弹跳效果
      'bounceOut',
      // 弹跳进出效果
      'bounceInOut',
      // 二次缓出
      'quadOut',     
      // 三次缓出
      'cubicOut',    
      // 四次缓出
      'quartOut',    
      // 五次缓出
      'quintOut',    
      // 正弦缓出
      'sineOut',     
      // 指数缓出
      'expoOut',     
      // 圆形缓出
      'circOut',     
      // 指数缓出
      'expoOut',      
      // 圆形缓出
      'circOut',     
    ];
  }

  /**
   * 快速切换到下一个位置（无动画）
   */
  public snapToNext(direction: number): void {
    if (this.isAnimating) return;
    
    const targetRotation = this.currentRotation + (direction * this.DATA_ANGLE_STEP);
    this.currentRotation = ((targetRotation % 360) + 360) % 360;
    this.updateItemsPosition();
  }

  update(deltaTime: number) {
    // 可以在这里添加其他更新逻辑
  }
}