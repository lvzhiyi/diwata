


import { _decorator, Component, Label, Node, UITransform } from "cc";
import { ActivityDataMgr } from "db://assets/common/script/data/ActivityDataMgr";
import { FreeSpin } from "db://assets/common/script/network/http/HttpDataModels/ResFreeSpinOfPlayer";
import { ActivityGlobleMgr } from "db://assets/common/script/managers/ActivityGlobleMgr";
import { FreeSpinItemData } from "db://assets/common/script/data/dataModels/FreeSpinItemData";
import { Handler } from "db://assets/common/script/tools/Handler";
import { DataReportMgr } from "db://assets/common/script/managers/DataReportMgr";
import { DataReporEvents } from "db://assets/common/script/data/dataModels/DataReporEvents";
const { ccclass, property } = _decorator;

@ccclass("ThisGameItem")
export class ThisGameItem extends Component {
    @property(Node)
    state_node_1: Node = null;
    @property(Node)
    state_node_2: Node = null;
    @property(Node)
    pause_btn: Node = null;
    @property(Node)
    continue_btn: Node = null;
    private _state: number = 1; //1简略 2详细
    private _btnState: number = 1; //1使用中 2未使用
    private _data: FreeSpinItemData;
    private _heightChangeCallBack: Handler<null> = null;
    private _pauseCallBack: Handler<FreeSpinItemData> = null;
    start() { }

    update(deltaTime: number) { }
    public setData(
        data: FreeSpinItemData,
        heightChangeCallBack: Handler<null>,
        pauseCallBack: Handler<FreeSpin>
    ) {
        this._data = data;
        this._heightChangeCallBack = heightChangeCallBack;
        this._pauseCallBack = pauseCallBack;
        this.refreshUI();
    }
    public getData(): FreeSpinItemData {
        return this._data;
    }
    /**
     * 设置阶段
     * @param state 1简略 2详细
     */
    private setState(state: number) {
        this._state = state;
        if (this._state == 1) {
            this.node.getComponent(UITransform).height = 91;
            this.state_node_1.active = true;
            this.state_node_2.active = false;
            this._data.isSpread = false;
        } else {
            this.node.getComponent(UITransform).height = 145;
            this.state_node_1.active = false;
            this.state_node_2.active = true;
            this._data.isSpread = true;
        }
    }
    // 刷新界面
    private refreshUI(): void {
        let node: Node = null;
        if (this._data.isSpread && this._data.isSpread) {
            this.setState(2);
        } else {
            this.setState(1);
        }
        this.state_node_1.getChildByName("free_spins_txt").getComponent(Label).string =
            this._data.remainingCount.toString();
        this.state_node_1.getChildByPath("Node/total_win_txt").getComponent(Label).string =
            this._data.totalWin.toString();
        this.state_node_2.getChildByPath("Node/total_win_txt").getComponent(Label).string =
            this._data.totalWin.toString();
        this.state_node_2.getChildByName("free_spins_txt").getComponent(Label).string =
            this._data.remainingCount.toString();
        let time = this._data.expireDate - ActivityDataMgr.instance.getTimestamp() / 1000;
        this.state_node_2.getChildByName("timer_txt").getComponent(Label).string =
            convertMillisecondsToDHM(time);
        this.state_node_2.getChildByName("freeBet_txt").getComponent(Label).string =
            this._data.freeBet.toString();
        if (this._data.campaignId == ActivityDataMgr.instance.getFreeSpinCampaignId()) {
            this._btnState = 1;
        } else {
            this._btnState = 2;
        }
        this.setBtnState(this._btnState);
        function convertMillisecondsToDHM(seconds: number): string {
            const days = Math.floor(seconds / (24 * 60 * 60));
            seconds %= 24 * 60 * 60;

            const hours = Math.floor(seconds / (60 * 60));
            seconds %= 60 * 60;

            const minutes = Math.floor(seconds / 60);

            let result = "";
            if (days > 0) result += `${days}D `;
            if (hours > 0) result += `${hours}H `;
            if (minutes > 0) result += `${minutes}M`;

            // 如果都为0，也返回0M
            return result || "0M";
        }
    }
    /**
     * 设置按钮状态
     * @param btnState 1使用中 2未使用
     */
    private setBtnState(btnState: number) {
        this._btnState = btnState;
        if (this._btnState == 1) {
            this.pause_btn.active = true;
            this.continue_btn.active = false;
        } else {
            this.pause_btn.active = false;
            this.continue_btn.active = true;
        }
    }
    onClick(e: Event, data: string): void {
        switch (data) {
            case "pause":
                this._pauseCallBack.runWith(this._data);
                this.addClickPauseFreeSpinsTrack();
                break;
            case "continue":
                if (ActivityGlobleMgr.instance.useFreeSpin(this._data)) {
                    this.refreshUI();
                    this.addClickContinueFreeSpinsTrack();
                }
                break;
            case "btn_spread": //展开
                this.setState(2);
                this._heightChangeCallBack.run();
                this.addClickFreeSpinsPanelTrack(this._state);
                break;
            case "btn_regain": //收回
                this.setState(1);
                this._heightChangeCallBack.run();
                this.addClickFreeSpinsPanelTrack(this._state);
                break;
        }
    }

    private addClickPauseFreeSpinsTrack(): void {
        const eventData = {
            free_spin_id: this._data.campaignId,
            round_number: "",
            remaining_spins: this._data.remainingCount,
            free_bet_value: this._data.freeBet,
            total_win: this._data.totalWin,
        };
        DataReportMgr.instance.track(DataReporEvents.ClickPauseFreeSpins, eventData);
    }

    private addClickFreeSpinsPanelTrack(state: number): void {
        const eventData = {
            free_spin_id: this._data.campaignId,
            panel_status: state == 1 ? "collapsed" : "expanded",
        };
        DataReportMgr.instance.track(DataReporEvents.ClickFreeSpinsPanel, eventData);
    }

    private addClickContinueFreeSpinsTrack(): void {
        const eventData = {
            free_spin_id: this._data.campaignId,
            round_number: "",
            remaining_spins: this._data.remainingCount,
            free_bet_value: this._data.freeBet,
            total_win: this._data.totalWin,
        };
        DataReportMgr.instance.track(DataReporEvents.ClickContinueFreeSpins, eventData);
    }
}

