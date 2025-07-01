import { _decorator, Button, Component, NodeEventType, Vec3, tween, Tween } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 按钮呼吸动画组件
 * 为按钮添加呼吸效果，让按钮有节奏地放大缩小
 */
@ccclass('ButtonBreath')
export class ButtonBreath extends Component {
  @property({ tooltip: '呼吸动画的最小缩放值' })
  private minScale: number = 0.9;

  @property({ tooltip: '呼吸动画的最大缩放值' })
  private maxScale: number = 1.1;

  @property({ tooltip: '呼吸动画的持续时间（秒）' })
  private duration: number = 1.0;

  @property({ tooltip: '是否在触摸时暂停呼吸动画' })
  private pauseOnTouch: boolean = true;

  @property({ tooltip: '是否自动开始呼吸动画' })
  private autoStart: boolean = true;

  private button: Button = null;
  private originalScale: Vec3 = new Vec3(1, 1, 1);
  private breathTween: Tween<Node> = null;
  private isBreathing: boolean = false;
  private isPaused: boolean = false;

  start() {
    this.button = this.getComponent(Button);
    if (!this.button) {
      console.warn('ButtonBreath component must be attached to a node with Button component');
      return;
    }

    // 保存原始缩放值
    this.originalScale = this.node.scale.clone();

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
    
    // 恢复到原始缩放
    this.node.setScale(this.originalScale);
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
   * @param minScale 最小缩放值
   * @param maxScale 最大缩放值
   * @param duration 动画持续时间
   */
  public setBreathParams(minScale: number, maxScale: number, duration: number) {
    this.minScale = minScale;
    this.maxScale = maxScale;
    this.duration = duration;
    
    // 如果正在呼吸，重新创建动画
    if (this.isBreathing && !this.isPaused) {
      this.stopBreath();
      this.startBreath();
    }
  }

  /**
   * 创建呼吸动画
   */
  private createBreathAnimation() {
    if (!this.isBreathing || this.isPaused) return;

    const minScaleVec = new Vec3(this.minScale, this.minScale, 1);
    const maxScaleVec = new Vec3(this.maxScale, this.maxScale, 1);

    this.breathTween = tween(this.node)
      .to(this.duration / 2, { scale: maxScaleVec }, { easing: 'sineInOut' })
      .to(this.duration / 2, { scale: minScaleVec }, { easing: 'sineInOut' })
      .call(() => {
        // 动画完成后，如果还在呼吸状态，继续下一轮
        if (this.isBreathing && !this.isPaused) {
          this.createBreathAnimation();
        }
      })
      .start();
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