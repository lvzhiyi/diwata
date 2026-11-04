import { _decorator, Component, Label, Node, sp, tween, Tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { app } from 'db://assets/app/app';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { getP, sliceAmount } from 'db://assets/common/script/extra/Utils/common';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass, property } = _decorator;

const MULTIPLE_BG_SPINE_POSITION = new Vec3(0, 352, 0);
@ccclass('CurrentRoundAmount')
export class CurrentRoundAmount extends Component {
  @property({ type: Node, tooltip: '当前轮次金额' })
  private amountNode: Node = null;

  @property({ type: Node, tooltip: '当前轮次倍率' })
  private multipleNode: Node = null;

  @property({ type: Node, tooltip: 'SpineWinSkeleton' })
  private spineWinNode: Node = null;

  @property({ type: Node, tooltip: 'SpineWinSkeleton' })
  private multipleBgSpine: Node = null;

  private tween: Tween = null;

  private originParent: Node = null;

  private originPosition: Vec3 = new Vec3(0, 0, 0);

  onLoad() {
    this.originParent = this.node.parent;
    this.originPosition = this.node.position.clone();
    this.node.scale = new Vec3(0.5, 0.5, 1);
  }

  async showAmount(amount: number, multiple: number, rewardBox: Node, onImpact: () => void):Promise<void> {
    return new Promise((resolve) => {
      if (this.tween?.running) {
        this.tween.stop();
        this.resetState();
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
      label.string = `${getP()}${sliceAmount(originalAmount)}`;
      const multipleValue = Math.pow(2, multiple);
      console.log('startNum-开始动画', originalAmount, multipleValue);
      // 与转盘倍率一致，数字在前，如 2x
      this.multipleNode.getComponent(Label).string = `${multipleValue}x`;
      this.multipleNode.active = multipleValue > 1;
      this.multipleBgSpine.active = multipleValue > 1;
      // 动态设置字体大小
      this.setMultipleNodeFontSize(multipleValue);
      // 重置节点状态
      this.resetState();
      const spine = this.spineWinNode.getComponent(sp.Skeleton);
      spine.timeScale = app.manager.global.gameSpeed;
      spine.setAnimation(0, 'start', false);
      const rewardParent = rewardBox.parent;
      const rewardPosition = rewardParent.getComponent(UITransform).convertToNodeSpaceAR(rewardBox.getWorldPosition());
      
      this.tween = tween(this.node)
        .timeScale(app.manager.global.gameSpeed)
        .sequence(
          // 第一步：amountNode从0.5放大到1出现
          tween(this.amountNode)
            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'quadIn' })
            .call(() => {
              // amountNode动画完成后，multipleNode透明度变为255
              this.multipleBgSpine.getComponent(UIOpacity).opacity = 255;
            }),
          
          // 第二步：multipleNode同时执行位移和缩放动画
          tween(this.multipleBgSpine)
            .parallel(
              tween(this.multipleBgSpine).to(0.5, { position: new Vec3(0, 30, 0) }, { easing: 'sineOut' }),
              tween(this.multipleNode).to(0.5, { scale: new Vec3(1.5, 1.5, 1) }, { easing: 'sineOut' })
            )
            .call(() => {
              // multipleNode动画完成后立马隐藏
              this.multipleBgSpine.getComponent(UIOpacity).opacity = 0;

              label.string = `${getP()}${sliceAmount(amount)}`;
            }),
          
          // 第三步：放大结算后的金额
          tween().call(() => {
            // amountNode放大到1.5
            tween(this.amountNode)
              .to(0.2, { scale: new Vec3(1.5, 1.5, 1) }, { easing: 'quadOut' })
              .start();
          }),
          
          // 等待0.5秒
          tween().delay(0.56),
          
          // 金额保持字号，从棋盘中央加速砸向金额栏。
          tween(this.node)
            .call(() => {
              // 落向金额栏时移到其上层，避免底板遮住冲击中心。
              this.node.setParent(rewardParent, true);
              this.node.setSiblingIndex(rewardBox.getSiblingIndex() + 1);
            })
            .to(0.26, { position: rewardPosition }, { easing: 'quadIn' })
            .call(() => {
              this.amountNode.getComponent(UIOpacity).opacity = 0;
              spine.setAnimation(0, 'win', false);
              onImpact();
            }),
          tween().delay(0.45),

          // 动画结束，重置状态
          tween().call(() => {
            console.log('startNum-结束动画');
            clearTimeout(timeoutId); 
            this.node.getComponent(UIOpacity).opacity = 0;
            this.node.setParent(this.originParent);
            this.node.setPosition(this.originPosition);
            this.amountNode.setPosition(Vec3.ZERO);
            this.amountNode.setScale(Vec3.ONE);
            this.multipleBgSpine.setPosition(MULTIPLE_BG_SPINE_POSITION);
            this.multipleNode.setScale(Vec3.ONE);
            this.multipleBgSpine.getComponent(UIOpacity).opacity = 0;
            EffectManager.inst.playEffect(AudioPath.GAME.DOUBLE_NUMBER);
            this.tween?.stop();
            resolve();
          })
        )
        .start();
    });
  }

  private setMultipleNodeFontSize(multiple: number) {
    const label = this.multipleNode.getComponent(Label);

    if (multiple < 10) {
      label.fontSize = 42 * 1.2;
    } else if (multiple < 100) {
      label.fontSize = 30 * 1.2;
    } else if (multiple < 1000) {
      label.fontSize = 24 * 1.2;
    } else {
      label.fontSize = 18 * 1.2;
    }
  }

  /**
   * 重置状态
   */
  resetState() {
    this.node.setParent(this.originParent);
    this.node.setPosition(this.originPosition);
    this.node.scale = new Vec3(1, 1, 1);
    this.node.getComponent(UIOpacity).opacity = 255;
    this.amountNode.scale = new Vec3(0.5, 0.5, 1);
    this.amountNode.setPosition(Vec3.ZERO);
    
    this.multipleBgSpine.setPosition(MULTIPLE_BG_SPINE_POSITION);
    this.multipleNode.scale = new Vec3(1, 1, 1);

    this.amountNode.getComponent(UIOpacity).opacity = 255;
    this.multipleBgSpine.getComponent(UIOpacity).opacity = 255;
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
