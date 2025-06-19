import {
  _decorator,
  Button,
  EventTouch,
  Label,
  Node,
  Skeleton,
  sp,
  Sprite,
  SpriteFrame,
  sys,
  Tween,
  tween,
  UITransform,
  Vec3,
} from 'cc';
import BaseView from '../../../../../../../extensions/app/assets/base/BaseView';
import { app } from '../../../../../../app/app';
import { HomeController } from '../../../../../../app-builtin/app-controller/HomeController';
import { PopSettings } from '../../../../pop/settings/native/PopSettings';
import { calculateWithBase, getViewportSize, numberToMoney } from 'db://assets/common/script/extra/Utils/common';
import { GameUtilTool } from 'db://assets/common/script/extra/GameUtilTool';
import { ActivityEventMgr, ActivityEventMgrEventsType } from 'db://assets/common/script/ActivityEventMgr';
import { PackageFacade } from 'db://assets/common/script/PackageFacade';
import { HomeBodyUtil } from './expansion/HomeBodyUtil';
import CpPostMessage from 'db://assets/common/script/extra/tmBridge/cpPostMessage';
import {  preventRapidClickDecorator, showInsufficientCreditAlert } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';
import { ToastManager } from 'db://assets/res-native/script/ToastManager';
import { BetTypes } from 'db://assets/basePlate/middleWare/enums/bet';
import { GameResourceManager } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';

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

  @property({ type: SpriteFrame, tooltip: '快速模式按钮-on' })
  private quickBtnOnSprite: SpriteFrame = null;

  @property({ type: SpriteFrame, tooltip: '快速模式按钮-off' })
  private quickBtnOffSprite: SpriteFrame = null;

  @property({ type: Node, tooltip: '自动模式按钮' })
  private autoModeBtn: Node = null;

  @property({ type: Node, tooltip: '开始按钮' })
  private startBtn: Node = null;

  @property({ type: Node, tooltip: '余额' })
  private creditLable: Node = null;

  @property({ type: Node, tooltip: '投注金额' })
  private betLable: Node = null;

  @property({ type: Node, tooltip: 'vipNode' })
  private vipNode: Node = null;

  @property({ type: [SpriteFrame], tooltip: 'vipIcon' })
  private vipIcons: SpriteFrame[] = [];

  @property({ type: Node, tooltip: 'betAmount按钮Ex状态的剪头' })
  private betAmoutExArrow: Node = null;

  @property({ type: Node, tooltip: 'betAmount按钮' })
  private betAmountIcon: Node = null;

  @property({ type: sp.Skeleton, tooltip: '投注金额按钮动画' })
  private betAmoutSpine: sp.Skeleton = null;

  @property({ type: Node, tooltip: '快速模式按钮' })
  private quickModeBtn: Node = null;

  @property({ type: Node, tooltip: 'prizeNode' })
  private prizeBoxNode: Node = null;

  @property({ type: Node, tooltip: '底部视图' })
  private bottomView: Node = null;

  private homeBodyUtil: HomeBodyUtil = new HomeBodyUtil();

  // 初始化的相关逻辑写在这
  onLoad() {
    this.creditLable.getComponent(Label).string =
      '₱ ' + numberToMoney(app.manager.global.creditCount);
    this.betLable.getComponent(Label).string =
      'Bet ₱ ' + numberToMoney(app.manager.global.betCount);
    this.vipNode.getComponent(Sprite).spriteFrame = this.vipIcons[app.manager.global.vipLevel - 1];
    this.onResizeScreen();
    GameResourceManager.instance.preloadLocalICons();
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
    this.homeBodyUtil.adaptPrizeTopMargin(this.prizeBoxNode);
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
    /// 监听投注金额变化
    app.manager.event.on('creditCountChange', this.creditCountChange, this);
    /// 监听投注金额变化
    app.manager.event.on('betCountChange', this.betCountChange, this);
    // 监听ex模式变化
    app.manager.event.on('exModeChange', this.exModeChangeListener, this);
    // 监听自动模式变化
    app.manager.event.on('allwaysAutoPlayChange', this.autoModeChangeListener, this);
    // 监听快速模式变化
    app.manager.event.on('quikeModeChange', this.quikeModeChangeListener, this);
    // 监听自动设置开始按钮
    app.manager.event.on('startAutoPlayChange', this.startAutoPlayChange, this);
    // 监听自动模式按钮点击
    app.manager.event.on('clickAllwaysAutoPlay', this.clickAllwaysAutoModeBtn, this);

    // 注册全局事件监听
    app.manager.event.on('creditCountChange', this.creditCountChange, this);
    app.manager.event.on('betCountChange', this.betCountChange, this);
  }

  // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
  onHide(result: undefined) {
    // app.manager.ui.show<PaperHomeBody>({name: 'PaperHomeBody', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
    this.controller.off(HomeController.Event.GameStart, this.startGame, this);
    this.controller.off(HomeController.Event.GameOver, this.gameOver, this);
    this.controller.off(HomeController.Event.DisableButton, this.disabledPlayButton, this);
    this.controller.off(HomeController.Event.EnableButton, this.enabledPlayButton, this);
    app.manager.event.off('creditCountChange', this.creditCountChange, this);
    app.manager.event.off('betCountChange', this.betCountChange, this);
    app.manager.event.off('exModeChange', this.exModeChangeListener, this);
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
    this.creditLable.getComponent(Label).string = '₱' + numberToMoney(val);
  }

  /**
   * 投注金额变化
   * @param val
   */
  betCountChange(val: number) {
    this.betLable.getComponent(Label).string = 'BET ₱' + numberToMoney(val);
  }

  /**
   * ex模式变化
   * @param val
   */
  exModeChangeListener(val: boolean) {
    this.betAmoutExArrow.active = val;

    this.betAmoutSpine.node.active = val;

    if (val) {
      this.betAmoutSpine.setAnimation(0, 'action', false);
    }
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
  quikeModeChangeListener(val: boolean) {
    console.log('quikeModeChangeListener', val);
    this.quickModeBtn.getComponent(Sprite).spriteFrame = val
      ? this.quickBtnOnSprite
      : this.quickBtnOffSprite;
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
    app.manager.ui.show<PopSettings>({ name: 'PopSettings', onShow: () => { } });
  }

  // 展示选择金额视图
  clickBetAmount() {
    app.manager.ui.show({ name: 'PopBetamout' });
  }

  /// 快速模式
  clickQuickMode(event: EventTouch) {
    app.manager.global.setQuikeMode(!app.manager.global.quikeMode);
  }

  /// 点击免费轮购买
  clickBuyBonus() {
    if (this.canClickBuyBonus()) {
      app.manager.ui.show({ name: 'PopBuybonus' });
    } 
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

  /// 点击jackpot中奖列表
  clickJackpotRecordList() {
    app.manager.ui.show({ name: 'PopJackpotRecord' });
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
    CpPostMessage.goHome();
  }

  /// 开始游戏
  startGame(event?: EventTouch) {
    // 余额不足时，无法开始游戏
    if (app.manager.global.creditCount < app.manager.global.betCount) {
      showInsufficientCreditAlert();

      return;
    }

    this.berforeStartGame();

    this.disabledPlayButton();

    app.controller.slots.betNormal();
  }

  /// 游戏结束
  gameOver(betResult: BetResult) {
    const globalManager = app.manager.global;

    if (globalManager.startAutoPlay && this.isAutoPlay(betResult)) {
      // 设置自动游戏模式 并且 未达到停止条件
      this.scheduleOnce(() => {
        this.startGame();
      }, 0.5);
    } else if (globalManager.allwaysAutoPlay) {
      // 普通自动游戏模式
      this.scheduleOnce(() => {
        this.startGame();
      }, 0.5);
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
    if (app.manager.global.isGoing) {
      this.stopAutoPlay();
      this.disabledPlayButton();
      ToastManager.inst.show('Auto spin disabled');
    } else {
      app.manager.global.setAllwaysAutoPlay(true);
      this.startGame();
      ToastManager.inst.show('Auto spin enabled');
    }
  }

  // 禁用开始、金额、自动按钮
  // 如果是自动模式，则自动模式不禁用
  disabledPlayButton() {
    this.startBtn.getComponent(Button).interactable = false;

    if (!app.manager.global.allwaysAutoPlay && !app.manager.global.startAutoPlay) {
      this.autoModeBtn.getComponent(Button).interactable = false;
    }

    this.betAmountIcon.getComponent(Button).interactable = false;
    // this.controlStartButtonRotation(false);
  }

  // 控制开始按钮的旋转
  private controlStartButtonRotation(isRotating: boolean) {
    // 获取开始按钮
    const startBtn = this.startBtn;
    if (!startBtn) return;

    if (isRotating) {
      // 停止可能存在的旋转动作
      Tween.stopAllByTarget(startBtn);

      // 创建一个旋转动作, 2秒内旋转360度
      tween(startBtn)
        .by(8, { angle: -360 })
        .repeatForever()
        .start();
    } else {
      // 停止所有针对该按钮的动作
      Tween.stopAllByTarget(startBtn);

      // 重置按钮角度
      // startBtn.angle = 0;
    }
  }

  // 启用开始、金额、自动按钮
  enabledPlayButton() {
    this.startBtn.getComponent(Button).interactable = true;
    this.autoModeBtn.getComponent(Button).interactable = true;
    this.betAmountIcon.getComponent(Button).interactable = true;
    // this.controlStartButtonRotation(true);
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
    }

    console.log(
      '自动轮总次数' +
      globalManager.autoSetting.totalSpins.value +
      ' 当前执行' +
      globalManager.currentAutoPlayTimes
    );

    return bool;
  }

  // 停止自动游戏
  private stopAutoPlay() {
    const globalManager = app.manager.global;
    globalManager.setCurrentAutoPlayTimes(0);
    globalManager.setStartAutoPlay(false);
    globalManager.setAllwaysAutoPlay(false);
    this.setAutoTimesLabel('');
  }
}
