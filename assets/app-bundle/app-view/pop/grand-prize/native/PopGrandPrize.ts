import { _decorator, Label, Node, sp, tween, Vec3 } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { app } from 'db://assets/app/app';
import { IEffectName } from 'db://assets/app-builtin/app-admin/executor';
import { RewardSubTypeEnum } from 'db://assets/basePlate/middleWare/enums/bet';
import { NumberAnimator } from 'db://assets/basePlate/middleWare/commonUI/NumberAnimator';
import { loadResource } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';
import { delay, numberToMoney } from 'db://assets/common/script/extra/Utils/common';

const { ccclass, property } = _decorator;

/**
 * 大奖弹窗组件
 * 用于显示游戏中的大奖信息和动画效果
 */
@ccclass('PopGrandPrize')
export class PopGrandPrize extends BaseView {
  /**
   * 金额显示标签
   * 用于展示中奖金额
   */
  @property({ type: Node, tooltip: '金额节点' })
  private AmountLabel: Label;

  /**
   * Max Win节点
   */
  @property({ type: Node, tooltip: 'Max Win Node' })
  private MaxWinNode: Node;

  /**
   * 奖励子类型
   * 决定显示哪种大奖动画和音效
   */
  private rewardSubType: RewardSubTypeEnum;
  
  /**
   * 中奖金额
   */
  private amount: number;

  /**
   * 是否达到最大倍率
   */
  private accumulateReachMaxMultiple: boolean;
  
  /**
   * 数字动画控制器
   * 用于实现金额数字的滚动效果
   */
  private numberWinBgAnimator: NumberAnimator;
  
  /**
   * 是否正在执行隐藏动画
   * 防止多次触发隐藏逻辑
   */
  private isHideInProgress: boolean = false;
  
  /**
   * 背景音乐ID
   * 用于后续停止播放
   */
  private bgm_id: number;

  /**
   * 组件加载时初始化
   */
  onLoad() {
    // 初始化数字动画控制器
    this.numberWinBgAnimator = new NumberAnimator(this.AmountLabel);
  }

  /**
   * 显示弹窗时的回调
   * @param params 包含奖励类型和金额的参数对象
   */
  async onShow(params: any) {
    if (!params) return;

    // 初始化UI并播放大奖动画
    await this.initializeUI(params);
    await this.playGrandPrizeAnimation();
  }

  /**
   * 初始化UI元素
   * @param params 包含奖励类型和金额的参数对象
   */
  private async initializeUI(params: any) {
    // 获取并初始化金额文本节点
    const textNode = this.node.getChildByName('AmontBox');
    textNode.active = false;
    textNode.setScale(new Vec3(1, 1, 1));
    
    // 重置节点缩放和数值
    this.node.setScale(new Vec3(1, 1, 1));
    this.numberWinBgAnimator.setValue(0);
    
    // 保存参数
    this.rewardSubType = params.rewardSubType;
    this.amount = params.amount;
    this.accumulateReachMaxMultiple = params.accumulateReachMaxMultiple;

    // 根据是否达到最大倍率决定是否显示Max Win节点
    this.MaxWinNode.active = this.accumulateReachMaxMultiple;
  }

  /**
   * 播放大奖动画序列
   * 包括骨骼动画、文本动画和数字滚动效果
   */
  private async playGrandPrizeAnimation() {
    // 获取骨骼动画组件和文本节点
    const spine = this.node.getChildByName('Bg').getComponent(sp.Skeleton);
    const textNode = this.node.getChildByName('AmontBox');
    
    // 根据奖励类型加载对应的骨骼动画资源
    const spineAtlas: sp.SkeletonData = await loadResource(
      'load',
      'pop-grand-prize-res',
      // `GrandPrize/IbongAdarna_pop_${this.rewardSubType}`,
      'GrandPrize/win',
      sp.SkeletonData
    );
    
    // 资源检查，确保所有必要元素都存在
    if (!spine || !this.rewardSubType || !spineAtlas) return;
    
    // 设置骨骼动画数据
    spine.skeletonData = spineAtlas;
    
    // 播放音效和背景音乐
    // this.playGrandPrizeSound();
    
    // 播放入场动画
    await this.playSpineAnimation(spine, 'in', false);
    
    // 显示金额文本并播放循环动画
    textNode.active = true;
    this.playSpineAnimation(spine, 'loop', true);
    
    // 执行整体缩放动画
    this.GrandprizeScaleAnimation();
    
    // 播放数字滚动动画，展示最终金额
    await this.numberWinBgAnimator.animateTo(
      this.amount,
      this.getDisplayTimeByRewardType(),
      (value) => numberToMoney(value, 3, false),
      true
    );
    
    // 动画完成后，如果节点仍然有效，则执行隐藏逻辑
    if (this.node && this.node.isValid) {
      this.hideGrandPrize();
    }
  }

  getAnimationPrefix() {
    switch (this.rewardSubType) {
      case RewardSubTypeEnum.NICE: return '01nice_';
      case RewardSubTypeEnum.MEGA: return '02mega_';
      case RewardSubTypeEnum.SUPER: return '03super_';
      case RewardSubTypeEnum.SENSATIONAL: return '04sensational_';
      default: return '01nice_';
    }
  }

  /**
   * 播放大奖配音音效和大奖背景音效
   * 根据奖励类型选择不同的音效
   */
  // private playGrandPrizeSound() {
  //   // 先停止正在播放的背景音乐
  //   app.manager.sound.pauseMusic();

  //   // 播放大奖配音音效（如"NICE!"、"MEGA!"等）
  //   app.manager.sound.playEffect({
  //     name: `effect/grandPrize/${this.rewardSubType}` as IEffectName,
  //     volume: app.manager.sound.effectVolumeScale,
  //   });
    
  //   // 播放大奖背景音效，并保存ID以便后续停止
  //   app.manager.sound.playEffectAsync({
  //     name: `effect/grandPrize/${this.rewardSubType}_bgm` as IEffectName,
  //     volume: app.manager.sound.effectVolumeScale,
  //     loop: true,
  //   }).then(id => this.bgm_id = id);
  // }

  /**
   * 播放骨骼动画
   * @param spine 骨骼动画组件
   * @param animName 动画名称
   * @param loop 是否循环播放
   * @returns Promise，动画完成时resolve
   */
  private async playSpineAnimation(spine: sp.Skeleton, animName: string, loop: boolean = true) {
    return new Promise<void>((resolve) => {
      const animationName = this.getAnimationPrefix() + animName;
 
      // 检查动画是否存在
      if (!spine.findAnimation(animationName)) {
        console.warn(`动画 ${animationName} 不存在，跳过播放`);
        resolve();

        return;
      }

      // 设置动画并监听完成事件
      spine.setAnimation(0, animationName, loop);
      spine.setCompleteListener(() => resolve());
    });
  }

  /**
   * 执行大奖整体缩放动画
   * 使整个弹窗在显示过程中缓慢放大
   */
  private GrandprizeScaleAnimation() {
    tween(this.node)
      .to(
        // 动画持续时间与奖励类型相关
        this.getDisplayTimeByRewardType(),
        // 放大到1.2倍
        { scale: new Vec3(1.2, 1.2, 1.2) },
        // 使用二次方缓出效果
        { easing: 'quadOut' }
      )
      .start();
  }

  /**
   * 根据奖励类型获取显示时间
   * 不同级别的奖励有不同的展示时长
   * @returns 显示时间（秒）
   */
  private getDisplayTimeByRewardType(): number {
    switch (this.rewardSubType) {
      // 普通奖励显示5秒
      case RewardSubTypeEnum.NICE: return 5;
      // 中等奖励显示10秒
      case RewardSubTypeEnum.MEGA: return 10;
      // 高级奖励显示15秒
      case RewardSubTypeEnum.SUPER: return 15;
      // 顶级奖励显示20秒
      case RewardSubTypeEnum.SENSATIONAL: return 20;
      // 默认显示5秒
      default: return 5;
    }
  }

  /**
   * 隐藏大奖弹窗
   * 停止动画和音效，播放结束动画
   */
  async hideGrandPrize() {
    // 防止重复调用
    if (this.isHideInProgress) return;
    this.isHideInProgress = true;

    try {
      // 停止数字动画和背景音乐
      this.numberWinBgAnimator.stopAnimation(true);
      // app.manager.sound.stopEffect(this.bgm_id);
      
      // 播放结束音效
      // app.manager.sound.playEffect({
      //   name: `effect/grandPrize/${this.rewardSubType}_end` as IEffectName,
      //   volume: app.manager.sound.effectVolumeScale,
      // });
      
      // 延迟2秒，让结束音效有时间播放
      await delay(2000);
      
      // 如果节点仍然有效，播放关闭动画
      if (this.node && this.node.isValid) {
        await this.playCloseAnimation();
      }

      // 恢复背景音乐
      app.manager.sound.resumeMusic();
    } catch (error) {
      console.error('hideGrandPrize error:', error);
    } finally {
      // 重置状态标志
      this.isHideInProgress = false;
    }
  }

  /**
   * 播放关闭动画
   * 包括文本放大、缩小和上移的动画序列
   * @returns Promise，动画完成时resolve
   */
  private async playCloseAnimation() {
    // 获取骨骼动画组件和文本节点
    const spine = this.node.getChildByName('Bg').getComponent(sp.Skeleton);
    const textNode = this.node.getChildByName('AmontBox');
    
    // 保存原始位置用于后续重置
    const originalPosition = textNode.position.clone();

    // 播放关闭骨骼动画
    this.playSpineAnimation(spine, 'out', false);
    
    return new Promise<void>((resolve) => {
      // 文本放大动画：放大并略微下移
      tween(textNode)
        .to(
          0.3,
          {
            scale: new Vec3(1.3, 1.3, 1.3),
            position: new Vec3(originalPosition.x, originalPosition.y - 25, originalPosition.z),
          },
          { easing: 'quadOut' }
        )
        .call(() => {
          // 文本缩小并上移动画：快速缩小到0并上移
          tween(textNode)
            .to(
              0.06,
              {
                scale: new Vec3(0, 0, 0),
                position: new Vec3(originalPosition.x, originalPosition.y + 100, originalPosition.z),
              },
              { easing: 'quadIn' }
            )
            .call(() => {
              // 重置并清理资源
              textNode.setPosition(originalPosition);
              spine.skeletonData = null;
              this.numberWinBgAnimator.stopAnimation(true);
              this.node.setScale(new Vec3(1, 1, 1));
              this.hide();
              resolve();
            })
            .start();
        })
        .start();
    });
  }

  /**
   * 隐藏回调
   * @param result 结果参数
   * @returns 返回结果
   */
  onHide(result: undefined) {
    return result;
  }
}
