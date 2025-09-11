import { _decorator, Component, Node, sp, Vec3, Tween, tween, Label } from 'cc';
import { IQuickMode } from 'db://assets/app-builtin/app-manager/global/GlobalManager';
import { app } from 'db://assets/app/app';

const { ccclass, property } = _decorator;

@ccclass('StartButtonState')
export class StartButtonState extends Component {
    private _speedMap = {
      slow: 5,
      fast: 0.26,
      turbo: 0.1,
    };
    
      private _state: 'normal' | 'freespin' = 'normal';
    
      @property({ tooltip: '置灰图片', type: Node })
      private disbleImageNode: Node = null;

      /**
       * 普通模式下的箭头节点
       */
      @property({ tooltip: '普通模式下的箭头节点', type: Node })
      private arrowNode: Node = null;

       /**
       * 普通模式下的背景
       */
       @property({ tooltip: '普通模式下的背景节点', type: Node })
       private normalBgNode: Node = null;
    
      /**
       * freespin模式标识节点
       */
      @property({ tooltip: 'freespin模式标识节点', type: Node })
      private freespinFlagNode: Node = null;
    
      /**
       * 发光动效节点
       */
      @property({ tooltip: '发光动效节点', type: Node })
      private glowNode: Node = null;
    
      /**
       * 呼吸灯效果节点
       */
      @property({ tooltip: '呼吸灯效果节点', type: Node })
      private breathNode: Node = null;
    
      /**
       * freespin模式标识节点动画资源
       */
      @property({ type: sp.SkeletonData, tooltip: 'freespin模式标识节点动画资源' })
      private freespinFlagSpineData: sp.SkeletonData = null;
    
      /**
       * freespin模式标识节点动画组件
       */
      private freespinFlagSpine: sp.Skeleton = null;
    
      /**
       * 旋转按钮动效节点动画组件
       */
      private spinButtonSpine: sp.Skeleton = null;
    
      /**
       * 呼吸灯动效节点动画组件
       */
      private breathSpine: sp.Skeleton = null;
    
      /**
       * 箭头动效节点动画组件
       */
      private arrowSpine: sp.Skeleton = null;
    
      /**
       * 按钮发光动效动画资源
       */
      @property({ type: sp.SkeletonData, tooltip: '普通模式下按钮发光动画资源' })
      private normalGlowSpinData: sp.SkeletonData = null;
    
      @property({ type: sp.SkeletonData, tooltip: 'freespin模式下按钮发光动画资源' })
      private freespinGlowSpinData: sp.SkeletonData = null;
    
      /**
       * 待机模式下的呼吸灯动效动画资源
       */
      @property({ type: sp.SkeletonData, tooltip: '待机模式下的呼吸灯动画资源' })
      private slowBreathSpinData: sp.SkeletonData = null;
    
      /**
       * 快速旋转模式下的呼吸灯动效动画资源
       */
      @property({ type: sp.SkeletonData, tooltip: '快速旋转模式下的呼吸灯动画资源' })
      private fastBreathSpinData: sp.SkeletonData = null;
      
      @property({ type: Node, tooltip: 'freespin模式下旋转次数节点' })
      private freespinTimesNode: Node = null;
    
      /**
       * 普通模式下发光动效动画组件
       */
      private glowSpine: sp.Skeleton = null;
    
      /**
       * freespin模式下旋转次数
       */
      private freespinTimes = 0;
    
      /**
       * 旋转速度
       */
      private rotateSpeed: 'slow' | 'fast' | 'turbo' = 'slow';
    
      /**
       * 复用的旋转向量，避免频繁创建Vec3对象
       */
      private rotateVec3: Vec3 = new Vec3();
    
      private rotateArrowTween: Tween<Node> = null;
    
      /**
       * 是否正在播放动画
       */
      private isGamePlaying = false;
    
      /**
       * 是否点击过
       */
      private isClicked = false;
    
      /**
       * 游戏状态
       * - idle: 待机状态
       * - playing: 游戏进行中，服务端还没返回结果
       * - reward: 播放中奖动画中
       */
      private playState: 'idle' | 'playing' | 'reward' = 'idle';
    
      /**
       * 是否是快速旋转模式
       */
      private isTurbo = false;
    
      /**
       * 按钮是否启用
       */
      private isButtonEnabled = false;
    
      private freespinInfo: {
        betAmount: number;
        freespinTimes: number;
        campaignId: string;
      } = {
        betAmount: 0,
        freespinTimes: 0,
        campaignId: '',
      };
    
      /**
       * 获取当前状态
       */
      public get state() {
        return this._state;
      }
    
      onLoad() {
        app.manager.event.on('freespin:state:change', this.onFreespinModeChange, this);
        // GameStateEvent.on('freespin:times:change', this.onFreespinTimesChange, this);
        // GameStateEvent.on('freespin:times:visible', this.onFreespinTimesVisibleChange, this);
        // GameStateEvent.on('button:enabled:change', this.onButtonEnabledChange, this);
        app.manager.event.on('roll:start', this.onRollStart, this);
        app.manager.event.on('roll:stop', this.onRollStop, this);
        app.manager.event.on('roll:reward', this.onRollReward, this);
        app.manager.event.on('button:disable', this.startButtonDisableAndRecover, this);
        app.manager.event.on('game:isGoing', this.onGameStateChange, this);
  
        this.processIdleAnimations();
      }
        
      /**
       * 改变游戏状态
       * @param state 游戏状态
       */
      private changePlayState(state: 'idle' | 'playing' | 'reward') {
        this.playState = state;
      }
    
      private onGameStateChange(isPlaying: boolean) {
        // 每次更新的时候，隐藏置灰图片
        this.disimageChange(false);
    
        if (isPlaying) {
          this.changePlayState('playing');
          this.isGamePlaying = true;
          
          return;
        }
      }
      
      /**
       * 自动游戏状态变化事件
       * @param isAutoGameEnabled 是否启用自动游戏
       */
      private onButtonEnabledChange(isEnabled: boolean) {
        this.isButtonEnabled = isEnabled;
      }

      disimageChange(isActive:boolean){
        if(this.disbleImageNode){
          this.disbleImageNode.active = isActive;
        }
      }
    
      /**
       * 处理点击动画
       */
      private processClickAnimation() {
        this.disimageChange(false);

        if (this._state === 'normal') {
          // 播放按钮点击动画
          this.playSpinButtonAnimation('dianji', false);
          // 播放普通模式下按钮发光动画
          this.playNormalSpinGlowAnimation('1c');
          // 播放箭头动画
          this.playArrowAnimation('faguang', false);
        } else {
          // 播放按钮点击动画
          this.playSpinButtonAnimation('dianji', false);
          // 播放普通模式下按钮发光动画
          this.playNormalSpinGlowAnimation('1c');
          // 播放freespin模式下按钮发光动画
          // this.playFreespinSpinGlowAnimation('dianji', false);
        }
      }
    
      /**
       * 开始滚动事件
       */
      public onRollStart() {
        this.changePlayState('playing');
        this.isGamePlaying = true;
    
        this.processPlayingAnimations();
      }
        
      /**
       * 停止滚动事件
       */
      public onRollStop(isReward: boolean = false) {
        console.log('停止-中奖事件', isReward);
        this.disimageChange(false);

        // 如果未中奖，直接重置为待机状态
        if (!isReward) {
          this.isGamePlaying = false;
          this.isClicked = false;
          this.processIdleAnimations();
          this.changePlayState('idle');
          // 恢复正常播放模式
          this.resetTurboMode();

          return;
        }
      }
    
      public resetTurboMode() {
        if (this.isTurbo) {
          this.isTurbo = false;
        }
      }
        
      /**
       * 中奖事件
       */
      public onRollReward(type: 'start' | 'end') {
        console.log('中奖事件', type);

        if (type === 'start') {
          this.changePlayState('reward');
          this.processRewardAnimations();
          // this.processDisableStateAnimations();
          console.log('中奖事件播放置灰效果:start');
        } else {
          this.disimageChange(false);
          this.isClicked = false;
          this.changePlayState('idle');
          // 播放完毕中奖动画后，重置游戏状态
          this.isGamePlaying = false;
          this.processIdleAnimations();
          // 恢复正常播放模式
          this.resetTurboMode();
          console.log('中奖事件end重置状态');
        }
      }
    
      /**
       * 处理待机状态下的动画
       */
      private processIdleAnimations() {
        this.playSpinButtonAnimation('daiji', true);
    
        if (this._state === 'normal') {
          // 开始旋转箭头节点，慢慢的旋转
          this.changeArrowRotateSpeed('slow');
          this.playArrowAnimation('daiji');
        } else {
          this.playFreespinFlagAnimation('daiji');
          this.playBreathAnimation('slow');
        }
      }
    
      /**
       * 处理游戏开始状态下的动画
       */
      private processPlayingAnimations() {
        this.processClickAnimation();
    
        if (this._state === 'freespin') {
          this.playBreathAnimation('fast');
        } else {
          this.changeArrowRotateSpeed('fast');
        }
      }
    
      /**
       * 处理中奖动画播放过程中的按钮动画
       */
      private processRewardAnimations() {
        this.playSpinButtonAnimation('zhihui', false);
    
        if (this._state === 'normal') {
          this.stopArrowAnimation();
          this.playArrowAnimation('zhihui');
    
          return;
        }
    
        this.stopBreathAnimation();
      }

      private  async startButtonDisableAndRecover() {
        if(this.playState != 'reward'){
          this.disimageChange(true);
          console.log('置灰', this.playState);
        }
      }
    
      /**
       * 处理投注按钮禁用状态下的动画
       */
      private processDisableStateAnimations() {
        this.playSpinButtonAnimation('zhihui', false);
    
        if (this._state === 'normal') {
          this.playArrowAnimation('zhihui');
        }
      }
    
      /**
       * 处理freespin模式下的动画
       */
      private processFreespinAnimations() {
        // 先停止并隐藏掉普通模式下的箭头和动画
        this.stopArrowAnimationAndHideArrow();
        // 播放freespin模式标识节点动画
        this.playFreespinFlagAnimation('chuxian');
        // 播放呼吸灯动画
        this.playBreathAnimation('slow');
      }
    
      /**
       * 播放旋转按钮动画
       * @param animationName 动画名称
       * @param isLoop 是否循环播放
       */
      private playSpinButtonAnimation(animationName: 'daiji' | 'dianji' | 'zhihui', isLoop = true) {
        if (!this.spinButtonSpine) {
          this.spinButtonSpine = this.normalBgNode.getComponent(sp.Skeleton);
        }
    
        this.spinButtonSpine.setAnimation(0, animationName, isLoop);
      }
    
      /**
       * 播放按钮发光动画
       * @param animationName 动画名称
       */
      private async playNormalSpinGlowAnimation(animationName: '1c') {
        if (!this.glowNode.active) {
          this.glowNode.active = true;
        }
      
        if (!this.glowSpine) {
          this.glowSpine = this.glowNode.getComponent(sp.Skeleton);
        }
    
        this.glowSpine.skeletonData = this.normalGlowSpinData;
        this.glowSpine.setAnimation(0, animationName, false);
        await wrapSpineCompleteListener(this.glowSpine);
        this.glowNode.active = false;
      }
    
      /**
       * 播放箭头动画
       * @param animationName 动画名称
       * @param isLoop 是否循环播放
       */
      private async playArrowAnimation(animationName: 'daiji' | 'faguang' | 'zhihui', isLoop = true) {
        if (!this.arrowSpine) {
          this.arrowSpine = this.arrowNode.getComponent(sp.Skeleton);
        }
    
        this.arrowSpine.setAnimation(0, animationName, isLoop);
      }
    
      /**
       * 切换呼吸灯动画
       * @param type 呼吸灯动画类型
       */
      private playBreathAnimation(type: 'slow' | 'fast') {
        if (!this.breathNode.active) {
          this.breathNode.active = true;
        }
    
        if (!this.breathSpine) {
          this.breathSpine = this.breathNode.getComponent(sp.Skeleton);
        }
    
        this.breathSpine.skeletonData = type === 'slow' ? this.slowBreathSpinData : this.fastBreathSpinData;
        this.breathSpine.setAnimation(0, 'xunhuan', true);
      }
      
      /**
       * 停止呼吸灯动画
       */
      private stopBreathAnimation() {
        this.breathSpine?.clearAnimations();
        this.breathNode.active = false;
      }
    
      /**
       * 播放freespin模式下按钮发光动画
       * @param animationName 动画名称
       * @param isLoop 是否循环播放
       */
      private async playFreespinSpinGlowAnimation(animationName: 'daiji' | 'dianji' | 'zhihui', isLoop = true) {
        if (!this.glowNode.active) {
          this.glowNode.active = true;
        }
    
        if (!this.glowSpine) {
          this.glowSpine = this.glowNode.getComponent(sp.Skeleton);
        }
    
        this.glowSpine.skeletonData = this.freespinGlowSpinData;
        this.glowSpine.setAnimation(0, animationName, isLoop);
    
        if (!isLoop) {
          await wrapSpineCompleteListener(this.glowSpine);
        }
      }
    
      /**
       * 播放freespin模式标识节点动画
       */
      private async playFreespinFlagAnimation(animationName: 'daiji' | 'chuxian') {
        if (!this.freespinFlagNode.active) {
          this.freespinFlagNode.active = true;
        }
        if (!this.freespinFlagSpine) {
          this.freespinFlagSpine = this.freespinFlagNode.getComponent(sp.Skeleton);
        }
    
        this.freespinFlagSpine.skeletonData = this.freespinFlagSpineData;
        this.freespinFlagSpine.setAnimation(0, animationName, true);
    
        if (animationName === 'chuxian') {
          // 先播放完毕出现时的动画，再切换到待机动画
          await wrapSpineCompleteListener(this.freespinFlagSpine);
          this.freespinFlagSpine.setAnimation(0, 'daiji', true);
        }
      }
    
      /**
       * 停止并隐藏掉普通模式下的箭头和动画
       */
      private stopArrowAnimationAndHideArrow() {
        this.stopArrowAnimation();
        this.arrowNode.active = false;
      }
    
      /**
       * 停止箭头旋转动画
       */
      private stopArrowAnimation() {
        if (this.rotateArrowTween) {
          this.rotateArrowTween.stop();
          this.rotateArrowTween = null;
        }
      }
    
      /**
       * 切换箭头旋转速度
       * @param speed 旋转速度
       */
      private changeArrowRotateSpeed(speed: 'slow' | 'fast') {
        this.rotateSpeed = speed === 'fast' && app.manager.global.quikeMode !== IQuickMode.nomal ? 'turbo' : speed;
        console.log('this.rotateSpeed', this.rotateSpeed);
        this.rotateArrow();
      }
    
      /**
       * 旋转箭头动画节点, 无限循环逆时针旋转
       * @param speed 旋转速度
       */
      private rotateArrow() {
        if (!this.arrowNode) return;
        
        // 停止之前的旋转动画
        this.stopArrowAnimation();
        
        // 设置复用的旋转向量值
        this.rotateVec3.set(0, 0, -360);
        
        // 开始逆时针旋转动画
        this.rotateArrowTween = tween(this.arrowNode)
          .by(this._speedMap[this.rotateSpeed], { eulerAngles: this.rotateVec3 })
          .repeatForever()
          .start();
      }
      
      /**
       * 处理freespin模式状态变化事件
       * @param isFreespin 是否启用freespin模式
       */
      private onFreespinModeChange(isFreespin: boolean, freespinTimes: number, betAmount: number, campaignId: string) {
        this._state = isFreespin ? 'freespin' : 'normal';
        this.freespinInfo = {
          betAmount,
          freespinTimes,
          campaignId,
        };
    
        if (isFreespin) {
          this.switchFreespinState(freespinTimes);
        } else {
          this.switchNormalState();
        }
      }
    
      /**
       * 切换到freespin状态
       * @param freespinTimes freespin模式下旋转次数
       */
      private switchFreespinState(freespinTimes: number) {
        this.initFreespinTimes(freespinTimes);
        this.stopArrowAnimationAndHideArrow();
        this.processFreespinAnimations();
      }
    
      /**
       * 切换到普通状态
       */
      private switchNormalState() {
        this.resetFreespinTimes();
        this.processIdleAnimations();
        this.stopBreathAnimation();
        this.arrowNode.active = true;
        this.freespinFlagNode.active = false;
      }
    
      /**
       * 初始化freespin模式下旋转次数
       * @param times freespin模式下旋转次数
       */
      private initFreespinTimes(times: number) {
        this.freespinTimes = times;
        this.freespinTimesNode.active = true;
        this.updateFreespinTimes();
      }
    
      /**
       * 设置freespin模式下旋转次数
       * @param freespinTimes freespin模式下旋转次数
       */
      private onFreespinTimesChange(times: number) {
        this.freespinTimes = times;
        this.updateFreespinTimes();
      }
    
      /**
       * 更新freespin模式下旋转次数
       */
      private updateFreespinTimes() {
        this.freespinTimesNode.getComponent(Label).string = `${this.freespinTimes}`;
      }
    
      /**
       * 设置freespin模式下旋转次数可见状态
       * @param visible 是否可见
       */
      private onFreespinTimesVisibleChange(visible: boolean) {
        this.freespinTimesNode.active = visible;
      }
    
      /**
       * 重置freespin模式下旋转次数
       */
      private resetFreespinTimes() {
        if (this._state !== 'freespin') {
          return;
        }
    
        this.freespinTimes = 0;
        this.freespinTimesNode.active = false;
        this.updateFreespinTimes();
      }
    
      protected onDestroy(): void {
        app.manager.event.off('freespin:state:change', this.onFreespinModeChange, this);
        app.manager.event.off('freespin:times:change', this.onFreespinTimesChange, this);
        app.manager.event.off('freespin:times:visible', this.onFreespinTimesVisibleChange, this);
        app.manager.event.off('roll:start', this.onRollStart, this);
        app.manager.event.off('roll:stop', this.onRollStop, this);
        app.manager.event.off('roll:reward', this.onRollReward, this);
        app.manager.event.off('button:disable', this.startButtonDisableAndRecover, this);
      }
}

/**
 * 包装spine的complete事件监听器
 * @param spine
 * @returns
 */
export const wrapSpineCompleteListener = (spine: sp.Skeleton) => {
  return new Promise<{ entry: sp.spine.TrackEntry; spine: sp.Skeleton }>((resolve) => {
    spine.setCompleteListener((entry) => {
      spine.setCompleteListener(null);
      resolve({ entry, spine });
    });
  });
};

export function preventRapidClickDecorator(clickDelay: number = 1000) {
  let lastClickTime = 0;

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const currentTime = Date.now();

      if (currentTime - lastClickTime < clickDelay) {
        return;
      }

      lastClickTime = currentTime;

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}