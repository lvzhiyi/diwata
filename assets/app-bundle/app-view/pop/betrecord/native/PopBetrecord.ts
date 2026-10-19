import { _decorator, Color, EditBox, Graphics, instantiate, Label, Node, NodePool, Prefab, Size, Sprite, SpriteFrame, UITransform, view } from 'cc';
import dayjs from 'dayjs';
import { app } from 'db://assets/app/app';
import { RecordCard } from './expansion/RecordCard';
import BaseView from 'db://app/base/BaseView';
import { PopBetrecorddetail } from '../../betrecorddetail/native/PopBetrecorddetail';
import { BetRecordListModel, getRecordHistory } from 'db://assets/basePlate/middleWare/services/user';
import { Loading } from 'db://assets/basePlate/middleWare/commonUI/Loading';
import { SelectDateView } from 'db://assets/basePlate/middleWare/commonUI/SelectDateView/SelectDateView';
import { calculateWithBase, getTimestampsNowAgoMinutes, numberToMoney } from 'db://assets/common/script/extra/Utils/common';
import { IntersectionObserver } from 'db://assets/res-native/script/IntersectionObserver';
import GameProcessCtrl from 'db://assets/common/script/extra/GameProcessCtrl';
import EventTrackManager from 'db://assets/basePlate/middleWare/serverManager/EventTrackManager';
import { preventRapidClickDecorator } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';
import { ToastView } from 'db://assets/basePlate/middleWare/commonUI/ToastView';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass, property } = _decorator;

@ccclass('PopBetrecord')
export class PopBetrecord extends BaseView {
    @property(Node)
    private cardScrollViewNode: Node;

    @property(Node)
    private ClickToSelectADateLabel: Node;

    @property(Node)
    private content: Node;

    @property(Prefab)
    private RecordCardPrefab: Prefab;

    @property(Node)
    private TimeTabs: Node;

    @property(Node)
    private LoadingNode: Node;

    @property(Node)
    private DateSearchIcon: Node;

    @property(Node)
    private DateClearIcon: Node;

    @property(Node)
    private NumberSearchIcon: Node;

    @property(Node)
    private NumberClearIcon: Node;

    @property(Node)
    private RoundNumberNode: Node;

    @property(Node)
    private SelectDateView: Node;

    @property(Node)
    private BackIconNode: Node;

    @property(Node)
    private PageLoading: Node;

    @property(SpriteFrame)
    private SelectIconOn: SpriteFrame;

    @property(SpriteFrame)
    private SelectIconOff: SpriteFrame;

    private _selectedDate = new Date();

    private _ageMinutes = 0;

    private _isLoading = true;

    private _pageLoadingUUID = '';

    private _hasMoreData = true;

    private _pageParams = {
      pageNo: 0,
      pageSize: 10,
      startCreateTime: +new Date(),
      endCreateTime: +new Date(),
      id: ''
    };

    private _recordList: any[] = [];

    // 是否搜索
    private _isSearched: boolean = false;

    // 是否点击记录详情
    private _isClickedRecordDetail: boolean = false;

    private _nodePool: NodePool;

    protected onLoad(): void {
      const { width, height } = view.getDesignResolutionSize();
      let w = width;
      let h = height;

      if (w / h < window.innerWidth / window.innerHeight) {
        // 实际效果比canvas宽
        w = h * window.innerWidth / window.innerHeight;
      } else {
        // 实际效果比canvas高
        h = w * window.innerHeight / window.innerWidth;
      }

      this.createLayoutSize(w, h);

      this.setCardListNodeHeight(h);

      this.initTimeTabsClickListener();

      this.addListenerScrollAtBottom();

      this.addSearchAndDeleteListener();

      this.addBackIconListener();

      this.initNodePool();

      // 初始化选中第一个时间
      this.scheduleOnce(() => {
        this.selectTabTime(this.TimeTabs.children[0]);
      });

      this.node.on(Node.EventType.TOUCH_END, () => {
        this.SelectDateView.active = false;
      }, this);

      // active 切换监听
      this.node.on(Node.EventType.ACTIVE_CHANGED, this.activeChangedListener, this);
    }

    activeChangedListener(parentNode: { active: any; }) {
      if (parentNode.active) {
        this.selectTabTime(this.TimeTabs.children[0]);
      }
    }

    addListenerScrollAtBottom() {
      this.cardScrollViewNode.on(Node.EventType.TOUCH_MOVE, this.onScroll, this);
    }

    addSearchAndDeleteListener() {
      this.DateSearchIcon.on(Node.EventType.TOUCH_END, this.searchFromDate, this);
      this.DateClearIcon.on(Node.EventType.TOUCH_END, this.clearDayAction, this);
      this.NumberSearchIcon.on(Node.EventType.TOUCH_END, this.searchFromRoundNumber, this);
      this.NumberClearIcon.on(Node.EventType.TOUCH_END, this.clearRoundNumberAction, this);
    }

    addBackIconListener() {
      this.BackIconNode.on(Node.EventType.TOUCH_END, this.closeRecordLayout, this);
    }

    /**
     * 初始化节点池
     */
    initNodePool() {
      this._nodePool = new NodePool();

      for (let i = 0; i < 5; i++) {
        const RecordCardNode = instantiate(this.RecordCardPrefab);
        this._nodePool.put(RecordCardNode);
      }
    }

    closeRecordLayout() {
      const roundNumberScprit = this.RoundNumberNode.getComponent(EditBox);

      EventTrackManager.inst.trackExitBetRecord({
        search_time_range: this._ageMinutes === 60 ? '1 hour' : `${this._ageMinutes} mins`,
        selected_date: dayjs(this._selectedDate).format('YYYY-MM-DD'),
        round_number: roundNumberScprit.string ? roundNumberScprit.string : '',
        search_used: this._isSearched,
        clicked_record_detail: this._isClickedRecordDetail,
      });
      EffectManager.inst.playEffect(AudioPath.UI.CLOSE, false, null, true);
      app.manager.ui.hide({ name: 'PopBetrecord' });
    }

    onScroll() {
      if (this._isLoading) {
        return;
      }

      const viewNode = this.cardScrollViewNode.getChildByName('view');
      const contentNode = viewNode.getChildByName('content');
      const contentPositionY = contentNode.position.y;
      const contentHeight = contentNode.getComponent(UITransform).height;
      const scrollViewHeight = this.cardScrollViewNode.getComponent(UITransform).height;

      // 判断是否滑动到底部
      if (contentPositionY + scrollViewHeight >= contentHeight + 400 && this._hasMoreData) {
        this.getData();
      }
    }

    showCalendar() {
      this.SelectDateView.getComponent(SelectDateView).show(
        new Date(),
        (selectDateList: Date[]) => {
          console.log(selectDateList);
          EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
          this.selectDate(selectDateList[0]);
        },
        0,
        30
      );
      this.SelectDateView.active = true;
      EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
    }

    hideCalendar() {
      EffectManager.inst.playEffect(AudioPath.UI.CLOSE, false, null, true);
      this.SelectDateView.getComponent(SelectDateView).hide();
    }

    async getData(id = '') {
      if (this._pageParams.pageNo === 0) {
        this.content.removeAllChildren();
        this._pageLoadingUUID = app.manager.ui.showLoading();
      }

      this._hasMoreData = true;
      this._isLoading = true;
      this._pageParams.pageNo += 1;
      const params = {
        ...this._pageParams,
        lastId: this._pageParams.pageNo === 1 ? null : this._recordList?.[this._recordList?.length - 1]?.id ?? null
      };

      if (id) {
        params.id = id;
      } else {
        delete params.id;
      }

      const res = await getRecordHistory(params);
      const recordList: BetRecordListModel[] = (res.data?.list ?? []).filter((item: BetRecordListModel) => item.id !== GameProcessCtrl.gamePlayingId);
      console.log('recordList', res.data?.list, GameProcessCtrl.gamePlayingId);

      if (this._pageParams.pageNo === 1) {
        this.content.addChild(this.LoadingNode);
        this._recordList = recordList;
      } else {
        this._recordList = [...this._recordList, ...recordList ?? []];
      }

      if (this._pageLoadingUUID) {
        app.manager.ui.hideLoading(this._pageLoadingUUID);
        this._pageLoadingUUID = '';
      }

      (recordList ?? []).forEach((item: any) => {
        this.addCard(item);
      });

      if (res.data?.list?.length < this._pageParams.pageSize) {
        this._hasMoreData = false;
        // 没有更多数据删除Loading
        this.content.removeChild(this.content.getChildByName('Loading'));
      }

      this._isLoading = false;
    }

    addCard(item: BetRecordListModel) {
      // const RecordCardNode = instantiate(this.RecordCardPrefab);
      // RecordCardNode.getComponent(RecordCard).initValue(item);
      // RecordCardNode.on(Node.EventType.TOUCH_END, () => {
      //     if (this.SelectDateView.active === true) {
      //         // 日历展示中时，阻止跳转
      //         return;
      //     }
      //     app.manager.ui.show<PopBetrecorddetail>({ name: 'PopBetrecorddetail', data: { id: item.id } });
      // }, this);

      const ItemNode = new Node();
      ItemNode.layer = this.node.layer;
      ItemNode.addComponent(UITransform).setContentSize(660, 280);

      this.content.insertChild(ItemNode, this.content.children.length - 1);

      ItemNode.addComponent(IntersectionObserver).observe(this.content.parent, { rootMargin: 100 }, (isIntersecting) => {
        if (isIntersecting) {
          if (ItemNode.children.length === 0) {
            const node = this._nodePool.get() || instantiate(this.RecordCardPrefab);
            node.getComponent(RecordCard).initValue(item);

            if (!ItemNode.hasEventListener(Node.EventType.TOUCH_END)) {
              ItemNode.on(Node.EventType.TOUCH_END, (e: { target: { name: string } }) => this.clickCard(e, item), this);
            }

            ItemNode.addChild(node);
            console.log('isIntersecting');
          }
        } else {
          if (ItemNode.children.length > 0) {
            this._nodePool.put(ItemNode.children[0]);
            ItemNode.removeAllChildren();
            console.log('isNotIntersecting');
          }
        }
      });
    }

    private clickCard(e: any, item: any) {
      if (e.target.name === 'CopyIcon') {
        // 当点击位置是复制图片，阻止跳转
        return;
      }
      if (this.SelectDateView.active === true) {
        // 日历展示中时，阻止跳转
        return;
      }

      // 上报投注记录点击事件
      EventTrackManager.inst.trackBetRecordItemClick({
        search_time_range: this._ageMinutes === 60 ? '1 hour' : `${this._ageMinutes} mins`,
        round_number: item.id,
        net: calculateWithBase(item.payOutAmount - item.payAmount),
        bet_amount: calculateWithBase(item.payAmount),
        win: calculateWithBase(item.payOutAmount),
        time: dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss'),
      });
      app.manager.ui.show<PopBetrecorddetail>({
        name: 'PopBetrecorddetail', data: { id: item.id }, attr:{ zIndex:11 }
      });
    }

    // 创建当前layout size
    private createLayoutSize(w: number, h: number) {
      const uiTransform = this.node.getComponent(UITransform);
      uiTransform.setContentSize(w, h);

      this.setBg(this.node, -w / 2, -h / 2, w, h, new Color().fromHEX('#000000f0'));
    }

    // 给node设置背景色
    private setBg(node: Node, x: number, y: number, w: any, h: any, color: Color) {
      const graphic = node.addComponent(Graphics);
      graphic.clear();
      graphic.fillColor = color;
      graphic.fillRect(x, y, w, h);
    }

    // 设置CardList的高度
    private setCardListNodeHeight(h: number) {
      this.cardScrollViewNode.getComponent(UITransform).height = h - 600;
    }

    // 初始化时间选择点击事件
    private initTimeTabsClickListener() {
      this.TimeTabs.children.forEach(tab => {
        tab.on(Node.EventType.TOUCH_END, () => {
          this.selectTabTime(tab);
        }, this);
      });
    }

    // 点击选择时间tab
    // 防止快速点击
    @preventRapidClickDecorator(1000)
    private selectTabTime(currentTab: Node) {
      EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
      this.TimeTabs.children.forEach(tab => {
        if (currentTab === tab) {
          tab.getComponent(Sprite).spriteFrame = this.SelectIconOn;
          tab.children[0].getComponent(Label).color = new Color().fromHEX('#FFFFFF');

          this._ageMinutes = parseInt(tab.children[0].name) || 0;

          this._pageParams = {
            ...this._pageParams,
            pageNo: 0,
            startCreateTime: getTimestampsNowAgoMinutes(this._ageMinutes),
            endCreateTime: +new Date()
          };

          this._isSearched = true;
          // 上报时间范围，最小单位为分钟，如果为60分钟则为1小时
          EventTrackManager.inst.trackBetRecordTimeRange(
            this._ageMinutes === 60 ? '1 hour' : `${this._ageMinutes} mins`
          );
          // 选择时间后置空日期
          this.clearDay();

          // 选择时间后置空RoundNumber
          this.clearRoundNumber();

          this.getData();
        } else {
          tab.getComponent(Sprite).spriteFrame = this.SelectIconOff;
          tab.children[0].getComponent(Label).color = new Color().fromHEX('#051E58');
        }
      });
    }

    selectDate(date: Date) {
      // if (dayjs(date).format('YYYY-MM-DD') === dayjs(this._selectedDate).format('YYYY-MM-DD')) {
      //     return;
      // }
      this._selectedDate = date;
      const DataLabel = this.ClickToSelectADateLabel.getComponent(Label);
      DataLabel.color = new Color().fromHEX('#051E58');
      DataLabel.string = dayjs(date).format('YYYY-MM-DD');

      this._pageParams = {
        ...this._pageParams,
        pageNo: 0,
        startCreateTime: dayjs(date).startOf('day').valueOf(),
        endCreateTime: dayjs(date).endOf('day').valueOf(),
      };

      // 选择日期后置空时间
      this.selectTabTime(null);

      // this.getData();
    }

    private searchFromDate() {
      if (!this._pageParams.startCreateTime) {
        const date = +new Date();
        this._pageParams.startCreateTime = dayjs(date).startOf('day').valueOf();
        this._pageParams.endCreateTime = dayjs(date).endOf('day').valueOf();
      }

      this._isSearched = true;
      // 上报日期范围
      EventTrackManager.inst.trackBetRecordSearch({
        search_time_range: '',
        selected_date: dayjs(this._selectedDate).format('YYYY-MM-DD'),
        round_number: '',
      });
      EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
      this._pageParams = {
        ...this._pageParams,
        pageNo: 0,
      };

      this.getData();

      this.clearRoundNumber();
    }

    private clearDay() {
      const DataLabel = this.ClickToSelectADateLabel.getComponent(Label);
      DataLabel.color = new Color().fromHEX('#6F87A5');
      DataLabel.string = 'Click to select a date';
    }

    private clearDayAction() {
      // 上报清除日期事件
      // 埋点-用户点击日期清除按钮
      const DataLabel = this.ClickToSelectADateLabel.getComponent(Label);
      EventTrackManager.inst.trackClearBetRecordField({
        cleared_field: 'date',
        cleared_value: DataLabel.string
      });
      EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
      DataLabel.color = new Color().fromHEX('#6F87A5');
      DataLabel.string = 'Click to select a date';
    }

// 防止快速点击
@preventRapidClickDecorator(1000)
    private searchFromRoundNumber() {
      const roundNumberScprit = this.RoundNumberNode.getComponent(EditBox);
      // 清空时间
      this.selectTabTime(null);
      // 清空日期显示
      const DataLabel = this.ClickToSelectADateLabel.getComponent(Label);
      DataLabel.color = new Color().fromHEX('#6F87A5');
      DataLabel.string = 'Click to select a date';
      
      this._pageParams = {
        ...this._pageParams,
        pageNo: 0,
        startCreateTime: null,
        endCreateTime: null,
      };
      EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);

      // 如果输入框有值，则获取数据
      if (roundNumberScprit.string) {
        this._isSearched = true;
        // 上报查询单号事件
        EventTrackManager.inst.trackBetRecordSearch({
          search_time_range: '',
          selected_date: '',
          round_number: roundNumberScprit.string,
        });
        this.getData(roundNumberScprit.string);
      } else {
        ToastView.showCommonToast('Please input round number');
      }
    }

private clearRoundNumber() {
  const roundNumberScprit = this.RoundNumberNode.getComponent(EditBox);
  roundNumberScprit.string = '';
  roundNumberScprit.blur();
}

private clearRoundNumberAction() {
  const roundNumberScript = this.RoundNumberNode.getComponent(EditBox);
  EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
  EventTrackManager.inst.trackBetRecordFilterFieldClear({
    cleared_field: 'round_number',
    cleared_value: roundNumberScript.string,
  });
  const roundNumberScprit = this.RoundNumberNode.getComponent(EditBox);
  roundNumberScprit.string = '';
  roundNumberScprit.blur();
}

protected onDisable(): void {
  this.cardScrollViewNode.off(Node.EventType.TOUCH_MOVE, this.onScroll, this);
  this.DateSearchIcon.off(Node.EventType.TOUCH_END, this.getData, this);
  this.DateClearIcon.off(Node.EventType.TOUCH_END, this.clearDayAction, this);
  this.NumberSearchIcon.off(Node.EventType.TOUCH_END, this.searchFromRoundNumber, this);
  this.NumberClearIcon.off(Node.EventType.TOUCH_END, this.clearRoundNumberAction, this);
  this.BackIconNode.off(Node.EventType.TOUCH_END, this.closeRecordLayout, this);
  this.node.off(Node.EventType.ACTIVE_CHANGED, this.activeChangedListener, this);
  this._nodePool.clear();
}
}
