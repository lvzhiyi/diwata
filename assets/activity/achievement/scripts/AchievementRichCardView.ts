import { _decorator, Component, Node, Sprite, Label, SpriteFrame, Button, isValid } from "cc";
import { ActivityDialogViewID } from "db://assets/common/script/DialogView/ActivityDialogViewID";
import { ActivityDialogViewBase } from "../../../common/script/DialogView/ActivityDialogViewBase";
import { ActivityUtils } from "db://assets/common/script/tools/ActivityUtils";
import { ActivityServicesMgr } from "db://assets/common/script/network/http/services/ActivityServicesMgr";
import { ResGetRewardDetail } from "db://assets/common/script/network/http/HttpDataModels/ResGetRewardDetail";
import { RewardItemInfo } from "db://assets/common/script/network/http/HttpDataModels/ResAchievement";
import { Handler } from "db://assets/common/script/tools/Handler";
import { HttpDataBase } from "db://assets/common/script/network/http/services/HttpDataBase";
const { ccclass, property } = _decorator;

@ccclass("AchievementRichCardView")
export class AchievementRichCardView extends ActivityDialogViewBase {
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.achievementRichCard;

    @property(Node)
    closeButton: Node = null;

    @property(Sprite)
    levelSprite: Sprite = null;

    @property(Sprite)
    richCardIcon: Sprite = null;

    @property(Label)
    gameNameLabel: Label = null;

    @property(Label)
    detailsLabel: Label = null;

    @property(SpriteFrame)
    levelSpriteFrames: SpriteFrame[] = [];

    onLoad() {
        this.closeButton?.on(Button.EventType.CLICK, this.onCloseButton, this);
    }

    setData(data: RewardItemInfo[]) {
        ActivityServicesMgr.instance.getRewardDetail(
            data[0].rewardConfigId,
            new Handler(this, (data: HttpDataBase<ResGetRewardDetail>) => {
                if (data.isSuccessful) {
                    this.gameNameLabel.string = "Play SM Slot Games";
                    this.detailsLabel.string = `Info: ${data.data.details.description}`;
                    this.levelSprite.spriteFrame =
                        this.levelSpriteFrames[data.data.details.starLevel - 1];
                    ActivityUtils.loadServerImage(
                        data.data.details.imgUrl,
                        (spriteFrame: SpriteFrame) => {
                            this.richCardIcon && isValid(this.richCardIcon) && (this.richCardIcon.spriteFrame = spriteFrame);
                        },
                        (error: Error) => {
                            this.richCardIcon && isValid(this.richCardIcon) && (this.richCardIcon.node.getChildByName("LoadFailed").active = true);
                        }
                    );
                }
            })
        );
    }

    private onCloseButton() {
        this.close();
    }
}
