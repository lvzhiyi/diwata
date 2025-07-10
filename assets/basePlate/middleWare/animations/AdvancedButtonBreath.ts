import { _decorator, Button, Component, NodeEventType, Vec3, tween, Tween, UIOpacity, TweenEasing, Enum, CCFloat, CCBoolean, CCString } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 呼吸动画类型枚举
 */
const BreathType = Enum({
  // 缩放呼吸
  SCALE: 0,
  // 透明度呼吸
  OPACITY: 1,
  // 旋转呼吸
  ROTATION: 2,
  // 组合呼吸
  COMBINED: 3
});

/**
 * 高级按钮呼吸动画组件
 * 支持多种呼吸效果：缩放、透明度、旋转等
 */
@ccclass('AdvancedButtonBreath')
export class AdvancedButtonBreath extends Component {
  @property({ 
    type: BreathType, 
    tooltip: '呼吸动画类型' 
  })
  private breathType: number = BreathType.SCALE;

  @property({ type: CCFloat, tooltip: '呼吸动画的最小缩放值' })
  private minScale: number = 0.9;

  @property({ type: CCFloat, tooltip: '呼吸动画的最大缩放值' })
  private maxScale: number = 1.1;

  @property({ type: CCFloat, tooltip: '呼吸动画的最小透明度值' })
  private minOpacity: number = 150;

  @property({ type: CCFloat, tooltip: '呼吸动画的最大透明度值' })
  private maxOpacity: number = 255;

  @property({ type: CCFloat, tooltip: '呼吸动画的旋转角度范围' })
  private rotationRange: number = 5;

  @property({ type: CCFloat, tooltip: '呼吸动画的持续时间（秒）' })
  private duration: number = 1.0;

  @property({ type: CCBoolean, tooltip: '是否在触摸时暂停呼吸动画' })
  private pauseOnTouch: boolean = true;

  @property({ type: CCBoolean, tooltip: '是否自动开始呼吸动画' })
  private autoStart: boolean = true;

  @property({ type: CCBoolean, tooltip: '是否循环播放' })
  private loop: boolean = true;

  @property({ type: CCString, tooltip: '缓动函数类型' })
  private easing: string = 'sineInOut';

  private button: Button = null;

  private uiOpacity: UIOpacity = null;

  private originalScale: Vec3 = new Vec3(1, 1, 1);

  private originalOpacity: number = 255;

  private originalRotation: number = 0;

  private breathTween: Tween<any> = null;

  private isBreathing: boolean = false;

  private isPaused: boolean = false;

  start() {
    this.button = this.getComponent(Button);
    this.uiOpacity = this.getComponent(UIOpacity);
    
    if (!this.button) {
      console.warn('AdvancedButtonBreath component must be attached to a node with Button component');

      return;
    }

    // 保存原始属性值
    this.originalScale = this.node.scale.clone();
    this.originalOpacity = this.uiOpacity ? this.uiOpacity.opacity : 255;
    this.originalRotation = this.node.angle;

    // 注册触摸事件
    if (this.pauseOnTouch) {
      this.node.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
      this.node.on(NodeEventType.TOUCH_END, this.onTouchEnd, this);
      this.node.on(NodeEventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    // 自动开始呼吸动画
    if (this.autoStart) {
      this.startBreath();
    }
  }

  onDestroy() {
    this.stopBreath();
    
    if (this.pauseOnTouch) {
      this.node.off(NodeEventType.TOUCH_START, this.onTouchStart, this);
      this.node.off(NodeEventType.TOUCH_END, this.onTouchEnd, this);
      this.node.off(NodeEventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }
  }

  /**
   * 开始呼吸动画
   */
  public startBreath() {
    if (this.isBreathing) return;
    
    this.isBreathing = true;
    this.isPaused = false;
    this.createBreathAnimation();
  }

  /**
   * 停止呼吸动画
   */
  public stopBreath() {
    this.isBreathing = false;
    this.isPaused = false;
    
    if (this.breathTween) {
      this.breathTween.stop();
      this.breathTween = null;
    }
    
    // 恢复到原始状态
    this.resetToOriginal();
  }

  /**
   * 暂停呼吸动画
   */
  public pauseBreath() {
    if (!this.isBreathing) return;
    
    this.isPaused = true;

    if (this.breathTween) {
      this.breathTween.pause();
    }
  }

  /**
   * 恢复呼吸动画
   */
  public resumeBreath() {
    if (!this.isBreathing || !this.isPaused) return;
    
    this.isPaused = false;

    if (this.breathTween) {
      this.breathTween.resume();
    }
  }

  /**
   * 设置呼吸动画参数
   */
  public setBreathParams(params: {
    minScale?: number;
    maxScale?: number;
    minOpacity?: number;
    maxOpacity?: number;
    rotationRange?: number;
    duration?: number;
    easing?: string;
  }) {
    Object.assign(this, params);
    
    // 如果正在呼吸，重新创建动画
    if (this.isBreathing && !this.isPaused) {
      this.stopBreath();
      this.startBreath();
    }
  }

  /**
   * 重置到原始状态
   */
  private resetToOriginal() {
    this.node.setScale(this.originalScale);
    this.node.angle = this.originalRotation;
    
    if (this.uiOpacity) {
      this.uiOpacity.opacity = this.originalOpacity;
    }
  }

  /**
   * 创建呼吸动画
   */
  private createBreathAnimation() {
    if (!this.isBreathing || this.isPaused) return;

    switch (this.breathType) {
      case BreathType.SCALE:
        this.createScaleBreath();
        break;
      case BreathType.OPACITY:
        this.createOpacityBreath();
        break;
      case BreathType.ROTATION:
        this.createRotationBreath();
        break;
      case BreathType.COMBINED:
     
        this.createCombinedBreath();
        break;
    }
  }

  /**
   * 创建缩放呼吸动画
   */
  private createScaleBreath() {
    const minScaleVec = new Vec3(this.minScale, this.minScale, 1);
    const maxScaleVec = new Vec3(this.maxScale, this.maxScale, 1);

    this.breathTween = tween(this.node)
      .to(this.duration / 2, { scale: maxScaleVec }, { easing: this.easing as TweenEasing })
      .to(this.duration / 2, { scale: minScaleVec }, { easing: this.easing as TweenEasing })
      .call(() => {
        if (this.isBreathing && !this.isPaused && this.loop) {
          this.createBreathAnimation();
        }
      })
      .start();
  }

  /**
   * 创建透明度呼吸动画
   */
  private createOpacityBreath() {
    if (!this.uiOpacity) {
      console.warn('UIOpacity component not found for opacity breath animation');

      return;
    }

    this.breathTween = tween(this.uiOpacity)
      .to(this.duration / 2, { opacity: this.maxOpacity }, { easing: this.easing as TweenEasing })
      .to(this.duration / 2, { opacity: this.minOpacity }, { easing: this.easing as TweenEasing })
      .call(() => {
        if (this.isBreathing && !this.isPaused && this.loop) {
          this.createBreathAnimation();
        }
      })
      .start();
  }

  /**
   * 创建旋转呼吸动画
   */
  private createRotationBreath() {
    const startAngle = this.originalRotation - this.rotationRange;
    const endAngle = this.originalRotation + this.rotationRange;

    this.breathTween = tween(this.node)
      .to(this.duration / 2, { angle: endAngle }, { easing: this.easing as TweenEasing })
      .to(this.duration / 2, { angle: startAngle }, { easing: this.easing as TweenEasing })
      .call(() => {
        if (this.isBreathing && !this.isPaused && this.loop) {
          this.createBreathAnimation();
        }
      })
      .start();
  }

  /**
   * 创建组合呼吸动画
   */
  private createCombinedBreath() {
    const minScaleVec = new Vec3(this.minScale, this.minScale, 1);
    const maxScaleVec = new Vec3(this.maxScale, this.maxScale, 1);
    const startAngle = this.originalRotation - this.rotationRange;
    const endAngle = this.originalRotation + this.rotationRange;

    // 创建组合动画
    const scaleTween = tween(this.node)
      .to(this.duration / 2, { scale: maxScaleVec }, { easing: this.easing as TweenEasing })
      .to(this.duration / 2, { scale: minScaleVec }, { easing: this.easing as TweenEasing });

    const rotationTween = tween(this.node)
      .to(this.duration / 2, { angle: endAngle }, { easing: this.easing as TweenEasing })
      .to(this.duration / 2, { angle: startAngle }, { easing: this.easing as TweenEasing });

    let opacityTween = null;

    if (this.uiOpacity) {
      opacityTween = tween(this.uiOpacity)
        .to(this.duration / 2, { opacity: this.maxOpacity }, { easing: this.easing as TweenEasing })
        .to(this.duration / 2, { opacity: this.minOpacity }, { easing: this.easing as TweenEasing });
    }

    // 并行执行所有动画
    this.breathTween = tween(this.node)
      .parallel(scaleTween, rotationTween)
      .call(() => {
        if (this.isBreathing && !this.isPaused && this.loop) {
          this.createBreathAnimation();
        }
      })
      .start();

    // 如果有透明度组件，单独执行透明度动画
    if (opacityTween) {
      opacityTween.start();
    }
  }

  /**
   * 触摸开始事件
   */
  private onTouchStart() {
    if (this.button && this.button.interactable && this.pauseOnTouch) {
      this.pauseBreath();
    }
  }

  /**
   * 触摸结束事件
   */
  private onTouchEnd() {
    if (this.button && this.pauseOnTouch) {
      this.resumeBreath();
    }
  }
} 