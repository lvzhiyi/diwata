import { _decorator, Button, Component, isValid, Label, Node, Sprite, SpriteFrame } from "cc";
const { ccclass, property } = _decorator;
import { ActivityDialogViewBase } from "../../../common/script/DialogView/ActivityDialogViewBase";
import { ActivityDialogViewID } from "db://assets/common/script/DialogView/ActivityDialogViewID";
import { ActivityUtils } from "db://assets/common/script/tools/ActivityUtils";
import { AchievementItemInfo } from "db://assets/common/script/network/http/HttpDataModels/ResAchievement";

@ccclass("AchievementBadgeDetailsView")
export class AchievementBadgeDetailsView extends ActivityDialogViewBase {
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.achievementBadgeDetails;

    @property(Node)
    private closeButton: Node | null = null;

    @property(Label)
    private titleLabel: Label | null = null;

    @property(Label)
    private detailsLabel: Label | null = null;

    @property(Sprite)
    private icon: Sprite | null = null;

    protected onLoad(): void {
        this.closeButton?.on(Button.EventType.CLICK, this.onCloseButton, this);
    }

    setData(data: AchievementItemInfo) {
        console.log("data",data);
        this.titleLabel.string = data.name;
        this.detailsLabel.string = `Info: ${data.description}`;
        ActivityUtils.loadServerImage(
            data.iconUrl,
            (spriteFrame: SpriteFrame) => {
                this.icon && isValid(this.icon) && (this.icon.spriteFrame = spriteFrame);
            },
            (error: Error) => {
                this.icon && isValid(this.icon) && (this.icon.node.getChildByName("LoadFailed").active = true);
            }
        );
    }

    private onCloseButton() {
        this.close();
    }
}
