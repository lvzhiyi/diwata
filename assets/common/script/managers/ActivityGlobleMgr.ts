import { ActivityEventMgr, ActivityEventMgrEventsType } from "../ActivityEventMgr";
import { ActivityConfigDataMgr } from "../data/ActivityConfigDataMgr";
import { ActivityDataMgr } from "../data/ActivityDataMgr";
import { FreeSpinItemData } from "../data/dataModels/FreeSpinItemData";
import { ActivityDialogViewID } from "../DialogView/ActivityDialogViewID";
import { ActivityDialogViewMgr } from "../DialogView/ActivityDialogViewMgr";
import { ActivityID, PackageFacade } from "../PackageFacade";

export class ActivityGlobleMgr {
    private static _inst: ActivityGlobleMgr;
    private _token: string;
    private _uid: string;
    private _gameID: string;
    public static get instance(): ActivityGlobleMgr {
        if (this._inst == null) {
            this._inst = new ActivityGlobleMgr();
        }
        return this._inst;
    }
    constructor() {
        this.initEvent();
    }
    private initEvent() {
        ActivityEventMgr.instance.on(
            ActivityEventMgrEventsType.useGoodsSuccess,
            this.onUseGoodsSuccess,
            this
        );
        ActivityEventMgr.instance.on(
            ActivityEventMgrEventsType.addRedData,
            this.onAddRedData,
            this
        );
        ActivityEventMgr.instance.on(
            ActivityEventMgrEventsType.endFreeSpin,
            this.onHideUseFreeSpin,
            this
        );
    }
    public useFreeSpin(data: FreeSpinItemData): Boolean {
        if (ActivityDataMgr.instance.getIsBuyFreeIng()) {
            PackageFacade.instance.openToast(ActivityConfigDataMgr.instance.getLanguageData(5));
            return false;
        }
        if (ActivityDataMgr.instance.getGameState()) {
            PackageFacade.instance.openToast(ActivityConfigDataMgr.instance.getLanguageData(4));
            return false;
        }
        if (ActivityDataMgr.instance.getFreeSpinCampaignId()) {
            this.cancelUseFreeSpin();
        }
        ActivityDataMgr.instance.setFreeSpinCampaignId(data.campaignId);
        ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.freeSpinEffect, data);
        return true;
    }
    public cancelUseFreeSpin(): void {
        ActivityEventMgr.instance.cancelUseFreeSpin();
        ActivityDataMgr.instance.setFreeSpinCampaignId(null);
        ActivityDialogViewMgr.instance.closeDialog(ActivityDialogViewID.freeSpinEffect);
    }
    public initData(token: string, uid: string, gameID: string): void {
        this._token = token;
        this._uid = uid;
        this._gameID = gameID;
    }
    public getToken(): string {
        return this._token;
    }
    public getUid(): string {
        return this._uid;
    }
    public getGameID(): string {
        return this._gameID;
    }
    private onUseGoodsSuccess(): void {
        ActivityDataMgr.instance.updateBagData(false);
    }
    private onAddRedData(activityID: ActivityID): void {
        ActivityDataMgr.instance.addRedData(activityID);
    }
    private onHideUseFreeSpin(): void {
        ActivityDataMgr.instance.updateFreeSpinData();
        this.cancelUseFreeSpin();
    }
}
