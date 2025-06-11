import { _decorator, Color, Event, instantiate, Label, Node, Prefab, sp, tween, Vec3 } from "cc";
import { ActivityDialogViewBase } from "db://assets/common/script/DialogView/ActivityDialogViewBase";
import { ActivityDialogViewID } from "db://assets/common/script/DialogView/ActivityDialogViewID";
import { SuperLayout } from "db://assets/common/script/tools/superScrollView/super-layout";
import { Handler } from "db://assets/common/script/tools/Handler";
import { ActivityConfigDataMgr } from "db://assets/common/script/data/ActivityConfigDataMgr";
import {
    ActivityDataMgr,
    ActivityDataMgrEventsType,
} from "db://assets/common/script/data/ActivityDataMgr";
import { HttpDataBase } from "db://assets/common/script/network/http/services/HttpDataBase";
import { ActivityServicesMgr } from "db://assets/common/script/network/http/services/ActivityServicesMgr";
import { ActivitySmallLoadingUI } from "db://assets/common/script/tools/ActivitySmallLoadingUI";
import { FreeSpinItemDetailProgram } from "./FreeSpinItemDetailProgram";
import { ThisGameItem } from "./ThisGameItem";
import { ActivityGlobleMgr } from "db://assets/common/script/managers/ActivityGlobleMgr";
import { OtherGameItem } from "./OtherGameItem";
import { FreeSpinMessageItem } from "./FreeSpinMessageItem";
import { ResFreeSpinHistoryOfPlayer } from "db://assets/common/script/network/http/HttpDataModels/ResfreeSpinHistoryOfPlayer";
import { ConfirmCancelPanel } from "db://assets/common/script/DialogView/views/ConfirmCancelPanel";
import { PackageFacade } from "db://assets/common/script/PackageFacade";
import { FreeSpinHistoryItemData } from "db://assets/common/script/data/dataModels/FreeSpinHistoryItemData";
import { FreeSpinItemData } from "db://assets/common/script/data/dataModels/FreeSpinItemData";
import { DataReportMgr } from "db://assets/common/script/managers/DataReportMgr";
import { DataReporEvents } from "db://assets/common/script/data/dataModels/DataReporEvents";
import { ActivityUtils } from "db://assets/common/script/tools/ActivityUtils";
const { ccclass, property } = _decorator;

@ccclass("FreeSpinDialogView")
export class FreeSpinDialogView extends ActivityDialogViewBase {
    // =============== 界面组件引用 ===============
    @property(FreeSpinItemDetailProgram)
    private itemDetailProgram: FreeSpinItemDetailProgram = null;
    @property(Prefab)
    private confirmCancelPanel: Prefab = null;
    @property(Node)
    private tabButtons: Node[] = [];
    @property(ActivitySmallLoadingUI)
    private loadingUI: ActivitySmallLoadingUI = null;
    @property(Node)
    listNodes: Node[] = [];
    @property(SuperLayout)
    superLists: SuperLayout[] = [];
    @property(Node)
    private img_notyet: Node = null;
    @property(Node)
    private tipsNode: Node = null;
    @property(FreeSpinItemDetailProgram)
    private freeSpinItemDetailProgram: FreeSpinItemDetailProgram = null;
    @property(Prefab)
    private freeSpinEffectDialogView: Prefab = null;
    // =============== 私有属性 ===============
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.freeSpin;
    private _tabIndex: number = -1;
    private _thisGameDatas: FreeSpinItemData[] = [];
    private _otherGameDatas: FreeSpinItemData[] = [];
    private _isUpdateMessageDataIng: boolean = false;
    private _messageDatas: FreeSpinHistoryItemData[] = [];
    private _resGetHistoryMessage: ResFreeSpinHistoryOfPlayer = null;
    private _confirmPauseFreeSpinItemData: FreeSpinItemData = null;
    private _confirmSwitchGameFreeSpinItemData: FreeSpinItemData = null;
    // =============== 生命周期方法 ===============
    start() {
        ActivityDataMgr.instance.updateFreeSpinData();
        this.initUI();
        this.initEvents();
        DataReportMgr.instance.track(DataReporEvents.ClickMenuFreeSpins);
    }

    // =============== 初始化方法 ===============
    private initUI(): void {
        this.itemDetailProgram.close();
        this.node.getChildByName("content").active = true;
        this.node.getChildByName("bg_mask").active = true;
        this.tipsNode.active = false;
        this.img_notyet.active = false;
        this.setTabIndex(0);
    }
    private initEvents(): void {
        ActivityDataMgr.instance.on(
            ActivityDataMgrEventsType.updateFreeSpinData,
            this.onUpdateFreeSpinData,
            this
        );
        this.superLists[0].selectedClick = (data: Node) => {
            this.onThisListSelected(data.getComponent(ThisGameItem));
        };
        this.superLists[1].selectedClick = (data: Node) => {
            this.onOtherListSelected(data.getComponent(OtherGameItem));
        };
        ActivityDataMgr.instance.on(
            ActivityDataMgrEventsType.updateFreeSpinCampaignId,
            this.onUpdateFreeSpinCampaignId,
            this
        );
    }
    // =============== 事件处理方法 ===============
    private onUpdateFreeSpinData(): void {
        this._thisGameDatas = ActivityDataMgr.instance.getThisGameFreeSpinDatas();
        this._otherGameDatas = ActivityDataMgr.instance.getOtherGameFreeSpinDatas();
        if (this._tabIndex == 0) {
            this.updateThisGameGoodsList();
        } else if (this._tabIndex == 1) {
            this.updateOtherGameGoodsList();
        }
    }
    private onUpdateFreeSpinCampaignId(): void {
        if (this._tabIndex == 0) {
            this.superLists[0].updateItems();
        }
    }
    private onThisListSelected(item: ThisGameItem): void {
        let data: FreeSpinItemData = item.getData();
        if (data) {
            this.freeSpinItemDetailProgram.open(data);
            this.addClickFreeSpinsDetailTrack(data);
        }
    }
    private onOtherListSelected(item: OtherGameItem): void {
        let data: FreeSpinItemData = item.getData();
        this.openConfirmCancelPanel(data);
        this._confirmSwitchGameFreeSpinItemData = data;
        this.addClickGoToFreeSpinsTrack(data);
    }
    tabClick(e: Event, data: string): void {
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
    onClick(e: Event, data: string): void {
        let tabMap = new Map<Number, String>([
            [0, "this_game"],
            [1, "other_game"],
            [2, "history"],
        ]);
        switch (data) {
            case "close":
                DataReportMgr.instance.track(DataReporEvents.ClickMenuFreeSpins, {
                    active_tab: tabMap.get(this._tabIndex),
                });
                DataReportMgr.instance.track(DataReporEvents.ExitFreeSpinsPage, {
                    active_tab: tabMap.get(this._tabIndex),
                });
                this.close();
                break;
            case "tipsClose":
                this.tipsNode.active = false;
                DataReportMgr.instance.track(DataReporEvents.ExitFreeSpinsRule, {
                    active_tab: tabMap.get(this._tabIndex),
                });
                break;

            case "tips_btn":
                this.tipsNode.active = true;
                DataReportMgr.instance.track(DataReporEvents.ViewFreeSpinsRule, {
                    source_tab: tabMap.get(this._tabIndex),
                });
                break;
        }
    }
    onThisListRefresh(node: Node, index: number): void {
        let data = this._thisGameDatas[index];
        node.getComponent(ThisGameItem).setData(
            data,
            new Handler(this, this.onThisListHeightChange),
            new Handler(this, this.onThisListPause)
        );
        this._confirmPauseFreeSpinItemData = data;
    }
    onMessageListRefresh(node: Node, index: number): void {
        let data = this._messageDatas[index];
        node.getComponent(FreeSpinMessageItem).setData(data);
        if (!this._isUpdateMessageDataIng) {
            if (index == this._messageDatas.length - 2) {
                this.updateMessageData();
            }
        }
    }
    onOtherListRefresh(node: Node, index: number): void {
        let data = this._otherGameDatas[index];
        node.getComponent(OtherGameItem).setData(data);
    }
    //高度变化
    private onThisListHeightChange(): void {
        this.superLists[0].scrollView.stopAutoScroll();
        this.superLists[0].resetChilds();
    }
    //取消freeSpin
    private onThisListPause(data: FreeSpinItemData): void {
        this.openConfirmCancelFreeSpin(data);
    }
    private onUpdateMessageData(data: HttpDataBase<ResFreeSpinHistoryOfPlayer>): void {
        this.removeHandler(this.onUpdateMessageData);
        this.loadingUI.hide();
        if (data.isSuccessful) {
            this._resGetHistoryMessage = data.data;
            this._isUpdateMessageDataIng = false;
            if (data.data.history) {
                this._messageDatas = this._messageDatas.concat(
                    data.data.history.map((item) =>
                        FreeSpinHistoryItemData.toFreeSpinHistoryItemData(item)
                    )
                );
            }
            // //todo 测试数据
            // this._messageDatas = this._messageDatas.concat(this.getTestMessageData());
            this.superLists[2].total(this._messageDatas.length);
            if (this._messageDatas.length == 0) {
                this.img_notyet.active = true;
            } else {
                this.img_notyet.active = false;
            }

            const eventData = {
                history_list: this._messageDatas,
                history_count: this._messageDatas.length,
            };

            DataReportMgr.instance.track(DataReporEvents.ViewFreeSpinsHistory, eventData);
        }
    }
    private updateMessageData(): void {
        if (this._resGetHistoryMessage) {
            if (this._resGetHistoryMessage.page < this._resGetHistoryMessage.totalPages) {
                this._isUpdateMessageDataIng = true;
                this.setLodingUIPosType(2);
                this.loadingUI.show();
                ActivityServicesMgr.instance.getFreeSpinHistory(
                    this.getHandler(this.onUpdateMessageData),
                    this._resGetHistoryMessage.page + 1,
                    10
                );
            }
        } else {
            this._isUpdateMessageDataIng = true;
            this.setLodingUIPosType(1);
            this.loadingUI.show();
            ActivityServicesMgr.instance.getFreeSpinHistory(
                this.getHandler(this.onUpdateMessageData),
                1,
                10
            );
        }
    }
    private setTabIndex(index: number): void {
        if (this._tabIndex != index) {
            this.img_notyet.active = false;
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
                    this.updateThisGameGoodsList();
                    break;
                case 1:
                    this.updateOtherGameGoodsList();
                    break;
                case 2:
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
        }
    }

    private updateThisGameGoodsList(): void {
        this._thisGameDatas.forEach((item) => {
            item.isSpread = false;
        });
        this._thisGameDatas = ActivityDataMgr.instance.getThisGameFreeSpinDatas();
        // 排序，将campaignId匹配的项放在前面
        this._thisGameDatas.sort((a, b) => {
            const currentCampaignId = ActivityDataMgr.instance.getFreeSpinCampaignId();
            if (a.campaignId === currentCampaignId && b.campaignId !== currentCampaignId) {
                return -1;
            } else if (a.campaignId !== currentCampaignId && b.campaignId === currentCampaignId) {
                return 1;
            }
            return 0;
        });
        if (this._thisGameDatas && this._thisGameDatas.length > 0) {
            this.superLists[0].total(this._thisGameDatas.length);
            this.img_notyet.active = false;
            this.superLists[0].resetChilds();
            this.superLists[0].scrollToHeader();
        } else {
            this.superLists[0].total(0);
            this.img_notyet.active = true;
        }
        DataReportMgr.instance.track(DataReporEvents.ViewFreeSpinsThisGame);
    }

    private updateOtherGameGoodsList(): void {
        this._otherGameDatas = ActivityDataMgr.instance.getOtherGameFreeSpinDatas();
        if (this._otherGameDatas && this._otherGameDatas.length > 0) {
            this.superLists[1].total(this._otherGameDatas.length);
            this.superLists[1].scrollToHeader();
            this.img_notyet.active = false;
        } else {
            this.superLists[1].total(0);
            this.img_notyet.active = true;
        }
        DataReportMgr.instance.track(DataReporEvents.ViewFreeSpinsOtherGame);
    }

    private updateMessageList(): void {
        this._messageDatas.length = 0;
        this._resGetHistoryMessage = null;
        this.updateMessageData();
    }

    private openConfirmCancelPanel(data: FreeSpinItemData): void {
        let content = ActivityConfigDataMgr.instance.getLanguageData(1) + data.gameName + "?";
        let panel = instantiate(this.confirmCancelPanel);
        this.node.addChild(panel);
        panel.getComponent(ConfirmCancelPanel).setContent(content);
        panel
            .getComponent(ConfirmCancelPanel)
            .setConfirmCallback(new Handler(this, this.onConfirm, [data.gameIdRef]));
        panel.getComponent(ConfirmCancelPanel).setCancelCallback(
            new Handler(this, () => {
                this.addConfirmSwitchGameFreeSpinsTrack(
                    this._confirmSwitchGameFreeSpinItemData,
                    "cancel"
                );
            })
        );
        panel.getComponent(ConfirmCancelPanel).setCloseCallback(
            new Handler(this, () => {
                this.addExitSwitchGameFreeSpinsTrack(this._confirmSwitchGameFreeSpinItemData);
            })
        );
    }
    private onConfirm(gameID: string): void {
        PackageFacade.instance.log("跳转其他游戏" + gameID);
        window.parent.postMessage({ type: "switchGame", data: { gameId: gameID } }, "*");
        this.addConfirmSwitchGameFreeSpinsTrack(this._confirmSwitchGameFreeSpinItemData, "confirm");
    }
    //打开确定是否取消freeSpin窗口
    private openConfirmCancelFreeSpin(data: FreeSpinItemData): void {
        let content = ActivityConfigDataMgr.instance.getLanguageData(6);
        let panel = instantiate(this.confirmCancelPanel);
        this.node.addChild(panel);
        panel.getComponent(ConfirmCancelPanel).setContent(content);
        panel
            .getComponent(ConfirmCancelPanel)
            .setConfirmCallback(new Handler(this, this.onConfirmFreeSpin));
        panel.getComponent(ConfirmCancelPanel).setCancelCallback(
            new Handler(this, () => {
                this.addConfirmPauseFreeSpinsTrack(data, "cancel");
            })
        );
        panel.getComponent(ConfirmCancelPanel).setCloseCallback(
            new Handler(this, () => {
                console.log("关闭");

                this.addExitPauseFreeSpinsTrack(data);
            })
        );
    }
    private onConfirmFreeSpin(): void {
        ActivityGlobleMgr.instance.cancelUseFreeSpin();
        this.updateThisGameGoodsList();
        this.addConfirmPauseFreeSpinsTrack(this._confirmPauseFreeSpinItemData, "confirm");
    }

    //设置loadingUI位置 1中间 2底部
    private setLodingUIPosType(type: number): void {
        switch (type) {
            case 1:
                this.loadingUI.node.setPosition(-6, 41, 0);
                break;
            case 2:
                this.loadingUI.node.setPosition(-6, -313, 0);
                break;
        }
    }
    protected onDestroy(): void {
        super.onDestroy();
        ActivityDataMgr.instance.off(
            ActivityDataMgrEventsType.updateFreeSpinData,
            this.onUpdateFreeSpinData,
            this
        );
        ActivityDataMgr.instance.off(
            ActivityDataMgrEventsType.updateFreeSpinCampaignId,
            this.onUpdateFreeSpinCampaignId,
            this
        );
    }
    private getTestMessageData(): FreeSpinHistoryItemData[] {
        let arr: FreeSpinHistoryItemData[] = [];
        for (let i: number = 0; i < 15; i++) {
            let item: FreeSpinHistoryItemData = new FreeSpinHistoryItemData();
            item.gameName = "糖果";
            item.usedCount = 10;
            item.firstUsedTime = new Date().getTime();
            item.totalWin = 1000;
            arr.push(item);
        }
        return arr;
    }

    private addClickFreeSpinsDetailTrack(data: FreeSpinItemData): void {
        const eventData = {
            free_spin_id: data.campaignId,
            free_spins_total: data.remainingCount,
            free_bet_value: data.freeBet,
            total_win: data.totalWin,
            countdown: ActivityUtils.secondFormatDay(
                Math.floor(data.expireDate - ActivityDataMgr.instance.getTimestamp() / 1000)
            ),
        };
        DataReportMgr.instance.track(DataReporEvents.ClickFreeSpinsDetail, eventData);
    }

    private addConfirmPauseFreeSpinsTrack(data: FreeSpinItemData, action: string): void {
        const eventData = {
            free_spin_id: data.campaignId,
            round_number: "",
            remaining_spins: data.remainingCount,
            free_bet_value: data.freeBet,
            total_win: data.totalWin,
            action: action,
        };
        DataReportMgr.instance.track(DataReporEvents.ConfirmPauseFreeSpins, eventData);
    }
    private addExitPauseFreeSpinsTrack(data: FreeSpinItemData): void {
        const eventData = {
            free_spin_id: data.campaignId,
            round_number: "",
            remaining_spins: data.remainingCount,
            free_bet_value: data.freeBet,
            total_win: data.totalWin,
        };
        DataReportMgr.instance.track(DataReporEvents.ExitPauseFreeSpins, eventData);
    }
    private addClickGoToFreeSpinsTrack(data: FreeSpinItemData): void {
        const eventData = {
            free_spin_id: data.campaignId,
            target_game: data.gameName,
            free_spin_count: data.remainingCount,
            countdown: ActivityUtils.secondFormatDay(
                Math.floor(data.expireDate - ActivityDataMgr.instance.getTimestamp() / 1000)
            ),
            entry_point: "go_to_button",
        };
        DataReportMgr.instance.track(DataReporEvents.ClickGoToFreeSpins, eventData);
    }

    private addConfirmSwitchGameFreeSpinsTrack(data: FreeSpinItemData, action: string): void {
        const eventData = {
            free_spin_id: data.campaignId,
            target_game: data.gameName,
            free_spin_count: data.remainingCount,
            countdown: ActivityUtils.secondFormatDay(
                Math.floor(data.expireDate - ActivityDataMgr.instance.getTimestamp() / 1000)
            ),
            entry_point: "go_to_button",
            action: action,
        };
        DataReportMgr.instance.track(DataReporEvents.ConfirmSwitchGameFreeSpins, eventData);
    }
    private addExitSwitchGameFreeSpinsTrack(data: FreeSpinItemData): void {
        const eventData = {
            free_spin_id: data.campaignId,
            target_game: data.gameName,
            free_spin_count: data.remainingCount,
            countdown: ActivityUtils.secondFormatDay(
                Math.floor(data.expireDate - ActivityDataMgr.instance.getTimestamp() / 1000)
            ),
            entry_point: "go_to_button",
        };
        DataReportMgr.instance.track(DataReporEvents.ExitSwitchGameFreeSpins, eventData);
    }
}
