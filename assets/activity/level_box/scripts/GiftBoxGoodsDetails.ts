import { _decorator, Component, Label, Node, Sprite, SpriteFrame } from "cc";
import { GiftBoxGoodsItem } from "./GiftBoxGoodsItem";
import { GiftBoxReward } from "db://assets/common/script/data/dataModels/GiftBoxItemData";
import { ActivityServicesMgr } from "db://assets/common/script/network/http/services/ActivityServicesMgr";
import { ResGetRewardDetail } from "db://assets/common/script/network/http/HttpDataModels/ResGetRewardDetail";
import { HttpDataBase } from "db://assets/common/script/network/http/services/HttpDataBase";
import { ActivityDialogViewBase } from "db://assets/common/script/DialogView/ActivityDialogViewBase";
import { ActivityDialogViewID } from "db://assets/common/script/DialogView/ActivityDialogViewID";
const { ccclass, property } = _decorator;

@ccclass("GiftBoxGoodsDetails")
export class GiftBoxGoodsDetails extends ActivityDialogViewBase {
    @property(SpriteFrame)
    spriteFrames: Array<SpriteFrame> = [];
    @property(Sprite)
    starSprite: Sprite = null;
    @property(Label)
    nameLabel: Label = null;
    @property(Label)
    infoLabel: Label = null;
    @property(Node)
    goodsItem: Node = null;
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.giftBoxGoodsDetails;
    private _data: GiftBoxReward = null;
    private _isStart: boolean = false;
    start() {
        this._isStart = true;
        this.updataUI();
    }

    public setData(data: GiftBoxReward): void {
        this._data = data;
        ActivityServicesMgr.instance.getRewardDetail(
            this._data.rewardConfigId,
            this.getHandler(this.updateDetail)
        );
        if (this._isStart) {
            this.updataUI();
        }
    }
    private updataUI(): void {
        if (!this._isStart || !this._data) {
            return;
        }
        this.goodsItem.getComponent(GiftBoxGoodsItem).setData(this._data, false);
        this.starSprite.spriteFrame = this.spriteFrames[this._data.starLevel - 1];
        this.nameLabel.string = this._data.name;
    }
    private updateDetail(data: HttpDataBase<ResGetRewardDetail>): void {
        this.removeHandler(this.updateDetail);
        if (data.isSuccessful) {
            let resGetRewardDetail: ResGetRewardDetail = data.data;
            this.infoLabel.string = resGetRewardDetail.details.description;
        }
    }
    onCloseClick(): void {
        this.close();
    }
}
