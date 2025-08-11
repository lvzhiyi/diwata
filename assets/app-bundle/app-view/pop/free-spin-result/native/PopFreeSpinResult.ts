import { _decorator, Label, Node, sp, Sprite, SpriteFrame } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { NumberAnimator } from 'db://assets/basePlate/middleWare/commonUI/NumberAnimator';
import { numberToMoney } from 'db://assets/common/script/extra/Utils/common';
import { app } from 'db://assets/app/app';

const { ccclass, property } = _decorator;
@ccclass('PopFreeSpinResult')
export class PopFreeSpinResult extends BaseView {
  @property({ type: Label, tooltip: '金额Label' })
  private AmountLabel: Label = null;

  @property({ type: Label, tooltip: '免费轮次数Label' })
  private FreeSpinTimesLabel: Label = null;

  @property({ type: Node, tooltip: 'subTitle Node' })
  private subTitleNode: Node = null;

  @property({ type: SpriteFrame, tooltip: 'haveWin SpriteFrame' })
  private haveWinSpriteFrame: SpriteFrame = null;

  @property({ type: SpriteFrame, tooltip: 'maxWin SpriteFrame' })
  private maxWinSpriteFrame: SpriteFrame = null;

  @property({ type: sp.Skeleton, tooltip: 'spineSkeleton' })
  private spineSkeleton: sp.Skeleton = null;

  private numberWinBgAnimator: NumberAnimator = null;

  private amount: number = 0;

  protected onLoad(): void {
    this.numberWinBgAnimator = new NumberAnimator(this.AmountLabel);
  }

  onShow(params: any) {
    this.init(params);

    this.showAmountAnimation();
  }

  init(params: any) {
    const {
      times, amount, accumulateReachMaxMultiple 
    } = params;
    this.numberWinBgAnimator.setValue(0);
    this.amount = amount / app.manager.global.multiBetAmount;
    this.FreeSpinTimesLabel.string = times;

    this.subTitleNode.getComponent(Sprite).spriteFrame = accumulateReachMaxMultiple ? this.maxWinSpriteFrame : this.haveWinSpriteFrame;
  }

  showAmountAnimation() {
    this.scheduleOnce(() => {
      this.startAnimation();
    });

    return new Promise<void>(async (resolve) => {
      await this.numberWinBgAnimator.animateTo(
        this.amount,
        3,
        (value) => '₱ ' + numberToMoney(value, 3, false),
        true
      );

      this.scheduleOnce(() => {
        this.stopAnimation();
      }, app.manager.global.quikeMode ? 1 : 2.5);

      resolve();
    });
  }

  startAnimation() {
    this.spineSkeleton.setAnimation(0, 'congratlilation_in', false);
    this.spineSkeleton.addAnimation(0, 'congratlilation_loop', true);
  }

  stopAnimation() {
    this.spineSkeleton.setAnimation(0, 'congratlilation_out', false);
    this.spineSkeleton.setCompleteListener(() => {
      app.manager.ui.hide({ name: 'PopFreeSpinResult' });
    });
  }
  
  onHide(result: undefined) {
    this.numberWinBgAnimator.stopAnimation(true);

    return result;
  }
}