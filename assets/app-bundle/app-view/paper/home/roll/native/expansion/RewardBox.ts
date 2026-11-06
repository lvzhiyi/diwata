import { _decorator, Component, Label, Node, sp } from 'cc';
import { calculateWithBase, getP, numberToMoney } from 'db://assets/common/script/extra/Utils/common';
import { WinString } from 'db://assets/common/script/extra/Utils/PlatformConfig';

const { ccclass, property } = _decorator;

@ccclass('RewardBox')
export class RewardBox extends Component {
    @property({ type: Node, tooltip: '金额栏文字' })
    private TipsNode: Node = null;

    @property({ type: sp.Skeleton, tooltip: '金额条背景动画，pt：普通轮，free：免费轮' })
    private bgSkeleton: sp.Skeleton = null;
  
    /**
     * 切换金额条背景：普通轮 pt，免费轮 free
     */
    setFreeMode(isFreeBonusSpin: boolean) {
      this.bgSkeleton.setAnimation(0, isFreeBonusSpin ? 'free' : 'pt', true);
    }

    async showGoodLuck(): Promise<void> {
      this.TipsNode.getComponent(Label).string = 'GOOD LUCK';
    }

    async showPlace(): Promise<void> {
      this.TipsNode.getComponent(Label).string = 'PLACE YOUR BETS';
    }

    async showWinNumber(_startNum: number, endNum: number): Promise<void> {
      const label = this.TipsNode.getComponent(Label);
      label.string = `${WinString().toUpperCase()} ${getP()}${numberToMoney(calculateWithBase(endNum), 3, false)}`;
    }
}
