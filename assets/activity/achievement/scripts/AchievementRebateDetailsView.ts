import { _decorator, Component, Node, Button   } from 'cc';
const { ccclass, property } = _decorator;
import { ActivityDialogViewBase } from '../../../common/script/DialogView/ActivityDialogViewBase';
import { ActivityDialogViewID } from 'db://assets/common/script/DialogView/ActivityDialogViewID';

@ccclass('AchievementRebateDetailsView')
export class AchievementRebateDetailsView extends ActivityDialogViewBase {

    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.achievementRebateDetails;  

    @property(Node)
    private closeButton: Node | null = null;

    protected onLoad(): void {
        this.closeButton?.on(Button.EventType.CLICK, this.onCloseButton, this);
    }

    private onCloseButton(){
        this.close();
    }

}


