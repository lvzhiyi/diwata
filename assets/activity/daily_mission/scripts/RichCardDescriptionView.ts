import { _decorator, Button, isValid, Label, Node, Sprite, SpriteFrame } from "cc";
import { ActivityDialogViewBase } from "../../../common/script/DialogView/ActivityDialogViewBase";
import { ActivityDialogViewID } from "db://assets/common/script/DialogView/ActivityDialogViewID";
import { ActivityUtils } from "db://assets/common/script/tools/ActivityUtils";
import { ActivityServicesMgr } from "db://assets/common/script/network/http/services/ActivityServicesMgr";
import { Handler } from "db://assets/common/script/tools/Handler";
import { HttpDataBase } from "db://assets/common/script/network/http/services/HttpDataBase";
import { ResGetRewardDetail } from "db://assets/common/script/network/http/HttpDataModels/ResGetRewardDetail";
import { RewardItemInfo } from "db://assets/common/script/network/http/HttpDataModels/ResAchievement";
import { DailyMission } from "db://assets/common/script/network/http/HttpDataModels/ResDailyMission";
const { ccclass, property } = _decorator;

@ccclass("RichCardDescriptionDialogView")
export class RichCardDescriptionDialogView extends ActivityDialogViewBase {
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.richCardDescription;

    @property(Node)
    closeButton: Node = null;

    @property(Sprite)
    levelSprite: Sprite = null;

    @property(Sprite)
    iconSprite: Sprite = null;

    @property(Label)
    gameNameLabel: Label = null;

    @property(Label)
    detailsLabel: Label = null;

    @property(SpriteFrame)
    levelSpriteFrames: SpriteFrame[] = [];

    protected onLoad(): void {
        this.closeButton.on(Button.EventType.CLICK, this.onCloseButton, this);
    }

    setData(data: DailyMission) {
        ActivityServicesMgr.instance.getRewardDetail(data.rewardConfigId,new Handler(this,(data:HttpDataBase<ResGetRewardDetail>)=>{
            if(data.isSuccessful){
                this.detailsLabel.string = `Info: ${data.data.details.description}`;
                this.levelSprite.spriteFrame = this.levelSpriteFrames[data.data.details.starLevel - 1];
                ActivityUtils.loadServerImage(
                    data.data.details.imgUrl,
                    (spriteFrame: SpriteFrame) => {
                        this.iconSprite && isValid(this.iconSprite) && (this.iconSprite.spriteFrame = spriteFrame);
                    },
                    (error: Error) => {
                        this.iconSprite && isValid(this.iconSprite) && (this.iconSprite.node.getChildByName("LoadFailed").active = true);
                    }
                );
            }

        }));

    }

    private onCloseButton() {
        this.close();
    }
}
