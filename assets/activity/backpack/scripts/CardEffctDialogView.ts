import {
    _decorator,
    Component,
    Node,
    ResolutionPolicy,
    screen,
    sp,
    Tween,
    tween,
    Vec3,
    view,
    Widget,
} from "cc";
import {
    ActivityEventMgr,
    ActivityEventMgrEventsType,
} from "db://assets/common/script/ActivityEventMgr";
import { ActivityDialogViewBase } from "db://assets/common/script/DialogView/ActivityDialogViewBase";
import { ActivityDialogViewID } from "db://assets/common/script/DialogView/ActivityDialogViewID";
import { CardEeffct } from "./CardEeffct";
import { ActivityConfigDataMgr } from "db://assets/common/script/data/ActivityConfigDataMgr";
import { ActivityDataMgr } from "db://assets/common/script/data/ActivityDataMgr";
const { ccclass, property } = _decorator;

@ccclass("CardEffctDialogView")
export class CardEffctDialogView extends ActivityDialogViewBase {
    @property(Node)
    cardEffectNode: Node = null;
    @property(sp.Skeleton)
    strascard: sp.Skeleton;
    @property(Node)
    bg: Node = null;
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.cardEffect;
    private _url: string = "";
    private _tween: Tween<Node> = null;
    private _isShowBg: boolean = false;
    private _isStart: boolean = false;

    public setIsShowBg(isShow: boolean): void {
        this._isShowBg = isShow;
        if (this._isStart) {
            this.bg.active = this._isShowBg;
        }
    }

    start() {
        this.strascard.node.active = false;
        this.bg.active = this._isShowBg;
        this._isStart = true;
        ActivityDataMgr.instance.setIsUseStarCard(true);
        ActivityEventMgr.instance.on(
            ActivityEventMgrEventsType.hideStarCard,
            this.onHideStarCard,
            this
        );
        this.playUseStarCard();
    }
    update(deltaTime: number) {}
    public setData(data?: any): void {
        this._url = data;
    }
    private onHideStarCard(): void {
        this.close();
    }
    //播放使用星卡动画
    private playUseStarCard(): void {
        let cardEeffct = this.cardEffectNode.getComponent(CardEeffct);
        cardEeffct.setUrl(this._url);
        // 初始设置缩放为0
        cardEeffct.node.setScale(0, 0, 1);
        this.node.addChild(this.cardEffectNode);
        // 添加缩放动画
        this._tween = tween(cardEeffct.node)
            .to(0.3, { scale: new Vec3(1.2, 1.2, 1) }, { easing: "backOut" })
            .to(0.15, { scale: new Vec3(0.9, 0.9, 1) })
            .to(0.1, { scale: new Vec3(1, 1, 1) })
            .call(() => {
                cardEeffct.showEeffct();
                this.scheduleOnce(() => {
                    let moveToPosData = ActivityConfigDataMgr.instance.getMoveToPosData();

                    // 同时执行移动和缩放动画
                    this._tween = tween(cardEeffct.node)
                        .parallel(
                            tween().to(0.5, { position: moveToPosData }),
                            tween().to(0.5, { scale: new Vec3(0.4, 0.4, 1) })
                        )
                        .call(() => {
                            cardEeffct.node.active = false;
                            this.strascard.node.active = true;
                            this.strascard.node.setPosition(moveToPosData);
                            this.strascard.setAnimation(0, "animation", false);
                            this.strascard.setCompleteListener(() => {
                                this.strascard.node.active = false;
                                cardEeffct.node.active = true;
                                cardEeffct.node.setPosition(
                                    ActivityConfigDataMgr.instance.getCardPosData()
                                );
                                ActivityEventMgr.instance.starCardEnd();
                            });
                        })
                        .start();
                }, 0.5);
            })
            .start();
    }
    protected onDestroy(): void {
        super.onDestroy();
        ActivityDataMgr.instance.setIsUseStarCard(false);
        if (this._tween) {
            this._tween.stop();
            this._tween = null;
        }
        ActivityEventMgr.instance.off(
            ActivityEventMgrEventsType.hideStarCard,
            this.onHideStarCard,
            this
        );
    }
}
