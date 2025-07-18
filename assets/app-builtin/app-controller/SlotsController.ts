import BaseController from 'db://app/base/BaseController';
import { app } from '../../app/app';
import { BetSubTypes, BetTypes } from '../../basePlate/middleWare/enums/bet';
import EventTrackManager from '../../basePlate/middleWare/serverManager/EventTrackManager';
import { freeSpinManager } from '../../res-native/script/FreeSpinManager';

export class SlotsController extends BaseController<
  SlotsController,
  {
    StartRolling: () => void;
    StopRolling: (serverResults: BetResult) => void;
    FreeBonusSpinChange: (isFreeBonusSpin: boolean) => void;
    GameOver: (betResult: BetResult) => void;
  }
>() {
  // 是否是免费轮
  isFreeBonusSpin = false;

  private betRecordId: string = '';

  betType: BetTypes = BetTypes.normal;

  betSubType: BetSubTypes = BetSubTypes.normal;

  // Controller中发射事件, UI中监听事件:

  // 1、UI中需要将 「extends BaseView」 改为=> 「extends BaseView.bindController(SlotsController)」
  // 2、UI中使用「this.controller.on/once」监听事件, 使用「this.controller.emit」发射事件, 使用「this.controller.off/targetOff」取消监听事件
  // 3、在外部(无法使用this.controller的地方)可以通过「app.controller.xxx」来调用对外导出的方法, 比如下面的refresh方法
  /**
   * 开始游戏
   */
  startRolling() {
    this.emit(SlotsController.Event.StartRolling);
  }

  /**
   * 停止滚动
   * @param serverResults 服务器结果
   */
  async stopRolling(betResult: BetResult) {
    this.betRecordId = betResult?.betRecordId ?? '';
    
    this.emit(SlotsController.Event.StopRolling, betResult);
  }

  /**
   * 游戏结束
   * @param betResult 游戏结果
   */
  gameOver(betResult: BetResult) {
    this.emit(SlotsController.Event.GameOver, betResult);
  }

  /**
   * 改变免费轮状态
   */
  freeBonusSpinChange(isFreeBonusSpin: boolean) {
    this.isFreeBonusSpin = isFreeBonusSpin;
    this.emit(SlotsController.Event.FreeBonusSpinChange, isFreeBonusSpin);

    if(!isFreeBonusSpin){
      this.resetBetAmount();
    }
  }

  /**
   * 设置投注类型
   */
  setBetType(betType: BetTypes, betSubType: BetSubTypes) {
    this.betType = betType;
    this.betSubType = betSubType;
  }
  
  /**
   * 普通投注
   */
  betNormal() {
    app.controller.home.gameStart();

    app.controller.home.getBetResult(app.manager.global.betCount, BetTypes.normal, BetSubTypes.normal, app.manager.global.isFreespinMode, freeSpinManager.freespinCampaignId);
  }

  /**
   * 购买免费轮按钮点击
   */
  betBuyFreeSpin() {
    app.controller.home.gameStart();

    app.controller.home.getBetResult(app.manager.global.betCount, BetTypes.buy, BetSubTypes.buySpinNormal);
  }

  /**
   * 关闭免费轮结算弹窗
   */
  public closeFreeSpinSettlementDialog() {
    app.manager.ui.hide({ name: 'PopFreeSpinResult' });
  }
  
  /**
   * 免费轮期间的投注
   */
  betFreeSpin() {
    app.controller.home.gameStart();

    if (this.betType === BetTypes.normal) {
      // 普通免费轮投注
      app.controller.home.getBetFreeSpinResult(app.manager.global.betCount, BetTypes.normal, BetSubTypes.normalFreeSpin, this.betRecordId);
    } else {
      // 购买免费轮投注
      app.controller.home.getBetFreeSpinResult(app.manager.global.betCount, BetTypes.buy, BetSubTypes.buySpinFreeSpin, this.betRecordId);
    }
  }

  /**
   * 复原投注金额
   */
  resetBetAmount() {
    const tempBetCount = app.manager.global.tempBetCount;

    if(tempBetCount){
      app.manager.global.setBetCount(tempBetCount);
      app.manager.event.emit('betCountChange', tempBetCount);
    }
  }
}
