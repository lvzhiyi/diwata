import { _decorator, Component, Label, Node, sp, tween, Tween, UIOpacity, Vec3 } from 'cc';
import { app } from 'db://assets/app/app';

const { ccclass, property } = _decorator;

@ccclass('CurrentRoundAmount')
export class CurrentRoundAmount extends Component {
  @property({ type: Node, tooltip: '当前轮次金额' })
  private amountNode: Node = null;

  @property({ type: Node, tooltip: '最后显示的金额' })
  private finalAmountNode: Node = null;

  @property({ type: Node, tooltip: '当前轮次倍率' })
  private multipleNode: Node = null;

  @property({ type: Node, tooltip: 'SpineWinSkeleton' })
  private spineWinNode: Node = null;

  private tween: Tween = null;

  private originPosition: Vec3 = new Vec3(0, 0, 0);

  onLoad() {
    this.originPosition = this.node.position.clone();
    this.node.scale = new Vec3(0.5, 0.5, 1);
  }

  async showAmount(amount: number, multiple: number) {
    return new Promise((resolve) => {
      if (this.tween?.running) {
        this.tween.stop();
        this.node.getComponent(UIOpacity).opacity = 0;
        this.node.setPosition(this.originPosition);
        this.amountNode.setPosition(Vec3.ZERO);
        this.multipleNode.setPosition(Vec3.ZERO);
        this.multipleNode.getComponent(UIOpacity).opacity = 0;
      }

      const label = this.amountNode.getComponent(Label);
      const originalAmount = amount / Math.pow(2, multiple);
      label.string = `₱${originalAmount.toFixed(3)}`;
      
      // 方法1：使用 UITransform 获取文本宽度
      const textWidth = this.calculateEnglishTextWidth();
      
      console.log('文本宽度:', textWidth);
      this.multipleNode.getComponent(Label).string = `x ${Math.pow(2, multiple)}`;

      // 最终展示的金额
      this.finalAmountNode.getComponent(Label).string = `₱${amount.toFixed(3)}`;
      
      // 重置节点状态
      this.resetState();

      this.tween = tween(this.node)
        .timeScale(app.manager.global.gameSpeed)
        .sequence(
          // 第一步：amountNode出现，从0.5放大到1.5再缩放到1
          tween(this.amountNode)
            .to(0.3, { scale: new Vec3(1.5, 1.5, 1) }, { easing: 'quadOut' })
            .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'quadIn' })
            .call(() => {
              this.multipleNode.getComponent(UIOpacity).opacity = 255;
            }),
          
          // 第二步：multipleNode显示，amountNode左移100像素，multipleNode移动到amountNode右边
          tween().parallel(
            // amountNode左移100像素
            tween(this.amountNode).to(0.3, { position: new Vec3(-textWidth / 4, 0, 0) }, { easing: 'quadOut' }),
            // multipleNode移动到amountNode右边（amountNode的y轴平级，x轴+100）
            tween(this.multipleNode).to(0.3, { position: new Vec3(textWidth / 4, this.spineWinNode.position.y, 0) }, { easing: 'quadOut' })
          ),
          
          // 第三步：播放spineWinNode动画
          tween().call(() => {
            // 实际播放spine动画的代码需要根据具体的spine组件来实现
            this.finalAmountNode.getComponent(UIOpacity).opacity = 0;
            const spine = this.spineWinNode.getComponent(sp.Skeleton);
            spine.setAnimation(0, 'jineshanguang', false);
            spine.setCompleteListener(() => {
        
            });
            // 同时执行所有动画（简洁版）
            const amountUIOpacity = this.amountNode.getComponent(UIOpacity);
            const multipleUIOpacity = this.multipleNode.getComponent(UIOpacity);
            const finalAmountUIOpacity = this.finalAmountNode.getComponent(UIOpacity);
            tween(amountUIOpacity)
              .to(0.2, { opacity: 0 })
              .start();
            tween(multipleUIOpacity)
              .to(0.2, { opacity: 0 })
              .start();
            tween(finalAmountUIOpacity)
              .to(0.2, { opacity: 255 })
              .start();
          }),
          
          // 等待spine动画播放完毕（假设1秒）
          tween().delay(0.67),
          
          // 第四步：父节点同时向下位移50像素并放大1.5，然后移到-380并缩小到0
          tween(this.node)
            .parallel(
              tween(this.node).to(0.3, { position: new Vec3(0, -10, 0) }, { easing: 'quintIn' }),
              tween(this.node).to(0.3, { scale: new Vec3(1.5, 1.5, 1) }, { easing: 'quadOut' }),
            )
            .parallel(  
              tween(this.node).to(0.4, { position: new Vec3(0, -380, 0) }, { easing: 'sineOut' }),
              tween(this.node).to(0.4, { scale: new Vec3(0.2, 0.2, 1) }, { easing: 'sineOut' })
            ),
          
          // 动画结束，重置状态
          tween().call(() => {
            this.node.getComponent(UIOpacity).opacity = 0;
            this.node.setPosition(this.originPosition);
            this.amountNode.setPosition(Vec3.ZERO);
            this.multipleNode.setPosition(new Vec3(0, 162, 0));
            this.multipleNode.getComponent(UIOpacity).opacity = 0;
          
            resolve(true);
          })
        )
        .start();
    });
  }

  /**
   * 重置状态
   */
  resetState() {
    this.node.scale = new Vec3(1, 1, 1);
    this.node.getComponent(UIOpacity).opacity = 255;
    this.amountNode.scale = new Vec3(0.5, 0.5, 1);
    this.amountNode.setPosition(Vec3.ZERO);
    this.multipleNode.scale = new Vec3(1, 1, 1);
    this.multipleNode.setPosition(new Vec3(0, 162, 0));
    this.multipleNode.getComponent(UIOpacity).opacity = 0;
    this.finalAmountNode.getComponent(UIOpacity).opacity = 0;
    this.amountNode.getComponent(UIOpacity).opacity = 255;
    this.multipleNode.getComponent(UIOpacity).opacity = 255;
  }

  /**
     * 简单文本宽度计算算法
     * @returns 计算出的文本宽度
     */
  private calculateEnglishTextWidth(): number {
    const label = this.amountNode.getComponent(Label);
    const text = label.string;
    const fontSize = label.fontSize;
    
    if (!text || fontSize <= 0) {
      return 0;
    }

    // 简单算法：每个字符平均宽度约为字体大小的0.6倍
    // 大写字母稍宽，小写字母稍窄，但平均下来0.6比较准确
    const averageCharWidth = fontSize * 0.6;
    const textWidth = text.length * averageCharWidth;
    
    return Math.ceil(textWidth);
  }

  onDestroy() {
    this.tween.stop();
    this.tween = null;
  }
}
