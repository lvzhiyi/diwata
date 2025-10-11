import { _decorator, Component, Label, Node, sp, Sprite, SpriteFrame, tween } from 'cc';
import { app } from 'db://assets/app/app';
import { calculateWithBase, numberToMoney } from 'db://assets/common/script/extra/Utils/common';

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
  
    start() {

    }

    update(deltaTime: number) {
        
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
        // 金额滚动效果
        const target = { value: startNum };
        const label = this.TipsNode.getComponent(Label);
        tween(target).to(
          2 / app.manager.global.gameSpeed,
          { value: endNum },
          { onUpdate: () => label.string = `WIN ₱${numberToMoney(calculateWithBase(target.value), 3, false)}` }
        ).call(() => {
          resolve();
        })
          .start();
      });
    }
}
