import { _decorator, Color, instantiate, Label, Node, Prefab, sp, tween, Vec3 } from "cc";
import { BagItemDetailProgram } from "./BagItemDetailProgram";
import { BagGoodsItem } from "./BagGoodsItem";
import { BagMessageItem } from "./BagMessageItem";
import { ActivityDialogViewBase } from "db://assets/common/script/DialogView/ActivityDialogViewBase";
import { ActivityDialogViewID } from "db://assets/common/script/DialogView/ActivityDialogViewID";
import { SuperLayout } from "db://assets/common/script/tools/superScrollView/super-layout";
import { GoodsItemData } from "db://assets/common/script/data/dataModels/GoodsItemData";
import { Handler } from "db://assets/common/script/tools/Handler";
import { ActivityID, PackageFacade } from "db://assets/common/script/PackageFacade";
import { ActivityConfigDataMgr } from "db://assets/common/script/data/ActivityConfigDataMgr";
import {
    ActivityEventMgr,
    ActivityEventMgrEventsType,
} from "db://assets/common/script/ActivityEventMgr";
import { OtherGameGoodsItem } from "./OtherGameGoodsItem";
import {
    ActivityDataMgr,
    ActivityDataMgrEventsType,
} from "db://assets/common/script/data/ActivityDataMgr";
import { OtherGameItemData } from "db://assets/common/script/data/dataModels/OtherGameItemData";
import {
    messages,
    ResGetHistoryMessage,
} from "db://assets/common/script/network/http/HttpDataModels/ResGetHistoryMessage";
import { HttpDataBase } from "db://assets/common/script/network/http/services/HttpDataBase";
import { ActivityServicesMgr } from "db://assets/common/script/network/http/services/ActivityServicesMgr";
import { ActivitySmallLoadingUI } from "db://assets/common/script/tools/ActivitySmallLoadingUI";
import { ActivityDialogViewMgr } from "db://assets/common/script/DialogView/ActivityDialogViewMgr";
import { ConfirmCancelPanel } from "db://assets/common/script/DialogView/views/ConfirmCancelPanel";
import { FreeSpinHistory } from "db://assets/common/script/network/http/HttpDataModels/ResfreeSpinHistoryOfPlayer";
import { DataReportMgr } from "db://assets/common/script/managers/DataReportMgr";
import { DataReporEvents } from "db://assets/common/script/data/dataModels/DataReporEvents";
const { ccclass, property } = _decorator;

@ccclass("BagDialogView")
export class BagDialogView extends ActivityDialogViewBase {
    // =============== 静态属性 ===============
    /** 提示文本配置 */
    private static readonly TIPS_VALUES: string[] = [
        "Click Rich Card icon to use.It disappears when expired.",
        "Click the icon to use the Rich Card!",
        "The Rich Card disappears once expired.",
    ];
    // =============== 界面组件引用 ===============

    @property(BagItemDetailProgram)
    private itemDetailProgram: BagItemDetailProgram = null;
    @property(Prefab)
    private goodsItem: Prefab = null;
    @property(Prefab)
    private confirmCancelPanel: Prefab = null;
    @property(Node)
    private tabButtons: Node[] = [];

    @property(Label)
    private tips_txt: Label = null;

    @property(sp.Skeleton)
    private jianTou: sp.Skeleton = null;
    @property(ActivitySmallLoadingUI)
    private loadingUI: ActivitySmallLoadingUI = null;
    @property(Node)
    listNodes: Node[] = [];
    @property(SuperLayout)
    superLists: SuperLayout[] = [];
    @property(Prefab)
    private cardEeffct: Prefab = null;

    // =============== 私有属性 ===============
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.backpack;
    private _tabIndex: number = -1;
    private _bagDatas: GoodsItemData[] = [];
    private _otherGameDatas: OtherGameItemData[] = [];
    private _isUpdateMessageDataIng: boolean = false;
    private _messageDatas: messages[] = [];
    private _resGetHistoryMessage: ResGetHistoryMessage = null;
    private _useStarCardData: GoodsItemData = null; //当前在使用的星卡数据
    private _isUseStarCard: boolean = false; //是否在请求使用星卡中
    // =============== 生命周期方法 ===============
    start() {
        ActivityDataMgr.instance.updateBagData(false);
        ActivityDataMgr.instance.updateOtherGameData();
        ActivityDataMgr.instance.removeRedData(ActivityID.backpack);
        this.initUI();
        this.initEvents();
        DataReportMgr.instance.track(DataReporEvents.ClickMenuBackpack);
    }

    // =============== 初始化方法 ===============
    private initUI(): void {
        this.setJianTouState(false);
        this.itemDetailProgram.close();
        this.node.getChildByName("content").active = true;
        this.node.getChildByName("bg_mask").active = true;
        this.setTabIndex(0);
    }
    private initEvents(): void {
        this.itemDetailProgram.setCallback(new Handler(this, this.onUseGoods));
        ActivityDataMgr.instance.on(
            ActivityDataMgrEventsType.updateBagData,
            this.onUpdateBagData,
            this
        );
        ActivityDataMgr.instance.on(
            ActivityDataMgrEventsType.updateOtherGameData,
            this.onUpdateOtherGameData,
            this
        );
        this.superLists[0].selectedClick = (data: Node) => {
            this.onThisListSelected(data.getComponent(BagGoodsItem));
        };
        this.superLists[1].selectedClick = (data: Node) => {
            this.onOtherListSelected(data.getComponent(OtherGameGoodsItem));
        };
        ActivityEventMgr.instance.on(
            ActivityEventMgrEventsType.hideStarCard,
            this.onHideStarCard,
            this
        );
    }
    // =============== 事件处理方法 ===============
    private onUpdateBagData(): void {
        this._bagDatas = ActivityDataMgr.instance.getBagDatas();
        this.superLists[0].total(this._bagDatas.length);
        this.setTabIndex(this._tabIndex);
    }
    private onUpdateOtherGameData(): void {
        this._otherGameDatas = ActivityDataMgr.instance.getOtherGameDatas();
        this.superLists[1].total(this._otherGameDatas.length);
        this.setTabIndex(this._tabIndex);
    }
    private onHideStarCard(): void {
        this.close();
    }
    private onThisListScroll(): void {
        this.setJianTouState(false);
    }
    private onThisListSelected(data: BagGoodsItem): void {
        this.openItemDetail(data.getData());
    }
    private onOtherListSelected(data: OtherGameGoodsItem): void {
        this.openConfirmCancelPanel(data.getData());
    }
    private tabClick(e: Event, data: string): void {
        switch (data) {
            case "0":
                this.setTabIndex(0);
                break;
            case "1":
                this.setTabIndex(1);
                break;
            case "2":
                this.setTabIndex(2);
                break;
        }
    }

    private onClick(e: Event, data: string): void {
        switch (data) {
            case "close":
                this.close();
                break;
        }
    }

    private onScrollViewRefresh(): void {
        this.setJianTouState(false);
    }
    //使用物品
    private onUseGoods(data: GoodsItemData): void {
        if (this._useStarCardData != null) {
            return;
        }
        if (ActivityDataMgr.instance.getIsUseStarCard()) {
            PackageFacade.instance.openToast(ActivityConfigDataMgr.instance.getLanguageData(0));
            return;
        }
        if (ActivityDataMgr.instance.getIsBuyFreeIng()) {
            PackageFacade.instance.openToast(ActivityConfigDataMgr.instance.getLanguageData(5));
            return;
        }
        if (ActivityDataMgr.instance.getGameState()) {
            PackageFacade.instance.openToast(ActivityConfigDataMgr.instance.getLanguageData(4));
            return;
        }
        if (PackageFacade.instance.getBalance() < data.balanceRequired) {
            PackageFacade.instance.openToast(ActivityConfigDataMgr.instance.getLanguageData(2));
        } else {
            this.useStarCard(data);
            this.itemDetailProgram.showLoading();
        }
    }
    private onThisListRefresh(node: Node, index: number): void {
        let data = this._bagDatas[index];
        node.getComponent(BagGoodsItem).setData(data);
    }
    private onOtherListRefresh(node: Node, index: number): void {
        let data = this._otherGameDatas[index];
        node.getComponent(OtherGameGoodsItem).setData(data);
    }
    private onMessageListRefresh(node: Node, index: number): void {
        let data = this._messageDatas[index];
        node.getComponent(BagMessageItem).setData(data);
        if (!this._isUpdateMessageDataIng) {
            if (index == this._messageDatas.length - 2) {
                this.updateMessageData();
            }
        }
    }
    private onUpdateMessageData(data: HttpDataBase<ResGetHistoryMessage>): void {
        this.removeHandler(this.onUpdateMessageData);
        this.loadingUI.hide();
        if (data.isSuccessful) {
            this._resGetHistoryMessage = data.data;
            this._isUpdateMessageDataIng = false;
            // 剔除type<3的数据
            this._messageDatas = this._messageDatas.concat(
                data.data.messages.filter((item) => item.type > 2)
            );
            this.superLists[2].total(this._messageDatas.length, true);
            this.scheduleOnce(() => {
                this.superLists[2].resetChilds();
            });
            this.addTrackViewBackpackMessage(this._messageDatas);
        }
    }
    private onUseStarCardSuccess(): void {
        this._isUseStarCard = false;
        if (this._useStarCardData) {
            let cardNode = ActivityDataMgr.instance.getCardNode();
            ActivityDialogViewMgr.instance.openDialog(
                ActivityDialogViewID.cardEffect,
                this._useStarCardData.imgUrl,
                cardNode
            );
            this.addTrackConfirmUseRichCard(this._useStarCardData);
            this._useStarCardData = null;
        }
        this.close();
    }
    private updateMessageData(): void {
        if (this._resGetHistoryMessage) {
            if (this._resGetHistoryMessage.page < this._resGetHistoryMessage.totalPages) {
                this._isUpdateMessageDataIng = true;
                this.setLodingUIPosType(2);
                this.loadingUI.show();
                ActivityServicesMgr.instance.getHistoryMessage(
                    this.getHandler(this.onUpdateMessageData),
                    this._resGetHistoryMessage.page + 1,
                    10
                );
            }
        } else {
            this.setLodingUIPosType(1);
            this.loadingUI.show();
            ActivityServicesMgr.instance.getHistoryMessage(
                this.getHandler(this.onUpdateMessageData),
                1,
                10
            );
        }
    }
    // =============== 业务逻辑方法 ===============
    private setTabIndex(index: number): void {
        if (this._tabIndex != index) {
            this._tabIndex = index;
            for (let i: number = 0; i < this.listNodes.length; i++) {
                if (i == index) {
                    this.listNodes[i].active = true;
                } else {
                    this.listNodes[i].active = false;
                }
            }
            switch (index) {
                case 0:
                    this.tips_txt.string = BagDialogView.TIPS_VALUES[0];
                    this.updateThisGameGoodsList();
                    break;
                case 1:
                    this.tips_txt.string = BagDialogView.TIPS_VALUES[1];
                    this.updateOtherGameGoodsList();
                    break;

                case 2:
                    this.tips_txt.string = BagDialogView.TIPS_VALUES[2];
                    this.updateMessageList();
                    break;
            }
            let list: SuperLayout;
            for (let i: number = 0; i < this.tabButtons.length; i++) {
                if (i == index) {
                    this.tabButtons[i].getChildByName("mask").active = true;
                    this.tabButtons[i].getChildByName("txt").getComponent(Label).color = new Color(
                        49,
                        28,
                        0
                    );
                } else {
                    this.tabButtons[i].getChildByName("mask").active = false;
                    this.tabButtons[i].getChildByName("txt").getComponent(Label).color = new Color(
                        255,
                        189,
                        76
                    );
                }
            }
            this.tips_txt.string = BagDialogView.TIPS_VALUES[this._tabIndex];
        }
    }

    private updateThisGameGoodsList(): void {
        this._bagDatas = ActivityDataMgr.instance.getBagDatas();
        if (this._bagDatas && this._bagDatas.length > 0) {
            this.setJianTouState(true);
            this.superLists[0].total(this._bagDatas.length);
            this.superLists[0].scrollToHeader();
        } else {
            this.setJianTouState(false);
        }
        this.addTrackViewBackpackThisGame(this._bagDatas);
    }

    private updateOtherGameGoodsList(): void {
        this._otherGameDatas = ActivityDataMgr.instance.getOtherGameDatas();
        if (this._otherGameDatas && this._otherGameDatas.length > 0) {
            this.superLists[1].total(this._otherGameDatas.length);
            this.superLists[1].scrollToHeader();
        } else {
            this.superLists[1].total(0);
        }
        this.addTrackViewBackpackOtherGame(this._otherGameDatas);
    }

    private updateMessageList(): void {
        this._messageDatas.length = 0;
        this._resGetHistoryMessage = null;
        this.updateMessageData();
        this.superLists[2].total(this._messageDatas.length);
    }

    private setJianTouState(state: boolean): void {
        if (state) {
            this.jianTou.node.active = true;
            this.jianTou.setAnimation(0, "jianTou", true);
        } else {
            if (this.jianTou.node.active) {
                this.jianTou.node.active = false;
            }
        }
    }
    private useStarCard(goodsData: GoodsItemData): void {
        if (this._isUseStarCard) {
            return;
        }
        this._isUseStarCard = true;
        this._useStarCardData = goodsData;
        ActivityEventMgr.instance.on(
            ActivityEventMgrEventsType.useGoodsSuccess,
            this.onUseStarCardSuccess,
            this
        );
        ActivityEventMgr.instance.useGoods(
            this._useStarCardData.rewardId,
            this._useStarCardData.rewardConfigId,
            this._useStarCardData.starLv,
            this._useStarCardData.betValue
        );
    }
    private openItemDetail(data: GoodsItemData): void {
        this.itemDetailProgram.setData(data);
    }
    private openConfirmCancelPanel(data: OtherGameItemData): void {
        let content = ActivityConfigDataMgr.instance.getLanguageData(1) + data.gameName + "?";
        let panel = instantiate(this.confirmCancelPanel);
        this.node.addChild(panel);
        panel.getComponent(ConfirmCancelPanel).setContent(content);
        panel.getComponent(ConfirmCancelPanel).setConfirmCallback(new Handler(this, this.onConfirm, [data]))
        panel.getComponent(ConfirmCancelPanel).setCancelCallback(new Handler(this, () => {
            this.addTrackCancelOrCloseOtherGameRichcard(DataReporEvents.CancelUseRichCard, data);
        }, [data]));
        panel.getComponent(ConfirmCancelPanel).setCloseCallback(new Handler(this, () => {
            this.addTrackCancelOrCloseOtherGameRichcard(DataReporEvents.ExitUseRichcard, data);
        }, [data]));
 
        this.addTrackClickBackpackItem(data);

    }
    private onConfirm(data: OtherGameItemData): void {
        PackageFacade.instance.log("跳转其他游戏" + data.name);
        this.addTrackConfirmUseOtherGameRichcard(data);
        window.parent.postMessage({ type: "switchGame", data: { gameId: data.gameId } }, "*");
    }

    private addTrackViewBackpackThisGame(bagDatas: GoodsItemData[]): void {
        // 统计每个星级的卡牌数量
        const starLevelCounts = {};
        bagDatas.forEach(item => {
            starLevelCounts[item.starLv] = (starLevelCounts[item.starLv] || 0) + 1;
        });

        let eventData = {
            card_count: bagDatas.length,
            card_ids: bagDatas.map((item) => item.rewardConfigId),
            card_star_level_counts: starLevelCounts, // 改为统计对象
        }
        DataReportMgr.instance.track(DataReporEvents.ViewBackpackThisGame, eventData);
    }
    private addTrackViewBackpackOtherGame(otherGameDatas: OtherGameItemData[]): void {
        let eventData = {
            item_count: otherGameDatas.length,
            item_list: otherGameDatas,
        }
        DataReportMgr.instance.track(DataReporEvents.ViewBackpackOtherGame, eventData);
    }
    private addTrackViewBackpackMessage(messageDatas: messages[]): void {
        let eventData = {
            message_count: messageDatas.length,
            messages: messageDatas,
        }
        DataReportMgr.instance.track(DataReporEvents.ViewBackpackMessage, eventData);
    }

    private addTrackConfirmUseRichCard(useStarCardData: GoodsItemData): void {
        let eventData = {
            card_id: useStarCardData.rewardConfigId,
            card_name: useStarCardData.name,
            target_game: useStarCardData.gameName,
            required_balance: useStarCardData.balanceRequired,
            required_bet: useStarCardData.betValue,
            available_from: useStarCardData.rewardDate,
            available_until: useStarCardData.expiryDate,
            source_tab: "this_game",
            use_result: "success",
        }
        DataReportMgr.instance.track(DataReporEvents.ConfirmUseRichCard, eventData);
    }

    private addTrackClickBackpackItem(data: OtherGameItemData): void {
        let eventData = {
            card_id: "",
            card_name: data.name,
            target_game: data.gameName,
            source_tab: "other_game"
        }
        DataReportMgr.instance.track(DataReporEvents.ClickBackpackItem, eventData);
    }


    private addTrackConfirmUseOtherGameRichcard(data: OtherGameItemData): void {
        let eventData = {
            card_name: data.name,
            target_game: data.gameName,
            source_tab: "other_game",
            use_result: "success",
        }
        DataReportMgr.instance.track(DataReporEvents.ConfirmUseRichCard, eventData);
    }
    private addTrackCancelOrCloseOtherGameRichcard(event: string, data: OtherGameItemData): void {
        let eventData = {
            card_id: "",
            card_name: data.name,
            target_game: data.gameName,
            source_tab: "other_game"

        }
        DataReportMgr.instance.track(event, eventData);
    }



    //设置loadingUI位置 1中间 2底部
    private setLodingUIPosType(type: number): void {
        switch (type) {
            case 1:
                this.loadingUI.node.setPosition(0, 41, 0);
                break;
            case 2:
                this.loadingUI.node.setPosition(0, -313, 0);
                break;
        }
    }
    // =============== 工具方法 ===============

    protected onDestroy(): void {
        super.onDestroy();
        ActivityDataMgr.instance.off(
            ActivityDataMgrEventsType.updateBagData,
            this.onUpdateBagData,
            this
        );
        ActivityDataMgr.instance.off(
            ActivityDataMgrEventsType.updateOtherGameData,
            this.onUpdateOtherGameData,
            this
        );
        ActivityEventMgr.instance.off(
            ActivityEventMgrEventsType.useGoodsSuccess,
            this.onUseStarCardSuccess,
            this
        );
        ActivityEventMgr.instance.off(
            ActivityEventMgrEventsType.hideStarCard,
            this.onHideStarCard,
            this
        );
        this._useStarCardData = null;

        let activeTabMap = {
            0: "this_game",
            1: "other_game",
            2: "message",
        }
        DataReportMgr.instance.track(DataReporEvents.ExitBackpackPage, { active_tab: activeTabMap[this._tabIndex] });

    }
    private testGoodsData(): void {
        this._bagDatas = getGoodsdatas();
        this._otherGameDatas = getOtherGameDatas();

        function getGoodsdatas(): GoodsItemData[] {
            let arr: GoodsItemData[] = [];
            for (let i: number = 0; i < 30; i++) {
                let item: GoodsItemData = new GoodsItemData();
                item.name = "糖果" + i;
                item.balanceRequired = 10000;
                item.betValue = 100;
                item.rewardId = "1";
                item.rewardType = "2";
                item.gameId = "1";
                arr.push(item);
            }
            return arr;
        }
        function getOtherGameDatas(): OtherGameItemData[] {
            let arr: OtherGameItemData[] = [];
            for (let i: number = 0; i < 30; i++) {
                let item: OtherGameItemData = new OtherGameItemData();
                item.name = "糖果" + i;
                item.totalCount = 100;
                arr.push(item);
            }
            return arr;
        }
    }
}

// =============== 辅助数据结构 ===============
/**
 * 物品类型枚举
 */
enum GoodsType {
    /** 本局游戏物品 */
    THIS_GAME = 0,
    /** 其他游戏物品 */
    OTHER_GAME = 1,
}
