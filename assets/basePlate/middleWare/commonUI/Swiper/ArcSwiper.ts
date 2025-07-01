import { _decorator, Component, Node, Prefab, SpriteFrame, Label, UITransform, instantiate, Sprite, Input, EventTouch, tween, Vec3, CCFloat } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ArcSwiper')
export class ArcSwiper extends Component {
  /** ****************** 可配置属性 ********************/
  @property({ tooltip: '可视区域宽度' })
  public viewWidth: number = 750;

  @property({ tooltip: '可视区域高度' })
  public viewHeight: number = 300;

  @property({ tooltip: '数据模板项(必须包含一个名为 text 的子节点用于显示倍数)' })
  public itemTemplate: Prefab = null;

  @property({ tooltip: '选中项Sprite' })
  public chooseSprite: SpriteFrame = null;

  @property({ tooltip: '未选中项Sprite' })
  public unChooseSprite: SpriteFrame = null;

  @property({ tooltip: '选中项缩放' })
  public selectedScale: number = 1;

  @property({ type: CCFloat, tooltip: '未选中项缩放' })
  public unSelectedScale: number = 0.9;

  @property({  type: CCFloat, tooltip: '拖动灵敏度' })
  public swipeSensitivity: number = 2;

  @property({ type: CCFloat, tooltip: '旋转动画时长' })
  public tweenTime: number = 0.25;

  /** ****************** 私有常量 ********************/
  // 总数据
  private readonly dataList: number[] = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];

  // 弧形半径(根据视觉需要可自行调整)
  private readonly radius: number = 300;

  // 可视弧度(显示5个item时的角度范围，大约130°)
  private readonly arcAngle: number = 130;

  // item之间的角度间隔 (360 / 数据总数)
  private readonly itemSpacing: number = 360 / 11;

  /** ****************** 运行时变量 ********************/
  private items: Node[] = [];

  private currentRotation: number = 0; 

  private isDragging = false;

  private lastTouchX = 0;

  private startTouchX = 0;

  private startRotation = 0;

  private velocityX = 0;

  private lastMoveTime = 0;

  private animating = false;

  onLoad() {
    this.initSize();
    this.createItems();
    this.registerTouch();
    this.updateItems();
  }

  /** ****************** 初始化 ********************/
  private initSize() {
    const trans = this.getComponent(UITransform);
    trans.setContentSize(this.viewWidth, this.viewHeight);
  }

  private createItems() {
    if (!this.itemTemplate) {
      console.error('ArcSwiper: itemTemplate 未设置');

      return;
    }

    this.dataList.forEach((value) => {
      const item = instantiate(this.itemTemplate);
      item.setParent(this.node);
      const labelNode = item.getChildByName('text');

      if (labelNode) {
        const label = labelNode.getComponent(Label);
        if (label) label.string = `x${value}`;
      }

      this.items.push(item);
    });
  }

  /** ****************** 触摸处理 ********************/
  private registerTouch() {
    this.node.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  private onTouchStart(evt: EventTouch) {
    if (this.animating) return;
    this.isDragging = true;
    const loc = evt.getUILocation();
    this.startTouchX = this.lastTouchX = loc.x;
    this.startRotation = this.currentRotation;
    this.velocityX = 0;
    this.lastMoveTime = Date.now();
  }

  private onTouchMove(evt: EventTouch) {
    if (!this.isDragging) return;
    const loc = evt.getUILocation();
    const now = Date.now();
    const deltaX = loc.x - this.lastTouchX;
    const dt = now - this.lastMoveTime;

    if (dt > 0) {
      this.velocityX = deltaX / dt * 1000; 
    }

    const totalMove = (loc.x - this.startTouchX);
    const rotateDelta = (totalMove / this.viewWidth) * this.arcAngle * this.swipeSensitivity;
    this.currentRotation = this.startRotation + rotateDelta;
    this.updateItems();
    this.lastTouchX = loc.x;
    this.lastMoveTime = now;
  }

  private onTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (Math.abs(this.velocityX) < 100) {
      this.snapNearest();
    } else {
      const inertia = (this.velocityX / this.viewWidth) * this.arcAngle * 0.3; 
      this.rotateTo(this.currentRotation + inertia, true, () => this.snapNearest());
    }
  }

  /** ****************** 更新显示 ********************/
  private updateItems() {
    this.items.forEach((item, idx) => {
      const angle = this.normalizeAngle(idx * this.itemSpacing + this.currentRotation);
      const visible = Math.abs(angle) <= this.arcAngle / 2;
      item.active = visible;
      if (!visible) return;
      const rad = angle * Math.PI / 180;
      const x = Math.sin(rad) * this.radius;
      const y = Math.cos(rad) * this.radius;
      item.setPosition(x, y, 0);
      item.setRotationFromEuler(0, 0, -angle);
      const sprite = item.getComponent(Sprite);
      const selected = Math.abs(angle) <= this.itemSpacing / 2;
      if (sprite) sprite.spriteFrame = selected ? this.chooseSprite : this.unChooseSprite;
      const scale = selected ? this.selectedScale : this.unSelectedScale;
      item.scale = new Vec3(scale, scale, 1);
    });
  }

  /** ****************** 工具 ********************/
  private normalizeAngle(a: number) {
    let r = ((a % 360) + 360) % 360;
    if (r > 180) r -= 360;

    return r;
  }

  private rotateTo(targetRot: number, anim = true, cb?: () => void) {
    if (this.animating) return;

    if (!anim) {
      this.currentRotation = targetRot;
      this.updateItems();
      cb && cb();

      return;
    }

    this.animating = true;
    const startRot = this.currentRotation;
    tween({ t: 0 })
      .to(this.tweenTime, { t: 1 }, {
        onUpdate: (obj) => {
          this.currentRotation = startRot + (targetRot - startRot) * obj.t;
          this.updateItems();
        }
      })
      .call(() => {
        this.animating = false;
        cb && cb();
      })
      .start();
  }

  private snapNearest() {
    const snapped = Math.round(this.currentRotation / this.itemSpacing) * this.itemSpacing;
    this.rotateTo(snapped, true);
  }

  /** ****************** 对外接口 ********************/
  /** 上一项 */
  public prev() { this.rotateStep(-1); }

  /** 下一项 */
  public next() { this.rotateStep(1); }

  private rotateStep(step: number) {
    if (this.animating) return;
    const target = this.currentRotation - step * this.itemSpacing;
    this.rotateTo(target, true);
  }

  /** 跳转到指定索引 */
  public jumpToIndex(idx: number) {
    const normIdx = ((idx % this.dataList.length) + this.dataList.length) % this.dataList.length;
    const target = -normIdx * this.itemSpacing;
    this.rotateTo(target, true);
  }

  /** 获取当前选中的倍数 */
  public getCurrentMultiple() {
    const centerIdx = Math.round(-this.currentRotation / this.itemSpacing);
    const realIdx = ((centerIdx % this.dataList.length) + this.dataList.length) % this.dataList.length;

    return this.dataList[realIdx];
  }
} 