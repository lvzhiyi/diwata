import BaseController from 'db://app/base/BaseController';
import { app } from 'db://assets/app/app';import { calculateWithBase, delay } from '../../common/script/extra/Utils/common';
import { BetSubTypes, BetTypes,  } from '../../basePlate/middleWare/enums/bet';
import { doBet } from '../../basePlate/middleWare/services/bet';
import { HTTP_STATUS_CODES } from '../../common/script/extra/Request';
import GameProcessCtrl, { GameState } from '../../common/script/extra/GameProcessCtrl';
import { sys } from 'cc';
import { mockFailedData, mockSuccessData } from '../../basePlate/core/baseUtil/mockDataUtils';
import { ToastView } from '../../basePlate/middleWare/commonUI/ToastView';
import { ActivityEventMgr, ActivityEventMgrEventsType } from '../../common/script/ActivityEventMgr';

// TODO 测试用
const useMock = false;

export class HomeController extends BaseController<
  HomeController,
  {
    Refresh: (a: number) => boolean;
    GameStart: () => void;
    GameOver: (betResult: BetResult) => void;
    IsAutoPlay: (betResult: BetResult) => void;
    EnableButton: () => void;
    DisableButton: () => void;
    ClickScreen: () => void;
  }
>() {
  private betResult: BetResult;

  /**
   * 余额
   */
  private credit: number = 0;

  /**
   * 是否处于游戏结束状态
   */
  private isEndGame = true;

  /**
   * 自动投注类型
   * - buy: 购买免费轮
   * - bet: 投注
   */
  public autoPlayType: BetTypes;

  /**
   * 游戏开始状态修改
   */
  async gameStart() {
    if (!this.isEndGame) {
      return;
    }

    console.log('游戏开始事件');
    this.emit(HomeController.Event.DisableButton);
    GameProcessCtrl.gameState = GameState.GameStarting;
    app.manager.global.setIsGoing(true);
    this.isEndGame = false;
    app.controller.slots.startRolling();
  }

  /**
   * 游戏结束事件
   */
  async gameOver() {
    console.log('游戏结束事件');
    GameProcessCtrl.gameState = GameState.GameEnded;

    // 普通轮且没有命中免费轮，或达到最大倍数
    if ((!this.checkIsFreeRound(this.betResult) && !app.controller.slots.isFreeSpin) || this.checkIsMaxMultiple(this.betResult)) {
      // 结束游戏
      this.emit(HomeController.Event.GameOver, this.betResult);

      // 非自动模式，启用按钮
      if (!app.manager.global.startAutoPlay && !app.manager.global.allwaysAutoPlay) {
        this.emit(HomeController.Event.EnableButton);
      }

      // 更改余额
      app.manager.global.setCreditCount(calculateWithBase(this.credit, true));
    } else if (this.isFreeSpinLastRound()) {
      // 免费轮最后一轮
      // 更改余额
      app.manager.global.setCreditCount(calculateWithBase(this.credit, true));
    } else if(app.manager.global.startAutoPlay && this.checkIsFreeRound(this.betResult)) {
      // 自动模式，命中免费轮，检查是否继续自动执行
      this.emit(HomeController.Event.IsAutoPlay, this.betResult);
    }

    this.setClickScreenFlase();
    this.betResult = null;

    app.manager.global.setIsGoing(false);
  }

  /**
   * 消费星卡
   * @param starCardData 星卡的数据
   */
  public onUseStarCard(starCardData: any) {
    if (starCardData == null) {
      return;
    }

    console.log('消费星卡', starCardData);
  
    this.autoPlayType = BetTypes.buy;
    const betAmount = starCardData.bet;
    // 关闭结算弹窗
    app.controller.slots.closeFreeSpinSettlementDialog();
    // 改变游戏状态
    app.controller.slots.freeSpinChange(true);
    this.gameStart();
    // 发起购买免费轮
    this.buyBonusBetResult(betAmount, BetTypes.buy, BetSubTypes.buySpinNormal, starCardData);
  }

  /**
   * 设置点击屏幕
   */
  private setClickScreenFlase() {
    if (app.manager.global.isClickScreen) {
      const { gameId, playerId } = app.manager.global;
      const storageKey = `${gameId}_${playerId}_ClickScreenCount`;
      const currentCount = parseInt(sys.localStorage.getItem(storageKey) || '0');
      const newCount = Math.min(currentCount + 1, 3);
      sys.localStorage.setItem(storageKey, newCount.toString());
    }

    // 设置点击屏幕为false
    app.manager.global.setClickScreen(false);
  }

  /**
   * 结束当前轮游戏
   */
  endGame() {
    this.isEndGame = true;
    this.gameOver();
  }

  /**
   * 获取投注结果
   * @param amount 投注金额
   * @param betType 投注类型
   * @param betSubType 投注子类型
   * @param starCardData 星卡数据
   * @param isFreeSpin 是否是使用free spin
   * @param compainId 活动ID
   */
  async getBetResult(amount: number, betType: BetTypes, betSubType: BetSubTypes, starCardData?: any, isFreeSpin?: boolean, compainId?: string) {
    app.controller.slots.setBetType(betType, betSubType);
    
    if (useMock) {
      await delay(1000);

      this.betResult = mockSuccessData;

      app.manager.global.setCreditCount(
        app.manager.global.creditCount - app.manager.global.betCount
      );
      this.credit = this.betResult.credit;
      // 停止滚动
      app.controller.slots.stopRolling(this.betResult);

      return;
    }

    if(betType === BetTypes.buy) {
      this.buyBonusBetResult(amount, betType, betSubType, starCardData);
    } else {
      this.getNormalBetResult(amount, betType, betSubType, isFreeSpin, compainId);
    }
  }

  /**
  * 获取普通投注结果
 */
  async getNormalBetResult(amount: number, betType: BetTypes, betSubType: BetSubTypes, isFreeSpin?: boolean, compainId?: string) {
    const betAmount = calculateWithBase(amount, false);
    const payAmount = calculateWithBase(amount * 1, false);

    const res = await doBet({
      gameId: app.config.app.GAME_ID,
      betType,
      betSubType,
      betDetail: isFreeSpin ? {
        betAmount,
        payAmount,
        useFreeSpin: isFreeSpin,
        campaignId: compainId,
      } : {
        betAmount,
        payAmount,
      },
    });

    if (res.code === HTTP_STATUS_CODES.SUCCESS && res.data) {
      app.manager.global.setCreditCount(
        app.manager.global.creditCount - (app.manager.global.betCount * (betType === BetTypes.buy ? app.config.app.BUY_FREE_SPIN_TIMES_RATIO : 1))
      );
      this.credit = res.data.credit;
      this.betResult = res.data;
      await delay(app.manager.global.quikeMode ? 0 : 500);
      app.controller.slots.stopRolling(this.betResult);
    } else {
      this.credit = calculateWithBase(app.manager.global.creditCount, false);
      this.betResult = mockFailedData;
      ToastView.showCommonToast('Unstable Network,Bet failed');
      app.controller.slots.stopRolling(this.betResult);
    }
  }

  /**
   * 花钱购买免费轮或者使用星卡
  */
  async buyBonusBetResult(amount: number, betType: BetTypes, betSubType: BetSubTypes, starCardData?: any) {
    const isUseStarCard = !!starCardData; 
    let res: ApiResponse<BetResult> = null;
    let betData: any = null;
    const _betAmount = calculateWithBase(isUseStarCard ? starCardData.bet ?? 0 : amount, false);
    // 购买金额，购买金额是投注金额的100倍
    const payAmount = isUseStarCard ? _betAmount : _betAmount * app.config.app.BUY_FREE_SPIN_TIMES_RATIO;

    if (starCardData != null) {
      betData = {
        gameId: app.config.app.GAME_ID,
        betType: betType,
        betSubType: betSubType,
        betDetail: {
          payAmount,
          betAmount: _betAmount,
          useStarCard: true,
          rewardConfigId: starCardData.rewardConfigId,
          rewardId: starCardData.reward_id
        },
      };
    } else {
      betData = {
        gameId: app.config.app.GAME_ID,
        betType: betType,
        betSubType: betSubType,
        betDetail: {
          betAmount: _betAmount,
          payAmount,
        },
      };
    }
    try {
      res = await doBet(betData);
    } catch (error) {
      res = {
        code: '500',
        msg: error.message ?? 'buy free spin failed',
        success: false,
        data: null,
      };
    }

    if (res.code === HTTP_STATUS_CODES.SUCCESS && res.data) {
      app.manager.global.setCreditCount(
        app.manager.global.creditCount - (app.manager.global.betCount * (betType === BetTypes.buy ? app.config.app.BUY_FREE_SPIN_TIMES_RATIO : 1))
      );
      this.credit = res.data.credit;
      this.betResult = res.data;
      await delay(app.manager.global.quikeMode ? 0 : 500);

      if (isUseStarCard) {
        // 星卡使用成功
        ActivityEventMgr.instance.dispatchEvent(ActivityEventMgrEventsType.useGoodsSuccess);
        // 复原投注金额
      }

      app.controller.slots.stopRolling(this.betResult);
    } else {
      this.credit = calculateWithBase(app.manager.global.creditCount, false);
      this.betResult = mockFailedData;
      ToastView.showCommonToast('Unstable Network,Bet failed');

      // 星卡使用失败
      if (isUseStarCard) {
        // 购买失败，复原星卡使用状态
        ActivityEventMgr.instance.dispatchEvent(ActivityEventMgrEventsType.hideStarCard, null);
      }
      
      app.controller.slots.stopRolling(this.betResult);
    }
  }

  /**
   * 查询免费轮期间的投注结果
   */
  async getBetFreeSpinResult(amount: number, betType: BetTypes, betSubType: BetSubTypes, betRecordId: string) {
    this.autoPlayType = betType;
    const betAmount = calculateWithBase(amount, false);

    const res = await doBet({
      gameId: app.config.app.GAME_ID,
      betType,
      betSubType,
      betDetail: {
        betRecordId,
        gameRecordId: app.manager.global.gameRecordIds[app.manager.global.gameRecordIndex],
        betAmount,
        payAmount: 0,
      },
    });

    if (res.code === HTTP_STATUS_CODES.SUCCESS && res.data) {
      this.betResult = res.data;
      await delay(app.manager.global.quikeMode ? 0 : 500);
      app.controller.slots.stopRolling(this.betResult);
    } else {
      this.betResult = mockFailedData;
      ToastView.showCommonToast('Unstable Network,Bet failed');
      app.controller.slots.resetBetAmount();
      // 免费中的子轮其中一个中断后，设置为非免费轮，修改状态
      app.controller.slots.freeSpinChange(false);
      app.controller.slots.stopRolling(this.betResult);
    }
  }

  /**
   * 检查当前轮是否命中免费轮
   */
  checkIsFreeRound(result: BetResult) {
    const resultList = result.resultDetail.resultList;

    return resultList.some(item => item.freeWheelFlag === 1);
  }

  /**
   * 是否是免费轮最后一轮
   */
  isFreeSpinLastRound() {
    return app.controller.slots.isFreeSpin && app.manager.global.gameRecordIndex === app.manager.global.gameRecordIds.length;
  }

  /**
   * 检查是否达到最大倍数
   */
  checkIsMaxMultiple(result: BetResult) {
    const resultList = result.resultDetail.resultList;

    return resultList.some(item => item.accumulateReachMaxMultiple);
  }
}
