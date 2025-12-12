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
    * 3: 展示免费轮剩余次数
   */
  updateBuyBonusStatus(status: number){
    if(status == 1){
      this.BuyBonusView.active = !getIsGap();
      this.FreeTimeView.active = false;
      this.FreeSpineView.active = false;
      this.node.getComponent(Sprite).spriteFrame = this.NormalBg;
    } else if (status == 2) {
      this.BuyBonusView.active = false;
      this.FreeTimeView.active = false;
      this.FreeSpineView.active = true;
      this.node.getComponent(Sprite).spriteFrame = this.freeSpineBg;
    } else if (status == 3) {
      this.BuyBonusView.active = false;
      this.FreeTimeView.active = true;
      this.FreeSpineView.active = false;
      this.node.getComponent(Sprite).spriteFrame = this.NormalBg;
    }
  }

  getBuyBonusView() {
    return this.BuyBonusView;
  }
}
