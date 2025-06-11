

import { _decorator, Component, Label, Node } from "cc";

import { DataReporEvents } from "../../../common/script/data/dataModels/DataReporEvents";
import { DataReportMgr } from "db://assets/common/script/managers/DataReportMgr";
import { FreeSpinItemData } from "db://assets/common/script/data/dataModels/FreeSpinItemData";

const { ccclass, property } = _decorator;

@ccclass("FreeSpinItemDetailProgram")
export class FreeSpinItemDetailProgram extends Component {
    @property(Label)
    toWin_txt: Label = null;
    @property(Label)
    id_txt: Label = null;
    start() { }

    update(deltaTime: number) { }
    private _data: FreeSpinItemData;
    public close() {
        this.node.active = false;
    }
    public open(data: FreeSpinItemData) {
        this.node.active = true;
        this.toWin_txt.string = data.totalWin.toString();
        this.id_txt.string = data.campaignId.toString();
        this._data = data;
    }
    onClick() {
        const eventData = {
            free_spin_id: this._data.campaignId,
            round_number: "",
            remaining_spins: this._data.remainingCount,
            free_bet_value: this._data.freeBet,
            total_win: this._data.totalWin,
        };
        DataReportMgr.instance.track(DataReporEvents.ExitFreeSpinsDetail, eventData);
        this.close();
    }
}

