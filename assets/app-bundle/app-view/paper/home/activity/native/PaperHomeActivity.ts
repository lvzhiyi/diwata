import { _decorator, Node } from 'cc';
import BaseView from '../../../../../../../extensions/app/assets/base/BaseView';
import { GameUtilTool } from 'db://assets/common/script/extra/GameUtilTool';
import { ActivityEventMgr, ActivityEventMgrEventsType } from 'db://assets/common/script/ActivityEventMgr';
import { PackageFacade } from 'db://assets/common/script/PackageFacade';

const { ccclass, property } = _decorator;
@ccclass('PaperHomeActivity')
export class PaperHomeActivity extends BaseView {
    @property({ type: Node, tooltip: 'ActivityEntry' })
    private activityEntry: Node = null;

    // 初始化的相关逻辑写在这
    onLoad() { }

    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
    onShow(params: any) {
      // 监听是否点击了星卡消费
      ActivityEventMgr.instance.on(ActivityEventMgrEventsType.useGoods, this.starCardUse, this);
      PackageFacade.instance.showEntryDialog();
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

    /** *星卡消费 */
    starCardUse(data: any) {
      console.log('starCardUse', data);
    }

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    onHide(result: undefined) {
      // app.manager.ui.show<PaperHomeActivity>({name: 'PaperHomeActivity', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
      return result;
    }
}