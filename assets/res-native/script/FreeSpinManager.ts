import { app } from 'db://assets/app/app';
import { ActivityEventMgr, ActivityEventMgrEventsType } from 'db://assets/common/script/ActivityEventMgr';
import { MoneyUtil } from 'db://assets/basePlate/core/baseUtil/MoneyUtil';
import { delay } from 'db://assets/common/script/extra/Utils/common';
import { _decorator, v3 } from 'cc';
import { GlobalActivity } from '../../common/script/extra/GlobalMgr';

const { ccclass } = _decorator;

@ccclass('FreeSpinManager')
class FreeSpinManager {
  /** freespin次数 */
  public freespinTimes: number = 0;

  /** freespin活动ID */
  public freespinCampaignId: string = '';

  /** freespin累计奖励金额 */
  public freespinRewardAmount: number = 0;

  /** 等待freespin事件开始时间 */
  private waitFreespinEventStartTime: number = 0;

  /** 是否启用自动游戏 */
  private isAutoGameEnabled: boolean = false;

  /** 单例实例 */
  private static instance: FreeSpinManager;

  private constructor() {
    // 私有构造函数，防止外部实例化
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): FreeSpinManager {
    if (!FreeSpinManager.instance) {
      FreeSpinManager.instance = new FreeSpinManager();
    }

    return FreeSpinManager.instance;
  }

  // ******************** 公共接口方法 ********************

  /**
   * 初始化freespin管理器
   * 外部调用此方法来初始化freespin功能
   */
  public async init() {
    await this.initFreespinInternal();
  }

  /**
   * 游戏轮次结束回调
   * 外部游戏逻辑需要在每轮结束后调用此方法
   */
  public onRoundEnd() {
    this.roundEnd();
  }

  /**
   * 更新中奖金额
   * @param amount 本轮中奖金额
   */
  public updateRewardAmount(amount: number) {
    this.updateFreespinRewardAmount(amount);
  }

  /**
   * 处理freespin活动ID失效
   */
  public handleActivityIdInvalid() {
    this.onFreeSpinActivityIdInvalid();
  }

  /**
   * 获取当前freespin状态
   */
  public getFreespinData() {
    return {
      enabled: app.manager.global.isFreespinMode,
      times: this.freespinTimes,
      campaignId: this.freespinCampaignId,
      rewardAmount: this.freespinRewardAmount
    };
  }

  /**
   * 点击freespin按钮
   */
  public onFreespinBtnClick() {
    GlobalActivity.openFreeSpin();
  }

  // ******************** freespin 模式内部实现 ********************

  /**
   * 初始化freespin数据
   */
  private async initFreespinInternal() {
    // 注册活动事件监听
    ActivityEventMgr.instance.on(ActivityEventMgrEventsType.useFreeSpin, this.onStartFreespin, this);
    ActivityEventMgr.instance.on(ActivityEventMgrEventsType.cancelUseFreeSpin, this.onCancelFreespin, this);
    ActivityEventMgr.instance.on(ActivityEventMgrEventsType.endFreeSpin, this.onCancelFreespin, this);
    // 成就freeSpin活动过期
    app.manager.event.on('freeSpinActivityIdInvalid', this.onFreeSpinActivityIdInvalid, this);
    // 监听自动按钮
    app.manager.event.on('allwaysAutoPlayChange', this.autoModeChangeListener, this);
    // 监听freeSpin金额累计
    app.manager.event.on('freeSpin:addAmount', this.updateFreespinRewardAmount, this);

    if (GlobalActivity.useFreeSpin()) {
      this.holdFreespinEvent();
    }
  }
  
  /**
   * 改变侧边入口弹窗状态
   * @param isActive 是否激活
   */
  private changeSideEntryDialogState(isActive: boolean) {
    GlobalActivity.setEntryDialogActive(isActive);
  }

  /**
   * 自动模式变化
   * @param val
   */
  autoModeChangeListener(val: boolean) {
    this.isAutoGameEnabled = val;
  }

  /**
   * 处理freespin模式开始事件
   * @param data 包含免费游玩次数、投注金额、总奖励的数据对象
   */
  private onStartFreespin(data: { count: number; freeBet: number, totalAward: number; campaignId: string }) {
    const {
      count, freeBet, campaignId, totalAward,
    } = data;
    this.onFreespinEnableChange(true, count, freeBet, campaignId);
    this.freespinRewardAmount = totalAward;
  }

  /**
   * 结束一轮游戏时的事件
   */
  private roundEnd() {
    if (app.manager.global.isFreespinMode) {
      this.updateFreespinTimes(--this.freespinTimes);
    }
  }

  /**
   * 处理取消freespin模式通知
   */
  private onCancelFreespin() {
    this.onFreespinEnableChange(false);
  }

  /**
   * 更新免费轮中奖金额
   * @param amount 中奖金额
   */
  private updateFreespinRewardAmount(amount: number) {
    this.freespinRewardAmount += amount;
  }

  /**
   * 等待SDK初始化完成后派发freespin事件
   */
  private holdFreespinEvent() {
    this.waitFreespinEventStartTime = Date.now();
    
    // 禁用掉投注金额选择按钮
    this.updateBetAmountButtonState(false);
    // 禁用开始按钮
    this.updateStartButtonState(false);
    // 禁用自动投注按钮
    this.updateAutoButtonEnableState(false);
  }

  /**
   * 处理freespin模式启用状态变化事件
   * @param isEnabled 是否启用freespin模式
   * @param freespinTimes 免费游玩次数
   * @param betAmount 投注金额
   * @param campaignId 活动ID
   */
  private async onFreespinEnableChange(isEnabled: boolean, freespinTimes?: number, betAmount?: number, campaignId?: string) {
    if (isEnabled) {
      const now = Date.now();

      // 只有等待freespin事件开始时间大于0时，才需要等待
      if (this.waitFreespinEventStartTime > 0) {
        await delay(Math.min(now - this.waitFreespinEventStartTime, 500));
        this.waitFreespinEventStartTime = 0;
        // 恢复开始按钮的可点击状态
        this.updateStartButtonState(true);
        // 恢复自动投注按钮的特效
        this.updateAutoButtonEnableState(true);
        // 恢复投注金额按钮的可点击状态，主要是为了避免在播放动画时，按钮处于禁用状态时，导致动画播放异常
        this.updateBetAmountButtonState(true);
      }

      await this.enableFreespin(freespinTimes, betAmount, campaignId);
      app.manager.event.emit('freespin:state:change', true, freespinTimes, betAmount, campaignId);
    } else {
      this.disableFreespin();
      app.manager.event.emit('freespin:state:change', false, freespinTimes, betAmount, campaignId);
    }
  }

  /**
   * 启用freespin模式
   */
  private async enableFreespin(freespinTimes: number, betAmount: number, campaignId?: string) {
    // 设置freespin模式
    app.manager.global.setIsFreespinMode(true);
    // 设置投注金额
    app.manager.global.setFreespinBetAmount(betAmount);
    // 设置活动ID
    this.freespinCampaignId = campaignId;
    // 显示freespin按钮
    this.updateFreeSpinBtnState(true);
    // 更新freespin次数
    this.updateFreespinTimes(freespinTimes);
    // 更新投注金额显示
    this.betCountChange(betAmount);
    // 播放开始按钮动画展示FreeSpin
    this.playFreespinStartBtnAnimation();
    // 更新freespin次数显示状态
    this.updateFreespinTimesVisible(true);
    // 播放投注金额按钮动画
    await this.playFreespinBetAmountButtonAnimation();
    // 禁用投注金额按钮
    this.updateBetAmountButtonState(false);
    // 禁用入口弹窗
    this.changeSideEntryDialogState(false);
  }

  /**
   * 禁用freespin模式
   */
  private disableFreespin() {
    // 恢复入口
    this.changeSideEntryDialogState(true);
    // 设置freespin模式
    app.manager.global.setIsFreespinMode(false);
    // 设置投注金额
    app.manager.global.setFreespinBetAmount(0);
    // 清空活动ID
    this.freespinCampaignId = '';
    // 清空freespin次数
    this.freespinTimes = 0;
    
    // 更新投注金额显示
    this.betCountChange(app.manager.global.betCount);
    // 启用投注金额按钮
    this.updateBetAmountButtonState(true);
    // 更新freespin次数显示状态
    this.updateFreespinTimesVisible(false);
    // 隐藏freespin按钮
    this.updateFreeSpinBtnState(false);
    // 恢复开始按钮动画
    this.restoreStartBtnAnimation();
    // 显示freespin累计中奖金额
    this.showFreespinTotalRewardAmount();
  }

  /**  
   * 停止freespin模式
   */
  private stopFreespin() {
    ActivityEventMgr.instance.dispatchEvent(ActivityEventMgrEventsType.endFreeSpin, null);

    // 如果当前处于自动投注模式，则需要停止自动投注
    if (this.isAutoGameEnabled) {
      this.startOrStopAutoGame();
    }
  }

  /**
   * 处理freespin活动id已失效事件
   */
  private onFreeSpinActivityIdInvalid() {
    this.stopFreespin();
  }

  /**
   * 显示freespin累计中奖金额
   */
  private showFreespinTotalRewardAmount() {
    // 通过事件系统通知UI显示累计奖励
    app.manager.event.emit('freespin:showTotalReward', this.freespinRewardAmount);
  }

  /**
   * 更新freespin次数显示状态
   * @param visible 是否显示
   */
  private updateFreespinTimesVisible(visible: boolean) {
    app.manager.event.emit('freespin:timesVisible', visible);
  }

  /**
   * 更新freespin次数
   * @param freespinTimes 免费游玩次数
   */
  private updateFreespinTimes(freespinTimes: number) {
    this.freespinTimes = freespinTimes;
    app.manager.event.emit('freespin:times', freespinTimes);

    if (this.freespinTimes <= 0) {
      this.stopFreespin();
    }
  }

  /**
   * 播放开启freespin模式时，投注金额按钮动画
   */
  private async playFreespinBetAmountButtonAnimation() {
    app.manager.event.emit('freespin:betAmountButtonAnimation');
  }

  /**
   * 播放开启freespin模式时，开始按钮动画
   */
  private async playFreespinStartBtnAnimation() {
    await this.playStartBtnAnimation('action', false);
    await this.playStartBtnAnimation('idle1', true);
  }

  /**
   * 恢复开始按钮动画动画成普通模式动画
   */
  private async restoreStartBtnAnimation() {
    await this.playStartBtnAnimation('idle', true);
  }

  /**
   * 更新投注金额按钮状态
   * @param enabled 是否启用
   */
  private updateBetAmountButtonState(enabled: boolean) {
    app.controller.home.changeBetAmountButtonState(enabled);
  }

  /**
   * 更新FreeSpin 按钮的隐藏和展示
  */
  private updateFreeSpinBtnState(enabled: boolean) {
    app.manager.event.emit('freespin:buttonState', enabled);
  }

  /**
   * 更新开始按钮状态
   * @param enabled 是否启用
   */
  private updateStartButtonState(enabled: boolean) {
    app.controller.home.changeStartButtonState(enabled);
  }

  /**
   * 更新自动投注按钮状态
   * @param enabled 是否启用
   */
  private updateAutoButtonEnableState(enabled: boolean) {
    app.controller.home.changeAutoPlayButtonState(enabled);
  }

  /**
   * 投注金额变化UI处理
   * @param val 新的投注金额
   */
  private betCountChange(val: number) {
    app.manager.event.emit('betCountChange', val);
  }

  /**
   * 停止自动游戏
   */
  private startOrStopAutoGame() {
    this.isAutoGameEnabled = !this.isAutoGameEnabled;
    app.manager.event.emit('stopAllwaysAutoPlay');
  }

  /**
   * 播放开始按钮动画
   * @param animationName 动画名称
   * @param loop 是否循环播放
   */
  private async playStartBtnAnimation(animationName: string, loop: boolean) {
    app.manager.event.emit('start-button:animation',  animationName, loop );
  }
}

export const freeSpinManager = FreeSpinManager.getInstance();