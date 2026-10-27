import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import { getIsGap } from 'db://assets/common/script/extra/Utils/common';

const { ccclass, property } = _decorator;

@ccclass('BousView')
export class BousView extends Component {
  @property({ type: Node, tooltip: 'BuyBonusView' })
  private BuyBonusView: Node = null;

  @property({ type: Node, tooltip: 'FreeTime' })
  private FreeTimeView: Node = null;

  @property({ type: Node, tooltip: 'FreeSpineView' })
  private FreeSpineView: Node = null;

  // 成就的免费的freeSpineBg
  @property(SpriteFrame)
  private freeSpineBg: SpriteFrame = null;

  @property(SpriteFrame)
  private NormalBg: SpriteFrame = null;

  start() {

  }

  update(deltaTime: number) {
        
  }

  /**
    * 更新展示按钮状态
    * 1: 展示购买免费轮按钮
    * 2: 展示freeSpin按钮   
    * 3: 免费轮中，整个按钮隐藏（剩余次数改在 spin 按钮上显示）
   */
  updateBuyBonusStatus(status: number){
    this.node.active = status !== 3 && !getIsGap();

    if(status == 1){
      this.BuyBonusView.active = !getIsGap();
      this.FreeTimeView.active = false;
      this.FreeSpineView.active = false;
      this.setBackground(this.NormalBg);
    } else if (status == 2) {
      this.BuyBonusView.active = false;
      this.FreeTimeView.active = false;
      this.FreeSpineView.active = true;
      this.setBackground(this.freeSpineBg);
    } else if (status == 3) {
      this.BuyBonusView.active = false;
      this.FreeTimeView.active = true;
      this.FreeSpineView.active = false;
      this.setBackground(this.NormalBg);
    }
  }

  /**
   * 切换按钮底图；按钮背景改为 buybonus 骨骼动画后节点上没有 Sprite，此时不处理
   */
  private setBackground(spriteFrame: SpriteFrame) {
    const sprite = this.node.getComponent(Sprite);

    if (sprite) {
      sprite.spriteFrame = spriteFrame;
    }
  }

  getBuyBonusView() {
    return this.BuyBonusView;
  }
}
