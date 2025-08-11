import { _decorator, Node } from 'cc';
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

const { ccclass, property } = _decorator;
@ccclass('PaperHomeActivity')
export class PaperHomeActivity extends BaseView.BindController(SlotsController) {
    @property({ type: Node, tooltip: 'ActivityEntry' })
    private activityEntry: Node = null;

    // 初始化的相关逻辑写在这
    onLoad() { 
     
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
        this.controller.on(SlotsController.Event.FreeBonusSpinChange, (a: boolean) => {
          this.onFreeBonusSpinStateChange(a);

          return true;
        });
        this.controller.on(SlotsController.Event.GameOver, (a: BetResult) => {
          // 当前轮游戏结束，更新freeSpin次数
          freeSpinManager.onRoundEnd();

          return true;
        });
        this.setupStarCardPostion();
        GlobalActivity.showEntryDialog();
        freeSpinManager.init();
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
      app.controller.home.onUseStarCard(starCardData);
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
          this.betCountChange(app.manager.global.tempBetCount);
        }
      }
    }

    /**
    * 设置星卡特效飞行终点位置
   */
    setupStarCardPostion() {
      // 延迟设置星卡特效飞行终点位置
      this.scheduleOnce(() => {
        const betCountScreenPosition = GameUtilTool.getMoveToPos();
        const quikeModeScreenPosition = GameUtilTool.getCardPos();
        GlobalActivity.setStarCardPosData(betCountScreenPosition, quikeModeScreenPosition);
      }, 0);
    }

    /**
   * 投注金额变化UI处理
   * @param val 新的投注金额
   */
    private betCountChange(val: number) {
      app.manager.event.emit('betCountChange', val);
    }

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    onHide(result: undefined) {
      // app.manager.ui.show<PaperHomeActivity>({name: 'PaperHomeActivity', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
      return result;
    }
}