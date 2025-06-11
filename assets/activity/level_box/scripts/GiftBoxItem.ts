import { _decorator, Component, Label, Node, ProgressBar, sp, Sprite, SpriteFrame } from "cc";
import { GiftBoxItemData } from "db://assets/common/script/data/dataModels/GiftBoxItemData";
import { PackageFacade } from "db://assets/common/script/PackageFacade";
import { ActivityUtils } from "db://assets/common/script/tools/ActivityUtils";
import { Handler } from "db://assets/common/script/tools/Handler";
const { ccclass, property } = _decorator;

@ccclass("GiftBoxItem")
export class GiftBoxItem extends Component {
    @property(SpriteFrame)
    vipSpriteFrames: Array<SpriteFrame> = [];
    @property(Sprite)
    vipSprite: Sprite = null;
    @property(Node)
    lockNode: Node = null;
    @property(sp.Skeleton)
    boxAni: sp.Skeleton = null;
    @property(ProgressBar)
    progressBar: ProgressBar = null;
    @property(Label)
    progressLabel: Label = null;
    @property(Node)
    getBtn: Node = null;
    @property(Node)
    getBtn_disabled: Node = null;
    @property(Node)
    tipsNode: Node = null;
    @property(Label)
    tipsLabel: Label = null;
    private _data: GiftBoxItemData = null;
    private _isStart: boolean = false;
    private _callback: Handler<{ type: number; vipLevel: number }> = null;
    start() {
        this._isStart = true;
        this.updataUI();
    }
    public setCallback(callback: Handler<{ type: number; vipLevel: number }>) {
        this._callback = callback;
    }
    public setData(data: GiftBoxItemData) {
        this._data = data;
        if (this._isStart) {
            this.updataUI();
        }
    }
    public getVipLevel(): number {
        return this._data.vipLevel;
    }
    private updataUI(): void {
        if (!this._data) {
            return;
        }
        this.vipSprite.spriteFrame = this.vipSpriteFrames[this._data.vipLevel - 1];
        this.progressBar.progress = this._data.nowExp / this._data.needExp;
        let nowExp: number;
        if (this._data.nowExp > this._data.needExp) {
            nowExp = this._data.needExp;
        } else {
            nowExp = this._data.nowExp;
        }
        this.progressLabel.string = `${ActivityUtils.formatNumber(
            nowExp
        )}/${ActivityUtils.formatNumber(this._data.needExp)}`;
        let vipIsOpen: boolean = PackageFacade.instance.getVipLv() >= this._data.vipLevel;
        if (vipIsOpen) {
            this.lockNode.active = false;
        }
        this.boxAni.setSkin("chest" + this._data.vipLevel);
        if (this._data.status == 3) {
            this.boxAni.setAnimation(0, "received", true);
            this.getBtn.active = false;
            this.getBtn_disabled.active = true;
        } else if (this._data.status == 2 && vipIsOpen) {
            this.boxAni.setAnimation(0, "available", true);
            if (vipIsOpen) {
                this.getBtn.active = true;
                this.getBtn_disabled.active = false;
            } else {
                this.getBtn.active = false;
                this.getBtn_disabled.active = true;
            }
        } else {
            this.boxAni.setAnimation(0, "idle", true);
            this.getBtn.active = false;
            this.getBtn_disabled.active = true;
        }
        if (!vipIsOpen) {
            this.tipsNode.active = true;
            this.tipsLabel.string = `Upgrade to VIP${this._data.vipLevel} to unlock rewards`;
        } else {
            this.tipsNode.active = false;
        }
    }
    private onGetBtnClick() {
        this._callback.runWith({ type: 1, vipLevel: this._data.vipLevel });
    }
    private onItemClick(): void {
        this._callback.runWith({ type: 0, vipLevel: this._data.vipLevel });
    }
}
