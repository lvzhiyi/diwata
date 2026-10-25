import { _decorator, Component, Node, sp, Vec3, Label } from 'cc';
import { IQuickMode } from 'db://assets/app-builtin/app-manager/global/GlobalManager';
import { app } from 'db://assets/app/app';

const { ccclass, property } = _decorator;

// spin 按钮 Spine 动画名：待机 daiji（箭头慢转一圈），点击 dianji，免费旋转模式点击 freespins（隐藏箭头）
const SPIN_ANIM_IDLE = 'daiji';
const SPIN_ANIM_CLICK = 'dianji';
const SPIN_ANIM_FREESPIN = 'freespins';

// 免费旋转次数挂点
const FREESPIN_TIMES_SOCKET_PATH = 'root/spin/number';

// daiji 动画中箭头转一圈的时长（秒）
const IDLE_ROTATE_DURATION = 10 / 3;

@ccclass('StartButtonState')
export class StartButtonState extends Component {
      /**
       * 滚动中箭头转一圈的时长（秒）
       */
      private _rotateDurationMap = {
        fast: 0.26,
        turbo: 0.1,
      };
    
      private _state: 'normal' | 'freespin' = 'normal';
    
      @property({ tooltip: '置灰图片', type: Node })
      private disbleImageNode: Node = null;

      /**
       * 旋转按钮节点，按钮、箭头和点击特效都在这个 Spine 里
       */
      @property({ tooltip: '旋转按钮 Spine 节点', type: Node })
      private normalBgNode: Node = null;
      
      @property({ type: Node, tooltip: 'freespin模式下旋转次数节点' })
      private freespinTimesNode: Node = null;
    
      /**
       * 旋转按钮动画组件
       */
      private spinButtonSpine: sp.Skeleton = null;

      /**
       * 当前播放的按钮动画
       */
      private currentSpinAnimation = '';
    
      /**
       * freespin模式下旋转次数
       */
      private freespinTimes = 0;
    
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
        this.spinButtonSpine = this.normalBgNode.getComponent(sp.Skeleton);
        this.bindFreespinTimesSocket();

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
       * 把免费旋转次数绑定到按钮中心的挂点
       * socket 目标必须是骨骼节点的直接子节点
       */
      private bindFreespinTimesSocket() {
        this.freespinTimesNode.setParent(this.normalBgNode);
        this.freespinTimesNode.setPosition(Vec3.ZERO);
        this.spinButtonSpine.sockets = [new sp.SpineSocket(FREESPIN_TIMES_SOCKET_PATH, this.freespinTimesNode)];
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
       * 开始滚动事件
       */
      public onRollStart() {
        console.log('roll:start事件');
        this.changePlayState('playing');
        this.isGamePlaying = true;
    
        this.processPlayingAnimations();
      }
        
      /**
       * 停止滚动事件
       */
      public onRollStop(isReward: boolean = false) {
        console.log('roll:stop事件', isReward);
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
        if (this._state === 'normal') {
          // 箭头按 daiji 原速慢慢旋转
          this.playSpinButtonAnimation(SPIN_ANIM_IDLE, true);
        } else {
          this.showFreespinPose();
        }
      }
    
      /**
       * 处理游戏开始状态下的动画
       */
      private processPlayingAnimations() {
        this.disimageChange(false);

        if (this._state === 'freespin') {
          this.playSpinButtonAnimation(SPIN_ANIM_FREESPIN, false);

          return;
        }

        this.playSpinButtonAnimation(SPIN_ANIM_CLICK, false);
        // 点击动画结束后，箭头按滚动速度持续旋转
        const entry = this.spinButtonSpine.addAnimation(0, SPIN_ANIM_IDLE, true);

        if (entry) {
          entry.timeScale = IDLE_ROTATE_DURATION / this._rotateDurationMap[this.getPlayingRotateSpeed()];
        }
      }

      /**
       * 滚动中的箭头转速档位
       */
      private getPlayingRotateSpeed(): 'fast' | 'turbo' {
        return app.manager.global.quikeMode !== IQuickMode.nomal ? 'turbo' : 'fast';
      }
    
      /**
       * 处理中奖动画播放过程中的按钮动画
       */
      private processRewardAnimations() {
        if (this._state === 'normal') {
          this.stopArrowRotate();
        }
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
        if (this._state === 'normal') {
          this.stopArrowRotate();
        }
      }

      /**
       * 箭头停在当前角度
       */
      private stopArrowRotate() {
        const entry = this.spinButtonSpine.getCurrent(0);

        if (entry && this.currentSpinAnimation === SPIN_ANIM_IDLE) {
          entry.timeScale = 0;
        } else {
          this.playSpinButtonAnimation(SPIN_ANIM_IDLE, true).timeScale = 0;
        }
      }

      /**
       * freespin 模式的静止姿态：停在 freespins 最后一帧，箭头隐藏，不播放点击特效
       */
      private showFreespinPose() {
        if (this.currentSpinAnimation === SPIN_ANIM_FREESPIN) {
          return;
        }

        const entry = this.playSpinButtonAnimation(SPIN_ANIM_FREESPIN, false);
        entry.trackTime = entry.animationEnd;
      }
    
      /**
       * 播放旋转按钮动画
       * @param animationName 动画名称
       * @param isLoop 是否循环播放
       */
      private playSpinButtonAnimation(animationName: string, isLoop = true): sp.spine.TrackEntry {
        this.currentSpinAnimation = animationName;
        // freespins 会隐藏箭头而 daiji 不控制该插槽，切换前先回到初始姿态
        this.spinButtonSpine.setToSetupPose();

        return this.spinButtonSpine.setAnimation(0, animationName, isLoop);
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
        // 进入时完整播放一次 freespins，之后停在隐藏箭头的姿态
        this.playSpinButtonAnimation(SPIN_ANIM_FREESPIN, false);
      }
    
      /**
       * 切换到普通状态
       */
      private switchNormalState() {
        this.resetFreespinTimes();
        this.processIdleAnimations();
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