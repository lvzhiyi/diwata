import { _decorator, Node } from 'cc';
import BaseView from '../../../../../../../extensions/app/assets/base/BaseView';
import { GameUtilTool } from 'db://assets/common/script/extra/GameUtilTool';
import { ActivityEventMgr, ActivityEventMgrEventsType } from 'db://assets/common/script/ActivityEventMgr';
import { PackageFacade } from 'db://assets/common/script/PackageFacade';
import { app } from 'db://assets/app/app';
import { GameEventMgrEventsType, GameMrgEvent } from 'db://assets/common/script/extra/GameMrsEvent';
import { ActivityDataMgr } from 'db://assets/common/script/data/ActivityDataMgr';
import { serverHookManager } from 'db://assets/basePlate/middleWare/serverManager/ServerHookManager';
import { getUserCredit } from 'db://assets/basePlate/middleWare/services/user';
import { HTTP_STATUS_CODES } from 'db://assets/common/script/extra/Request';
import { HomeController } from 'db://assets/app-builtin/app-controller/HomeController';

const { ccclass, property } = _decorator;
@ccclass('PaperHomeActivity')
export class PaperHomeActivity extends BaseView.BindController(HomeController) {
    @property({ type: Node, tooltip: 'ActivityEntry' })
    private activityEntry: Node = null;

    // 初始化的相关逻辑写在这
    onLoad() { }

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
        ActivityEventMgr.instance.on(ActivityEventMgrEventsType.useFreeSpin, this.onStartFreespin, this);
        ActivityEventMgr.instance.on(ActivityEventMgrEventsType.cancelUseFreeSpin, this.onCancelFreespin, this);
        this.setupStarCardPostion();
        PackageFacade.instance.showEntryDialog();
      }
    }

    protected beforeShow(next: (error?: string) => void, data?: any) {
      next();
      this.addActivityRootNode();
    }

    /**
     * 添加活动视图的根节点
    */
    addActivityRootNode() {
      const activityRootNode = GameUtilTool.createXforgeActivityRootNode(this.activityEntry);
      activityRootNode.setSiblingIndex(199);
      // 下一帧再次确认（防止其他代码覆盖）
      this.scheduleOnce(() => {
        activityRootNode.setSiblingIndex(
          activityRootNode.parent.children.length - 1
        );
      });
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
        app.manager.global.setBetCount(betAmout);
        this.betCountChange(betAmout);
      }

      // 发生一次购买免费轮
      // this.controller.onUseStarCard(data);
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
        // 后端返回的是分，前端显示的是元，所以需要除以1000
          // const creditCount = CurrencyUtil.internalToDisplay(res.data);
          // this.controller.updateUserBalance(creditCount);
        }
      }
    }

    /**
   * 处理freespin模式开始事件
   * @param data 包含免费游玩次数、投注金额、总奖励的数据对象
   */
    private onStartFreespin(data: { count: number; freeBet: number, totalAward: number; campaignId: string }) {
    // console.log('处理freespin模式开始事件', data);
      const {
        count, freeBet, campaignId, totalAward,
      } = data;
      // this.onFreespinEnableChange(true, count, freeBet, campaignId);
      // this.freespinRewardAmount = totalAward;
    }

    /**
   * 处理取消freespin模式通知
   */
    private onCancelFreespin() {
      console.log('on cancel freespin');
      this.onFreespinEnableChange(false);
    }

    /**
   * 处理免费轮状态变化事件
   * @param freeSpinState 免费轮状态
   */
    private onFreeSpinStateChange(freeSpinState: boolean) {
      if (freeSpinState) {
        GameMrgEvent.instance.dispatchEvent(GameEventMgrEventsType.updateBuyFreeCount, 1);
      } else {
        GameMrgEvent.instance.dispatchEvent(GameEventMgrEventsType.updateBuyFreeCount, 0);
        const starCardData = ActivityDataMgr.instance.getGoodsData();

        // 隐藏星卡动效
        if (starCardData != null) {
          ActivityEventMgr.instance.dispatchEvent(ActivityEventMgrEventsType.hideStarCard, null);
          // 恢复投注金额
          app.manager.global.setBetCount(app.manager.global.tempBetCount);
          this.betCountChange(app.manager.global.tempBetCount);
        }
      }
    }

    /**
   * 处理freespin模式启用状态变化事件
   * @param isEnabled 是否启用freespin模式
   * @param freespinTimes 免费游玩次数
   * @param betAmount 投注金额
   * @param campaignId 活动ID
   */
    private async onFreespinEnableChange(isEnabled: boolean, freespinTimes?: number, betAmount?: number, campaignId?: string) {
      // if (isEnabled) {
      //   const now = Date.now();

      //   // 只有等待freespin事件开始时间大于0时，才需要等待
      //   if (this.waitFreespinEventStartTime > 0) {
      //     await delay(Math.min(now - this.waitFreespinEventStartTime, 500));
      //     this.waitFreespinEventStartTime = 0;
      //     // 恢复开始按钮的可点击状态
      //     this.updateStartButtonState(true);
      //     // 恢复自动投注按钮的特效
      //     this.updateAutoButtonEnableState(true);
      //     // 恢复投注金额按钮的可点击状态，主要是为了避免在播放动画时，按钮处于禁用状态时，导致动画播放异常
      //     this.updateBetAmountButtonState(true);
      //   }

      //   this.enableFreespin(freespinTimes, betAmount, campaignId);
      // } else {
      //   this.disableFreespin();
      // }
    }

    /**
    * 设置星卡特效飞行终点位置
   */
    setupStarCardPostion() {
      // 延迟设置星卡特效飞行终点位置
      this.scheduleOnce(() => {
        const betCountScreenPosition = GameUtilTool.getMoveToPos();
        const quikeModeScreenPosition = GameUtilTool.getCardPos();
        PackageFacade.instance.setStarCardPosData(betCountScreenPosition, quikeModeScreenPosition);
      }, 0);
    }

    /**
   * 投注金额变化UI处理
   * @param val 新的投注金额
   */
    private betCountChange(val: number) {
      // this.updateBetDisplay(val);
    }

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    onHide(result: undefined) {
      // app.manager.ui.show<PaperHomeActivity>({name: 'PaperHomeActivity', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
      return result;
    }
}