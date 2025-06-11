import { _decorator, Component, Label, Node } from "cc";
import { ActivityDataMgr } from "db://assets/common/script/data/ActivityDataMgr";
import { FreeSpinItemData } from "db://assets/common/script/data/dataModels/FreeSpinItemData";
const { ccclass, property } = _decorator;

@ccclass("OtherGameItem")
export class OtherGameItem extends Component {
    @property(Label)
    private nameLabel: Label = null;
    @property(Label)
    private timeLabel: Label = null;
    @property(Label)
    private free_spins_txt: Label = null;
    private _data: FreeSpinItemData = null;
    public setData(data: FreeSpinItemData): void {
        this._data = data;
        this.nameLabel.string = this._data.campaignName;
        let time = this._data.expireDate - ActivityDataMgr.instance.getTimestamp() / 1000;
        this.timeLabel.string = convertMillisecondsToDHM(time);
        this.free_spins_txt.string = this._data.remainingCount.toString();
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
    public getData(): FreeSpinItemData {
        return this._data;
    }
    private onClick(data: string): void {}
}
