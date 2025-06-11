import {
    _decorator,
    Node,
    tween,
    Vec3,
    UIOpacity,
    UITransform,
    view,
    EventTouch,
    SpriteFrame,
    Label,
    Sprite,
    Size,
    Widget,
} from "cc";
import { ActivityDialogViewBase } from "../ActivityDialogViewBase";
import { ActivityDialogViewMgr } from "../ActivityDialogViewMgr";
import { ActivityDialogViewID } from "../ActivityDialogViewID";
import { ActivityID, PackageFacade } from "../../PackageFacade";
import { ActivityDataMgr, ActivityDataMgrEventsType } from "../../data/ActivityDataMgr";
import { DataReportMgr } from "../../managers/DataReportMgr";
import { DataReporEvents } from "../../data/dataModels/DataReporEvents";
import { GlobalMgr } from "../../extra/GlobalMgr";
import { ActivityUtils } from "../../tools/ActivityUtils";
import { isLargeScreenPhone } from "../../extra/Utils/common";
const { ccclass, property } = _decorator;

@ccclass("ActivityEntryDialogView")
//管理igo功能列表
export class ActivityEntryDialogView extends ActivityDialogViewBase {
    @property(Node)
    parentNode: Node = null;
    @property(Node)
    tipNode: Node = null;
    @property(Node)
    igoList: Node = null;
    @property(Node)
    touchNode: Node = null;
    @property(Node)
    btns: Array<Node> = [];
    @property(SpriteFrame)
    iconSprFrames: SpriteFrame[] = [];
    @property(Label)
    tipsLabel: Label = null;
    @property(Sprite)
    iconSprite: Sprite = null;
    @property(Node)
    igo_node: Node = null;
    private _btnMap: Map<ActivityID, Node> = new Map();
    private _redNodeMap: Map<ActivityID, Node> = new Map();
    private _tipTimer: any = null; // 添加一个属性来存储定时器
    private _igoNodeInitPosX: number = 0;
    private _offsetX: number = 5;
    private _listIsOpen: boolean = false;
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.entry;
    /** 提示文本配置 */
    private static readonly TIPS_VALUES: string[] = [
        "Get new items！",
        "Treasure chest rewards waiting to be claimed！",
        "Achievement completed！",
        "Daily Mission completed！",
    ];
    private _isPlayTipsIng: boolean = false; //是否播放通知列表中
    private _playTipsIndex: number = 0; //播放通知列表中
    protected onLoad(): void {
        this.tipNode.active = false;
        this.tipNode.setPosition(-186, 1, 0);
        let opacityComp = this.tipNode.getComponent(UIOpacity);
        if (opacityComp) {
            opacityComp.opacity = 0;
        }
        this._btnMap.set(ActivityID.dailyMission, this.btns[0]);
        this._btnMap.set(ActivityID.backpack, this.btns[1]);
        this._btnMap.set(ActivityID.giftBox, this.btns[2]);
        this._btnMap.set(ActivityID.achievement, this.btns[3]);
        this._btnMap.set(ActivityID.freeSpin, this.btns[4]);
        this.initIGoView();
        this.initTouchNode();
        this.touchNode.active = false;
        this.updateUIFrame();
    }

    /*
        *不同屏幕高度适配
         */
    private updateUIFrame(): void {
        const rootNode = GlobalMgr.instance.rootNode;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const widget = this.parentNode.getComponent(Widget);
        let scale = screenWidth > 750 ? 2 : 1.5;
        if (isLargeScreenPhone() == false) {
            scale = 0.8;
        }
        console.log('####scale', scale);
        widget.verticalCenter = widget.verticalCenter * scale;
        widget.updateAlignment();
        this.igoList.active = false;
    }

    start() {
        this.initRedNode();
        this.initEvents();
        this.onUpdateRedData();
        this.scheduleOnce(this.startPlayTips, 5);
    }
    public setEntryDialogActive(active: boolean): void {
        this.igo_node.active = active;
        this.closeIgoList();
    }
    private initEvents(): void {
        ActivityDataMgr.instance.on(
            ActivityDataMgrEventsType.updateRedData,
            this.onUpdateRedData,
            this
        );
        ActivityDataMgr.instance.on(
            ActivityDataMgrEventsType.updateNoticeData,
            this.onUpdateNoticeData,
            this
        );
        ActivityDataMgr.instance.registerEvent();
    }
    private onClick(e: EventTouch, data: string): void {
        let self = this;
        switch (data) {
            case "bag":
                ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.backpack);
                this.closeIgoList();
                break;
            case "mission":
                ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.dailyMission);
                this.closeIgoList();
                break;
            case "igoBtn":
                this.openIgoList();
                break;

            case "giftBox":
                ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.giftBox);
                this.closeIgoList();
                break;
            case "achievement":
                ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.achievement);
                this.closeIgoList();
                break;
            case "freeSpin":
                ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.freeSpin);
                this.closeIgoList();
                break;
        }
    }
    private onUpdateNoticeData(): void {
        if (ActivityDataMgr.instance.getNoticeDatas().length > 0) {
            if (!this._listIsOpen) {
                if (!this._isPlayTipsIng) {
                    this.startPlayTips();
                }
            }
        }
    }
    private onUpdateRedData(): void {
        this._redNodeMap.get(ActivityID.entry).active = ActivityDataMgr.instance.getRedData(
            ActivityID.entry
        );
        this._redNodeMap.get(ActivityID.backpack).active = ActivityDataMgr.instance.getRedData(
            ActivityID.backpack
        );
        this._redNodeMap.get(ActivityID.giftBox).active = ActivityDataMgr.instance.getRedData(
            ActivityID.giftBox
        );
        this._redNodeMap.get(ActivityID.dailyMission).active = ActivityDataMgr.instance.getRedData(
            ActivityID.dailyMission
        );
        this._redNodeMap.get(ActivityID.achievement).active = ActivityDataMgr.instance.getRedData(
            ActivityID.achievement
        );
    }
    private initIGoView(): void {
        const screenSize = view.getVisibleSize();
        const nodeSize = this.igoList.getComponent(UITransform);
        this._igoNodeInitPosX = this.igoList.position.x;
        this.igoList.setPosition(new Vec3(this._igoNodeInitPosX, 0, 0));
        let activityIDs = PackageFacade.instance.getActivityIDs();
        this.btns.forEach((btn) => {
            btn.active = false;
        });
        for (let i = 0; i < activityIDs.length; i++) {
            let btn = this._btnMap.get(activityIDs[i]);
            if (btn) {
                btn.active = true;
            }
        }
    }
    /**打开igo功能列表*/
    private openIgoList(): void {
        ActivityDataMgr.instance.clearNoticeData();
        this.touchNode.active = true;
        this._listIsOpen = true;
        this.closeTip();
        this.igoList.active = true;
        const igoListNodeWidth = this.igoList.getComponent(UITransform).width;
        DataReportMgr.instance.track(DataReporEvents.ToggleSideMenu,{status:"open"});
        // 使用 tween 缓动 igoList 的位置
        tween(this.igoList)
            .to(0.3, {
                position: new Vec3(
                    this._igoNodeInitPosX + igoListNodeWidth,
                    this.igoList.position.y,
                    this.igoList.position.z
                ),
            })
            .start();
    }
    public closeIgoList(): void {
        this.touchNode.active = false;
        this._listIsOpen = false;
        if (this.igoList.active) {
            tween(this.igoList)
                .to(0.3, {
                    position: new Vec3(
                        this._igoNodeInitPosX,
                        this.igoList.position.y,
                        this.igoList.position.z
                    ),
                })
                .call(() => {
                    this.igoList.active = false;
                })
                .start();
        }
    }
    private startPlayTips(): void {
        this.unschedule(this.startPlayTips);
        this._isPlayTipsIng = true;
        this._playTipsIndex = 0;
        this.playItemTips();
    }
    private playItemTips(): void {
        let tipsList: Array<ActivityID> = ActivityDataMgr.instance.getNoticeDatas();
        if (tipsList.length > 0) {
            let id = tipsList[0];
            ActivityDataMgr.instance.removeNoticeData();
            let tips = ActivityEntryDialogView.TIPS_VALUES[id - 2];
            this.tipsLabel.string = tips;
            this.iconSprite.spriteFrame = this.iconSprFrames[id - 2];
            this.openTip();
            this._playTipsIndex++;
            this.scheduleOnce(this.onPlayTipsEnd, 3);
        } else {
            this._isPlayTipsIng = false;
        }
    }
    private onPlayTipsEnd(): void {
        this.closeTip().then(() => {
            if (ActivityDataMgr.instance.getNoticeDatas().length > 0) {
                this.playItemTips();
            } else {
                this._isPlayTipsIng = false;
            }
        });
    }
    private openTip(): void {
        this.tipNode.active = true;
        let opacityComp = this.tipNode.getComponent(UIOpacity);
        if (opacityComp) {
            tween(this.tipNode)
                .to(0.5, { position: new Vec3(247, 1, 0) })
                .start();
            tween(opacityComp).to(0.5, { opacity: 255 }).start();
        }
    }
    private closeTip(): Promise<void> {
        // 清理定时器
        clearTimeout(this._tipTimer);
        this._tipTimer = null;
        return new Promise((resolve) => {
            let opacityComp = this.tipNode.getComponent(UIOpacity);
            if (opacityComp) {
                tween(this.tipNode)
                    .to(0.5, { position: new Vec3(-186, 1, 0) })
                    .start();
                tween(opacityComp)
                    .to(0.5, { opacity: 0 })
                    .call(() => {
                        this.tipNode.active = false;
                        resolve();
                    })
                    .start();
            }
        });
    }
    private initTouchNode(): void {
        // 确保touchNode存在
        if (this.touchNode) {
            // 添加触摸事件监听
            this.touchNode.on(Node.EventType.TOUCH_START, this.onTouchNodeClick, this);
        }
    }
    private initRedNode(): void {
        this._redNodeMap.set(ActivityID.entry, this.node.getChildByPath("parentNode/igo_node/redPoint"));
        this._redNodeMap.set(
            ActivityID.backpack,
            this.node.getChildByPath("parentNode/igoList/layout/BACKPACK_btn/redPoint")
        );
        this._redNodeMap.set(
            ActivityID.giftBox,
            this.node.getChildByPath("parentNode/igoList/layout/winMore_btn/redPoint")
        );
        this._redNodeMap.set(
            ActivityID.dailyMission,
            this.node.getChildByPath("parentNode/igoList/layout/MISSION_btn/redPoint")
        );
        this._redNodeMap.set(
            ActivityID.achievement,
            this.node.getChildByPath("parentNode/igoList/layout/achievement_btn/redPoint")
        );
    }
    private onTouchNodeClick(event: EventTouch): void {
        event.preventSwallow = true;
        // 关闭窗口
        this.closeDialog();
    }
    private closeDialog(): void {
        this.closeIgoList();
    }
    protected onDestroy(): void {
        super.onDestroy();
        ActivityDataMgr.instance.off(
            ActivityDataMgrEventsType.updateNoticeData,
            this.onUpdateNoticeData,
            this
        );
        ActivityDataMgr.instance.off(
            ActivityDataMgrEventsType.updateRedData,
            this.onUpdateRedData,
            this
        );
    }
}
