// eslint-disable-next-line max-len
import { _decorator, Component, Node, Label, tween, UITransform, view, instantiate, Prefab, Vec3, Sprite, Color, input, Input, EventTouch, math, sp, SpriteFrame, TweenEasing } from 'cc';
import { app } from 'db://assets/app/app';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass, property } = _decorator;

@ccclass('RouletteWheel')
export class RouletteWheel extends Component {
  @property(Node)
  private wheelNode: Node = null;

  @property(Node)
  private ItemNode: Node = null;

  @property(Node)
  private textSpineNode: Node = null;

  @property(Node)
  private bgSpineNode: Node = null;

  @property(Node)
  private bg2SpineNode: Node = null;

  @property(SpriteFrame)
  private chooseSprite: SpriteFrame = null;

  @property(SpriteFrame)
  private unChooseSprite: SpriteFrame = null;

  // swiper相关属性
  private items: Node[] = [];

  private dataList: number[] = [];

  private currentRotation: number = 0;

  private currentIndex: number = 0;

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
  
  // 背景旋转相关属性
  private bgCurrentRotation: number = 0;

  private isBgAnimating: boolean = false;

  private bgAnimationDuration: number = 1.0;

  private bgEasingType: TweenEasing = 'backOut';

  private firstItemPostion: Vec3 = new Vec3(0, 0, 0);
  
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
    this.initSpine();
    this.initData();
    this.createItems();
    this.updateItemsPosition();
    // 启用触摸滑动
    this.setupViewClipping();
  }

  private initSpine(): void {
    const spine = this.bgSpineNode.getComponent(sp.Skeleton);
    spine.setAnimation(0, 'zhuanpan', false);
    spine.timeScale = 0;
    const spine2 = this.bg2SpineNode.getComponent(sp.Skeleton);
    spine2.setAnimation(0, 'gunzhoudi', false);
    spine2.timeScale = 0;
  }

  /**
   * 多倍索引改变
   * @param index 索引
   * @param needAnimation 是否需要动画
  */
  public multipleIndexChange(index: number, needAnimation: boolean = true): void {
    if (this.currentIndex === index) {
      return;
    }
    // 盘面进行发光
    if (needAnimation === false) {
      const spine = this.bgSpineNode.getComponent(sp.Skeleton);
      spine.timeScale = 1;
      spine.setAnimation(0, 'zhuanpan', false);
   
      const spine2 = this.bg2SpineNode.getComponent(sp.Skeleton);
      spine2.timeScale = 1;
      spine2.setAnimation(0, 'gunzhoudi', false);
    }
    // 如果 index 为 0 和，3，强制复原到起始位置
    if(index === 0 || index === 3) {
      this.currentIndex = index;
      this.jumpToOriginalPosition(index);
    }else{
      this.jumpToData(this.dataList[index]);
      this.currentIndex = index;
    }
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
    
    const currentIndex = this.currentIndex;
    const currentData = this.dataList[currentIndex];

    if (currentIndex === -1) {
      console.warn('无法获取当前数据');

      return;
    }
   
    // 根据数值大小关系决定旋转方向
    let rotationSteps: number;

    if (targetData > currentData) {
      // 目标值更大，逆时针旋转
      rotationSteps = (targetIndex - currentIndex);
    } 
    
    // 计算目标旋转角度
    const targetRotation = this.bgCurrentRotation + (rotationSteps * this.DATA_ANGLE_STEP);
    console.log('targetRotation', targetRotation, this.bgCurrentRotation, currentIndex, targetIndex);

    this.animateBgToRotation(targetRotation);
  }

  /** 跳到原始位置 */ 
  jumpToOriginalPosition(index: number): void {
    if(index === 0 ) {
      tween(this.bgSpineNode)
        .timeScale(app.manager.global.gameSpeed)
        .to(0.5, { eulerAngles: new Vec3(0, 0, 0) }, { easing: this.bgEasingType })
        .call(() => {
          this.updateSelectedItem();
          this.bgCurrentRotation = 0;
        })
        .start();
    }
    if(index === 3) {
      const targetRotation = this.DATA_ANGLE_STEP * 3;
      tween(this.bgSpineNode)
        .timeScale(app.manager.global.gameSpeed)
        .to(0.5, { eulerAngles: new Vec3(0, 0, targetRotation) }, { easing: this.bgEasingType })
        .call(() => {
          this.updateSelectedItem();
          this.bgCurrentRotation = targetRotation;
        })
        .start();
    }
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
    if (!this.ItemNode || !this.bgSpineNode) {
      console.error('ItemNode或wheelNode未设置');

      return;
    }

    // 只创建和数据量相等的item数量
    const totalItems = this.dataList.length;
    
    for (let i = 0; i < totalItems; i++) {
      const item = instantiate(this.ItemNode);
      item.setParent(this.bgSpineNode);
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
          label.color = new Color().fromHEX('#C50909');
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

      if (i === 0) {
        this.firstItemPostion = item.position.clone();
      }
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

  updateSelectedItem(): void {
    const totalItems = this.items.length;
    const selectedIndex = this.currentIndex;

    for (let i = 0; i < totalItems; i++) {
      const sprite = this.items[i].getComponent(Sprite);
      if (!sprite) continue;

      if (i === selectedIndex) {
        const item = this.items[i];
        tween(item)
          .timeScale(app.manager.global.gameSpeed)
          .to(0.5, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'bounceOut' })
          .start();
        item.getChildByName('text').getComponent(Label).isBold = true;
        const textString = item.getChildByName('text').getComponent(Label).string;
        if (this.chooseSprite) sprite.spriteFrame = this.chooseSprite;
        this.textSpineNode.active = true;
        const textSpine = this.textSpineNode.getComponent(sp.Skeleton);
        const animationName = textString.indexOf('x1024') === -1 ? 'beilvshuzishanguang' : 'beilvshuzishanguang2';
        textSpine.setAnimation(0, animationName, false);
        textSpine.setCompleteListener(() => {
          textSpine.setCompleteListener(null);
          this.textSpineNode.active = false;
        });
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
   * 背景转盘动画到指定角度
   * @param targetRotation 目标旋转角度（度）
   * @param duration 动画持续时间（可选）
   */
  private animateBgToRotation(targetRotation: number, duration?: number): void {
    if (this.isBgAnimating) return;
    
    this.isBgAnimating = true;
    const animDuration = duration || this.bgAnimationDuration;
    
    tween(this.bgSpineNode)
      .timeScale(app.manager.global.gameSpeed)
      .to(animDuration, { eulerAngles: new Vec3(0, 0, targetRotation) }, { easing: this.bgEasingType })
      .call(() => {
        this.updateSelectedItem();
        this.finishBgAnimation(targetRotation);
      })
      .start();
  }

  /**
   * 完成背景动画
   * @param targetRotation 目标旋转角度
   */
  private finishBgAnimation(targetRotation: number): void {
    this.isBgAnimating = false;
    this.bgCurrentRotation = targetRotation;
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

  update(deltaTime: number) {
    // 可以在这里添加其他更新逻辑
  }
}