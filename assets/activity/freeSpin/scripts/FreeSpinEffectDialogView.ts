import { _decorator, Label, Node, sp } from "cc";
import { ActivityEventMgr } from "db://assets/common/script/ActivityEventMgr";
import { ActivityDialogViewBase } from "db://assets/common/script/DialogView/ActivityDialogViewBase";
import { ActivityDialogViewID } from "db://assets/common/script/DialogView/ActivityDialogViewID";
import { ActivityAudioMgr } from "db://assets/common/script/managers/ActivityAudioMgr";
import { FreeSpin } from "db://assets/common/script/network/http/HttpDataModels/ResFreeSpinOfPlayer";
const { ccclass, property } = _decorator;

@ccclass("FreeSpinEffectDialogView")
export class FreeSpinEffectDialogView extends ActivityDialogViewBase {
    @property(Label)
    count_txt: Label = null;
    @property(sp.Skeleton)
    sp_freespin: sp.Skeleton = null;
    @property(Node)
    maskNode: Node;
    private _data: FreeSpin = null;
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.freeSpinEffect;
    start() {
        this.playEffect();
    }
    public setData(data: FreeSpin) {
        this._data = data;
    }
    private playEffect() {
        ActivityAudioMgr.instance.playSoundByName("freespin");
        this.count_txt.string = this._data.remainingCount.toString();
        this.sp_freespin.setAnimation(0, "freespin", false);
        this.sp_freespin.setCompleteListener((track) => {
            this.sp_freespin.node.active = false;
            ActivityEventMgr.instance.useFreeSpin(this._data);
            this.close();
        });
    }
}
