import { _decorator, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BousView')
export class BousView extends Component {
  @property({ type: Node, tooltip: 'BuyBonusView' })
  private BuyBonusView: Node = null;

  @property({ type: Node, tooltip: 'FreeTime' })
  private FreeTimeView: Node = null;

  @property({ type: Node, tooltip: 'FreeSpineView' })
  private FreeSpineView: Node = null;

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
      this.BuyBonusView.active = true;
      this.FreeTimeView.active = false;
      this.FreeSpineView.active = false;
    } else if (status == 2) {
      this.BuyBonusView.active = false;
      this.FreeTimeView.active = false;
      this.FreeSpineView.active = true;
    } else if (status == 3) {
      this.BuyBonusView.active = false;
      this.FreeTimeView.active = true;
      this.FreeSpineView.active = false;
    }
  }
}
