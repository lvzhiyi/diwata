import { _decorator, Component, Label, Node, sp, tween, Tween, UIOpacity, Vec3 } from 'cc';
import { app } from 'db://assets/app/app';

const { ccclass, property } = _decorator;

@ccclass('CurrentRoundAmount')
export class CurrentRoundAmount extends Component {
  @property({ type: Node, tooltip: '当前轮次金额' })
  private amountNode: Node = null;

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

  async showAmount(amount: number, multiple: number):Promise<void> {
    return new Promise((resolve) => {
      if (this.tween?.running) {
        this.tween.stop();
        this.node.getComponent(UIOpacity).opacity = 0;
        this.node.setPosition(this.originPosition);
        this.amountNode.setPosition(Vec3.ZERO);
        this.multipleNode.setPosition(Vec3.ZERO);
        this.multipleNode.getComponent(UIOpacity).opacity = 0;
        // 重要：被中断的动画也需要 resolve，否则 Promise 永远不会完成
        console.log('startNum-动画被中断');
        resolve();
        
        return;
      }

      // 设置一个超时定时器，4秒后执行callback
      const timeoutId = setTimeout(() => {
        resolve();
      }, 2200);

      const label = this.amountNode.getComponent(Label);
      const originalAmount = amount / Math.pow(2, multiple);
      label.string = `₱${originalAmount.toFixed(3)}`;
      
      this.multipleNode.getComponent(Label).string = `x ${Math.pow(2, multiple)}`;

      // 最终展示的金额
      // this.finalAmountNode.getComponent(Label).string = `₱${amount.toFixed(3)}`;
      
      // 重置节点状态
      this.resetState();
      console.log('startNum-开始动画');
      this.tween = tween(this.node)
        .timeScale(app.manager.global.gameSpeed)
        .sequence(
          // 第一步：amountNode从0.5放大到1出现
          tween(this.amountNode)
            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'quadIn' })
            .call(() => {
              // amountNode动画完成后，multipleNode透明度变为255
              this.multipleNode.getComponent(UIOpacity).opacity = 255;
            }),
          
          // 第二步：multipleNode同时执行位移和缩放动画
          tween(this.multipleNode)
            .parallel(
              tween(this.multipleNode).to(0.3, { position: new Vec3(0, 30, 0) }, { easing: 'sineOut' }),
              tween(this.multipleNode).to(0.3, { scale: new Vec3(1.5, 1.5, 1) }, { easing: 'sineOut' })
            )
            .call(() => {
              // multipleNode动画完成后立马隐藏
              this.multipleNode.getComponent(UIOpacity).opacity = 0;
              // 播放spine动画
              const spine = this.spineWinNode.getComponent(sp.Skeleton);
              spine.setAnimation(0, 'jineshanguang', false);
              label.string = `₱${amount.toFixed(3)}`;
            }),
          
          // 第三步：amountNode从Scale 1变到1.5，同时播放jineshanguang动画
          tween().call(() => {
            // amountNode放大到1.5
            tween(this.amountNode)
              .to(0.2, { scale: new Vec3(1.5, 1.5, 1) }, { easing: 'quadOut' })
              .start();
          }),
          
          // 等待0.5秒
          tween().delay(0.56),
          
          // 第四步：整个节点执行y轴位移动画到-380，同时scale缩小到0.2
          tween(this.node)
            .parallel(
              tween(this.node).to(0.4, { position: new Vec3(0, -300, 0) }, { easing: 'sineOut' }),
              tween(this.node).to(0.4, { scale: new Vec3(0.2, 0.2, 1) }, { easing: 'sineOut' })
            ),
          
          // 动画结束，重置状态
          tween().call(() => {
            console.log('startNum-结束动画');
            clearTimeout(timeoutId); 
            this.node.getComponent(UIOpacity).opacity = 0;
            this.node.setPosition(this.originPosition);
            this.amountNode.setPosition(Vec3.ZERO);
            this.amountNode.setScale(Vec3.ONE);
            this.multipleNode.setPosition(new Vec3(0, 300, 0));
            this.multipleNode.setScale(Vec3.ONE);
            this.multipleNode.getComponent(UIOpacity).opacity = 0;
          
            resolve();
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
    this.multipleNode.setPosition(new Vec3(0, 300, 0));
    this.multipleNode.getComponent(UIOpacity).opacity = 0;

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
