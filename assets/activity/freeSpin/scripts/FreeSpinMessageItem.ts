import { _decorator, Component, Label, Node } from "cc";
import { FreeSpinHistoryItemData } from "db://assets/common/script/data/dataModels/FreeSpinHistoryItemData";
const { ccclass, property } = _decorator;

@ccclass("FreeSpinMessageItem")
export class FreeSpinMessageItem extends Component {
    @property(Label)
    private game_name_txt: Label = null;
    @property(Label)
    private free_spins_txt: Label = null;
    @property(Label)
    private free_bet_txt: Label = null;
    @property(Label)
    private total_win_txt: Label = null;
    @property(Label)
    private time_txt: Label = null;
    public setData(data: FreeSpinHistoryItemData) {
        this.game_name_txt.string = data.gameName;
        this.free_spins_txt.string = data.usedCount.toString();
        this.free_bet_txt.string = data.freeBet.toString();
        this.total_win_txt.string = data.totalWin.toString();
        this.time_txt.string = convertSecondsToDateTime(data.firstUsedTime);
        function convertSecondsToDateTime(timestamp: number): string {
            const date = new Date(timestamp * 1000);
            const year = date.getFullYear();
            const month =
                date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`;
            const day = date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`;
            const hours = date.getHours() < 10 ? `0${date.getHours()}` : `${date.getHours()}`;
            const minutes =
                date.getMinutes() < 10 ? `0${date.getMinutes()}` : `${date.getMinutes()}`;
            const seconds =
                date.getSeconds() < 10 ? `0${date.getSeconds()}` : `${date.getSeconds()}`;

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
    }
}
