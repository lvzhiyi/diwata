import { Label, Node, Component } from 'cc';

/**
 * 数字动画控制器类
 * 用于创建平滑的数字变化动画效果
 */
export class NumberAnimator {
  private targetNode: Node;

  private targetComponent: Label | Component;

  private displayValue: number = 0;

  private isAnimating: boolean = false;

  private updateCallback: Function | null = null;

  private componentGetter: () => Label;

  private decimalPlaces: number = 0;

  private useThousandsSeparator: boolean = false;

  private targetValue: number = 0;

  private currentFormatFunction: ((value: number) => string) | undefined = undefined;

  /**
   * 构造函数
   * @param target 目标节点或组件
   * @param updateCallback 可选的更新回调，如果提供则在每次数值更新时调用
   * @param decimalPlaces 小数点位数，默认为0（整数）
   * @param useThousandsSeparator 是否使用千分号分隔，默认为false
   */
  constructor(
    target: Node | Label,
    updateCallback: Function | null = null,
    decimalPlaces: number = 0,
    useThousandsSeparator: boolean = false
  ) {
    if (target instanceof Node) {
      this.targetNode = target;
      this.targetComponent = this.targetNode.getComponent(Label);
      this.componentGetter = () => this.targetComponent as Label;
    } else {
      this.targetComponent = target;
      this.targetNode = target.node;
      this.componentGetter = () => this.targetComponent as Label;
    }

    this.updateCallback = updateCallback;
    this.decimalPlaces = Math.max(0, decimalPlaces);
    this.useThousandsSeparator = useThousandsSeparator;
  }

  /**
   * 设置小数点位数
   * @param places 小数点位数
   */
  public setDecimalPlaces(places: number): void {
    this.decimalPlaces = Math.max(0, places);
    // 更新当前显示
    this.updateDisplay(this.displayValue);
  }

  /**
   * 设置是否使用千分号分隔
   * @param use 是否使用千分号
   */
  public setUseThousandsSeparator(use: boolean): void {
    this.useThousandsSeparator = use;
    // 更新当前显示
    this.updateDisplay(this.displayValue);
  }

  /**
   * 格式化数字为字符串，应用小数点和千分号设置
   * @param value 要格式化的数值
   */
  private formatNumber(value: number): string {
    // 处理小数点
    let formattedValue =
      this.decimalPlaces > 0 ? value.toFixed(this.decimalPlaces) : Math.floor(value).toString();

    // 处理千分号
    if (this.useThousandsSeparator) {
      const parts = formattedValue.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formattedValue = parts.join('.');
    }

    return formattedValue;
  }

  /**
   * 更新显示
   * @param value 要显示的数值
   */
  private updateDisplay(value: number): void {
    const label = this.componentGetter();

    if (label) {
      label.string = this.formatNumber(value);
    }

    if (this.updateCallback) {
      this.updateCallback(value);
    }
  }

  /**
   * 设置初始值
   * @param value 初始数值
   */
  public setValue(value: number): void {
    this.displayValue = value;
    this.updateDisplay(value);
  }

  /**
   * 以动画形式更新数字
   * @param targetValue 目标数值
   * @param duration 动画持续时间（秒）
   * @param formatFunction 可选的格式化函数，用于自定义数字显示格式
   * @param startFromZero 是否从0开始播放动画，默认为false
   */
  public animateTo(
    targetValue: number,
    duration: number = 1.0,
    formatFunction?: (value: number) => string,
    startFromZero: boolean = false
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      // 如果目标值与当前显示值相同且不是从0开始，无需动画
      if (targetValue === this.displayValue && !startFromZero) {
        resolve();

        return;
      }

      // 如果正在执行动画，先停止当前动画
      if (this.isAnimating) {
        this.stopAnimation();
      }

      // 保存目标值和格式化函数，用于可能的立即结束动画
      this.targetValue = targetValue;
      this.currentFormatFunction = formatFunction;

      // 设置动画初始值和目标值
      const startValue = startFromZero ? 0 : this.displayValue;
      const endValue = targetValue;
      const changeValue = endValue - startValue;

      // 如果从0开始，立即更新显示值为0
      if (startFromZero) {
        this.displayValue = 0;
        const label = this.componentGetter();

        if (label) {
          label.string = formatFunction ? formatFunction(0) : this.formatNumber(0);
        }
      }

      // 无变化时直接设置
      if (changeValue === 0) {
        this.displayValue = endValue;

        const label = this.componentGetter();

        if (label) {
          label.string = formatFunction ? formatFunction(endValue) : this.formatNumber(endValue);
        }

        if (this.updateCallback) {
          this.updateCallback(endValue);
        }

        resolve();

        return;
      }

      // 动画参数
      let elapsedTime = 0;
      // 约60帧每秒
      const interval = 1 / 60; 

      // 标记动画开始
      this.isAnimating = true;

      // 更新函数
      const updateAnimation = (dt: number) => {
        elapsedTime += dt;

        if (elapsedTime >= duration) {
          // 动画结束，设置为最终值
          this.displayValue = endValue;

          const label = this.componentGetter();

          if (label) {
            label.string = formatFunction ? formatFunction(endValue) : this.formatNumber(endValue);
          }

          if (this.updateCallback) {
            this.updateCallback(endValue);
          }

          this.isAnimating = false;

          // 停止计时器
          if (this.targetComponent instanceof Component) {
            this.targetComponent.unschedule(updateAnimation);
          }

          // 动画完成，解析Promise
          resolve();

          return;
        }

        // 计算当前进度（使用缓动函数让动画更自然）
        const progress = elapsedTime / duration;
        const easedProgress = this.easeOutQuad(progress);

        // 计算当前值（支持小数）
        const currentValue = startValue + changeValue * easedProgress;
        this.displayValue = currentValue;

        // 更新UI显示
        const label = this.componentGetter();

        if (label) {
          label.string = formatFunction
            ? formatFunction(currentValue)
            : this.formatNumber(currentValue);
        }

        if (this.updateCallback) {
          this.updateCallback(currentValue);
        }
      };

      // 使用组件的调度器
      if (this.targetComponent instanceof Component) {
        this.targetComponent.schedule(updateAnimation, interval);
      }
    });
  }

  /**
   * 立即停止动画
   * @param jumpToTarget 是否跳转到目标值，默认为false
   */
  public stopAnimation(jumpToTarget: boolean = false): void {
    if (!this.isAnimating) {
      return;
    }

    // 确保目标组件存在且是组件类型
    if (this.targetComponent instanceof Component) {
      this.targetComponent.unscheduleAllCallbacks();
    }

    this.isAnimating = false;

    // 如果需要跳转到目标值
    if (jumpToTarget) {
      this.displayValue = this.targetValue;

      // 更新UI显示
      const label = this.componentGetter();

      if (label) {
        label.string = this.currentFormatFunction
          ? this.currentFormatFunction(this.targetValue)
          : this.formatNumber(this.targetValue);
      }

      // 调用更新回调
      if (this.updateCallback) {
        this.updateCallback(this.targetValue);
      }
    }
  }

  /**
   * 缓动函数 - 缓出二次方
   */
  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  /**
   * 获取当前显示值
   */
  public getCurrentValue(): number {
    return this.displayValue;
  }

  /**
   * 检查是否正在动画中
   */
  public isInAnimation(): boolean {
    return this.isAnimating;
  }
}
