import BaseController from 'db://app/base/BaseController';
import { app } from 'db://assets/app/app';import { calculateWithBase, delay } from '../../common/script/extra/Utils/common';
import { BetSubTypes, BetTypes, RewardSubTypeEnum, RewardType } from '../../basePlate/middleWare/enums/bet';
import { doBet } from '../../basePlate/middleWare/services/bet';
import { HTTP_STATUS_CODES } from '../../common/script/extra/Request';
import GameProcessCtrl, { GameState } from '../../common/script/extra/GameProcessCtrl';
import { sys } from 'cc';

// TODO 测试用
const useMock = false;

export class HomeController extends BaseController<
  HomeController,
  {
    Refresh: (a: number) => boolean;
    GameStart: () => void;
    GameOver: (betResult: BetResult) => void;
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
   * 本次jackpot中奖金额，如果存在则需要在游戏结束时添加到余额中
   */
  private jackpotAmount: number = 0;

  /**
   * 是否处于游戏结束状态
   */
  private isEndGame = true;

  // TODO 测试用
  private freeWheelFlag = 1;

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

    this.emit(HomeController.Event.DisableButton);
    GameProcessCtrl.gameState = GameState.GameStarting;
    console.log('游戏开始事件');
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

    // 普通轮且没有命中免费轮
    if ((!this.checkIsFreeRound(this.betResult) && !app.controller.slots.isFreeSpin)) {
      // 结束游戏
      this.emit(HomeController.Event.GameOver, this.betResult);

      // 非自动模式，启用按钮
      if (!app.manager.global.startAutoPlay && !app.manager.global.allwaysAutoPlay) {
        this.emit(HomeController.Event.EnableButton);
      }

      // 更改余额
      app.manager.global.setCreditCount(calculateWithBase(this.credit + this.jackpotAmount, true));

      this.jackpotAmount = 0;
    } else if (this.isFreeSpinLastRound()) {
      // 免费轮最后一轮
      // 更改余额
      app.manager.global.setCreditCount(calculateWithBase(this.credit + this.jackpotAmount, true));

      this.jackpotAmount = 0;
    }

    this.setClickScreenFlase();
    this.betResult = null;

    app.manager.global.setIsGoing(false);
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
   */
  async getBetResult(amount: number, betType: BetTypes, betSubType: BetSubTypes) {
    app.controller.slots.setBetType(betType, betSubType);
    
    if (useMock) {
      await delay(2000);

      const symbolObj = (symbolId: string, symbolGoldBorder: boolean) => {
        return { symbolId, symbolGoldBorder };
      };

      this.betResult = {
        betRecordId: '1935893957962104832',
        gameId: 'zhumeng006',
        betType: 'NORMAL_BET',
        betSubType: 'NORMAL_BET',
        credit: 5539873954205297582,
        overallRewardAmount: 708000,
        totalPayoutAmount: 708000,
        resultDetail: {
          allWheelRewardSubType: 'sensational',
          resultList: [
            {
              rewardType: 'MULTIPLE',
              rewardSubType: 'sensational',
              totalRewardAmount: 708000,
              totalRewardMultiple: 1.0,
              wheel: [
                [
                  { symbolId: '1003' },
                  { symbolId: '4011' },
                  { symbolId: '4001' },
                  { symbolId: '4011' },
                  { symbolId: '4011' },
                  { symbolId: '1006' }
                ],
                [
                  { symbolId: '1005' },
                  { symbolId: '4011' },
                  { symbolId: '4011' },
                  { symbolId: '1004' },
                  { symbolId: '4011' },
                  { symbolId: '1009' }
                ],
                [
                  { symbolId: '1001' },
                  { symbolId: '1004' },
                  { symbolId: '1009' },
                  { symbolId: '1003' },
                  { symbolId: '1003' },
                  { symbolId: '1004' }
                ],
                [
                  null,
                  { symbolId: '4011' },
                  { symbolId: '4011' },
                  { symbolId: '1005' },
                  { symbolId: '1008' },
                  null
                ],
                [
                  null,
                  null,
                  { symbolId: '4011' },
                  { symbolId: '4011' },
                  null,
                  null
                ]
              ],
              rewardSymbolIndexSet: [
                {
                  rowIndex: 4,
                  columnIndex: 2
                },
                {
                  rowIndex: 4,
                  columnIndex: 3
                },
                {
                  rowIndex: 3,
                  columnIndex: 1
                },
                {
                  rowIndex: 3,
                  columnIndex: 2
                },
                {
                  rowIndex: 3,
                  columnIndex: 3
                },
                {
                  rowIndex: 2,
                  columnIndex: 0
                },
                {
                  rowIndex: 2,
                  columnIndex: 3
                },
                {
                  rowIndex: 2,
                  columnIndex: 4
                },
                {
                  rowIndex: 1,
                  columnIndex: 0
                },
                {
                  rowIndex: 1,
                  columnIndex: 1
                },
                {
                  rowIndex: 1,
                  columnIndex: 2
                },
                {
                  rowIndex: 1,
                  columnIndex: 4
                },
                {
                  rowIndex: 0,
                  columnIndex: 0
                },
                {
                  rowIndex: 0,
                  columnIndex: 1
                },
                {
                  rowIndex: 0,
                  columnIndex: 2
                },
                {
                  rowIndex: 0,
                  columnIndex: 3
                },
                {
                  rowIndex: 0,
                  columnIndex: 4
                }
              ],
              rewardLineList: [
                {
                  symbolId: '1005',
                  multiple: 1.0,
                  odds: 0.8,
                  rewardLineType: 'FIVE',
                  rewardLineSubType: 'COMMON',
                  rewardLineCount: 72,
                  rewardAmount: 288000,
                  betAmount: 5000
                },
                {
                  symbolId: '1003',
                  multiple: 1.0,
                  odds: 0.6,
                  rewardLineType: 'FIVE',
                  rewardLineSubType: 'COMMON',
                  rewardLineCount: 108,
                  rewardAmount: 324000,
                  betAmount: 5000
                },
                {
                  symbolId: '1001',
                  multiple: 1.0,
                  odds: 0.4,
                  rewardLineType: 'FIVE',
                  rewardLineSubType: 'COMMON',
                  rewardLineCount: 48,
                  rewardAmount: 96000,
                  betAmount: 5000
                }
              ],
              freeWheelFlag: 0,
              gameRecordIds: [],
              accumulateReachMaxMultiple: false,
              id: ''
            },
            {
              rewardType: 'NONE',
              rewardSubType: 'none',
              totalRewardAmount: 0,
              totalRewardMultiple: 1.0,
              wheel: [
                [
                  { symbolId: '1007' },
                  { symbolId: '1005' },
                  { symbolId: '1010' },
                  { symbolId: '4010' },
                  { symbolId: '1001' },
                  { symbolId: '1006' }
                ],
                [
                  { symbolId: '1001' },
                  { symbolId: '1007' },
                  { symbolId: '1004' },
                  { symbolId: '4010' },
                  { symbolId: '1007' },
                  { symbolId: '1009' }
                ],
                [
                  { symbolId: '1003' },
                  { symbolId: '1003' },
                  { symbolId: '1001' },
                  { symbolId: '4010' },
                  { symbolId: '1002' },
                  { symbolId: '1004' }
                ],
                [
                  null,
                  { symbolId: '1004' },
                  { symbolId: '1010' },
                  { symbolId: '4010' },
                  { symbolId: '1008' },
                  null
                ],
                [
                  null,
                  null,
                  { symbolId: '1009' },
                  { symbolId: '4010' },
                  null,
                  null
                ]
              ],
              rewardSymbolIndexSet: null,
              rewardLineList: null,
              freeWheelFlag: 0,
              gameRecordIds: [],
              accumulateReachMaxMultiple: false,
              id: ''
            }
          ],
        }
      };
      this.freeWheelFlag = 0;
      app.manager.global.setCreditCount(
        app.manager.global.creditCount - app.manager.global.betCount
      );
      this.credit = this.betResult.credit;
      // 停止滚动
      app.controller.slots.stopRolling(this.betResult);

      return;
    }

    const betAmount = calculateWithBase(amount, false);
    const payAmount = calculateWithBase(amount * (betType === BetTypes.buy ? app.config.app.BUY_FREE_SPIN_TIMES_RATIO : 1), false);

    const res = await doBet({
      gameId: app.config.app.GAME_ID,
      betType,
      betSubType,
      betDetail: {
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
      await delay(500);
      app.controller.slots.stopRolling(this.betResult);
    } else {
      this.betResult = null;
      console.log('获取投注结果失败', res);
    }
  }

  /**
   * 获取免费轮投注结果
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
      await delay(500);
      app.controller.slots.stopRolling(this.betResult);
    } else {
      this.betResult = null;
      console.log('获取投注结果失败', res);
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
   * 设置本次获得的jackpot中奖金额
   */
  setJackpotAmount(amount: number) {
    this.jackpotAmount = amount;
  }
}
