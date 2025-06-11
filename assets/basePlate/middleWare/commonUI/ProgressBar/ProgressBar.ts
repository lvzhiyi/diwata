import { _decorator, Component, Label, Node, tween, UITransform, Widget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ProgressBar')
export class ProgressBar extends Component {
  @property(Node)
  private ProgressBgNode: Node = null;

  @property(Node)
  private ProgressNode: Node = null;

  @property(Node)
  private LabelPercentNode: Node = null;

  private currentPercent: number = 0;

  private maxWidth: number = 0;

  protected onLoad(): void {
    this.maxWidth = this.ProgressBgNode.getComponent(UITransform).contentSize.width;
  }

  startMove(percent: number) {
    if (percent < 0) {
      percent = 0;
    } else if (percent > 1) {
      percent = 1;
    }
    percent = percent * 100;
    const tweenTarget = { currentPercent: this.currentPercent };
    tween(this.node)
      .parallel(
        tween(this.ProgressNode.getComponent(UITransform)).to(0.5, {
          width: (this.maxWidth * percent) / 100,
        }),
        tween(tweenTarget).to(
          0.5,
          { currentPercent: percent },
          {
            onUpdate: (target) => {
              this.LabelPercentNode.getComponent(Label).string =
                Math.round(target.currentPercent) + '%';
            },
          }
        )
      )
      .call(() => {
        this.currentPercent = percent;
      })
      .start();
  }

  protected onDestroy(): void {
    tween(this.ProgressNode).stop();
  }
}
