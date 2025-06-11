import { _decorator, Component, instantiate, Node, Prefab, Tween, tween, Vec3 } from 'cc';
import { RewardLine } from 'db://assets/basePlate/middleWare/gamemodels/GameResultModel';
import { delay } from 'db://assets/common/script/extra/Utils/common';
import { RewardLineNode } from './RewardLineNode';

const { ccclass, property } = _decorator;

@ccclass('RewardLineBox')
export class RewardLineBox extends Component {
  @property(Prefab)
  private rewardLinePrefab: Prefab = null;

  @property(Node)
  private content: Node = null;

  private rewardLineTween: Tween<Node> = null;

  private ITEM_HEIGHT = 50;

  init(rewardLines: RewardLine[]) {
    this.reset();

    rewardLines.forEach((line, index) => {
      const rewardLineNode = instantiate(this.rewardLinePrefab);
      rewardLineNode.getComponent(RewardLineNode).init(line);
      rewardLineNode.setPosition(new Vec3(0, -this.ITEM_HEIGHT * index, 0));
      
      this.content.addChild(rewardLineNode);
    });

    if (rewardLines.length > 1) {
      this.startMove();
    }
  }

  /**
   * 重置中奖线
   */
  reset() {
    this.content.removeAllChildren();
    this.content.setPosition(new Vec3(0, 0, 0));

    if (this.rewardLineTween) {
      this.rewardLineTween.stop();
      this.rewardLineTween = null;
    }
  }

  async startMove() {
    await delay(1000);

    const runTween = tween(this.content).by(0.3, { position: new Vec3(0, this.ITEM_HEIGHT, 0) }).delay(1.3).call(() => {
      const rewardLineNode = instantiate(this.rewardLinePrefab);
      const lastY = this.content.children[this.content.children.length - 1].getPosition().y;
      rewardLineNode.setPosition(new Vec3(0, lastY - this.ITEM_HEIGHT, 0));

      this.content.removeChild(this.content.children[0]);
      this.content.addChild(rewardLineNode);
    });

    this.rewardLineTween = tween(this.content).repeatForever(runTween).start();
  }

  protected onDisable(): void {
    if (this.rewardLineTween) {
      this.rewardLineTween.stop();
      this.rewardLineTween = null;
    }
  }
}
