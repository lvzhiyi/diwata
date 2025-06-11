import { _decorator, Component, Label, Node, RichText, UITransform } from "cc";
import { messages } from "db://assets/common/script/network/http/HttpDataModels/ResGetHistoryMessage";
import { ActivityUtils } from "db://assets/common/script/tools/ActivityUtils";
const { ccclass, property } = _decorator;

@ccclass("BagMessageItem")
export class BagMessageItem extends Component {
    @property(RichText)
    richText: RichText = null;
    @property(Node)
    usage_record: Node = null;
    @property(Node)
    acquisition_record: Node = null;
    start() {}
    private _data: messages = null;
    public setData(data: messages): void {
        this._data = data;
        if (data.type == 6) {
            this.usage_record.active = true;
            this.acquisition_record.active = false;
            this.updateUsageRecord();
            this.node.getComponent(UITransform).height = 120;
        } else {
            this.usage_record.active = false;
            this.acquisition_record.active = true;
            this.updateAcquisitionRecord();
            this.node.getComponent(UITransform).height = 296;
        }
    }
    private updateUsageRecord(): void {
        let str =
            "Use " +
            ActivityUtils.createRichTextHTML(this._data.rewardName, 20, false, "#FFDE45") +
            "\n" +
            'Please check the "BetRecord" for more details.' +
            "\n" +
            ActivityUtils.createRichTextHTML(
                ActivityUtils.convertDateTimeFormat(this._data.createTime),
                20,
                false,
                "#FFDE45"
            );
        this.richText.string = str;
    }
    private updateAcquisitionRecord(): void {
        this.acquisition_record.getChildByName("source_txt").getComponent(Label).string =
            this.getTitle(this._data.type);
        let missionName: string = "";
        if (this._data.type != 3) {
            missionName = this._data.missionName;
        } else {
            missionName = this._data.missionDescription;
        }
        this.acquisition_record.getChildByName("mission_txt").getComponent(Label).string =
            missionName;
        if (this._data.rewardDetails) {
            this.acquisition_record.getChildByName("reward_txt").getComponent(Label).string =
                this._data.rewardName + "x" + this._data.rewardDetails.count;
        } else {
            this.acquisition_record.getChildByName("reward_txt").getComponent(Label).string =
                this._data.rewardName;
        }
        this.acquisition_record.getChildByName("date_txt").getComponent(Label).string =
            ActivityUtils.convertDateTimeFormat(this._data.createTime);
    }
    private getTitle(type: number): string {
        switch (type) {
            case 1:
                return "Congrats on completing the achievement."; //成就
            case 2:
                return "Congrats on getting the treasure chest."; //宝箱
            case 3:
                return "Congrats on completing the mission."; //每日任务
            case 4:
                return "Congrats on completing the achievement."; //成就
            case 5:
                return "Congrats on getting the treasure chest."; //宝箱
        }
    }
}
