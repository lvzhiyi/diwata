import { _decorator, Label, Node } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { Roll } from './expansion/Roll';
import { calculateWithBase, delay } from 'db://assets/common/script/extra/Utils/common';
import { app } from 'db://assets/app/app';
import { PopGrandPrize } from '../../../../pop/grand-prize/native/PopGrandPrize';
import { RewardSubTypeEnum } from 'db://assets/basePlate/middleWare/enums/bet';
import { PopFreeSpinResult } from '../../../../pop/free-spin-result/native/PopFreeSpinResult';
import { SlotsController } from 'db://assets/app-builtin/app-controller/SlotsController';
import { ToastManager } from 'db://assets/res-native/script/ToastManager';
import { RewardLineBox } from './expansion/RewardLineBox';

const { ccclass, property } = _decorator;

@ccclass('PaperHomeRoll')
export class PaperHomeRoll extends BaseView.BindController(SlotsController) {
  @property({ type: Node, tooltip: 'MaskBox节点' })
  private MaskBoxNode: Node = null;

  @property({ type: Node, tooltip: 'JackpotTitle' })
  private JackpotTitleNode: Node = null;

  @property({ type: Node, tooltip: 'Freespin免费轮次数' })
  private FreespinTimesNode: Node = null;

  @property({ type: Node, tooltip: 'Tips Node' })
  private TipsNode: Node = null;

  @property({ type: Node, tooltip: 'RewardLineBox' })
  private RewardLineBox: Node = null;

  private Rolls: Node[] = [];

  // 当前回合index，默认为0，每次消除后+1
  private roundIndex: number = 0;

  // 结果数据
  private resultData: any;

  // 结果列表
  private resultList: any[] = [];

  // 总中奖金额
  private totalRewardAmount: number = 0;

  onLoad() {
    this.initRoll();

    this.initEvents();

    // app.manager.ui.show<PopWheel>({ name: 'PopWheel' });

    // app.manager.ui.show<PopJackpotRecord>({ name: 'PopJackpotRecord' });
  }

  initData() {
    this.roundIndex = 0;
    app.manager.global.setMultipleIndex(0);

    // 重置中奖线
    this.RewardLineBox.getComponent(RewardLineBox).reset();
  }

  initRoll() {
    this.MaskBoxNode.children.forEach((child: Node) => {
      const childRoll = child.getChildByName('Roll');

      if (childRoll) {
        this.Rolls.push(childRoll);
      }
    });
  }

  initEvents() {
    this.controller.on(SlotsController.Event.FreeSpinChange, this.startFreeSpinChange, this);
    this.controller.on(SlotsController.Event.StartRolling, this.startGame, this);
    this.controller.on(SlotsController.Event.StopRolling, this.stopGame, this);
    app.manager.event.on('buyFreeSpinTimes', this.buyFreeSpinTimes, this);
  }

  /**
   * 开始游戏
   */
  async startGame() {
    console.log('startGame');

    this.changeTipsContent('Good Lucky');
    
    // 初始化数据
    this.initData();

    // 开始所有滚轴旋转
    this.startAllRolls();
  }

  /**
   * 启动所有滚轴旋转
   */
  private startAllRolls() {
    this.Rolls.forEach(roll => {
      roll.getComponent(Roll).startRolling();
    });
  }

  /**
   * 停止游戏
   */
  stopGame(data: BetResult) {
    this.resultData = data;
    this.resultList = data.resultDetail.resultList;

    this.stopAllRolls();
  }

  /**
   * 逐个停止滚轴，带有延迟效果
   */
  private stopAllRolls() {
    this.Rolls.forEach((roll: Node, rollIndex: number) => {
      setTimeout(() => {
        this.stopSingleRoll(roll, rollIndex);
      }, rollIndex * 200);
    });
  }

  /**
   * 停止单个滚轴
   * @param roll 滚轴节点
   * @param index 滚轴索引
   */
  private stopSingleRoll(roll: Node, rollIndex: number) {
    // 获取当前roll的symbol列表
    const rollList = this.resultList[this.roundIndex].wheel.map((item: any) => item[rollIndex]);

    // roll滚动完成回调
    const onRollComplete = () => {
      if (this.isAllRollsStopped()) {
        this.scheduleOnce(() => {
          this.startRemoveSymbol();
        }, 0.1);
      }
    };

    roll.getComponent(Roll).stopRolling(
      rollList,
      onRollComplete
    );
  }

  /**
   * 核心消除逻辑
   * 开始本回合消除
   * 1. 获取所有滚轴的script
   * 2. 设置roundIndex
   * 3. 初始化Symbol动画数据
   * 4. 处理消除数据
   * 5. symbol变为wild
   * 6. 移除Symbol
   * 7. 添加新Symbol到顶部
   * 8. Symbol下落
   * 9. 结束本回合消除
   */
  async startRemoveSymbol() {
    const rollsScript = this.Rolls.map(roll => roll.getComponent(Roll));
    
    /**
     * 设置当前回合数据
     * -- 设置当前回合数据
     * -- 设置当前roll的数据
     * -- 设置当前回合消除数据
     */ 
    await Promise.all(rollsScript.map((roll, rollIndex) => 
      roll.setRoundData(
        this.resultList[this.roundIndex].wheel.map((item: any) => item[rollIndex]), 
        this.resultList[this.roundIndex].rewardSymbolIndexSet?.filter((item: any) => item.columnIndex === rollIndex) || []
      )
    ));

    /**
     * 初始化Symbol动画数据
     */ 
    await Promise.all(rollsScript.map(roll => roll.initSymbolAnimationData()));

    /**
     * 处理消除数据
     */
    const symbolAnimationData = await Promise.all(rollsScript.map(roll => roll.dealRemoveData()));
    console.log('初步处理消除数据', symbolAnimationData);

    /**
     * symbol变为wild
     */
    const hasSymbolChangeToWilds = await Promise.all(rollsScript.map(roll => roll.symbolChangeToWild()));

    if (hasSymbolChangeToWilds.some(item => item)) await delay(1000);

    /**
     * 如果是变超级wild，则修改除super wild外的其余symbol为下一轮的高级symbol 
     */
    if (this.isChangeToSuperWild()) {
      // 修改除super wild外的其余symbol为下一轮的高级symbol 
      await Promise.all(
        rollsScript.map((roll, rollIndex) => roll.changeOtherSymbolExceptWild(this.resultList[this.roundIndex]?.wheel.map((item: any) => item[rollIndex]) || [] ))
      );

      await delay(1000);
    }

    /**
     * 开始闪烁动画
     */
    const hasStartLightAnimations = await Promise.all(rollsScript.map(roll => roll.startLightAnimation()));

    if (hasStartLightAnimations.some(item => item)) await delay(1000);

    /**
     * 如果当前回合达到最大倍率，则结束本回合消除
     */
    if (this.currentRoundIsMaxMultiple()) { 
      this.endRemoveSymbol();

      return;
    }

    /**
     * 结束闪烁动画
     */
    await Promise.all(rollsScript.map(roll => roll.endLightAnimation()));

    /**
     * 移除Symbol
     */
    await Promise.all(rollsScript.map(roll => roll.removeSymbol()));

    /**
     * 更新tips中奖金额
     */
    const currentRoundTotalRewardAmount = this.resultList[this.roundIndex].totalRewardAmount;

    if (currentRoundTotalRewardAmount > 0) {
      this.totalRewardAmount += currentRoundTotalRewardAmount;
      this.changeTipsContent(`WIN ₱ ${calculateWithBase(this.totalRewardAmount)}`);
    }

    /**
     * 显示中奖线Toast
     */
    if (this.getRewardLine().length > 0) {
      this.RewardLineBox.getComponent(RewardLineBox).init(this.getRewardLine());
    }

    /**
     * 更新到下一个倍率
     */
    if (this.hasNextRound()) {
      this.updateNextMultiple();
    }

    /**
     * 添加新Symbol到顶部
     * -- 传入下一回合roll的数据
     */
    await Promise.all(rollsScript.map((roll, rollIndex) =>
      roll.addNewSymbolToTop(this.resultList[this.roundIndex + 1]?.wheel.map((item: any) => item[rollIndex]) || [])
    ));

    /**
     * Symbol下落
     */
    const hasFallDownSymbols = await Promise.all(rollsScript.map(roll => roll.fallDownSymbol()));

    if (hasFallDownSymbols.some(item => item)) await delay(1000);

    /**
     * 更新免费轮次数
     */
    const isUpdateFreeSpinTimes = await this.updateFreeSpinTimes();

    if (isUpdateFreeSpinTimes) {
      await delay(1000);
    }

    /**
     * 结束本回合消除
     */
    this.endRemoveSymbol();
  }

  /**
   * 结束本回合消除
   * 1. 判断是否存在下一回合，如果存在则继续消除，否则结束游戏
   * 2. 如果当前轮命中免费轮，则开始免费轮
   * 3. 如果存在免费轮，则开始免费轮游戏
   * 4. 如果当前轮命中免费轮，则开始免费轮游戏
   */
  private async endRemoveSymbol() {
    // 等待消除动画结束，添加延迟，不然消除动画结束会立马执行下一轮，偶发性会导致roll偏移
    await delay(50);

    /**
     * 判断是否存在下一回合，如果存在则继续消除，否则结束游戏
     */ 
    if (this.hasNextRound()) {
      // 更新到下一个回合
      this.updateNextRound();
    
      // 继续消除
      this.startRemoveSymbol();
    } else {
      /** 
       * 结束游戏
       */

      /**
       * 大奖弹窗
       * 免费轮的结束轮，并且当前轮达到最大倍率，不展示大奖弹窗
       */
      if (this.hasGrandPrize() && !(this.isFreeSpinEnd() && this.resultList[this.roundIndex]?.accumulateReachMaxMultiple)) {
        await this.showGrandPrize();
      }

      /**
       * 如果免费轮的结束轮，则展示免费轮总金额弹窗
       */
      if (this.isFreeSpinEnd()) {
        await this.showPopFreeSpinResult();
        // 重置免费轮数据
        app.manager.global.setGameRecordIds([]);
        app.manager.global.setGameRecordIndex(0);
        // 设置为非免费轮
        app.controller.slots.freeSpinChange(false);
      }

      /**
       * 结束游戏
       */
      await this.endGame();

      /**
       * 如果命中免费轮，则设置免费轮数据，并开始免费轮游戏
       */
      if (this.checkIsFreeRound()) {
        app.manager.global.setFreeSpinTimes(10);
        ToastManager.inst.show('FREE SPIN 10 TIMES');

        this.setFreeSpinData(true, this.resultData.totalPayoutAmount);
        this.startFreeSpinGame();

        return;
      }
  
      // 免费轮有剩余次数，开始免费轮下一轮游戏
      if (this.hasFreeSpin()) {
        // 更新免费轮索引
        app.manager.global.setGameRecordIndex(app.manager.global.gameRecordIndex + 1);
    
        this.startFreeSpinGame();

        return;
      }

      // 如果购买了免费轮次数，并且没有消耗完，则开始下一轮游戏
      if (app.manager.global.quantity > 0) {
        this.startBuyFreeSpinGame();

        return;
      }
    }
  }

  /**
   * 检查是否所有滚轴都已停止
   * @returns 是否全部停止
   */
  private isAllRollsStopped(): boolean {
    return this.Rolls.every(roll => !roll.getComponent(Roll).isRolling);
  }

  /**
   * 结束游戏
   */
  private async endGame() {
    const rollsScript = this.Rolls.map(roll => roll.getComponent(Roll));
    // 结束闪烁动画
    await Promise.all(rollsScript.map(roll => roll.endLightAnimation()));
    // 添加顶部多余符号
    await Promise.all(rollsScript.map(roll => roll.addTopExcessSymbol()));
    // 初始化数据
    await Promise.all(rollsScript.map(roll => roll.initData()));

    // 重置tips内容
    if (this.totalRewardAmount === 0) {
      this.changeTipsContent('PLACE YOUR BETS!');
    } else {
      // 重置总中奖金额
      this.totalRewardAmount = 0;
    }
    
    // 结束游戏
    app.controller.home.endGame();
  }

  /**
   * 是否存在下一回合
   * @returns 是否存在下一回合
   */
  private hasNextRound() {
    return !!this.resultList[this.roundIndex + 1];
  }

  /**
   * 检查当前轮是否命中免费轮（非免费轮中，freeWheelFlag的值为1则为命中免费轮）
   * @param roundIndex 回合数
   * @returns 检查是否命中免费轮
   */
  private checkIsFreeRound() {
    return !!this.resultList[this.roundIndex].freeWheelFlag && !this.hasFreeSpin();
  }

  /**
   * 设置免费轮数据
   */
  private setFreeSpinData(bool: boolean, freeSpinTotalAmount: number) {
    // 设置免费轮状态
    app.controller.slots.freeSpinChange(bool);
    // 设置免费轮总金额
    app.manager.global.setFreeSpinTotalAmount(freeSpinTotalAmount);
  }

  /**
   * 是否存在免费轮
   * @returns 是否存在免费轮
   */
  private hasFreeSpin() {
    return app.controller.slots.isFreeSpin && app.manager.global.gameRecordIds.length > 0 && app.manager.global.gameRecordIndex < app.manager.global.gameRecordIds.length - 1;
  }

  /**
   * 是否是免费轮的结束轮
   * @returns 是否是免费轮的结束轮
   */
  private isFreeSpinEnd() {
    return app.controller.slots.isFreeSpin && app.manager.global.gameRecordIds.length - 1 === app.manager.global.gameRecordIndex;
  }

  /**
   * 更新到下一个倍率
   */
  private updateNextMultiple() {
    if (app.manager.global.multipleIndex >= 3) return;
    app.manager.global.setMultipleIndex(app.manager.global.multipleIndex + 1);
  }

  /**
   * 更新到下一个回合
   */
  private updateNextRound() {
    this.roundIndex++;
  }

  /**
   * 判断本回合是否变超级wild
   * @returns 是否是超级wild
   */
  private isChangeToSuperWild() {
    return this.resultList[this.roundIndex]?.wheel.some((roll: any) => roll.some((item: any) => item?.symbolId === '4007'));
  }

  /**
   * 开始免费轮中的下一轮
   */
  private startFreeSpinGame() {
    // 更新免费轮次数
    this.updateFreeSpinTimesNodeString();

    app.controller.slots.betFreeSpin();
  }

  /**
   * 更新免费轮次数Node展示
   */
  private updateFreeSpinTimesNodeString() {
    const newFreeSpinNumber = app.manager.global.freeSpinTimes - app.manager.global.gameRecordIndex - 1;
    this.FreespinTimesNode.getComponent(Label).string = `FREE SPIN ${newFreeSpinNumber}`;
  }

  /**
   * 购买免费轮
   * @param betCount 投注金额
   * @param quantity 数量
   */
  buyFreeSpinTimes(betCount: number, quantity: number) {
    app.manager.global.setQuantity(quantity);
    app.manager.global.setBetCount(betCount);

    this.startBuyFreeSpinGame();
  }

  /**
   * 开始购买免费轮游戏
   */
  private startBuyFreeSpinGame() {
    app.manager.global.setQuantity(app.manager.global.quantity - 1);
    app.controller.slots.betBuyFreeSpin();
  }

  /**
   * 免费轮状态变更
   * 1. 如果免费轮状态为true，则显示免费轮次数
   * 2. 如果免费轮状态为false，则隐藏免费轮次数
   */
  private startFreeSpinChange(isFreeSpin: boolean) {
    isFreeSpin ? this.showFreeSpinTimes() : this.hideFreeSpinTimes();
  }

  /**
   * 显示免费轮Node，隐藏JackpotNode
   */
  private showFreeSpinTimes() {
    this.JackpotTitleNode.active = false;
    this.FreespinTimesNode.active = true;
  }

  /**
   * 隐藏免费轮Node，展示JackpotNode
   */
  private hideFreeSpinTimes() {
    this.JackpotTitleNode.active = true;
    this.FreespinTimesNode.active = false;
  }

  /**
   * 本轮是否中大奖
   * @returns 是否中大奖
   */
  private hasGrandPrize() {
    const { allWheelRewardSubType } = this.resultData.resultDetail;

    return allWheelRewardSubType !== RewardSubTypeEnum.NONE && allWheelRewardSubType !== RewardSubTypeEnum.OTHER;
  }

  /**
   * 展示大奖弹窗
   */
  private async showGrandPrize() {
    const { overallRewardAmount, resultDetail } = this.resultData;
    const { allWheelRewardSubType } = resultDetail;
    const { accumulateReachMaxMultiple } = this.resultList[this.roundIndex];

    // 如果当前轮命中免费轮，则不展示大奖弹窗
    if (app.controller.slots.isFreeSpin && accumulateReachMaxMultiple) {
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      app.manager.ui.show<PopGrandPrize>({
        name: 'PopGrandPrize',
        data: {
          rewardSubType: allWheelRewardSubType,
          amount: calculateWithBase(overallRewardAmount),
          accumulateReachMaxMultiple
        },
        onHide: () => resolve(),
      });
    });
  }

  /**
   * 展示免费轮总金额弹窗
   */
  private async showPopFreeSpinResult() {
    const { accumulateReachMaxMultiple } = this.resultList[this.roundIndex];
    console.log('showPopFreeSpinResult', this.resultList, this.roundIndex);

    return new Promise<void>(resolve => {
      app.manager.ui.show<PopFreeSpinResult>({
        name: 'PopFreeSpinResult',
        data: { 
          times: app.manager.global.gameRecordIndex + 1,
          amount: app.manager.global.freeSpinTotalAmount,
          accumulateReachMaxMultiple
        },
        onHide: () => resolve(),
      });
    });
  }

  /**
   * 修改Tips内容
   */
  private changeTipsContent(str: string) {
    this.TipsNode.getComponent(Label).string = str;
  } 

  /**
   * 当前回合是否达到最大倍率
   * @returns 是否达到最大倍率
   */
  private currentRoundIsMaxMultiple() {
    return this.resultList[this.roundIndex].accumulateReachMaxMultiple;
  }

  /**
   * 当前回合是否命中jackpot
   * @returns 是否命中jackpot
   */
  private checkIsJackpot() {
    return this.resultData.resultDetail.jackpotRewardGameRecordId && this.resultList[this.roundIndex].id === this.resultData.resultDetail.jackpotRewardGameRecordId;
  }

  /**
   * 获取中奖线
   * @returns 中奖线
   */
  private getRewardLine = () => {
    return this.resultList[this.roundIndex].rewardLineList ?? [];
  };

  /**
   * 更新免费轮次数
   * 如果当前是免费轮，则展示freespin增加的次数，并用toast提示
   * 如果当前是普通轮，则展示freespin次数设置为10
   */
  private updateFreeSpinTimes() {
    const gameRecordIds = this.resultList[this.roundIndex].gameRecordIds;

    if (gameRecordIds.length > 0) {
      if (app.controller.slots.isFreeSpin) {
        app.manager.global.setFreeSpinTimes(app.manager.global.freeSpinTimes + gameRecordIds.length);
        app.manager.global.setGameRecordIds([...app.manager.global.gameRecordIds, ...gameRecordIds]);
        ToastManager.inst.show('FREE SPIN + ' + gameRecordIds.length + ' TIMES');
        this.updateFreeSpinTimesNodeString();
      } else {
        app.manager.global.setFreeSpinTimes(10);
        app.manager.global.setGameRecordIds([...gameRecordIds]);
      }

      return Promise.resolve(true);
    } 

    return Promise.resolve(false);
  }

  onDestroy() {
    this.controller.off(SlotsController.Event.FreeSpinChange, this.startFreeSpinChange, this);
    this.controller.off(SlotsController.Event.StartRolling, this.startGame, this);
    this.controller.off(SlotsController.Event.StopRolling, this.stopGame, this);
    app.manager.event.off('buyFreeSpinTimes', this.buyFreeSpinTimes, this);
  }
}
