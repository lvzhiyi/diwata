import { _decorator, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
import { loadResource } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';
import { RewardLine } from 'db://assets/basePlate/middleWare/gamemodels/GameResultModel';
import { calculateWithBase } from 'db://assets/common/script/extra/Utils/common';

const { ccclass, property } = _decorator;

const RewardLineType = {
  THREE: '3',
  FOUR: '4',
  FIVE: '5',
  SIX: '6',
};

@ccclass('RewardLineNode')
export class RewardLineNode extends Component {
  @property(Node)
  private symbol: Node = null;

  @property(Label)
  private symbolLabel: Label = null;

  @property(Label)
  private rewardLabel: Label = null;

  init(rewardLine: RewardLine) {
    loadResource('load', 'resources', `icons/symbols/${rewardLine.symbolId}/spriteFrame`, SpriteFrame).then((spriteFrame: SpriteFrame) => {
      this.symbol.getComponent(Sprite).spriteFrame = spriteFrame;
    });

    this.symbolLabel.string = RewardLineType[rewardLine.rewardLineType as keyof typeof RewardLineType] || '';

    // eslint-disable-next-line max-len
    this.rewardLabel.string = `${calculateWithBase(rewardLine.betAmount)} x ${rewardLine.odds} x ${rewardLine.rewardLineCount} x ${rewardLine.multiple} = ${calculateWithBase(rewardLine.rewardAmount)}`;
  }
}
