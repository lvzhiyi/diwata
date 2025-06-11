import { _decorator, Component, Label, Node, Sprite, SpriteFrame } from "cc";
import { GoodsItemData } from "db://assets/common/script/data/dataModels/GoodsItemData";
import { ResGetRewardDetail } from "db://assets/common/script/network/http/HttpDataModels/ResGetRewardDetail";
import { ActivityServicesMgr } from "db://assets/common/script/network/http/services/ActivityServicesMgr";
import { ActivityUtils } from "db://assets/common/script/tools/ActivityUtils";
import { Handler } from "db://assets/common/script/tools/Handler";
import { BagGoodsItem } from "./BagGoodsItem";
import { HttpDataBase } from "db://assets/common/script/network/http/services/HttpDataBase";
import { DataReportMgr } from "db://assets/common/script/managers/DataReportMgr";
import { DataReporEvents } from "db://assets/common/script/data/dataModels/DataReporEvents";
const { ccclass, property } = _decorator;

@ccclass("BagItemDetailProgram")
/**物品详情*/
export class BagItemDetailProgram extends Component {
    @property(Label)
    bet_txt: Label = null;
    @property(Label)
    name_txt: Label = null;
    @property(Label)
    balance_txt: Label = null;
    @property(Label)
    date_txt: Label = null;
    @property(Label)
    info_txt: Label = null;
    @property(Sprite)
    star_img: Sprite = null; //星级
    @property(SpriteFrame)
    star_frames: SpriteFrame[] = [];
    @property(BagGoodsItem)
    goodsItem: BagGoodsItem = null;
    @property(Node)
    loadingNode: Node = null;
    private _callback: Handler<GoodsItemData>;
    private _goodsItemData: GoodsItemData;
    private _handler: Handler<HttpDataBase<ResGetRewardDetail>> = null;
    start() {
        this.hideLoading();
    }

    update(deltaTime: number) { }
    public setCallback(callback: Handler<GoodsItemData>): void {
        this._callback = callback;
    }
    private onClick(e, data: string): void {
        switch (data) {
            case "use":
                this._callback.runWith(this._goodsItemData);
                break;

            case "close":
                this.close();
                break;
        }
    }
    public setData(data: GoodsItemData): void {
        this.node.active = true;
        this._goodsItemData = data;
        this.goodsItem.setData(data);
        this.bet_txt.string = "₱" + data.betValue;
        this.name_txt.string = data.name;
        this.info_txt.string = "";
        this.balance_txt.string = "₱" + ActivityUtils.formatNumber(data.balanceRequired);
        this.star_img.spriteFrame = this.star_frames[data.starLv - 1];
        this._handler = new Handler<HttpDataBase<ResGetRewardDetail>>(this, this.updateInfo);
        this.date_txt.string =
            ActivityUtils.convertDateTimeFormat(data.rewardDate) +
            "\n" +
            ActivityUtils.convertDateTimeFormat(data.expiryDate);
        ActivityServicesMgr.instance.getRewardDetail(data.rewardConfigId, this._handler);
        this.addTrackClickUseRichCard(data);

    }
    public showLoading(): void {
        this.loadingNode.active = true;
    }
    public hideLoading(): void {
        this.loadingNode.active = false;
    }
    public close(): void {
        this.node.active = false;
        if (this._handler) {
            this._handler.clear();
        }

    }
    //更新详细信息
    private updateInfo(data: HttpDataBase<ResGetRewardDetail>): void {
        if (data.isSuccessful) {
            let resGetRewardDetail: ResGetRewardDetail = data.data;
            this.info_txt.string = resGetRewardDetail.details.description;
        }
    }


    onDestroy() {
        if (this._handler) {
            this._handler.clear();
            this._handler = null;
        }
        this.addTrackExitRichCardPage();
    }

    /**
     * 添加点击使用星卡的跟踪
     * @param data 
     */
    private addTrackClickUseRichCard(data: GoodsItemData): void {
        let eventData = {
            card_id: data.rewardConfigId,
            card_name: data.name,
            target_game: data.gameName,
            required_balance: data.balanceRequired,
            required_bet: data.betValue,
            available_from: data.rewardDate,
            available_until: data.expiryDate,
            source_tab: "this_game",
            use_result: "success"
        }
        DataReportMgr.instance.track(DataReporEvents.ClickUseRichCard, eventData);
    }

    /**
     * 添加退出星卡页面的跟踪
     */
    private addTrackExitRichCardPage(): void {
        let eventData = {
            card_id: this._goodsItemData.rewardConfigId,
            card_name: this._goodsItemData.name,
            source_tab: "this_game",
        }
        DataReportMgr.instance.track(DataReporEvents.ExitRichCardPage, eventData);
    }
}
