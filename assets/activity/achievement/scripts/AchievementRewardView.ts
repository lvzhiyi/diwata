import { _decorator, Button, Component, isValid, Label, Node, Sprite, SpriteFrame } from "cc";
import { ActivityDialogViewBase } from "../../../common/script/DialogView/ActivityDialogViewBase";
import { ActivityDialogViewID } from "../../../common/script/DialogView/ActivityDialogViewID";
import { ActivityUtils } from "db://assets/common/script/tools/ActivityUtils";
import { DataReportMgr } from "db://assets/common/script/managers/DataReportMgr";
import { DataReporEvents } from "db://assets/common/script/data/dataModels/DataReporEvents";
import { RedeemAchievementData, RewardItemInfo } from "db://assets/common/script/network/http/HttpDataModels/ResAchievement";
const { ccclass, property } = _decorator;

@ccclass("AchievementRewardView")
export class AchievementRewardView extends ActivityDialogViewBase {
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.achievementReward;

    @property(Node)
    closeButton: Node = null;
    @property(Node)
    confirmButton: Node = null;

    @property(Sprite)
    iconSprite: Sprite = null;

    @property(Label)
    amountLabel: Label = null;

    @property(SpriteFrame)
    levelSpriteFrames: SpriteFrame[] = [];



    private _reward: RewardItemInfo = null;

    onLoad() {
        this.closeButton?.on(Button.EventType.CLICK, this.onCloseButton, this);
        this.confirmButton?.on(Button.EventType.CLICK, this.onConfirmButton, this);
    }

    setData(data: RewardItemInfo) {

        this._reward = data;
        this.amountLabel.string = `X${data.count}`;
        ActivityUtils.loadServerImage(
            data.imgUrl,
            (spriteFrame: SpriteFrame) => {
                this.iconSprite && isValid(this.iconSprite) && (this.iconSprite.spriteFrame = spriteFrame);
            },
            (error: Error) => {
                this.iconSprite && isValid(this.iconSprite) && (this.iconSprite.node.getChildByName("LoadFailed").active = true);
            }
        );
    }

    private onCloseButton() {
        this.addTrackExitAchievementRewardPreview();
        this.close();
    }

    private onConfirmButton() {
        this.addTrackConfirmReceiveAchievementReward();
        this.close();
    }

    private addTrackConfirmReceiveAchievementReward() {
        let eventData = {
            task_id: this._reward.rewardConfigId,
            reward_type: "",
            reward_quantity: this._reward.count,
            card_star_level: this._reward.starLevel,
        }
        DataReportMgr.instance.track(DataReporEvents.ConfirmReceiveAchievementReward, eventData);
    }

    private addTrackExitAchievementRewardPreview() {
        let eventData = {
            task_id: this._reward.rewardConfigId,
            reward_type: "",
            reward_quantity: this._reward.count,
            card_star_level: this._reward.starLevel,
        }
        DataReportMgr.instance.track(DataReporEvents.ExitReceiveAchievementConfirm, eventData);
    }
}
