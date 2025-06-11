import { _decorator, Component, Label, Node, UITransform } from 'cc';
import { app } from 'db://assets/app/app';
import { NumberAnimator } from 'db://assets/basePlate/middleWare/commonUI/NumberAnimator';
import { JackpotType } from 'db://assets/basePlate/middleWare/enums/jackpot';
import { JackpotInfoModel } from 'db://assets/basePlate/middleWare/services/user';
import { numberToMoney } from 'db://assets/common/script/extra/Utils/common';

const { ccclass, property } = _decorator;

@ccclass('JackpotPrizePool')
export class JackpotPrizePool extends Component {
  @property({ type: Node, tooltip: 'grand' })
  private grandNode: Node = null;

  @property({ type: Node, tooltip: 'major' })
  private majorNode: Node = null;

  @property({ type: Node, tooltip: 'minor' })
  private minorNode: Node = null;

  @property({ type: Node, tooltip: 'mini' })
  private miniNode: Node = null;

  /**
     * 数字动画控制器
     * 用于实现金额数字的滚动效果
     */
  private grandAnimator: NumberAnimator;

  private majorAnimator: NumberAnimator;

  private minorAnimator: NumberAnimator;

  private miniAnimator: NumberAnimator;

  onLoad() {
   
  }

  start() {
    if (this.grandNode) {
      this.grandAnimator = new NumberAnimator(this.grandNode, null, 3, false);
    }
    if (this.majorNode) {
      this.majorAnimator = new NumberAnimator(this.majorNode, null, 3, false);
    }
    if (this.minorNode) {
      this.minorAnimator = new NumberAnimator(this.minorNode, null, 3, false);
    }
    if (this.miniNode) {
      this.miniAnimator = new NumberAnimator(this.miniNode, null, 3, false);
    }
  }

  update(deltaTime: number) {
        
  }

  /**
   * 初始化UI元素
   */
  public  initializeUI(data: JackpotInfoModel[]) {
    if (!data || data.length === 0) {
      return;
    }

    data.forEach(jackpot => {
      const amount = jackpot.amount / app.manager.global.multiBetAmount;
      const type = jackpot.type ?? 0;

      switch (type) {
        case JackpotType.GRAND:
          this.assignmentNodeWithData(this.grandNode, this.grandAnimator, amount);
          break;
        case JackpotType.MAJOR:
          this.assignmentNodeWithData(this.majorNode, this.majorAnimator, amount);
          break;
        case JackpotType.MINOR:
          this.assignmentNodeWithData(this.minorNode, this.minorAnimator, amount);
          break;
        case JackpotType.MINI:
          this.assignmentNodeWithData(this.miniNode, this.miniAnimator, amount);
          break;
      }
    });
  }

  /**
   * 初始化UI元素
   */
  public  rollAnimation(data: JackpotInfoModel[]) {
    if (!data || data.length === 0) {
      return;
    }

    data.forEach(jackpot => {
      const amount = jackpot.amount / app.manager.global.multiBetAmount;
      const type = jackpot.type ?? 0;

      switch (type) {
        case JackpotType.GRAND:
          this.rollAnimationNodeWithData(this.grandNode, this.grandAnimator, amount);
          break;
        case JackpotType.MAJOR:
          this.rollAnimationNodeWithData(this.majorNode, this.majorAnimator, amount);
          break;
        case JackpotType.MINOR:
          this.rollAnimationNodeWithData(this.minorNode, this.minorAnimator, amount);
          break;
        case JackpotType.MINI:
          this.rollAnimationNodeWithData(this.miniNode, this.miniAnimator, amount);
          break;
      }
    });
  }

  assignmentNodeWithData(node: Node, animator: NumberAnimator, amount: number) {
    const lable = node.getComponent(Label);

    if (lable) {
      lable.string = '' + amount;
    }

    animator.setValue(amount);
  }

  rollAnimationNodeWithData(node: Node, animator: NumberAnimator, amount: number) {
    const lable = node.getComponent(Label);

    if (lable) {
      lable.string = '' + amount;
    }

    animator.animateTo(amount, 2, (value) => numberToMoney(value, 3, false), false);
  }
}
