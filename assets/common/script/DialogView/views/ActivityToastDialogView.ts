import { _decorator, instantiate, Label, Node, tween, Tween, UITransform, v3 } from "cc";
import { ActivityDialogViewID } from "../ActivityDialogViewID";
import { ActivityDialogViewBase } from "../ActivityDialogViewBase";
const { ccclass, property } = _decorator;

@ccclass("ActivityToastDialogView")
export class ActivityToastDialogView extends ActivityDialogViewBase {
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.toast;

    @property(Node)
    private toastList: Node | null = null;
    @property(Node)
    private toast: Node | null = null;
    private _toastItem: Map<string, Node> = new Map();
    onLoad() {
        this.toast.active = false;
    }
    public setData(data: string) {
        super.setData(data);
        if (!data) return;
        let toastNode: Node = null;
        if (this._toastItem.has(data)) {
            toastNode = this._toastItem.get(data);
            Tween.stopAllByTarget(toastNode);
            toastNode.setScale(1, 1, 1);
            toastNode.setSiblingIndex(0);
            tween(toastNode)
                .set({ scale: v3(0.85, 0.85, 1) })
                .to(0.1, { scale: v3(1, 1, 1) })
                .delay(3)
                .call(() => this.close())
                .start();
        } else {
            toastNode = instantiate(this.toast);
            toastNode.active = true;
            this.toastList.addChild(toastNode);
            toastNode.setSiblingIndex(0);
            this._toastItem.set(data, toastNode);
            const textLabel = toastNode.getChildByName("Text").getComponent(Label);
            textLabel.string = data;
            textLabel.updateRenderData();
            if (textLabel.node.getComponent(UITransform).height > 45) {
                this.scheduleOnce(() => {
                    toastNode
                        .getComponent(UITransform)
                        .setContentSize(this.node.getComponent(UITransform).width, 140);
                });
            }
            tween(toastNode)
                .set({ scale: v3(0.5, 0.5, 1) })
                .to(0.15, { scale: v3(1.1, 1.1, 1) })
                .to(0.1, { scale: v3(1, 1, 1) })
                .delay(3)
                .call(() => this.close())
                .start();
        }
    }
}
