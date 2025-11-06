import { _decorator, Label, Node, sp, Sprite, SpriteFrame } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { NumberAnimator } from 'db://assets/basePlate/middleWare/commonUI/NumberAnimator';
import { numberToMoney } from 'db://assets/common/script/extra/Utils/common';
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

  protected onLoad(): void {
    this.numberWinBgAnimator = new NumberAnimator(this.AmountLabel);
    console.log('this.spineNode', this.spineNode);
    this.spineSkeleton = this.spineNode.getComponent(sp.Skeleton);
  }

  onShow(params: any) {
    this.init(params);
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

    return new Promise<void>(async (resolve) => {
      await this.numberWinBgAnimator.animateTo(
        this.amount,
        5,
        (value) => '₱ ' + numberToMoney(value, 3, false),
        true
      );
      this.stopAnimation();

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
    BGMManager.inst.playNormalModeBGM();
    this.numberWinBgAnimator.stopAnimation(true);
    SpineTool.clearAnimationNode(this.spineNode);

    return result;
  }
}