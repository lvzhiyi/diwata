import { _decorator, Component, Node, Button } from 'cc';
import { ButtonBreath } from './ButtonBreath';
import { AdvancedButtonBreath } from '../animations/AdvancedButtonBreath';

const { ccclass, property } = _decorator;

/**
 * 按钮呼吸动画使用示例
 * 展示如何使用 ButtonBreath 和 AdvancedButtonBreath 组件
 */
@ccclass('ButtonBreathExample')
export class ButtonBreathExample extends Component {
  @property(Node)
  private simpleBreathButton: Node = null;

  @property(Node)
  private scaleBreathButton: Node = null;

  @property(Node)
  private opacityBreathButton: Node = null;

  @property(Node)
  private rotationBreathButton: Node = null;

  @property(Node)
  private combinedBreathButton: Node = null;

  private simpleBreath: ButtonBreath = null;

  private advancedBreath: AdvancedButtonBreath = null;

  start() {
    this.setupBreathAnimations();
  }

  /**
   * 设置呼吸动画
   */
  private setupBreathAnimations() {
    // 简单呼吸动画示例
    if (this.simpleBreathButton) {
      this.simpleBreath = this.simpleBreathButton.getComponent(ButtonBreath);

      if (!this.simpleBreath) {
        this.simpleBreath = this.simpleBreathButton.addComponent(ButtonBreath);
      }
      
      // 自定义参数
      this.simpleBreath.setBreathParams(0.85, 1.15, 1.5);
    }

    // 缩放呼吸动画示例
    if (this.scaleBreathButton) {
      this.advancedBreath = this.scaleBreathButton.getComponent(AdvancedButtonBreath);

      if (!this.advancedBreath) {
        this.advancedBreath = this.scaleBreathButton.addComponent(AdvancedButtonBreath);
      }
      
      // 设置缩放呼吸参数
      this.advancedBreath.setBreathParams({
        minScale: 0.8,
        maxScale: 1.2,
        duration: 1.2,
        easing: 'quadInOut'
      });
    }

    // 透明度呼吸动画示例
    if (this.opacityBreathButton) {
      const opacityBreath = this.opacityBreathButton.getComponent(AdvancedButtonBreath);

      if (!opacityBreath) {
        const breath = this.opacityBreathButton.addComponent(AdvancedButtonBreath);
        // 通过属性面板设置 breathType 为 OPACITY
        // 或者通过代码设置
        breath['breathType'] = 'opacity';
        breath.setBreathParams({
          minOpacity: 100,
          maxOpacity: 255,
          duration: 0.8,
          easing: 'sineInOut'
        });
      }
    }

    // 旋转呼吸动画示例
    if (this.rotationBreathButton) {
      const rotationBreath = this.rotationBreathButton.getComponent(AdvancedButtonBreath);

      if (!rotationBreath) {
        const breath = this.rotationBreathButton.addComponent(AdvancedButtonBreath);
        breath['breathType'] = 'rotation';
        breath.setBreathParams({
          rotationRange: 8,
          duration: 1.5,
          easing: 'backInOut'
        });
      }
    }

    // 组合呼吸动画示例
    if (this.combinedBreathButton) {
      const combinedBreath = this.combinedBreathButton.getComponent(AdvancedButtonBreath);

      if (!combinedBreath) {
        const breath = this.combinedBreathButton.addComponent(AdvancedButtonBreath);
        breath['breathType'] = 'combined';
        breath.setBreathParams({
          minScale: 0.9,
          maxScale: 1.1,
          minOpacity: 180,
          maxOpacity: 255,
          rotationRange: 3,
          duration: 2.0,
          easing: 'elasticInOut'
        });
      }
    }
  }

  /**
   * 控制简单呼吸动画
   */
  public toggleSimpleBreath() {
    if (this.simpleBreath) {
      if (this.simpleBreath['isBreathing']) {
        this.simpleBreath.stopBreath();
      } else {
        this.simpleBreath.startBreath();
      }
    }
  }

  /**
   * 控制高级呼吸动画
   */
  public toggleAdvancedBreath() {
    if (this.advancedBreath) {
      if (this.advancedBreath['isBreathing']) {
        this.advancedBreath.stopBreath();
      } else {
        this.advancedBreath.startBreath();
      }
    }
  }

  /**
   * 暂停所有呼吸动画
   */
  public pauseAllBreath() {
    const breathComponents = this.node.getComponentsInChildren(AdvancedButtonBreath);
    breathComponents.forEach(breath => {
      breath.pauseBreath();
    });

    const simpleBreathComponents = this.node.getComponentsInChildren(ButtonBreath);
    simpleBreathComponents.forEach(breath => {
      breath.pauseBreath();
    });
  }

  /**
   * 恢复所有呼吸动画
   */
  public resumeAllBreath() {
    const breathComponents = this.node.getComponentsInChildren(AdvancedButtonBreath);
    breathComponents.forEach(breath => {
      breath.resumeBreath();
    });

    const simpleBreathComponents = this.node.getComponentsInChildren(ButtonBreath);
    simpleBreathComponents.forEach(breath => {
      breath.resumeBreath();
    });
  }

  /**
   * 停止所有呼吸动画
   */
  public stopAllBreath() {
    const breathComponents = this.node.getComponentsInChildren(AdvancedButtonBreath);
    breathComponents.forEach(breath => {
      breath.stopBreath();
    });

    const simpleBreathComponents = this.node.getComponentsInChildren(ButtonBreath);
    simpleBreathComponents.forEach(breath => {
      breath.stopBreath();
    });
  }
} 