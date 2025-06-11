import { _decorator, Button, Node } from 'cc';
import { ActivityDialogViewBase } from '../../../common/script/DialogView/ActivityDialogViewBase';
import { ActivityDialogViewID } from 'db://assets/common/script/DialogView/ActivityDialogViewID';
const { ccclass, property } = _decorator;

@ccclass('DailyMissionDescriptionDialogView')
export class DailyMissionDescriptionDialogView extends ActivityDialogViewBase {

    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.dailyMissionDescription;

    @property(Node)
    private closeButton: Node | null = null;

    protected onLoad(): void {
        this.closeButton?.on(Button.EventType.CLICK, this.onCloseButton, this);
    }

    private onCloseButton(){
        this.close();
    }
}


