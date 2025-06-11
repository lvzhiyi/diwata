import {
  _decorator,
  Color,
  Component,
  instantiate,
  Label,
  Node,
  Prefab,
  Sprite,
  SpriteFrame,
} from 'cc';
import { app } from 'db://assets/app/app';
import { numberToMoney } from 'db://assets/common/script/extra/Utils/common';

const { ccclass, property } = _decorator;

@ccclass('BetAmountGrid')
export class BetAmountGrid extends Component {
  @property(Prefab)
  private roundBorderPrefab: Prefab;

  @property(SpriteFrame)
  private activeSpriteFrame: SpriteFrame = null;

  @property(SpriteFrame)
  private unactiveSpriteFrame: SpriteFrame = null;

  private list = [0.3, 0.5, 1, 2, 3, 5, 10, 20, 30, 40, 50, 80, 100, 200, 500, 1000, 5000, 10000];

  private listRadiusRect: Node[] = [];

  private listLabel: { isBold: boolean; color: Color, enableShadow: boolean }[] = [];

  protected onLoad(): void {
    this.onActive();
  }

  onActive() {
    this.node.removeAllChildren();
    this.list.forEach((val) => {
      const realVal = val ;
      const roundBorder = instantiate(this.roundBorderPrefab);
      const labelNode = roundBorder.getChildByName('Label').getComponent(Label);

      if (app.manager.global.betCount === realVal) {
        roundBorder.getComponent(Sprite).spriteFrame = this.activeSpriteFrame;
        labelNode.enableShadow = true;
      } else {
        roundBorder.getComponent(Sprite).spriteFrame = this.unactiveSpriteFrame;
        labelNode.enableShadow = false;
      }

      labelNode.string = '₱ ' + numberToMoney(realVal);
      this.node.addChild(roundBorder);

      this.listRadiusRect.push(roundBorder);
      this.listLabel.push(labelNode);
      roundBorder.on(Node.EventType.TOUCH_END, () => this.click(realVal), this);
    });
  }

  click(val: number) {
    app.manager.global.setBetCount(val);
    this.list.forEach((val, index) => {
      const label = this.listLabel[index];

      if (val === app.manager.global.betCount) {
        this.listRadiusRect[index].getComponent(Sprite).spriteFrame =
          this.activeSpriteFrame;
        label.enableShadow = true;
      } else {
        this.listRadiusRect[index].getComponent(Sprite).spriteFrame =
          this.unactiveSpriteFrame;
        label.enableShadow = false;
      }
    });
    app.manager.ui.hide({ name: 'PopBetamout' });
  }
}
