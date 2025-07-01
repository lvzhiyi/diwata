import { _decorator, Color, Label, Node, RichText, Sprite, SpriteFrame, UITransform, Vec3, Widget } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { Roll } from './expansion/Roll';
import { Symbol } from './expansion/Symbol';
import { calculateWithBase, delay } from 'db://assets/common/script/extra/Utils/common';
import { app } from 'db://assets/app/app';
import { PopGrandPrize } from '../../../../pop/grand-prize/native/PopGrandPrize';
import { BetTypes, RewardSubTypeEnum, SymbolType } from 'db://assets/basePlate/middleWare/enums/bet';
import { PopFreeSpinResult } from '../../../../pop/free-spin-result/native/PopFreeSpinResult';
import { SlotsController } from 'db://assets/app-builtin/app-controller/SlotsController';
import { RewardLineBox } from './expansion/RewardLineBox';
import { ToastManager } from 'db://assets/res-native/script/ToastManager';
import { HomeRollTool } from './expansion/HomeRollTool';
import { GameResourceManager } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';
import { preventRapidClickDecorator } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';

const { ccclass, property } = _decorator;

@ccclass('PaperHomeRoll')
export class PaperHomeRoll extends BaseView.BindController(SlotsController) {
  @property({ type: Node, tooltip: 'MaskBox节点' })
  private MaskBoxNode: Node = null;

  /// 悬浮节点用于做动画 
  @property({ type: Node, tooltip: 'overLayNode' })
  private overLayNode: Node = null;

  @property({ type: Node, tooltip: 'Freespin免费轮次数' })
  private FreespinTimesNode: Node = null;

  @property({ type: Node, tooltip: '' })
  private freespinView: Node = null;

  @property({ type: Node, tooltip: '' })
  private buyBonusView: Node = null;

  @property({ type: Node, tooltip: 'Tips Node' })
  private TipsNode: Node = null;

  private Rolls: Node[] = [];

  // 当前回合index，默认为0，每次消除后+1
  private roundIndex: number = 0;

  // 结果数据
  private resultData: any;

  // 结果列表
  private resultList: any[] = [];

  // 总中奖金额
  private totalRewardAmount: number = 0;

  // 需要执行的wild变化的数据,node：棒子的节点，type：类型，rollNode：滚轴节点，hasShow：是否展示过动画,RollIndex：滚轴索引
  private changeWildData: {node: Node, type: SymbolType, rollNode?: Node, hasShow?: boolean, rollIndex?: number}[] = [];

  // 动画管理工具类
  private homeRollTool: HomeRollTool = null;

  // 是否是免费轮
  private isFreeSpin: boolean = false;

  onLoad() {
    this.homeRollTool = new HomeRollTool();
    this.initRoll();

    this.initEvents();

    this.onResizeScreen();
  }

  /** *屏幕适配**/
  onResizeScreen() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenScale =  screenHeight / screenWidth;

    console.log('screenWidth', screenWidth, screenHeight);
  }

  initData() {
    this.roundIndex = 0;
    app.manager.global.setMultipleIndex(this.isFreeSpin ? 3 : 0);
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
   * 点击免费轮购买
   * */ 
  clickBuyBonus() {
    if (this.canClickBuyBonus()) {
      app.manager.ui.show({ name: 'PopBuybonus' });
    } 
  }

  // 防止快速点击
  @preventRapidClickDecorator(1000)
  canClickBuyBonus() {
    if (app.manager.global.isGoing || this.freespinView.active) {
      if (app.controller.slots.betType === BetTypes.buy) {
        ToastManager.inst.show('The purchased free game is in use, and this function is temporarily unavailable');
      } else {
        ToastManager.inst.show('Game Playing');
      }

      return false;
    }
  
    return true;
  }

  /**
   * 开始游戏
   */
  async startGame() {
    console.log('startGame');

    if (this.totalRewardAmount === 0) {
      this.changeTipsContent('Good Lucky');
    }
    
    // 初始化数据
    this.initData();

    // 开始所有滚轴旋转
    this.startAllRolls();
  }

  /**
   * 启动所有滚轴旋转
   */
  private startAllRolls() {
    this.Rolls.forEach((roll: Node, rollIndex: number) => {
      setTimeout(() => {
        roll.getComponent(Roll).startRolling();
      }, rollIndex * (app.manager.global.quikeMode ? 0 : 200));
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
      }, rollIndex * (app.manager.global.quikeMode ? 0 : 200));
    });
  }

  /**
   * 停止单个滚轴
   * @param roll 滚轴节点
   * @param index 滚轴索引
   */
  private stopSingleRoll(roll: Node, rollIndex: number) {
    // 获取当前roll的symbol列表
    let rollList = this.resultList[this.roundIndex].wheel.map((item: any) => item[rollIndex]);
    rollList = rollList.filter((item: any) => item !== null);

    // roll滚动完成回调局部函数回调
    const onRollComplete = () => {
      if (this.isAllRollsStopped()) {
        this.startRemoveSymbol();
      }
    };

    roll.getComponent(Roll).stopRolling(
      rollList,
      onRollComplete
    );
  }

  /**
   * 处理是否中了wild需要把其中一个元素变成先变成剑或者棒子
   */
  private async handleSwordAndStick(): Promise<boolean> {
    this.changeWildData = [];
    const rollsScript = this.Rolls.map(roll => roll.getComponent(Roll));
    const hasShowSwordNode = await Promise.all(rollsScript.map(roll => roll.showSwordSymbol()));
    const hasShowBowNode = await Promise.all(rollsScript.map(roll => roll.showBowSymbol()));
    // 把剑的节点储存到changeWildData中
    hasShowSwordNode.map((node, index) => {
      if (node) {
        this.changeWildData.push({
          node,
          type: SymbolType.SWORD,
          rollNode: this.Rolls[index],
          hasShow: false,
          rollIndex: index
        });
      }
    });
    
    let bowTempArr :Node[] = [];
    hasShowBowNode.map((nodeArr:[], index) => {
      if (nodeArr.length > 0) {
        nodeArr.map((node) => {
          this.changeWildData.push({
            node,
            type: SymbolType.BOW,
            hasShow: false,
            rollIndex: index
          });
          bowTempArr.push(node);
        });
      }
    });

    // 把棒子的节点储存到changeWildData中
    if (bowTempArr.length > 0) {
      // 随机一个节点变为棒子图标
      const randomIndex = Math.floor(Math.random() * bowTempArr.length);
      const symbolNode = bowTempArr[randomIndex];
      const symbol = symbolNode.getComponent(Symbol);
      symbol.initSymbol('4011', );
    }

    console.log('changeWildData-数据', this.changeWildData);

    return hasShowSwordNode.some(item => item !== null) || bowTempArr.length > 0;
  }

  /**
     * 使用for...of循环处理异步序列处理是否需要展示剑和棒子的动画
    */
   
  public async playSequentialAnimations(): Promise<void> {
    if (this.changeWildData.length === 0 || app.manager.global.quikeMode) return Promise.resolve();
    // 先根据rollIndex排序
    this.changeWildData.sort((a, b) => a.rollIndex - b.rollIndex);

    for (let [index, itemMap] of this.changeWildData.entries()) {
      // 元素之间添加1秒间隔（第一个除外）
      if (itemMap.hasShow) {
        continue;
      }
      // 根据类型播放不同动画
      if (itemMap.type === SymbolType.SWORD) {
        await this.homeRollTool.showSwordHaloAnimation(
          itemMap.rollNode, 
          this.overLayNode
        );
        itemMap.hasShow = true;
      } else if (itemMap.type === SymbolType.BOW) {
        await itemMap.node.getComponent(Symbol).changeToBowAnimation();
        itemMap.hasShow = true;
      }
    }
  }

  /**
   * 核心消除逻辑
   * 开始本回合消除
   * 
   * 2. 设置当前回合数据
   * 3. 初始化Symbol动画数据
   *  处理是否需要展示剑和棒子的动画
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
    // 处理是否需要展示剑和棒子
    await this.handleSwordAndStick();

    // 调用同步动画等待函数
    await this.playSequentialAnimations();

    if (this.changeWildData.length > 0) await delay(app.manager.global.quikeMode ? 500 : 1500);

    /**
     * 初始化Symbol动画数据
     */ 
    await Promise.all(rollsScript.map(roll => roll.initSymbolAnimationData()));

    /**
     * 处理消除数据
     */
    let symbolAnimationData = await Promise.all(rollsScript.map(roll => roll.dealRemoveData()));
    console.log('初步处理消除数据', symbolAnimationData);
    
    /**
     * symbol变为wild
     */
    const hasSymbolChangeToWilds = await Promise.all(rollsScript.map(roll => roll.symbolChangeToWild()));
   
    console.log('symbol变为wild-数据', hasSymbolChangeToWilds);
    if (hasSymbolChangeToWilds.some(item => item)) await delay(app.manager.global.quikeMode ? 500 : 1500);

    /**
     * 开始闪烁动画
     */
    const hasStartLightAnimations = await Promise.all(rollsScript.map(roll => roll.startLightAnimation()));

    if (hasStartLightAnimations.some(item => item)) await delay(app.manager.global.quikeMode ? 500 : 1000);

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
    console.log('开始移除Symbol-数据');
    await Promise.all(rollsScript.map(roll => roll.removeSymbol()));

    /**
     * 更新tips中奖金额
     */
    const currentRoundTotalRewardAmount = this.resultList[this.roundIndex].totalRewardAmount;

    if (currentRoundTotalRewardAmount > 0) {
      this.totalRewardAmount += currentRoundTotalRewardAmount;
      
      this.changeTipsContent(`<color=#FF50E4><b>WIN</b></color> <color=#FFFFFF>₱ ${calculateWithBase(this.totalRewardAmount)}</color>`, true);
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
    console.log('消除后的消除数据', symbolAnimationData);

    symbolAnimationData = await Promise.all(rollsScript.map((roll, rollIndex) =>
      roll.addNewSymbolToTop(this.resultList[this.roundIndex + 1]?.wheel.map((item: any) => item[rollIndex]) || [])
    ));

    /**
     * Symbol下落
     */
    const hasFallDownSymbols = await Promise.all(rollsScript.map(roll => roll.fallDownSymbol()));

    if (hasFallDownSymbols.some(item => item)) await delay(app.manager.global.quikeMode ? 500 : 1000);

    /**
     * 是否命中免费轮
     */
    const isNormalRoundHitFreeSpin = await this.normalRoundHitFreeSpin();

    if (isNormalRoundHitFreeSpin) {
      await delay(app.manager.global.quikeMode ? 500 : 1000);
    }

    this.changeWildData = [];
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
      console.log('========开启下一轮的数据========', this.roundIndex);
      // 处理当前回合是否需要展示剑和棒子的动画
      this.startRemoveSymbol();
    } else {
      /** 
       * 结束游戏
       */

      /**
       * 如果当前轮命中最大倍率，则设置tips内容
       * 免费轮总金额为 app.manager.global.freeSpinTotalAmount
       * 普通轮总金额为 this.resultData.totalPayoutAmount
       */
      if (this.currentRoundIsMaxMultiple()) {
        this.totalRewardAmount = app.controller.slots.isFreeSpin ? app.manager.global.freeSpinTotalAmount : this.resultData.totalPayoutAmount;
        this.changeTipsContent(`<color=#FF50E4><b>WIN</b></color> <color=#FFFFFF>₱ ${calculateWithBase(this.totalRewardAmount)}</color>`, true);
        await delay(50);
      }

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

      // 重置累计中奖金额
      this.resetTotalRewardAmount();

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
    // 结束游戏
    app.controller.home.endGame();
  }

  /**
   * 重置累计中奖金额
   */
  private resetTotalRewardAmount() {
    // 重置tips内容
    if (this.totalRewardAmount === 0) {
      this.changeTipsContent('PLACE YOUR BETS!');
    } else {
      // 重置总中奖金额
      this.totalRewardAmount = 0;
    }
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
    if (app.manager.global.multipleIndex >= 10) return;
    app.manager.global.setMultipleIndex(app.manager.global.multipleIndex + 1);
  }

  /**
   * 更新到下一个回合
   */
  private updateNextRound() {
    this.roundIndex++;
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
    this.FreespinTimesNode.getComponent(Label).string = `${newFreeSpinNumber}`;
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
    this.isFreeSpin = isFreeSpin;
    isFreeSpin ? this.showFreeSpinTimes() : this.hideFreeSpinTimes();
  }

  /**
   * 显示免费轮Node，
   */
  private showFreeSpinTimes() {
    this.FreespinTimesNode.active = true;
    this.freespinView.active = true;
    this.buyBonusView.active = false;
  }

  /**
   * 隐藏免费轮Node，
   */
  private hideFreeSpinTimes() {
    this.FreespinTimesNode.active = false;
    this.freespinView.active = false;
    this.buyBonusView.active = true;
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
  private changeTipsContent(str: string, needRichText: boolean = false) {
    if(needRichText){
      this.TipsNode.getComponent(RichText).string = str;
    }else{
      this.TipsNode.getComponent(RichText).string = `<color=#FFFFFF>${str}</color>`;
    }
  } 

  /**
   * 当前回合是否达到最大倍率
   * @returns 是否达到最大倍率
   */
  private currentRoundIsMaxMultiple() {
    return this.resultList[this.roundIndex].accumulateReachMaxMultiple;
  }

  /**
   * 获取中奖线
   * @returns 中奖线
   */
  private getRewardLine = () => {
    return this.resultList[this.roundIndex].rewardLineList ?? [];
  };

  /**
   * 普通轮中，本回合是否命中免费轮
   */
  private normalRoundHitFreeSpin() {
    const gameRecordIds = this.resultList[this.roundIndex].gameRecordIds;

    // 如果当前不是免费轮，并且本回合有免费轮游戏ids，则命中免费轮
    if (!app.controller.slots.isFreeSpin && gameRecordIds.length > 0) {
      app.manager.global.setFreeSpinTimes(10);
      app.manager.global.setGameRecordIds([...gameRecordIds]);

      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  }

  /**
   * 免费轮中，是否命中scatter增加次数
   * scatterAddTimes和gameRecordIds正常情况下是相等的，如果免费轮中提前达到最大金额，则命中scatter+1时，gameRecordIds会返回空，
   * 所以不能用gameRecordIds的长度来判断是否命中scatter增加次数
   */
  private async freeRoundIsHitScatterAddTimes(symbolAnimationDatas: ISymbolAnimationData[][]) {
    const scatterAddTimes = await this.freeSpinScatterAddTimes(symbolAnimationDatas);

    const gameRecordIds = this.resultList[this.roundIndex].gameRecordIds;

    // 如果当前不是免费轮，或者scatter增加次数小于等于0，则不命中scatter增加次数
    if (!app.controller.slots.isFreeSpin || scatterAddTimes <= 0) {
      return Promise.resolve(false);
    }

    app.manager.global.setFreeSpinTimes(app.manager.global.freeSpinTimes + scatterAddTimes);
    app.manager.global.setGameRecordIds([...app.manager.global.gameRecordIds, ...gameRecordIds]);

    // 获取freeSpinTimes节点位置
    const targetPosition = this.FreespinTimesNode.getWorldPosition().clone();
    const rollsScript = this.Rolls.map(roll => roll.getComponent(Roll));
    // 播放scatter增加次数动画
    await Promise.all(rollsScript.map(roll => roll.playScatterAddTimeAnimation(targetPosition)));
      
    // 更新免费轮次数Node展示
    this.updateFreeSpinTimesNodeString();

    return Promise.resolve(true);
  }

  /**
   * 免费轮中，计算scatter增加次数
   * @param symbolAnimationDatas 
   * @returns 
   */
  private freeSpinScatterAddTimes(symbolAnimationDatas: ISymbolAnimationData[][]): number {
    let count = 0;
    
    for (const innerArray of symbolAnimationDatas) {
      for (const item of innerArray) {
        if (item.symbolId === '3002' && !item.isPlayScatterAddTimeAnimation) {
          count++;
        }
      }
    }
    
    return count;
  }

  onDestroy() {
    this.controller.off(SlotsController.Event.FreeSpinChange, this.startFreeSpinChange, this);
    this.controller.off(SlotsController.Event.StartRolling, this.startGame, this);
    this.controller.off(SlotsController.Event.StopRolling, this.stopGame, this);
    app.manager.event.off('buyFreeSpinTimes', this.buyFreeSpinTimes, this);
  }
}
