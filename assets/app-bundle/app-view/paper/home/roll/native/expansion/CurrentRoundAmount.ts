import { _decorator, Component, Label, Node, tween, Tween, UIOpacity, Vec3 } from 'cc';
import { app } from 'db://assets/app/app';

const { ccclass, property } = _decorator;

@ccclass('CurrentRoundAmount')
export class CurrentRoundAmount extends Component {
  @property({ type: Node, tooltip: '当前轮次金额' })
  private amountNode: Node = null;

  private tween: Tween = null;

  private originPosition: Vec3 = new Vec3(0, 0, 0);

  onLoad() {
    this.originPosition = this.node.position.clone();
  }

  async showAmount(amount: number) {
    return new Promise((resolve) => {
      if (this.tween?.running) {
        this.tween.stop();
        this.node.getComponent(UIOpacity).opacity = 0;
        this.node.setPosition(this.originPosition);
      }

      this.amountNode.getComponent(Label).string = amount.toFixed(3);
      this.tween = tween(this.node);

      this.tween
        .timeScale(app.manager.global.gameSpeed)
        .sequence(
          tween(this.node.getComponent(UIOpacity)).to(0.25, { opacity: 255 }),
          tween(this.node).delay(1).to(0.25, { position: new Vec3(0, -380, 0) }, { easing: 'quintIn' })
        )
        .call(() => {
          this.node.getComponent(UIOpacity).opacity = 0;
          this.node.setPosition(this.originPosition);
          resolve(true);
        })
        .start();
    });
  }

  onDestroy() {
    this.tween.stop();
    this.tween = null;
  }
}
