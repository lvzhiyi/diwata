import { _decorator, Component, Label, Layout, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { MoneyUtil } from 'db://assets/basePlate/core/baseUtil/MoneyUtil';
import { BetRewardLineItem } from 'db://assets/basePlate/middleWare/services/bet';
import { getP } from 'db://assets/common/script/extra/Utils/common';

const { ccclass, property } = _decorator;

@ccclass('RewardLine')
export class RewardLine extends Component {
  @property(Node)
  private icon: Node = null;

  @property(Node)
  private rewardNumberLabel: Node = null;

  @property(Node)
  private paysLable: Node = null;

  @property(Node)
  private rewardContainer: Node = null;

  start() {

  }

  update(deltaTime: number) {
        
  }

  public initValue(item: BetRewardLineItem, icon: SpriteFrame) {
    if(icon) {
      this.icon.getComponent(Sprite).spriteFrame = icon;
    }

    // 设置中奖线
    const RewardLineType = {
      THREE: '3',
      FOUR: '4',
      FIVE: '5',
      SIX: '6',
    };

    if (item.rewardLineCount > 0) {
      this.rewardNumberLabel.active = true;
      this.rewardNumberLabel.getComponent(Label).string =
        RewardLineType[item.rewardLineType as keyof typeof RewardLineType] || '';
    } else {
      // 隐藏
      this.rewardNumberLabel.active = false;
    }  
    
    // 中奖金额
    const textNode = this.paysLable;

    if (item) {
      const label = textNode.getComponent(Label);
      const betNumber = MoneyUtil.formatDisplayAmount(MoneyUtil.internalToDisplay(item.betAmount) * item.odds);
      let content = `${getP()} ${betNumber} X ${item.rewardLineCount} = ${getP()}${MoneyUtil.internalToDisplay(item.rewardAmount)
      }`;

      if (item.multiple > 1 && item.symbolId != '3001') {
        const betNewNumber =  MoneyUtil.internalToDisplay(item.betAmount * item.odds);
        const rewardAmount = betNewNumber * item.rewardLineCount;
        content = `${getP()} ${MoneyUtil.formatDisplayAmount(rewardAmount)} X ${item.multiple
        } = ${getP()} ${MoneyUtil.internalToDisplay(item.rewardAmount)}`;
      }

      label.string = content;

    //   // 获取容器宽度并调整字体大小
    //   this.scheduleOnce(() => {
    //     this.adjustScale(this.rewardContainer, label);
    //   }, 0.01);
    }
  }

  /**
   * 动态调整Scale
   */
  private adjustScale(textContainer: Node, label: Label) {
    const parentWidth = 190;
    // SYMBOL图标大小+PAYS图标大小+间距+label宽度
    const textContainerWidth = 55 + label.node.getComponent(UITransform).width;

    if (textContainerWidth > parentWidth) {
      const scale = parentWidth / textContainerWidth;
      textContainer.scale = new Vec3(scale, scale, 1);
    }

    textContainer.getComponent(Layout).updateLayout();
  }
}
