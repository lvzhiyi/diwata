import { _decorator, Component, Label, Node } from "cc";
import { GiftBoxGoodsItem } from "./GiftBoxGoodsItem";
import { GiftBoxReward } from "db://assets/common/script/data/dataModels/GiftBoxItemData";
import { DataReportMgr } from "db://assets/common/script/managers/DataReportMgr";
import { DataReporEvents } from "db://assets/common/script/data/dataModels/DataReporEvents";
const { ccclass, property } = _decorator;

@ccclass("GiftRewardPopupPanel")
// 礼包奖励弹窗
export class GiftRewardPopupPanel extends Component {
    @property(GiftBoxGoodsItem)
    goodsItem: GiftBoxGoodsItem = null;
    @property(Label)
    countLabel: Label = null;
    private _goodsItemData: GiftBoxReward = null;
    private _vipLevel: number = 0;

    start() { }

    update(deltaTime: number) { }
    public open(goodsItemData: GiftBoxReward, vipLevel: number): void {
        this.node.active = true;
        this._goodsItemData = goodsItemData;
        this.goodsItem.setData(this._goodsItemData, false, false);
        this.countLabel.string = "x" + this._goodsItemData.count;
        this._vipLevel = vipLevel;


    }

    private onClick(): void {
        this.addTrackConfirmWinMoreReward(this._vipLevel);
        this.node.active = false;
    }
    private onClose(): void {
        this.addTrackExitWinMoreRewardConfirm();
        this.node.active = false;
    }

    onDestroy(): void {

    }

    /**
     * 添加点击确认获取宝箱奖励的跟踪
     */
    private addTrackConfirmWinMoreReward(vipLevel: number): void {
        let eventData = {
            chest_id: this._goodsItemData.rewardConfigId,
            vip_level: `VIP${vipLevel}`,
            reward_type: this._goodsItemData.rewardConfigId,
            reward_quantity: this._goodsItemData.count,
            card_star_level: this._goodsItemData.starLevel,
        }
        DataReportMgr.instance.track(DataReporEvents.ConfirmWinMoreReward, eventData);
    }
    /**
     * 添加点击退出获取宝箱奖励的跟踪
     */
    private addTrackExitWinMoreRewardConfirm(): void {
        let eventData = {
            chest_id: this._goodsItemData.rewardConfigId,
            vip_level: `VIP${this._vipLevel}`,
            reward_type: this._goodsItemData.rewardConfigId,
            reward_quantity: this._goodsItemData.count,
            card_star_level: this._goodsItemData.starLevel,
        }
        DataReportMgr.instance.track(DataReporEvents.ExitWinMoreRewardConfirm, eventData);
    }
}
