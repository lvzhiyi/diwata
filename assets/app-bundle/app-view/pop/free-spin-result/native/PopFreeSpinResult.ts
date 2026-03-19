import { _decorator, Label, Node, sp, Sprite, SpriteFrame } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { NumberAnimator } from 'db://assets/basePlate/middleWare/commonUI/NumberAnimator';
import { getP, numberToMoney } from 'db://assets/common/script/extra/Utils/common';
import { app } from 'db://assets/app/app';
import { IQuickMode } from 'db://assets/app-builtin/app-manager/global/GlobalManager';
import { SpineTool } from 'db://assets/res-native/script/SpineTool';
import { GameResourceManager, SPINE_RESOURCE_NAMES } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';
import { BGMManager } from 'db://assets/basePlate/middleWare/serverManager/BGMManager';

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

  @property({ type: Node, tooltip: 'spineSkeleton' })
  private spineNode:Node = null;

  private numberWinBgAnimator: NumberAnimator = null;

  private spineSkeleton:sp.Skeleton = null;

  private amount: number = 0;

  private isClickScreenToStop: boolean = false;

  protected onLoad(): void {
    this.numberWinBgAnimator = new NumberAnimator(this.AmountLabel);
    console.log('this.spineNode', this.spineNode);
    this.spineSkeleton = this.spineNode.getComponent(sp.Skeleton);
  }

  onShow(params: any) {
    this.init(params);
    this.node.on(Node.EventType.TOUCH_START, this.clickScreenToStop, this);
    EffectManager.inst.playEffect(AudioPath.GAME.SETTLE);
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

  async showAmountAnimation() {
    // 获取骨骼动画组件和文本节点
    if(!this.spineNode || !this.spineNode.isValid) {
      return;
    }
    try {
      // 根据奖励类型加载对应的骨骼动画资源
      const spineAtlas: sp.SkeletonData = await GameResourceManager.instance.getSpineAnimationDataByName(SPINE_RESOURCE_NAMES.FREE_SPIN_RESULT);
      this.spineSkeleton = this.spineNode.getComponent(sp.Skeleton) || this.spineNode.addComponent(sp.Skeleton);
      this.spineSkeleton.premultipliedAlpha = false;
      // 设置骨骼动画数据
      this.spineSkeleton.skeletonData = spineAtlas;

      this.spineSkeleton.timeScale = app.manager.global.gameSpeed;
      this.startAnimation();
    } catch (error) {
      console.error('showAmountAnimation error', error);
    }

    await this.numberWinBgAnimator.animateTo(
      this.amount,
      this.getDisplayTimeByRewardType(),
      (value) => `${getP()} ` + numberToMoney(value, 3, false),
      true
    );
    this.scheduleOnce(() => {
      if (!this.isClickScreenToStop) {
        this.stopAnimation();
      }
    }, 5);
  }

  private getDisplayTimeByRewardType(): number {
    let time = 5.2;

    time = app.manager.global.gameSpeed === 2 ? time : time / app.manager.global.gameSpeed;

    return time;
  }

  clickScreenToStop() {
    if (this.isClickScreenToStop) {
      // 如果是第二次点击，播放隐藏动画
      this.stopAnimation();
    } else {
      this.isClickScreenToStop = true;

      if (this.numberWinBgAnimator.isInAnimation()) {
        // 如果数字动画在播放，点击后金额动画直接到最后一步
        this.numberWinBgAnimator.stopAnimation();
        EffectManager.inst.stopAllEffectsByName(AudioPath.GAME.SETTLE);
        EffectManager.inst.playEffect(AudioPath.GAME.SETTLE_END, false, null, true);
        this.scheduleOnce(() => {
          this.numberWinBgAnimator.animateTo(
            this.amount,
            0,
            (value) => numberToMoney(value, 3, false),
            true
          );
          this.scheduleOnce(() => {
            this.stopAnimation();
          }, 5);
        });
      } else {
        // 如果数字动画没有在播放，点击后直接隐藏
        this.stopAnimation();
      }
    }
  }

  startAnimation() {
    this.spineSkeleton.setAnimation(0, 'congratlilation_in', false);
    this.spineSkeleton.addAnimation(0, 'congratlilation_loop', true);
  }

  stopAnimation() {
    EffectManager.inst.stopAllEffectsByName(AudioPath.GAME.SETTLE);
    this.spineSkeleton.setAnimation(0, 'congratlilation_out', false);
    this.spineSkeleton.setCompleteListener(() => {
      app.manager.ui.hide({ name: 'PopFreeSpinResult' });
    });
  }
  
  onHide(result: undefined) {
    this.isClickScreenToStop = false;
    this.node.off(Node.EventType.TOUCH_START, this.clickScreenToStop, this);
    BGMManager.inst.playNormalModeBGM();
    this.numberWinBgAnimator.stopAnimation(true);
    SpineTool.clearAnimationNode(this.spineNode);

    return result;
  }
}