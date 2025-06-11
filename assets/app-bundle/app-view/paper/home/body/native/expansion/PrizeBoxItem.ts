import { _decorator, Component, Label, Node, UITransform, Widget } from 'cc';
import { NumberAnimator } from 'db://assets/basePlate/middleWare/commonUI/NumberAnimator';
import { calculateTextWidth, numberToMoney } from 'db://assets/common/script/extra/Utils/common';

const { ccclass, property } = _decorator;

@ccclass('PrizeBoxItem')
export class PrizeBoxItem extends Component {
  /**
   * 金额显示标签
   * 用于展示中奖金额
   */
  @property({ type: Node, tooltip: '金额节点' })
  private AmountLabel: Label;

  @property({ type: Node, tooltip: '背景节点' })
  private bgView: Node;

  @property({ type: Node, tooltip: 'cover节点' })
  private coverView: Node;

  @property({ type: Node, tooltip: 'lock节点' })
  private lockView: Node;

  /**
   * 数字动画控制器
   * 用于实现金额数字的滚动效果
   */
  private numberWinBgAnimator: NumberAnimator;

  /**
   * 组件加载时初始化
   */
  onLoad() {
    this.numberWinBgAnimator = new NumberAnimator(this.AmountLabel, null, 3, false);
  }

  /**
   * 初始化UI元素
   * @param params 包含奖励类型和金额的参数对象
   */
  public initializeUI(initValue: number) {
    const textWidth = calculateTextWidth(numberToMoney(initValue, 3, false), 30, 'Arial');
    const bgTransform = this.node.getComponent(UITransform);
   
    bgTransform.setContentSize(textWidth + 110, 85);
    // 更新子节点的widget
    const widget = this.bgView.getComponent(Widget);

    if (widget) {
      widget.updateAlignment();
    }

    this.AmountLabel.string = '' + initValue;
   
    this.numberWinBgAnimator.setValue(initValue);
  }

  public setLockStatus(isLock: boolean) {
    this.coverView.active = isLock;
    this.lockView.active = isLock;
  } 

  /**
   * 播放数字动效
   * @param targetAmount 目标金额
   * @param duration 动效持续时间
   */

  public playNumberAnimation(targetAmount: number, duration: number) {
    this.AmountLabel.string = '' + targetAmount;
    this.numberWinBgAnimator.animateTo(targetAmount, duration, (value) => numberToMoney(value, 3, false), false);
  }

  update(deltaTime: number) {
        
  }
}
