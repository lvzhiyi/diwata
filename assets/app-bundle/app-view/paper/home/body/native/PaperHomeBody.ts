import {
  _decorator,
  Button,
  EventTouch,
  Label,
  Node,

  sp,
  Sprite,
  SpriteFrame,

  tween,

  UIOpacity,

  Vec3,
} from 'cc';
import BaseView from '../../../../../../../extensions/app/assets/base/BaseView';
import { app } from '../../../../../../app/app';
import { HomeController } from '../../../../../../app-builtin/app-controller/HomeController';
import { PopSettings } from '../../../../pop/settings/native/PopSettings';
import { calculateWithBase, getIsGap, getP, numberToMoney } from 'db://assets/common/script/extra/Utils/common';
import { HomeBodyUtil } from './expansion/HomeBodyUtil';
import CpPostMessage from 'db://assets/common/script/extra/tmBridge/cpPostMessage';
import {  preventRapidClickDecorator, showInsufficientCreditAlert } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';
import { ToastManager } from 'db://assets/res-native/script/ToastManager';
import { BetTypes } from 'db://assets/basePlate/middleWare/enums/bet';
import { GameResourceManager } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';
import EventTrackManager from 'db://assets/basePlate/middleWare/serverManager/EventTrackManager';
import { ErrorType } from 'db://assets/common/script/extra/https/Constant';
import { IQuickMode } from 'db://assets/app-builtin/app-manager/global/GlobalManager';
import globalSpeedCtrl from 'db://assets/common/script/extra/GlobalSpeedCtrl';
import { PopGrandPrize } from '../../../../pop/grand-prize/native/PopGrandPrize';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';
import { BGMManager } from 'db://assets/basePlate/middleWare/serverManager/BGMManager';
import { BalanceString, BetString } from 'db://assets/common/script/extra/Utils/PlatformConfig';

const { ccclass, property } = _decorator;

@ccclass('PaperHomeBody')
export class PaperHomeBody extends BaseView.BindController(HomeController) {
  /** 顶部视图节点 */
  @property({ type: Node, tooltip: '顶部视图' })
  private topView: Node = null;

  @property({ type: SpriteFrame, tooltip: '自动按钮-on' })
  private autoBtnOnSprite: SpriteFrame = null;

  @property({ type: SpriteFrame, tooltip: '自动按钮-off' })
  private autoBtnOffSprite: SpriteFrame = null;

  @property({ type: Node, tooltip: '自动模式按钮' })
  private autoModeBtn: Node = null;

  @property({ type: Node, tooltip: '开始按钮' })
  startBtn: Node = null;

  @property({ type: Node, tooltip: '余额' })
  private creditLable: Node = null;

  @property({ type: Node, tooltip: '投注金额' })
  private betLable: Node = null;

  @property({ type: Node, tooltip: 'vipNode' })
  private vipNode: Node = null;

  @property({ type: [SpriteFrame], tooltip: 'vipIcon' })
  private vipIcons: SpriteFrame[] = [];

  @property({ type: Node, tooltip: 'betAmount按钮' })
  private betAmountIcon: Node = null;

  @property({ type: Node, tooltip: '投注金额按钮动画' })
  private betAmoutSpine: Node = null;

  @property({ type: Node, tooltip: '快速模式按钮' })
  private quickModeBtn: Node = null;

  @property({ type: Node, tooltip: '底部视图' })
  private bottomView: Node = null;

  @property({ type: Label, tooltip: 'balanceLabel' })
  private balanceLabel: Label = null;

  /** freespin模式下免费游玩次数节点 */
  @property({
    type: Node,
    tooltip: 'freespin模式下免费游玩次数'
  })
  freespinTimesNode: Node = null;

  @property({ type: Node, tooltip: 'freeSpinWin 节点' })
  freeSpinWin: Node = null;

  private homeBodyUtil: HomeBodyUtil = null;

  // 记录点击停止滚动，防止快速点击，每次点击间隔300ms
  private clickToStopTime: number = new Date().getTime();

  // 当前是否命中过免费轮
  private isHitFreeBonusSpin: boolean = false;

  // 初始化的相关逻辑写在这
  onLoad() {
    this.homeBodyUtil = new HomeBodyUtil(this);
    this.creditLable.getComponent(Label).string =
    `${getP()} ` + numberToMoney(app.manager.global.creditCount);

    this.betLable.getComponent(Label).string =
    `${BetString()} ${getP()} ` + numberToMoney(app.manager.global.betCount);
    this.vipNode.getComponent(Sprite).spriteFrame = this.vipIcons[app.manager.global.vipLevel - 1];
    this.balanceLabel.getComponent(Label).string = BalanceString();
    this.vipNodeSetup();

    this.onResizeScreen();

    // 如果有开屏动画线隐藏节点
    this.hiddenAllNodes();

    app.manager.event.on('startHomeAnimationComplete', this.startHomeAnimationComplete, this);

    GameResourceManager.instance.preloadLocalICons();
  }

  vipNodeSetup() {
    if(getIsGap() === false){
      this.vipNode.active = app.store.user.PlayerLevelData.playerLevel > -1;
      this.vipNode.getComponent(Sprite).spriteFrame = this.vipIcons[app.store.user.PlayerLevelData.playerLevel];
    }else{
      this.vipNode.active = false;
    }
  }

  private hiddenAllNodes() {
    // 为两个节点添加渐显动画
    this.bottomView.active = false;
    this.topView.active = false;
    const nodes = [this.topView, this.bottomView];
    nodes.forEach((node) => {
      let uiOpacity = node.getComponent(UIOpacity);
     
      if (!uiOpacity) {
        uiOpacity = node.addComponent(UIOpacity);
      }

      node.active = false;
      uiOpacity.opacity = 0; 
    });
  }

  startHomeAnimationComplete(needAnimation: boolean = true) {
    this.bottomView.active = true;
    this.topView.active = true;
    // 为两个节点添加渐显动画
    const nodes = [this.topView, this.bottomView];
    nodes.forEach((node) => {
      let uiOpacity = node.getComponent(UIOpacity);

      if (!uiOpacity) {
        uiOpacity = node.addComponent(UIOpacity);
      }
      if(needAnimation){
      // 确保从透明开始
        uiOpacity.opacity = 0; 
        node.active = true;
     
        tween(uiOpacity)
          .to(2, { opacity: 255 }, { easing: 'sineOut' })
          .start();
      }else{
        node.active = true;
        uiOpacity.opacity = 255;
      }
    });
  }

  /** *屏幕适配**/
  onResizeScreen() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenScale =  screenHeight / screenWidth;

    if (screenScale < 1.78) {
      this.bottomView.setScale(new Vec3(0.85, 0.85, 1));
    }
  }

  protected beforeShow(next: (error?: string) => void, data?: any): any {
    next();
    this.homeBodyUtil.adaptBottomButtonPosition(this.bottomView);
  }

  // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onShow(params: any) {
    // 监听游戏开始
    this.controller.on(HomeController.Event.GameStart, this.startGame, this);
    /// 监听游戏结束
    this.controller.on(HomeController.Event.GameOver, this.gameOver, this);
    /// 监听按钮禁用
    this.controller.on(HomeController.Event.DisableButton, this.disabledPlayButton, this);
    /// 监听按钮启用
    this.controller.on(HomeController.Event.EnableButton, this.enabledPlayButton, this);
    /// 监听投注金额按钮状态
    this.controller.on(HomeController.Event.BetAmountButtonState, this.changeBetAmountButtonState, this);
    /// 监听自动投注按钮状态
    this.controller.on(HomeController.Event.AutoPlayButtonState, this.changeAutoPlayButtonState, this);
    /// 监听开始按钮状态
    this.controller.on(HomeController.Event.StartButtonState, this.changeStartButtonState, this);
    /// 监听免费轮状态
    app.manager.event.on('freeBonusModeChange', this.freeBonusModeChange, this);
    /// 监听投注金额变化
    app.manager.event.on('creditCountChange', this.creditCountChange, this);
   
    /// 监听投注金额变化
    app.manager.event.on('betCountChange', this.betCountChange, this);
    // 监听自动模式变化
    app.manager.event.on('allwaysAutoPlayChange', this.autoModeChangeListener, this);
    // 监听快速模式变化
    app.manager.event.on('quikeModeChange', this.quikeModeChangeListener, this);
    // 监听自动设置开始按钮
    app.manager.event.on('startAutoPlayChange', this.startAutoPlayChange, this);
    // 监听自动模式按钮点击
    app.manager.event.on('clickAllwaysAutoPlay', this.clickAllwaysAutoModeBtn, this);
    // 停止自动投注
    app.manager.event.on('stopAllwaysAutoPlay', this.stopAllwaysAutoPlay, this);
    // 监听免费轮次数变化
    app.manager.event.on('quantityChange', this.quantityChange, this);
    // 重置自动投注
    app.manager.event.on('resetGameMode', this.resetGameMode, this);
  }

  // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
  onHide(result: undefined) {
    this.controller.off(HomeController.Event.GameStart, this.startGame, this);
    this.controller.off(HomeController.Event.GameOver, this.gameOver, this);
    this.controller.off(HomeController.Event.DisableButton, this.disabledPlayButton, this);
    this.controller.off(HomeController.Event.EnableButton, this.enabledPlayButton, this);
    app.manager.event.off('creditCountChange', this.creditCountChange, this);
    app.manager.event.off('betCountChange', this.betCountChange, this);
    app.manager.event.off('allwaysAutoPlayChange', this.autoModeChangeListener, this);
    app.manager.event.off('quikeModeChange', this.quikeModeChangeListener, this);
    app.manager.event.off('startAutoPlayChange', this.startAutoPlayChange, this);

    return result;
  }

  /**
   * 余额变化
   * @param val
   */
  creditCountChange(val: number) {
    this.creditLable.getComponent(Label).string = getP() + numberToMoney(val);
  }

  /**
   * 免费轮状态变化
   */
  freeBonusModeChange(val: boolean) {
    if(val) {
      this.isHitFreeBonusSpin = true;
    }
  }

  /**
   * 投注金额变化
   * @param val
   */
  betCountChange(val: number) {
    // 获取当前正在展示的金额
    const currentBetAmount = this.betLable.getComponent(Label).string;
    const targetBetAmount = `${BetString()} ${getP()} ` + numberToMoney(val);

    console.log('betCountChange', currentBetAmount, targetBetAmount);

    // 如果当前金额和val相等，则不进行操作
    if(currentBetAmount === targetBetAmount){
      return;
    }

    this.betAmoutSpine.active = true;
    const skeleton = this.betAmoutSpine.getComponent(sp.Skeleton);
    skeleton.setAnimation(0, 'action', false);
    skeleton.setCompleteListener(() => {
      this.betAmoutSpine.active = false;
    });
    this.betLable.getComponent(Label).string = targetBetAmount;
  }

  /**
   * 自动模式变化
   * @param val
   */
  autoModeChangeListener(val: boolean) {
    this.autoModeBtn.getComponent(Sprite).spriteFrame = val
      ? this.autoBtnOnSprite
      : this.autoBtnOffSprite;
  }

  /**
   * 快速模式变化
   * @param val
   */
  quikeModeChangeListener(val: IQuickMode) {
    console.log('quikeModeChangeListener', val);
    [IQuickMode.nomal, IQuickMode.quick, IQuickMode.turbo].forEach(item => {
      if(item === val){
        this.quickModeBtn.getChildByName(item).active = true;
      }else{
        this.quickModeBtn.getChildByName(item).active = false;
      }
    });
  }

  /**
   * 监听设置自动开始游戏状态变化
   * @param val
   */
  startAutoPlayChange(val: boolean) {
    if (val) {
      if (app.manager.ui.isShow('PopAutosetting')) {
        // 隐藏自动设置弹窗
        app.manager.ui.hide({ name: 'PopAutosetting', onHide: () => { } });
      }
      if (app.manager.ui.isShow('PopSettings')) {
        // 隐藏设置弹窗
        app.manager.ui.hide({ name: 'PopSettings', onHide: () => { } });
      }

      app.manager.global.setAllwaysAutoPlay(false);
      app.manager.global.setCurrentAutoPlayTimes(1);
      this.autoModeBtn.getComponent(Sprite).spriteFrame = val
        ? this.autoBtnOnSprite
        : this.autoBtnOffSprite;
      this.startGame();
    }
  }

  // 点击设置按钮
  clickSettingBtn() {
    // 播放音效
    EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
    app.manager.ui.show<PopSettings>({ name: 'PopSettings', onShow: () => { } });
    // 设置按钮点击
    EventTrackManager.inst.trackClickSetting(true);
    // 播放音效
    EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
  }

  // 展示选择金额视图
  clickBetAmount() {
    // 播放音效
    EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
    app.manager.ui.show({ name: 'PopBetamout' });
    // 投注金额设置按钮点击
    EventTrackManager.inst.trackBetAmountSetting(true);
    // 播放音效
    EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
  }

  /// 快速模式
  clickQuickMode(event: EventTouch) {
    if(app.manager.global.quikeMode !== IQuickMode.nomal){
      EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
    }else{
      EffectManager.inst.playEffect(AudioPath.UI.CLOSE, false, null, true);
    }

    const quickModes = [IQuickMode.nomal, IQuickMode.quick, IQuickMode.turbo];
    const findIndex = quickModes.findIndex((item) => item === app.manager.global.quikeMode);
    const nextIndex = findIndex + 1 === quickModes.length ? 0 : findIndex + 1;
    app.manager.global.setQuikeMode(quickModes[nextIndex]);

    if(quickModes[nextIndex] === IQuickMode.turbo){
      globalSpeedCtrl.startAcceleratedMode(2);
      EffectManager.inst.setTurboMode(true);
      // BGMManager.inst.pauseBGM();
      // this.scheduleOnce(() => {
      //   BGMManager.inst.resumeBGM();
      // }, 0.5);
    }else{
      // BGMManager.inst.resumeBGM();
      EffectManager.inst.setTurboMode(false);
      globalSpeedCtrl.stopAcceleratedMode();
    }

    EventTrackManager.inst.trackTurboSpin(quickModes[nextIndex] !== IQuickMode.nomal);
  }

  /**
  重置游戏所有的模式
  */
  resetGameMode(){
    // 如果是正在自动投注，停止自动投注
    if(app.manager.global.allwaysAutoPlay || app.manager.global.startAutoPlay || app.manager.global.quantity > 0){
      this.stopAutoPlay();
    }
    // 如果是免费轮中，退出免费轮模式,清空数据
    if(app.controller.slots.isFreeBonusSpin){
      // 重置免费轮数据
      app.manager.global.setGameRecordIds([]);
      app.manager.global.setGameRecordIndex(0);
      app.manager.global.setFreeBonusTimes(0);
      // 设置为非免费轮
      app.controller.slots.freeBonusSpinChange(false);
    }
  }
  
  /// 点击免费轮购买
  clickBuyBonus() {
    if (this.canClickBuyBonus()) {
      // 播放音效
      EffectManager.inst.playEffect(AudioPath.UI.OPENBETFREE);

      if(!app.manager.global.isBuyFreeBonusMode){
        app.manager.ui.show({ name: 'PopBuybonus' });
      }
    }
  }

  /**
   *点击vip（prefab 按钮仍绑定此方法；等级弹窗随成就系统移除）
  */
  clickVip(){
  }

  // 防止快速点击
  @preventRapidClickDecorator(1000)
  canClickBuyBonus() {
    if (app.manager.global.isGoing) {
      if (app.controller.slots.betType === BetTypes.buy) {
        ToastManager.inst.show('The purchased free game is in use, and this function is temporarily unavailable');
      } else {
        ToastManager.inst.show('Game Playing');
      }

      return false;
    }
  
    return true;
  }

  berforeStartGame() {
    // 如果自动模式开启，并且总次数选中，并且总次数大于0, 展示剩余次数
    if (
      app.manager.global.startAutoPlay &&
      app.manager.global.autoSetting.totalSpins.selected &&
      app.manager.global.autoSetting.totalSpins.value > 0
    ) {
      const times = (
        app.manager.global.autoSetting.totalSpins.value - app.manager.global.currentAutoPlayTimes
      ).toString();
      this.setAutoTimesLabel(times);
    }
  }

  /**
   * 返回首页
   */
  goHome() {
    EventTrackManager.inst.trackBackToHome();
    app.manager.ui.show({
      name: 'PopErrorPop',
      data: {
        msg: 'Are you sure you want to leave?',
        type: ErrorType.SlowNetTips,
        showCancelBtn: true,
        cancelCallback: () => {
          app.manager.ui.hide({ name: 'PopErrorPop', onHide: () => { } });
        },
        confirmCallback: () => {
          app.manager.ui.hide({ name: 'PopErrorPop', onHide: () => { } });
          CpPostMessage.goHome();
        },
      },
    });
  }

  /// 开始游戏
  startGame(event?: EventTouch) {
    // 余额不足时，无法开始游戏
    if (app.manager.global.creditCount < app.manager.global.betCount && app.manager.global.isFreespinMode === false) {
      if(!getIsGap()){
        showInsufficientCreditAlert();
      }

      showInsufficientCreditAlert();

      return;
    }

    this.berforeStartGame();

    this.disabledPlayButton();

    if (app.manager.global.isGoing) {
      app.manager.event.emit('button:disable');

      if(app.manager.global.quikeMode === IQuickMode.nomal){
        app.manager.global.setClickScreen(true);
      }
      
      return;
    }

    // 播放音效
    EffectManager.inst.playEffect(AudioPath.GAME.SPIN_ROTATE);
    app.controller.slots.betNormal();
  }

  /// 游戏结束
  gameOver(betResult: BetResult) {
    const globalManager = app.manager.global;

    if (globalManager.startAutoPlay && this.isAutoPlay(betResult)) {
      // 设置自动游戏模式 并且 未达到停止条件
      this.scheduleOnce(() => {
        this.startGame();
      }, 0.1);
    } else if (globalManager.allwaysAutoPlay && this.isCanAutoPlay()) {
      // 普通自动游戏模式
      this.scheduleOnce(() => {
        this.startGame();
      }, 0.1);
    }
  }

  // 设置自动次数
  setAutoTimesLabel(times: string) {
    this.autoModeBtn.getChildByName('autoTimes').getComponent(Label).string = times;
  }

  // 点击自动模式按钮、停止按钮
  // 防止快速点击
  @preventRapidClickDecorator(1000)
  clickAllwaysAutoModeBtn() {
    if (app.manager.global.creditCount < app.manager.global.betCount && app.manager.global.isFreespinMode === false) {
      if(!getIsGap()){
        showInsufficientCreditAlert();
      }

      return;
    }
    if (app.manager.global.isGoing) {
      this.stopAutoPlay();
      this.disabledPlayButton();
      ToastManager.inst.show('Auto spin disabled');
      EventTrackManager.inst.trackAutoSpin(false, app.manager.global.isFreespinMode ? 'free_spin' : 'normal');
    } else {
      // 如果余额小于投注额，不能开启自动投注
      if(app.manager.global.creditCount < app.manager.global.betCount && app.manager.global.isFreespinMode === false){
        showInsufficientCreditAlert();

        return;
      }

      app.manager.global.setAllwaysAutoPlay(true);
      this.startGame();
      ToastManager.inst.show('Auto spin enabled');
      EventTrackManager.inst.trackAutoSpin(true, app.manager.global.isFreespinMode ? 'free_spin' : 'normal');
    }
  }

  /**
    * 停止自动模式
    * */ 
  stopAllwaysAutoPlay(){
    this.stopAutoPlay();
    this.disabledPlayButton();
    ToastManager.inst.show('Auto spin disabled');
  }

  /**
   * 购买的免费轮总次数变化
   * @param val
   */
  quantityChange(val: number) {
    this.setAutoTimesLabel(val > 0 ? val.toString() : '');
    this.autoModeChangeListener(val > 0);
    this.autoModeBtn.getComponent(Button).interactable = val > 0;
  }

  // 禁用开始、金额、自动按钮
  // 如果是自动模式，则自动模式不禁用
  disabledPlayButton() {
    if (!app.manager.global.allwaysAutoPlay && !app.manager.global.startAutoPlay && app.manager.global.quantity === 0) {
      this.autoModeBtn.getComponent(Button).interactable = false;
    }

    this.betAmountIcon.getComponent(Button).interactable = false;
  }

  // 启用开始、金额、自动按钮
  enabledPlayButton() {
    this.autoModeBtn.getComponent(Button).interactable = true;

    if(app.manager.global.isFreespinMode  || app.manager.global.isBuyFreeBonusMode ){
      this.betAmountIcon.getComponent(Button).interactable = false;
    }else{
      this.betAmountIcon.getComponent(Button).interactable = true;
    }
  }

  // 改变投注金额按钮状态
  changeBetAmountButtonState(state: boolean) {
    this.betAmountIcon.getComponent(Button).interactable = state;
  }

  // 改变自动投注按钮状态
  changeAutoPlayButtonState(state: boolean) {
    this.autoModeBtn.getComponent(Button).interactable = state;
  }

  // 改变开始按钮状态
  changeStartButtonState(state: boolean) {
    // this.startBtn.getComponent(Button).interactable = state;
  }

  // 获取下一轮是否自动开始
  public isAutoPlay(result: BetResult) {
    const globalManager = app.manager.global;
    globalManager.setCurrentAutoPlayTimes(globalManager.currentAutoPlayTimes + 1);
    let bool = globalManager.startAutoPlay;

    if (globalManager.startAutoPlay) {
      // 如果选中总次数，并且当前次数大于总次数，则停止
      if (
        globalManager.autoSetting.totalSpins.selected &&
        globalManager.currentAutoPlayTimes > globalManager.autoSetting.totalSpins.value
      ) {
        this.stopAutoPlay();

        return false;
      }
      // 如果选中单次中奖，并且当前中奖金额大于单次中奖金额，则停止
      if (
        globalManager.autoSetting.singleWin.selected &&
        calculateWithBase(result.overallRewardAmount, true) / globalManager.betCount >=
        globalManager.autoSetting.singleWin.value
      ) {
        this.stopAutoPlay();

        return false;
      }
      // 如果选中余额少于，并且当前余额小于余额少于金额，则停止
      if (
        globalManager.autoSetting.balanceLess.selected &&
        calculateWithBase(result.credit, true) < globalManager.autoSetting.balanceLess.value
      ) {
        this.stopAutoPlay();

        return false;
      }
      // 如果选中余额多于，并且当前余额大于余额多于金额，则停止
      if (
        globalManager.autoSetting.balanceMore.selected &&
        calculateWithBase(result.credit, true) > globalManager.autoSetting.balanceMore.value
      ) {
        this.stopAutoPlay();

        return false;
      }
      // 如果选中免费轮，并且当前是免费轮，则停止
      if (globalManager.autoSetting.isFree.selected && this.isHitFreeBonusSpin) {
        this.isHitFreeBonusSpin = false;
        this.stopAutoPlay();

        return false;
      }
    }

    return bool;
  }

  // 是否可以自动游戏,余额不足需暂停
  public isCanAutoPlay() {
    if (app.manager.global.creditCount < app.manager.global.betCount && app.manager.global.isFreespinMode === false) {
      this.stopAutoPlay();
      showInsufficientCreditAlert();

      return false;
    }

    return true;
  }

  // 停止自动游戏
  private stopAutoPlay() {
    const globalManager = app.manager.global;
    globalManager.setCurrentAutoPlayTimes(0);
    globalManager.setStartAutoPlay(false);
    globalManager.setAllwaysAutoPlay(false);
    globalManager.setQuantity(0);
    this.setAutoTimesLabel('');
  }
}
