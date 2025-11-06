import { _decorator, Label, Node, sp, tween, Vec3 } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { app } from 'db://assets/app/app';
import { RewardSubTypeEnum } from 'db://assets/basePlate/middleWare/enums/bet';
import { NumberAnimator } from 'db://assets/basePlate/middleWare/commonUI/NumberAnimator';
import { loadResource } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';
import { delay, numberToMoney } from 'db://assets/common/script/extra/Utils/common';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { BGMManager } from 'db://assets/basePlate/middleWare/serverManager/BGMManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';
import { GameResourceManager, SPINE_RESOURCE_NAMES } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';
import { IQuickMode } from 'db://assets/app-builtin/app-manager/global/GlobalManager';
import { HomeRollTool } from '../../../paper/home/roll/native/expansion/HomeRollTool';
import { SpineTool } from 'db://assets/res-native/script/SpineTool';

const { ccclass, property } = _decorator;

const animationMap: any = {
  [RewardSubTypeEnum.NICE]: ['01nice_'],
  [RewardSubTypeEnum.MEGA]: ['01nice_', '02mega_'],
  [RewardSubTypeEnum.SUPER]: ['01nice_', '02mega_', '03super_'],
};

const effectBGMap :any = {
  '01nice_': AudioPath.BGM.NICE_OPEN,
  '02mega_':  AudioPath.BGM.MEGA_OPEN,
  '03super_':  AudioPath.BGM.SUPER_OPEN,
};

const effectMap :any = {
  '01nice_': AudioPath.GAME.NICE_DUB,
  '02mega_':  AudioPath.GAME.MEGA_DUB,
  '03super_':  AudioPath.GAME.SUPER_DUB,
};

const effectBGMapEnd :any = {
  '01nice_': AudioPath.POPUP.NICE_END,
  '02mega_':  AudioPath.POPUP.MEGA_END,
  '03super_':  AudioPath.POPUP.SUPER_END,
};
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

  @property({ type: Node, tooltip: 'bg' })
  private bgNode: Node;

  /**
   * 资源前缀
   */
  private resourcePrefix: string;

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
   * 数字滚动音效是否正在播放
   */
   private numberRollIsPlaying: boolean = false;

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
   * 当前动画名称
   */
  private currentAnimationName: string;

  /**
   * 是否播放结束
   */
  private isPlayEnd: boolean = false;

  /**
   * 背景音乐ID
   * 用于后续停止播放
   */
  private bgm_id: number;

  /**
   * 奖励动画队列
   */
  private animationQueue: string[] = [];

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

    this.isHideInProgress = false;

    this.numberRollIsPlaying = false;

    this.isPlayEnd = false;
    this.pauseBGM();

    // 初始化UI并播放大奖动画
    await this.initializeUI(params);
    this.playAmountAnimation();

    for (const animationName of this.animationQueue) {
      if (this.isHideInProgress) break;
      await this.playGrandPrizeAnimation(animationName);
    }
  }

  /**
   * 初始化UI元素
   * @param params 包含奖励类型和金额的参数对象
   */
  private async initializeUI(params: any): Promise<void> {
    return new Promise<void>((resolve) => {
      // 获取并初始化金额文本节点
      const textNode = this.node.getChildByName('AmontBox');
      textNode.active = false;
      textNode.setScale(new Vec3(1, 1, 1));

      // 重置节点缩放和数值
      this.node.setScale(new Vec3(1, 1, 1));
      this.numberWinBgAnimator.setValue(0);

      // 保存参数
      this.resourcePrefix = params.resourcePrefix;
      this.rewardSubType = params.rewardSubType;
      this.amount = params.amount;
      this.accumulateReachMaxMultiple = params.accumulateReachMaxMultiple;

      // 根据是否达到最大倍率决定是否显示Max Win节点
      this.MaxWinNode.active = this.accumulateReachMaxMultiple;

      // 根据奖励类型设置动画队列
      this.animationQueue = [...animationMap[this.rewardSubType]];
      resolve();
    });
  }

  private  playAmountAnimation() {
    // 确保金额动画只执行一次
    if (this.numberWinBgAnimator.isInAnimation() || this.numberRollIsPlaying) {
      return;
    }

    this.numberRollIsPlaying = true;
    
    console.log('金币开始播放', this.amount, this.animationQueue.length);
    this.numberWinBgAnimator.animateTo(
      this.amount,
      this.getDisplayTimeByRewardType() * this.animationQueue.length,
      (value) => numberToMoney(value, 3, false),
      true
    ).then(() => {
      console.log('金币结束播放');
      EffectManager.inst.stopAllEffectsByName(AudioPath.UI.COIN_ADD2);
    });
  }

  /**
   * 播放大奖动画序列
   * 包括骨骼动画、文本动画和数字滚动效果
   */
  private async playGrandPrizeAnimation(animationName: string) {
    // 获取骨骼动画组件和文本节点
    console.log('this.bgNode', this.bgNode);

    if(!this.bgNode || this.bgNode.active === false) {
      return;
    }

    const spine = this.bgNode.getComponent(sp.Skeleton) || this.bgNode.addComponent(sp.Skeleton);
    const textNode = this.node.getChildByName('AmontBox');
    // 显示金额文本并播放循环动画
    textNode.active = true;

    try {
      // 根据奖励类型加载对应的骨骼动画资源
      const spineAtlas: sp.SkeletonData = await GameResourceManager.instance.getSpineAnimationDataByName(SPINE_RESOURCE_NAMES.GRAND_PRIZE);

      // 资源检查，确保所有必要元素都存在
      if (!spine || !this.rewardSubType || !spineAtlas) return;
      // 设置骨骼动画数据
      spine.skeletonData = spineAtlas;
      // 设置骨骼动画数据
      spine.setSkin(animationName);
      console.log('animationName', animationName);
      spine.timeScale = app.manager.global.gameSpeed;
      
      const musicBGName = effectBGMap[animationName];
      this.playGrandPrizeBGSound(musicBGName);
      // 播放音效和背景音乐
      const musicName = effectMap[animationName];
      this.playGrandPrizeSound(musicName);
      
      this.currentAnimationName = animationName;

      // 播放入场动画
      await this.playSpineAnimation(spine, `${animationName}in`, false);
       
      this.playSpineAnimation(spine, `${animationName}loop`, true);
      // 执行整体缩放动画
      this.GrandprizeScaleAnimation();
      await delay(4000 / app.manager.global.gameSpeed);

      // 动画完成后，如果节点仍然有效，则执行隐藏逻辑
      if (this.node && this.node.isValid && animationName === this.animationQueue[this.animationQueue.length - 1] && !this.isPlayEnd) {
        this.hideGrandPrize();
      }
    } catch (error) {
      console.error('playGrandPrizeAnimation error:', error);
    }
  }

  /**
   * 播放大奖配音音效和大奖背景音效
   * 根据奖励类型选择不同的音效
   */
  private playGrandPrizeSound(animationName: string) {
    // 播放大奖配音音效（如"NICE!"、"MEGA!"等）
    console.log('animationPrizeName', animationName);
    EffectManager.inst.playEffect(animationName, false, null, false);
    setTimeout(() => {
      EffectManager.inst.playEffect(AudioPath.UI.COIN_ADD2, true, null, true);
    }, 600 / app.manager.global.gameSpeed);
  }

  /**
   * 播放大奖配音音效和大奖背景音效
   * 根据奖励类型选择不同的音效
   */
  private playGrandPrizeBGSound(animationName: string) {
    BGMManager.inst.playBigPrizeBGM(animationName);
  }

  /**
   * 播放骨骼动画
   * @param spine 骨骼动画组件
   * @param animName 动画名称
   * @param loop 是否循环播放
   * @returns Promise，动画完成时resolve
   */
  private async playSpineAnimation(spine: sp.Skeleton, animName: string, loop: boolean = true) {
    return new Promise<void>((resolve) => {
      // 检查动画是否存在
      if (!spine.findAnimation(animName)) {
        console.warn(`动画 ${animName} 不存在，跳过播放`);
        resolve();

        return;
      }

      // 设置动画并监听完成事件
      spine.setAnimation(0, animName, loop);
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
        this.getDisplayTimeByRewardType() * (this.animationQueue.length + 1),
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
    const time = 4;

    return time / app.manager.global.gameSpeed;
  }

  /**
   * 隐藏大奖弹窗
   * 停止动画和音效，播放结束动画
   */
  async hideGrandPrize() {
    // 防止重复调用
    if (this.isHideInProgress || !this.numberRollIsPlaying) return;
    this.isHideInProgress = true;

    const lastAnimationName = this.animationQueue[this.animationQueue.length - 1];

    if (this.currentAnimationName !== lastAnimationName) {
      console.log('播放最后的音效');
      // 先把当前的音效停止
      const musicName = effectMap[this.currentAnimationName];
      // const musicBGName = effectBGMap[this.currentAnimationName];
      EffectManager.inst.stopAllEffectsByName(musicName);
      BGMManager.inst.pauseBGM();
      this.playGrandPrizeAnimation(lastAnimationName);
    }

    try {
      // 停止数字动画和背景音乐
      this.numberWinBgAnimator.stopAnimation(true);
      EffectManager.inst.stopAllEffectsByName(AudioPath.UI.COIN_ADD2);
      // app.manager.sound.stopEffect(this.bgm_id);

      this.isPlayEnd = true;

      // 延迟2秒，让结束音效有时间播放
      await delay(2000);

      // 如果节点仍然有效，播放关闭动画
      if (this.node && this.node.isValid) {
        await this.playCloseAnimation();
      }
    } catch (error) {
      console.error('hideGrandPrize error:', error);
    } finally {

    }
  }

  /**
   * 播放关闭动画
   * 包括文本放大、缩小和上移的动画序列
   * @returns Promise，动画完成时resolve
   */
  private async playCloseAnimation() {
    // 获取骨骼动画组件和文本节点
    const spine = this.bgNode.getComponent(sp.Skeleton);
    spine.timeScale = app.manager.global.gameSpeed;
    const textNode = this.node.getChildByName('AmontBox');

    // 保存原始位置用于后续重置
    const originalPosition = textNode.position.clone();

    // 播放关闭骨骼动画
    const animationName = this.currentAnimationName + 'out';
    // 播放关闭骨骼动画
    this.playSpineAnimation(spine, animationName, false);
    // 播放完毕音乐
    const musicName = effectBGMapEnd[this.currentAnimationName];
    EffectManager.inst.playEffect(musicName);

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
              
              this.numberWinBgAnimator.stopAnimation(true);
              EffectManager.inst.stopAllEffectsByName(AudioPath.UI.COIN_ADD2);
              this.node.setScale(new Vec3(1, 1, 1));
              this.hide();
              resolve();
            })
            .start();
        })
        .start();
    });
  }

  private pauseBGM() {
    BGMManager.inst.pauseBGM();
  }

  private resumeBGM() {
    BGMManager.inst.resumeBGM();
  }

  /**
   * 隐藏回调
   * @param result 结果参数
   * @returns 返回结果
   */
  onHide(result: undefined) {
    SpineTool.clearAnimationNode(this.bgNode);
    EffectManager.inst.stopAllEffects();

    // 恢复背景音乐，如果当前是免费区间就播免费轮音乐，
    if(app.controller.slots.isFreeBonusSpin) {
      BGMManager.inst.playFreeModeBGM();
    } else {
      BGMManager.inst.playNormalModeBGM();
    }

    return result;
  }
}
