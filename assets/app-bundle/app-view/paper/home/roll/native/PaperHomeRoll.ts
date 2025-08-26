import { _decorator, EventTouch, Label, Node, Prefab, sp,  tween, UITransform } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { Roll } from './expansion/Roll';
import { Symbol } from './expansion/Symbol';
import { calculateWithBase, delay, numberToMoney } from 'db://assets/common/script/extra/Utils/common';
import { app } from 'db://assets/app/app';
import { PopGrandPrize } from '../../../../pop/grand-prize/native/PopGrandPrize';
import { BetTypes, RewardSubTypeEnum, SymbolType } from 'db://assets/basePlate/middleWare/enums/bet';
import { PopFreeSpinResult } from '../../../../pop/free-spin-result/native/PopFreeSpinResult';
import { SlotsController } from 'db://assets/app-builtin/app-controller/SlotsController';
import { ToastManager } from 'db://assets/res-native/script/ToastManager';
import { ChangeWildData, HomeRollTool } from './expansion/HomeRollTool';
import { GameResourceManager, ROLL_RESOURCE_NAMES } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';
import { preventRapidClickDecorator } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';
import { AdvancedButtonBreath } from 'db://assets/basePlate/middleWare/animations/AdvancedButtonBreath';
import EventTrackManager from 'db://assets/basePlate/middleWare/serverManager/EventTrackManager';
import { CurrentRoundAmount } from './expansion/CurrentRoundAmount';
import { GlobalActivity } from 'db://assets/common/script/extra/GlobalMgr';
import { BousView } from './expansion/BousView';
import { ErrorType } from 'db://assets/common/script/extra/https/Constant';

const { ccclass, property } = _decorator;

@ccclass('PaperHomeRoll')
export class PaperHomeRoll extends BaseView.BindController(SlotsController) {
  @property({ type: Node, tooltip: '女神节点' })
  private goddessNode: Node = null;

  @property({ type: Node, tooltip: '女神动画节点' })
  private goddessAnimationNode: Node = null;

  @property({ type: Node, tooltip: 'MaskBox节点' })
  private MaskBoxNode: Node = null;

  @property({ type: Node, tooltip: 'rollBgView节点' })
  private rollBgViewNode: Node = null;

  /// 悬浮节点用于做动画 
  @property({ type: Node, tooltip: 'overLayNode' })
  private overLayNode: Node = null;

  @property({ type: Node, tooltip: 'FreeBonusSpin次数' })
  private FreeBonusSpinTimesNode: Node = null;

  @property({ type: Node, tooltip: '' })
  private freeTimesView: Node = null;

  @property({ type: Node, tooltip: '' })
  private BonusView: Node = null;

  @property({ type: Node, tooltip: '' })
  private freeSpinView: Node = null;

  @property({ type: Node, tooltip: 'Tips Node' })
  private TipsNode: Node = null;

  @property(Prefab)
  private lightPrefab: Prefab = null;

  @property({ type: sp.Skeleton, tooltip: 'SpineWinSkeleton' })
  private SpineWinSkeleton: sp.Skeleton = null;

  @property({ type: Node, tooltip: 'CurrentRoundAmount' })
  private CurrentRoundAmount: Node = null;

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
  private changeWildData: ChangeWildData[] = [];

  // 动画管理工具类
  private homeRollTool: HomeRollTool = null;

  // 是否是免费轮
  private isFreeBonusSpin: boolean = false;

  // 需要播放roll滚动动画的rollIndex
  private needPlayRollsFrameSpine: boolean[] = [false, false, false, false, false, false];

  // 滚轴边框动画
  private rollFrameSkeleton: sp.Skeleton = null;

  onLoad() {
    this.homeRollTool = new HomeRollTool();
    this.initRoll();

    this.initEvents();

    this.initRollFrameSpine();
  }

  /**
   * 初始化rollFrameSpine
   */
  async initRollFrameSpine() {
    const rollFrameNode = new Node();
    rollFrameNode.layer = this.node.layer;
    rollFrameNode.active = false;
    rollFrameNode.addComponent(UITransform);
    rollFrameNode.getComponent(UITransform).setContentSize(100, 400);
    rollFrameNode.setParent(this.node.parent.parent);

    this.rollFrameSkeleton = rollFrameNode.addComponent(sp.Skeleton);
    this.rollFrameSkeleton.premultipliedAlpha = false;
    this.rollFrameSkeleton.skeletonData = await GameResourceManager.instance.getRollSpineAnimationDataByName(ROLL_RESOURCE_NAMES.LAMANG_RUN);
  }

  /** *监听freespin按钮状态**/
  onFreeBonusSpinButtonState(enabled: boolean) {
    if (enabled && app.manager.global.isBuyFreeBonusMode) {
      this.showFreeSpinView(true);
    } else {
      this.showFreeSpinView(false);
    }
  }

  initData() {
    this.roundIndex = 0;
    app.manager.global.setMultipleIndex(app.controller.slots.isFreeBonusSpin ? 3 : 0);
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
    this.controller.on(SlotsController.Event.FreeBonusSpinChange, this.startFreeSpinChange, this);
    this.controller.on(SlotsController.Event.StartRolling, this.startGame, this);
    this.controller.on(SlotsController.Event.StopRolling, this.stopGame, this);
    app.manager.event.on('buyFreeSpinTimes', this.buyFreeSpinTimes, this);
    // 盘面添加点击事件
    this.rollBgViewNode.on(Node.EventType.TOUCH_END, this.rollClick, this);
  }

  /**
   * 点击免费轮购买或者展示freeSpin
   * */ 
  clickBuyBonus() {
    console.log('点击免费轮购买或者展示freeSpin', this.freeSpinView.active);

    if(this.freeSpinView.active) {
      GlobalActivity.openFreeSpin(); 
    } else {
      if (this.canClickBuyBonus()) {
        EventTrackManager.inst.trackBuyBonusOpen(app.manager.global.creditCount);
        app.manager.ui.show({ name: 'PopBuybonus' });
      }
    }
  }

  /**
   /**
   * 盘面点击roll
   */
  rollClick(e: EventTouch) {
    // 处理点击事件的逻辑
    const isIn = HomeRollTool.isCheckAreaSuccess(this.rollBgViewNode, e);

    if (isIn) {
      if (!app.manager.global.isClickRollTips) {
        // 展示提示弹框
        this.showFirstClickRollTipsDialog();
      } else {
        app.controller.home.gameStartClick();
      }
    }
  }

  /** 显示首次点击的踢死弹窗 */
  private showFirstClickRollTipsDialog() {
    app.manager.ui.show({
      name: 'PopErrorPop',
      data: {
        msg: 'Click the board for\n SPIN/STOP.\nPress "Confirm" to spin.',
        type: ErrorType.NormalTips,
        showCancel: false,
        confirmCallback: () => {
          console.log('点击确认');
          app.manager.ui.hide({ name: 'PopErrorPop', onHide: () => { } });
          app.controller.home.gameStartClick();
          app.manager.global.setIsClickRollTips(true);
        },
      },
      onShow: () => { },
    });
  }

  // 防止快速点击
  @preventRapidClickDecorator(1000)
  canClickBuyBonus() {
    if (app.manager.global.isGoing || this.freeTimesView.active) {
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
    this.rollBgViewNode.off(Node.EventType.TOUCH_END, this.rollClick, this);

    if (this.totalRewardAmount === 0) {
      this.changeTipsContent(null, null);
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
      }, rollIndex * (app.manager.global.quikeMode ? 0 : 100));
    });
  }

  /**
   * 停止游戏
   */
  stopGame(data: BetResult) {
    this.resultData = data;

    if(data) {
      this.resultList = data.resultDetail.resultList;
    }

    this.stopAllRolls();
  }

  /**
   * 逐个停止滚轴，带有延迟效果
   */
  private async stopAllRolls() {
    // 同步停止的滚轴
    const syncStopRolls = [];
    // 异步停止的滚轴
    const asyncStopRolls = [];

    // 判断当前轮次是否存在两个scatter
    this.currentNormalRoundHasMoreThanOneScatter();

    for (const [rollIndex, roll] of this.Rolls.entries()) {
      const needPlayRollFrameSpine = this.needPlayRollsFrameSpine[rollIndex];

      if (app.manager.global.quikeMode && !needPlayRollFrameSpine) {
        // 快速模式 并且 没有滚轮边框动画，直接同步停止滚轴
        syncStopRolls.push(async () => this.stopSingleRoll(roll, rollIndex, needPlayRollFrameSpine));
      } else {
        // 非快速模式 或者 快速模式并且有滚轮边框动画，则需要播放滚轮边框动画
        asyncStopRolls.push(async () => this.stopSingleRoll(roll, rollIndex, needPlayRollFrameSpine));
      }
    }

    // 同步停止的滚轴
    if (syncStopRolls.length > 0) {
      await Promise.all(syncStopRolls.map(syncStopRoll => syncStopRoll()));
    }

    // 异步停止的滚轴
    if (asyncStopRolls.length > 0) {
      for (const [index, asyncStopRoll] of asyncStopRolls.entries()) {
        if (app.manager.global.isClickScreen) {
          // 如果点击屏幕则马上停止
          // 当有边框动画时，边框动画的Roll异步停止，其他同步停止
          const realIndex = syncStopRolls.length + index;
          const needPlayRollFrameSpine = this.needPlayRollsFrameSpine[realIndex];

          if (needPlayRollFrameSpine) {
            await asyncStopRoll();
          } else {
            asyncStopRoll();
          }
        } else {
          await asyncStopRoll();
        }
      }
    }
  } 

  /**
   * 停止单个滚轴
   * @param roll 滚轴节点
   * @param rollIndex 滚轴索引
   * @param needPlayRollFrameSpine 是否需要播放rollFrameSpine动画
   */
  private async stopSingleRoll(roll: Node, rollIndex: number, needPlayRollFrameSpine: boolean) {
    return new Promise(async (resolve) => {
      // 获取当前roll的symbol列表
      const rollList = this.resultList[this.roundIndex].wheel.map((item: any) => item[rollIndex]);

      // roll滚动完成回调
      const onRollComplete = () => {
        resolve(true);

        if (this.isAllRollsStopped()) {
          // 如果rollFrameSpine动画播放中，则停止
          if (this.rollFrameSkeleton.node.active) {
            this.rollFrameSkeleton.node.active = false;
            this.rollFrameSkeleton.clearAnimation();
          }

          this.scheduleOnce(() => {
            this.startRemoveSymbol();
          }, 0.1);
        }
      };

      // 如果需要播放rollFrameSpine动画，则播放
      if (needPlayRollFrameSpine) {
        await roll.getComponent(Roll).showRollFrameSpine(this.rollFrameSkeleton);
      }

      // 停止滚轴
      roll.getComponent(Roll).stopRolling(
        rollList,
        onRollComplete
      );
    });
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
    // 把棒子的节点储存到changeWildData中
    hasShowBowNode.map((nodeArr: Node[], index) => {
      if (nodeArr.length > 0) {
        nodeArr.map((node) => {
          const isMainBow = node.getComponent(Symbol).currentSymbolItem.main === true;
          this.changeWildData.push({
            node,
            type: isMainBow ? SymbolType.MAIN_BOW : SymbolType.BOW,
            hasShow: false,
            rollIndex: index
          });
        });
      }
    });

    console.log('changeWildData-数据', this.changeWildData);

    return hasShowSwordNode.some(item => item !== null) || hasShowBowNode.some(item => item !== null);
  }

  /**
   * 同时执行棒子和剑光球飞向女神的效果
  */
  private async playBowAndSwordFlyingAnimation() {
    if (this.changeWildData.length === 0 || app.manager.global.quikeMode) return Promise.resolve();
    // 先根据rollIndex排序
    this.changeWildData.sort((a, b) => a.rollIndex - b.rollIndex);
    const newChangeWildData = this.changeWildData.filter((itemMap) => {
      return itemMap.type === SymbolType.SWORD || itemMap.type === SymbolType.MAIN_BOW;
    });
    if (newChangeWildData.length === 0) return Promise.resolve();
    await this.homeRollTool.showFlyingToGoddessAnimation(
      newChangeWildData,
      this.overLayNode,
      this.goddessAnimationNode,
      this.lightPrefab,
      this.goddessNode
    );
  }

  /**
     * 使用for...of循环处理异步序列处理是否需要展示剑和棒子打击动画
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
          this.overLayNode,
        );
        itemMap.hasShow = true;
      } else if (itemMap.type === SymbolType.BOW) {
        await this.homeRollTool.showBowHitAnimation(
          itemMap.node,
          this.overLayNode,
        );
        itemMap.hasShow = true;
      }
    }
  }

  /**
   * ！！！！！核心消除逻辑！！！！！
   * 开始本回合消除
   * 1. 设置当前回合数据
   * 2. 初始化Symbol动画数据
   * 3. 处理消除数据
   * 4. 命中scatter，则播放scatter击中宝箱动效
   * 6. 如果命中scatter，则播放scatter击中宝箱动效
   * 7. symbol变为wild 
   * 9. 开始闪烁动画
   * 10. 结束闪烁动画
   * 11. 移除Symbol
   * 12. 更新tips中奖金额
   * 13. 显示中奖线Toast
   * 14. 更新到下一个倍率
   * 15. 添加新Symbol到顶部
   * 16. Symbol下落
   * 17. 结束本回合消除
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
    // 同时执行棒子和剑光球飞向女神的效果
    await this.playBowAndSwordFlyingAnimation();

    // 调用同步动画依次执行等待函数
    await this.playSequentialAnimations();

    if (this.changeWildData.length > 0) await delay(app.manager.global.quikeMode ? 500 : 1500);

    /**
     * 初始化Symbol动画数据
     */ 
    await Promise.all(rollsScript.map(roll => roll.initSymbolAnimationData()));

    /**
     * 处理消除数据
     */
    await Promise.all(rollsScript.map(roll => roll.dealRemoveData()));
    let symbolAnimationData = rollsScript.map(roll => roll.symbolAnimationData);
    console.log('初步处理消除数据', symbolAnimationData);
    console.table(symbolAnimationData[2].map((_, index) => symbolAnimationData.map((item: any) => item[index]?.symbolId || '')));
    
    /**
     * symbol变为wild,先清空overlayNode上面的发光节点
     */
    this.homeRollTool.destoryOverlayNodeLight(this.overLayNode);
    const hasSymbolChangeToWilds = await Promise.all(rollsScript.map(roll => roll.symbolChangeToWild()));
   
    console.log('symbol变为wild-数据', hasSymbolChangeToWilds);
    if (hasSymbolChangeToWilds.some(item => item)) await delay(app.manager.global.quikeMode ? 500 : 1500);
   
    /**
     * 如果当前回合达到最大倍率，则结束本回合消除
     */
    if (this.currentRoundIsMaxMultiple()) { 
      this.endRemoveSymbol();

      return;
    }

    /**
     * 开始执行闪烁和消除动画
     */
    console.log('开始执行闪烁-数据');
    await Promise.all(rollsScript.map(roll => roll.startLightAnimation())); 
    console.log('结束闪烁和消除动画-数据');
    const endLightAnimationData = await Promise.all(rollsScript.map(roll => roll.endLightAnimation())); 
    if (endLightAnimationData.some(item => item)) await delay(500);
    console.log('endLightAnimationData-数据', endLightAnimationData);
   
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
      this.changeTipsContent(this.totalRewardAmount, this.totalRewardAmount + currentRoundTotalRewardAmount);
      this.totalRewardAmount += currentRoundTotalRewardAmount;
      // this.changeTipsContent(`<color=#FF50E4><b>WIN</b></color> <color=#FFFFFF>₱ ${calculateWithBase(this.totalRewardAmount)}</color>`, true);
    }
  
    /**
     * 更新到下一个轮的倍率
     */
    if (this.hasNextRound()) {
      this.updateNextMultiple();
    }
    
    /**
     * 添加到顶部然后下落 或者 播放Roll边框动画然后落下然后添加到顶部最后下落
     */
    await this.addToTopThenFallDowmOrRunRollFrameAnimationThenFallDownThenAddToTopThenFallDown(rollsScript, symbolAnimationData);

    symbolAnimationData = rollsScript.map(roll => roll.symbolAnimationData);
    console.log('下落后数据', symbolAnimationData);
    console.table(symbolAnimationData[2].map((_, index) => symbolAnimationData.map((item: any) => item[index]?.symbolId || '')));

    if (this.needPlayRollsFrameSpine.some(item => item)) {  
      await delay(1000 / app.manager.global.gameSpeed);
    }

    /**
     * 是否命中免费轮
     */
    const isNormalRoundHitFreeSpin = await this.normalRoundHitFreeSpin();

    // 开始免费轮动画
    if (isNormalRoundHitFreeSpin) {
      await this.startHitFreeSpinScatterAnimation(symbolAnimationData);
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
        this.totalRewardAmount = app.controller.slots.isFreeBonusSpin ? app.manager.global.freeBonusTotalAmount : this.resultData.totalPayoutAmount;
        // this.changeTipsContent(`<color=#FF50E4><b>WIN</b></color> <color=#FFFFFF>₱ ${calculateWithBase(this.totalRewardAmount)}</color>`, true);
        await delay(50);
      }

      /**
       * 大奖弹窗
       * 免费轮的结束轮，并且当前轮达到最大倍率，不展示大奖弹窗
       */
      if (this.hasGrandPrize() && !(this.isFreeBonusEnd() && this.resultList[this.roundIndex]?.accumulateReachMaxMultiple)) {
        await this.showGrandPrize();
      }

      /**
       * 如果免费轮的结束轮，则展示免费轮总金额弹窗
       */
      if (this.isFreeBonusEnd()) { 
        await this.showPopFreeSpinResult();
        // 重置免费轮数据
        app.manager.global.setGameRecordIds([]);
        app.manager.global.setGameRecordIndex(0);
        // 设置为非免费轮
        app.controller.slots.freeBonusSpinChange(false);
      } 

      /**
       * 结束游戏
       */
      await this.endGame();

      /**
       * 如果命中免费轮，则设置免费轮数据，并开始免费轮游戏
       */
      if (this.checkIsFreeRound()) {
        const gameRecordIds = this.resultList[this.roundIndex].gameRecordIds;
        app.manager.global.setFreeBonusTimes(gameRecordIds.length);
        app.manager.global.setGameRecordIds([...gameRecordIds]);
        // ToastManager.inst.show(`FREE SPIN ${gameRecordIds.length} TIMES`);

        await this.setFreeBonusData(this.resultData.totalPayoutAmount);
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

    // 监听RollContianer点击事件
    this.rollBgViewNode.on(Node.EventType.TOUCH_END, this.rollClick, this);
    app.manager.event.emit('roll:reward', 'end');
    console.log('结束游戏');
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
    
    app.manager.global.setMultipleIndex(app.controller.slots.isFreeBonusSpin ? 3 : 0);
    // 结束游戏
    app.controller.home.endGame();
  }

  /**
   * 添加到顶部然后下落 或者 播放Roll边框停牌动画然后落下然后添加到顶部最后下落
   */
  private async addToTopThenFallDowmOrRunRollFrameAnimationThenFallDownThenAddToTopThenFallDown(rollsScript: Roll[], symbolAnimationData: ISymbolAnimationData[][]) {
    /**
     * 处理this.needPlayRollsFrameSpine哪些roll需要播放滚轮动画的数据
     */
    this.currentNormalRoundHasMoreThanOneScatter();
    this.needPlayRollsFrameSpine = this.needPlayRollsFrameSpine.map((needPlayRollsFrameSpine, index) => {
      return !!(needPlayRollsFrameSpine && symbolAnimationData[index].find(item => item.isNeedRemove));
    });

    /**
     * 处理仅下落的Roll和播放Roll边框动画后再下落的Roll的数据
     * fallDownScript： 仅下落的Roll
     * rollFrameAnimationScript： 播放Roll边框动画后再下落的Roll
     */
    const fallDownScript: Roll[] = [];
    const rollFrameAnimationScript: Roll[] = [];
    rollsScript.forEach((script, index) => {
      if (this.needPlayRollsFrameSpine[index] === false) {
        fallDownScript.push(script);
      } else {
        rollFrameAnimationScript.push(script);
      }
    });

    const nextRoundList = this.resultList[this.roundIndex + 1];

    /**
     * 添加仅下落roll上的新Symbol到顶部
     * -- 传入下一回合roll的数据
     */
    if (fallDownScript.length > 0) {
      await Promise.all(fallDownScript.map((roll) =>
        roll.addNewSymbolToTop(nextRoundList?.wheel.map((item: any) => item[roll.getCurrentIndex()]) || [])
      ));
    }

    /**
     * 仅Symbol下落
     */
    await Promise.all([...fallDownScript.map(roll => roll.fallDownSymbol()), ...rollFrameAnimationScript.map(roll => roll.fallDownSymbol())]);

    /**
     * Roll边框动画 之后 再Symbol下落
     */
    if (rollFrameAnimationScript.length > 0) {
      for (const roll of rollFrameAnimationScript) {
        await roll.showRollFrameSpine(this.rollFrameSkeleton);
        /**
       * 添加Roll边框动画后下落，然后再添加到顶部下落
       * -- 传入下一回合roll的数据
       */

        await roll.addNewSymbolToTop(nextRoundList?.wheel.map((item: any) => item[roll.getCurrentIndex()]) || []);
        await roll.fallDownSymbol();
  
        if (this.rollFrameSkeleton.node.active) {
          this.rollFrameSkeleton.node.active = false;
          this.rollFrameSkeleton.clearAnimation();
        }
      }
    }
  }

  /**
   * 当前回合是否命中超过1个scatter
   * @returns 当前回合是否命中超过1个scatter 
   */
  private currentNormalRoundHasMoreThanOneScatter() {
    this.needPlayRollsFrameSpine.fill(false);
    
    const wheel = this.resultList[this.roundIndex].wheel;
    let scatterCount = 0;
    let secondScatterIndex = -1;

    const analyzeWheel = wheel[0].map((_: any, colIndex: number) => wheel.map((row: any) => row[colIndex]));

    analyzeWheel.forEach((item: any, index: number) => {
      if (item.find((item: any) => item?.symbolId === '3001')) {
        scatterCount++;

        if (scatterCount === 2) {
          secondScatterIndex = index;
        }
      }
    });

    // 找到第 2 个 scatter，并且不是最后一个roll中
    const hasMoreThanOneScatter = secondScatterIndex !== -1 && secondScatterIndex < this.needPlayRollsFrameSpine.length - 1;

    if (hasMoreThanOneScatter) {
      for (let i = secondScatterIndex + 1; i < this.needPlayRollsFrameSpine.length; i++) {
        this.needPlayRollsFrameSpine[i] = true;
      }
    }

    return !app.controller.slots.isFreeBonusSpin && hasMoreThanOneScatter;
  }

  /**
   * 普通轮中命中免费轮，播放3个命中免费轮的scatter的动效
   */
  private async startHitFreeSpinScatterAnimation(symbolAnimationDatas: ISymbolAnimationData[][]) {
    return new Promise<boolean>(async resolve => {
      const scatterAnimationFunctions: Promise<void>[] = [];

      symbolAnimationDatas.forEach(item => {
        item.forEach(item => {
          const symbol = item.symbolNode.getComponent(Symbol);

          if (item.symbolId === '3001') {
            scatterAnimationFunctions.push(new Promise(async resolve => {
              await symbol.startScatterActionAnimation(ROLL_RESOURCE_NAMES.LAMANG_ICON_SCATTER);
              resolve();
            }));
          }
        });
      });

      if (scatterAnimationFunctions.length > 0) {
        await Promise.all(scatterAnimationFunctions);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  /**
   * 重置累计中奖金额
   */
  private resetTotalRewardAmount() {
    // 重置tips内容
    if (this.totalRewardAmount === 0) {
      this.changeTipsContent(0, 0);
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
   * 设置免费轮数据,播放免费轮转场动画
   */
  private setFreeBonusData(freeBonusTotalAmount: number):Promise<void> {
    return new Promise<void>(resolve => {
    // 设置免费轮状态
      app.controller.slots.freeBonusSpinChange(true);
      app.manager.event.emit('begainfreeBonusAnimation', () => {
        console.log('转场动画执行完成');
        app.manager.event.emit('roll:reward', 'end');
        resolve();
      });
      // 设置免费轮总金额
      app.manager.global.setFreeBonusTotalAmount(freeBonusTotalAmount);
    });
  }

  /**
   * 是否存在免费轮
   * @returns 是否存在免费轮
   */
  private hasFreeSpin() {
    return app.controller.slots.isFreeBonusSpin && app.manager.global.gameRecordIds.length > 0 && app.manager.global.gameRecordIndex < app.manager.global.gameRecordIds.length - 1;
  }

  /**
   * 是否是免费轮的结束轮
   * @returns 是否是免费轮的结束轮
   */
  private isFreeBonusEnd() {
    return app.controller.slots.isFreeBonusSpin && app.manager.global.gameRecordIds.length - 1 === app.manager.global.gameRecordIndex;
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
    const newFreeSpinNumber = app.manager.global.freeBonusTimes - app.manager.global.gameRecordIndex - 1;
    this.FreeBonusSpinTimesNode.getComponent(Label).string = `${newFreeSpinNumber}`;
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
  private startFreeSpinChange(isFreeBonusSpin: boolean) {
    this.isFreeBonusSpin = isFreeBonusSpin;
    console.log('startFreeSpinChange', isFreeBonusSpin);
    isFreeBonusSpin ? this.showFreeSpinTimes() : this.hideFreeSpinTimes();
  }

  /**
   * 显示免费轮剩余次数Node，
   */
  private showFreeSpinTimes() {
    if (this.BonusView.isValid) {
      this.BonusView.getComponent(BousView).updateBuyBonusStatus(3);
    }

    this.BonusView.getComponent(AdvancedButtonBreath).pauseBreath();
  }

  /**
   * 隐藏免费轮Node，
   */
  private hideFreeSpinTimes() {
    this.BonusView.getComponent(AdvancedButtonBreath).startBreath();

    if(app.manager.global.isBuyFreeBonusMode) {
      this.showFreeSpinView(true);
    } else {
      this.showFreeSpinView(false);
    }
  }

  /**
   * 是否显示成就FreeSpin按钮
  */
  showFreeSpinView(show: boolean) {
    if (this.BonusView.isValid) {
      this.BonusView.getComponent(BousView).updateBuyBonusStatus(show ? 2 : 1);
    }
  }

  /**
   * 本轮是否中大奖
   * @returns 是否中大奖
   */
  private hasGrandPrize() {
    if (!this.resultData) {
      return false;
    }

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
    if (app.controller.slots.isFreeBonusSpin && accumulateReachMaxMultiple) {
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
          amount: app.manager.global.freeBonusTotalAmount,
          accumulateReachMaxMultiple
        },
        onHide: () => resolve(),
      });
    });
  }

  /**
   * 修改Tips内容
   */
  private async changeTipsContent(startNum: number, endNum: number) {
    if (endNum === null) {
      this.TipsNode.getComponent(Label).string = 'GOOD LUCKY';
    } else if (endNum === 0) {
      this.TipsNode.getComponent(Label).string = 'PLACE YOUR BETS!';
    } else {
      const amount = calculateWithBase(endNum - startNum);

      // 展示当前轮次金额弹出提示
      await this.showCurrentRoundAmount(amount);

      // 播放金额动画，如果金额变化小于2倍投注金额，则播放action1，否则播放action2
      this.SpineWinSkeleton.setAnimation(0, amount < 2 * app.manager.global.betCount ? 'action1' : 'action2', false);
      // 金额滚动效果
      const target = { value: startNum };
      const label = this.TipsNode.getComponent(Label);
      tween(target).to(
        2 / app.manager.global.gameSpeed,
        { value: endNum },
        { onUpdate: () => label.string = `WIN ₱ ${numberToMoney(calculateWithBase(target.value), 3, false)}` }
      ).start();
    }
  } 

  /**
   * 展示当前轮次金额弹出提示
   * @param amount 金额
   */
  private async showCurrentRoundAmount(amount: number) {
    await this.CurrentRoundAmount.getComponent(CurrentRoundAmount).showAmount(amount);
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
    if (!app.controller.slots.isFreeBonusSpin && gameRecordIds.length > 0) {
      app.manager.global.setFreeBonusTimes(gameRecordIds.length);
      app.manager.global.setGameRecordIds([...gameRecordIds]);

      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  }

  onDestroy() {
    this.controller.off(SlotsController.Event.FreeBonusSpinChange, this.startFreeSpinChange, this);
    this.controller.off(SlotsController.Event.StartRolling, this.startGame, this);
    this.controller.off(SlotsController.Event.StopRolling, this.stopGame, this);
    app.manager.event.off('buyFreeSpinTimes', this.buyFreeSpinTimes, this);
  }
}
