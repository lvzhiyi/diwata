import { _decorator, find, Label, Node, sp, Vec3 } from 'cc';
import BaseView from '../../../../../../../extensions/app/assets/base/BaseView';
import { GameUtilTool } from 'db://assets/common/script/extra/GameUtilTool';
import { ActivityEventMgr, ActivityEventMgrEventsType } from 'db://assets/common/script/ActivityEventMgr';
import { app } from 'db://assets/app/app';
import { ActivityDataMgr, GameDataMgrEventsType } from 'db://assets/common/script/data/ActivityDataMgr';
import { serverHookManager } from 'db://assets/basePlate/middleWare/serverManager/ServerHookManager';
import { getUserCredit } from 'db://assets/basePlate/middleWare/services/user';
import { HTTP_STATUS_CODES } from 'db://assets/common/script/extra/Request';
import { SlotsController } from 'db://assets/app-builtin/app-controller/SlotsController';
import { GlobalActivity, GlobalMgr } from 'db://assets/common/script/extra/GlobalMgr';
import { calculateWithBase } from 'db://assets/common/script/extra/Utils/common';
import { freeSpinManager } from 'db://assets/res-native/script/FreeSpinManager';
import { GameResourceManager, SPINE_RESOURCE_NAMES } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';
import { SpineTool } from 'db://assets/res-native/script/SpineTool';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass, property } = _decorator;
@ccclass('PaperHomeActivity')
export class PaperHomeActivity extends BaseView.BindController(SlotsController) {
    @property({ type: Node, tooltip: 'ActivityEntry' })
    private activityEntry: Node = null;

    @property({ type: Node, tooltip: 'BousSpineView 节点' })
    private BousSpineView: Node = null;

    /// 开屏动画节点
   @property(Node)
   private startHomeSpine: Node | null = null;

    @property({ type: Node, tooltip: 'numberLable 节点' })
    private NumberLable: Node = null;

    // 初始化的相关逻辑写在这
    onLoad() {
      // 播放开屏动画
      this.playStartHomeSpine();
    }

    private async playStartHomeSpine() {
      if (this.startHomeSpine && this.startHomeSpine.isValid) {
        this.startHomeSpine.active = true;

        try {
          const skeleton = this.startHomeSpine.getComponent(sp.Skeleton);
          skeleton.setAnimation(0, 'show2_qipan', false);
          app.manager.event.emit('startHomeRollAnimation');
          skeleton.setCompleteListener(() => {
            this.playStartAnimationComplete(true);
          });
        } catch (error) {
          app.manager.event.emit('startHomeAnimationComplete');
          this.playStartAnimationComplete(true);
        }
      }else{
        app.manager.event.emit('startHomeAnimationComplete');
        this.playStartAnimationComplete(true);
      }
    }
  
    private playStartAnimationComplete(needAnimation: boolean = true) {
      SpineTool.destoryAnimationNode(this.startHomeSpine);
      this.startHomeSpine = null;
      console.log('playStartAnimationComplete');

      app.manager.event.emit('startHomeAnimationComplete');

      // 播放背景音乐
    }

    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
    onShow(params: any) {
      if (app.store.user.isInitActivityModule) {
        // 监听是否点击了星卡消费
        ActivityEventMgr.instance.on(ActivityEventMgrEventsType.useGoods, this.onUseStarCard, this);
        // 余额变动通知
        ActivityEventMgr.instance.on(
          ActivityEventMgrEventsType.otherMessage,
          this.otherMessage,
          this
        );
        this.controller.on(SlotsController.Event.GameOver, (a: BetResult) => {
          // 当前轮游戏结束，更新freeSpin次数
          if(app.controller.slots.isFreeBonusSpin === false && app.manager.global.isFreespinMode === true && a.credit !== -1) {
            freeSpinManager.onRoundEnd();
          }

          return true;
        });
        this.controller.on(SlotsController.Event.FreeBonusSpinChange, (a: boolean) => {
          this.onFreeBonusSpinStateChange(a);
  
          return true;
        });
        this.setupStarCardPostion();
        GlobalActivity.showEntryDialog();
        freeSpinManager.init();
      }

      app.manager.event.on('begainfreeBonusAnimation', this.showFreeBonusSpineAnimation, this);
      // 调整免费轮动画节点的层级
      this.scheduleOnce(() => {
        this.BousSpineView.setSiblingIndex(
          this.BousSpineView.parent.children.length - 1
        );
      });
    }

    protected beforeShow(next: (error?: string) => void, data?: any) {
      next();
      this.addActivityRootNode();
    }

    /**
     * 添加活动视图的根节点
    */
    addActivityRootNode() {
      GameUtilTool.createXforgeActivityRootNode(this.activityEntry);
      // activityRootNode.setSiblingIndex(199);
      // // 下一帧再次确认（防止其他代码覆盖）
      // this.scheduleOnce(() => {
      //   activityRootNode.setSiblingIndex(
      //     activityRootNode.parent.children.length - 1
      //   );
      // });
    }

    /**
   * 消费星卡
   * @param starCardData 星卡的数据
   */
    public onUseStarCard(starCardData: any) {
      if (starCardData == null) {
        return;
      }

      const betAmout = starCardData.bet;
  
      if (betAmout > 0) {
        // 临时记录修改投注金额变化
        let tempBetCount = app.manager.global.betCount;
        app.manager.global.setTempBetCount(tempBetCount);
        app.manager.global.setBetCount(betAmout, false);
      }

      // 关闭结算弹窗
      app.controller.slots.closeFreeSpinSettlementDialog();
      // 发生一次购买免费轮
      app.manager.event.emit('buyFreeSpinTimes', betAmout, 1, starCardData);
    }

    /**
   * 关闭免费轮结算弹窗
   */
    public closeSettlementDialog() {
      app.controller.slots.closeFreeSpinSettlementDialog();
    }

    /** 更新余额的通知 */
    async otherMessage(data: any) {
      if (serverHookManager.isServerMaintenance) {
        return;
      }
      if (data.msgType === 'CREDIT_CHANGE_RES') {
        console.log('余额变动通知');
        const res = await getUserCredit();

        if (res.code === HTTP_STATUS_CODES.SUCCESS && res.data !== null) {
          // 后端返回的是1厘比索，前端显示的是1比索，所以需要除以1000
          const creditCount = calculateWithBase(res.data, true);
          app.manager.global.setCreditCount(creditCount);
          GlobalMgr.instance.balance = creditCount;
        }
      }
    }
  
    /**
   * 处理免费轮状态变化事件
   * @param freeSpinState 免费轮状态
   */
    private onFreeBonusSpinStateChange(freeBonusSpinState: boolean) {
      if (freeBonusSpinState) {
        GlobalActivity.dispatchEvent(GameDataMgrEventsType.updateBuyFreeCount, 1);
      } else {
        GlobalActivity.dispatchEvent(GameDataMgrEventsType.updateBuyFreeCount, 0);
        const starCardData = ActivityDataMgr.instance.getGoodsData();

        // 隐藏星卡动效
        if (starCardData != null) {
          ActivityEventMgr.instance.dispatchEvent(ActivityEventMgrEventsType.hideStarCard, null);
          // 恢复投注金额
          app.manager.global.setBetCount(app.manager.global.tempBetCount);
        }
      }
    }

    /**
     * 展示免费轮中奖动画
     */
    private async showFreeBonusSpineAnimation(callback: () => void) {
      // sm节点隐藏
      GlobalActivity.setEntryDialogActive(false);
      this.BousSpineView.active = true;
      this.NumberLable.getComponent(Label).string = app.manager.global.freeBonusTimes.toString();
      // 开始播放动画
      const Skeleton = this.BousSpineView.getComponent(sp.Skeleton);
      const spineData = await GameResourceManager.instance.getSpineAnimationDataByName(SPINE_RESOURCE_NAMES.FREE_BONUS_TRANSITION);

      if(Skeleton && spineData) {
        Skeleton.skeletonData = spineData;
        Skeleton.setAnimation(0, 'show', false);
        EffectManager.inst.playEffect(AudioPath.GAME.FREE_BONUS_TRANSITION);
        // 监听自定义事件 "sz"
        Skeleton.setEventListener((trackEntry: sp.spine.TrackEntry, event: sp.spine.Event) => {
          if (event.data.name === 'sz') {
            console.log('监听到 sz 事件:', event);
            this.NumberLable.active = true;
          }
        });
      }

      // 设置一个超时定时器，4秒后执行callback
      const timeoutId = setTimeout(() => {
        console.log('动画播放超时');
        this.BousSpineView.active = false;
        this.NumberLable.active = false;
        GlobalActivity.setEntryDialogActive(true);
        Skeleton.clearAnimations();
        Skeleton.skeletonData = null;
        Skeleton.setEventListener(null);
        callback();
      }, 4400);

      Skeleton.setCompleteListener((track: sp.spine.TrackEntry) => {
        clearTimeout(timeoutId); 
        Skeleton.setCompleteListener(null);
        clearTimeout(timeoutId); 
        this.BousSpineView.active = false;
        this.NumberLable.active = false;
        GlobalActivity.setEntryDialogActive(true);
        Skeleton.clearAnimations();
        Skeleton.skeletonData = null;
        Skeleton.setEventListener(null);
        callback();
      });
    }

    /**
    * 设置星卡特效飞行终点位置
   */
    setupStarCardPostion() {
      // 延迟设置星卡特效飞行终点位置
      this.scheduleOnce(() => {
        const betBtn = find('Canvas/UserInterface/Paper/PaperHomeBody/bottomView/buttonBox/hboxLayout/BetAmoutView');
        const betCountScreenPosition = GameUtilTool.getCardPosByNode(betBtn);
        const amoutBtnScreenNewPosition = new Vec3(betCountScreenPosition.x, betCountScreenPosition.y - 160, 0);
        const quickBtn = find('Canvas/UserInterface/Paper/PaperHomeBody/bottomView/buttonBox/quickBtnView/quickBtn');
        const quikeModeScreenPosition = GameUtilTool.getCardPosByNode(quickBtn);
        GlobalActivity.setStarCardPosData(amoutBtnScreenNewPosition, quikeModeScreenPosition);
      }, 0);
    }

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    onHide(result: undefined) {
      // app.manager.ui.show<PaperHomeActivity>({name: 'PaperHomeActivity', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
      return result;
    }
}