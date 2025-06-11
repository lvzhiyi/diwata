import { _decorator, instantiate, Label, Node, NodePool, Prefab, UITransform } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { JackpotRecordTab, JackpotTabNameType } from './expansion/JackpotRecordTab';
import { app } from 'db://assets/app/app';
import { fetchJackpotInfo, fetchJackpotMaxRecord, fetchJackpotRecord, JackpotInfoModel, JackpotRecordModel } from 'db://assets/basePlate/middleWare/services/user';
import { formatTimestampToMonthday, JackpotRecordItem } from './expansion/JackpotRecordItem';
import { IntersectionObserver } from 'db://assets/res-native/script/IntersectionObserver';
import { JackpotPrizePool } from './expansion/JackpotPrizePool';
import { calculateTextWidth, numberToMoney } from 'db://assets/common/script/extra/Utils/common';
import { GameGlobalEvent, GameGlobalEventType } from 'db://assets/basePlate/middleWare/events/GameGlobalEvent';

const { ccclass, property } = _decorator;
@ccclass('PopJackpotRecord')
export class PopJackpotRecord extends BaseView {
  @property({ type: JackpotRecordTab, tooltip: 'JackpotRecordTab Script' })
  private jackpotRecordTabScript: JackpotRecordTab = null;

  /// 记录的内容视图
  @property({ type: Node, tooltip: '内容' })
  private content: Node;

  @property({ type: Node, tooltip: '最大中奖金额用户' })
  private maxUserNode: Node;

  @property({ type: Node, tooltip: '最大中奖金额' })
  private maxAmountNode: Node;

  @property({ type: Node, tooltip: '最大中奖金额时间' })
  private maxTimeNode: Node;

  @property({ type: Node, tooltip: '加载loading节点' })
  private loadingNode: Node;

  @property({ type: Prefab, tooltip: 'JackpotRecordItem' })
  private jackpotRecordItem: Prefab;

  /// 奖池内容
  @property({ type: Node, tooltip: 'JackpotPrizePool' })
  private jackpotPrizeNode: Node;

  private _nodePool: NodePool;

  private scheduleId: number | null = null;

  onLoad() {
    this.initNodePool();
    this.getJackpotMaxRecord();
    this.requestJackpotInfo();
    this.jackpotRecordTabScript.listenerTabChange((tabName) => {
      console.log('切换到 ' + tabName);
      var recordTypeList: number[] = [];
      var pageSize = 10;

      switch (tabName) {
        case JackpotTabNameType.ALL:
          recordTypeList = [1, 2, 3,];
          pageSize = 30;
          break;
        case JackpotTabNameType.MAJOR:
          recordTypeList = [2];
          pageSize = 20;
          break;
        case JackpotTabNameType.GRAND:
          recordTypeList = [1];
          break;
      }

      this.getJackpotRecord(recordTypeList, pageSize);
    });
    // 监听数据变化
    GameGlobalEvent.instance.on(GameGlobalEventType.UPDATE_JACKPOT_INFO, this.updateJackpot, this);
  }

  /**
     * 初始化节点池
     */
  initNodePool() {
    this._nodePool = new NodePool();

    for (let i = 0; i < 6; i++) {
      const RecordCardNode = instantiate(this.jackpotRecordItem);
      this._nodePool.put(RecordCardNode);
    }
  }

  /**
  * 获取中奖列表记录
 */
  private async getJackpotRecord(recordTypeList: number[], pageSize:number) {
    this.content.removeAllChildren();
    this.content.addChild(this.loadingNode);

    try {
      const res = await fetchJackpotRecord(recordTypeList, pageSize);
      console.log(res);
      const listdata = res.data.list ?? [];

      if(listdata.length > 0) {
        this.content.removeAllChildren();
        listdata.forEach((item: JackpotRecordModel) => {
          this.addCard(item);
        });
      } else {
        this.showNotice('Coming soon');
      }
    } catch (error) {
      this.showNotice('load data error');
    } 
  }

  /// 获取最大奖记录
  private async getJackpotMaxRecord() {
    // 获取最大中奖金额
    const res = await fetchJackpotMaxRecord();
    const data: JackpotRecordModel  = res.data;

    if(data) {
      this.maxUserNode.getComponent(Label).string = data.playerName;
      const prizeAmount = `${numberToMoney(data.rewardAmount / 1000, 3, false)}`;
      const textWidth = calculateTextWidth(prizeAmount, 60, 'GOLD_FONT');
      console.log('textWidth', textWidth);
      // if(textWidth > 600) {
      //   this.maxAmountNode.getComponent(Label).fontSize = 45;
      // } else {
      //   this.maxAmountNode.getComponent(Label).fontSize = 60;
      // }

      this.maxAmountNode.getComponent(Label).string = prizeAmount;
      this.maxTimeNode.getComponent(Label).string = formatTimestampToMonthday(data.createTime);
    }
  }

  /**
   * 请求jackpot奖池信息
  */
  private async requestJackpotInfo() {
    const response = await fetchJackpotInfo();
    const data: JackpotInfoModel[] = response.data;

    if (!data || data.length === 0) {
      return;
    } 

    const jackpotPrizePool = this.jackpotPrizeNode.getComponent(JackpotPrizePool);
    jackpotPrizePool.initializeUI(data);
  }
  
  /**
   * 更新jackpot奖池信息
   */
  private  updateJackpot(data: JackpotInfoModel[]) {
    if (!data || data.length === 0) {
      console.warn('Jackpot data is empty.');
      this.initJackpotFailed();

      return;
    }

    const jackpotPrizePool = this.jackpotPrizeNode.getComponent(JackpotPrizePool);
    jackpotPrizePool.rollAnimation(data);
  }

  /// 添加卡片
  addCard(item: JackpotRecordModel) {
    const ItemNode = new Node();
    ItemNode.layer = this.node.layer;
    ItemNode.addComponent(UITransform).setContentSize(592, 60);

    this.content.addChild(ItemNode);
    /// 复用池加载
    ItemNode.addComponent(IntersectionObserver).observe(this.content.parent, { rootMargin: 60 }, (isIntersecting) => {
      /// 进入可视区域内
      if (isIntersecting) {
        if (ItemNode.children.length === 0) {
          const node = this._nodePool.get() || instantiate(this.jackpotRecordItem);
          node.getComponent(JackpotRecordItem).initValue(item);
          ItemNode.addChild(node);
        }
      } else {
        /// 移除可视区域
        if (ItemNode.children.length > 0) {
          this._nodePool.put(ItemNode.children[0]);
          ItemNode.removeAllChildren();
        }
      }
    });
  }

  /// 显示提示
  showNotice(msg: string) {
    const label = this.loadingNode.getComponent(Label);

    if(label) {
      label.string = msg;
    }
  }

  private initJackpotFailed() {
  }

  /// 关闭
  clickClose() {
    app.manager.ui.hide({ name: 'PopJackpotRecord' });
  }

  protected onDisable(): void {
    GameGlobalEvent.instance.off(GameGlobalEventType.UPDATE_JACKPOT_INFO, this.updateJackpot, this);
  }
}