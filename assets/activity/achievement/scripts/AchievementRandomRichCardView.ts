import { _decorator, Button, Component, instantiate, isValid, Label, Node, Sprite, SpriteFrame } from 'cc';
import { DataReporEvents } from 'db://assets/common/script/data/dataModels/DataReporEvents';
import { ActivityDialogViewBase } from 'db://assets/common/script/DialogView/ActivityDialogViewBase';
import { ActivityDialogViewID } from 'db://assets/common/script/DialogView/ActivityDialogViewID';
import { DataReportMgr } from 'db://assets/common/script/managers/DataReportMgr';
import { AchievementItemInfo, RewardItemInfo } from 'db://assets/common/script/network/http/HttpDataModels/ResAchievement';
import { ActivityUtils } from 'db://assets/common/script/tools/ActivityUtils';

const { ccclass, property } = _decorator;

@ccclass('AchievementRandomRichCardView')
export class AchievementRandomRichCardView extends ActivityDialogViewBase {
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.achievementRandomRichCard;  

    @property(Node)
    private closeButton: Node | null = null;

    @property(Node)
    private scrollViewContent: Node | null = null;

    @property(Node)
    private richCardItem: Node | null = null;

    private _data: AchievementItemInfo = null;
 


    protected onLoad(): void {
        this.closeButton.on(Button.EventType.CLICK, this.onCloseButton, this);
    }
    
    public setData(data?: AchievementItemInfo): void {
        this._data = data;
        for(let i = 0; i < this._data.rewards.length; i++){
            let richCard = instantiate(this.richCardItem);
            richCard.setParent(this.scrollViewContent);
            richCard.getChildByName("AmountLabel").getComponent(Label).string = `X${this._data.rewards[i].count}`;
            ActivityUtils.loadServerImage(this._data.rewards[i].imgUrl,
                (spriteFrame: SpriteFrame) => {
                    richCard && isValid(richCard) && (richCard.getComponent(Sprite).spriteFrame = spriteFrame);
                },
                (error: Error) => {
                    richCard && isValid(richCard) && (richCard.getChildByName("LoadFailed").active = true);
                }
            );
        }
        this.addTrackViewAchievementRewardPreview();
    }

    private onCloseButton(){
        this.addTrackExitAchievementRewardPreview();
        this.close();
    }

    private addTrackViewAchievementRewardPreview(){
        let eventData = {
            task_id: this._data.id,
            task_name: this._data.name,
            reward_type: "",
            card_reward_options: this._data.rewards.map((reward) => JSON.stringify(reward)),
            card_star_levels: this._data.rewards.map((reward) => reward.starLevel),
        }
        DataReportMgr.instance.track(DataReporEvents.ViewAchievementRewardPreview,eventData);
    }

    private addTrackExitAchievementRewardPreview(){
        let eventData = {
            task_id: this._data.id,
            card_reward_options: this._data.rewards.map((reward) => JSON.stringify(reward)),
        }
        DataReportMgr.instance.track(DataReporEvents.ExitAchievementRewardPreview,eventData);
    }
}


