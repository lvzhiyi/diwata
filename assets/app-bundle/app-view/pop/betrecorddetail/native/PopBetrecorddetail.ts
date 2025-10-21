import { _decorator, Node,  } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { RecordDetailLayout } from './expansion/RecordDetailLayout';

const { ccclass, property } = _decorator;

/**
 * 投注记录详情弹窗组件
 * 用于显示玩家投注记录的详细信息，包括游戏结果、奖励线等
 */
@ccclass('PopBetrecorddetail')
export class PopBetrecorddetail extends BaseView {
  @property(Node)
   private RecordDetailLayout: Node;

  /**
   * 显示弹窗时的回调函数
   * @param data 传入的数据，包含记录ID
   */
  protected onLoad(): void {
 
  }

  protected onShow(data?: any) {
    console.log('onShow', data);
  }

  protected beforeShow(next: (error?: string) => void, data?: any) {
    console.log('data', data);
    this.RecordDetailLayout.getComponent(RecordDetailLayout).show(data.id);
    next();
  }
}
