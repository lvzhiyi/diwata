import { _decorator, Component, Label, Node, sp, Sprite, SpriteFrame, tween, Vec3 } from 'cc';
import { app } from 'db://assets/app/app';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { calculateWithBase, getP, numberToMoney } from 'db://assets/common/script/extra/Utils/common';
import { WinString } from 'db://assets/common/script/extra/Utils/PlatformConfig';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass, property } = _decorator;

@ccclass('RewardBox')
export class RewardBox extends Component {
    @property({ type: SpriteFrame, tooltip: 'Tips Image Node' })
    private placeImageNode: SpriteFrame = null;
  
    @property({ type: SpriteFrame, tooltip: 'Tips Image Node' })
    private goodLuckImageNode: SpriteFrame = null;

    @property({ type: Node, tooltip: 'Tips Node' })
    private TipsNode: Node = null;
  
    @property({ type: Node, tooltip: 'Tips Image Node' })
    private TipsImageNode: Node = null;

    @property({ type: Node, tooltip: 'SpineWinSkeleton' })
    private SpineWinSkeleton: Node = null;

    @property({ type: sp.Skeleton, tooltip: '金额条背景动画，pt：普通轮，free：免费轮' })
    private bgSkeleton: sp.Skeleton = null;
  
    start() {

    }

    update(deltaTime: number) {
        
    }

    /**
     * 切换金额条背景：普通轮 pt，免费轮 free
     */
    setFreeMode(isFreeBonusSpin: boolean) {
      this.bgSkeleton.setAnimation(0, isFreeBonusSpin ? 'free' : 'pt', true);
    }

    showGoodLuck(): Promise<void> {
      return new Promise<void>(resolve => {
        this.TipsNode.active = false;
        this.TipsImageNode.active = true;
        this.TipsImageNode.getComponent(Sprite).spriteFrame = this.goodLuckImageNode;
        resolve();
      });
    }

    showPlace(): Promise<void> {
      return new Promise<void>(resolve => {
        this.TipsNode.active = false;
        this.TipsImageNode.active = true;
        this.TipsImageNode.getComponent(Sprite).spriteFrame = this.placeImageNode;
        resolve();
      });
    }

    showWinNumber(startNum: number, endNum: number): Promise<void> {
      return new Promise<void>(resolve => {
        // EffectManager.inst.playEffect(AudioPath.GAME.COIN_ADD);
        this.TipsNode.active = true;
        this.TipsImageNode.active = false;
        // 播放金额动画，如果金额变化小于2倍投注金额，则播放action1，否则播放action2
        this.SpineWinSkeleton.active = true;
        const spine = this.SpineWinSkeleton.getComponent(sp.Skeleton);
        spine.setAnimation(0,  'jiesuanshanguang', false);
        spine.setCompleteListener(() => {
          spine.setCompleteListener(null);
          this.SpineWinSkeleton.active = false;
        });
        // 金额滚动效果
        console.log('startNum', startNum, endNum);
        const label = this.TipsNode.getComponent(Label);
        label.string = `${WinString().toUpperCase()} ${getP()}${numberToMoney(calculateWithBase(endNum), 3, false)}`;
        // 缩放效果：从 0 放大到 1.2 再回弹到 1（小 pop）
        this.TipsNode.setScale(0.25, 0.25, 1);
        tween(this.TipsNode)
          .to(0.35, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'quadOut' })
          .to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'quadIn' })
          .call(() => resolve())
          .start();
        // tween(target).to(
        //   0.8,
        //   { value: endNum },
        //   { onUpdate: () => label.string = `${WinString().toUpperCase()} ${getP()}${numberToMoney(calculateWithBase(target.value), 3, false)}` }
        // ).call(() => {
        //   // EffectManager.inst.stopAllEffectsByName(AudioPath.GAME.COIN_ADD);
        // resolve();
        // })
        //   .start();
      });
    }
}
