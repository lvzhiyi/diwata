import { AssetManager, director, instantiate, Node, resources, Vec3, view } from "cc";
import {
    ActivityDialogViewBundleName,
    ActivityDialogViewID,
    ActivityDialogViewPath,
} from "./ActivityDialogViewID";
import { PackageFacade } from "../PackageFacade";
import { ActivityDialogViewBase } from "./ActivityDialogViewBase";
import { ActivityDataMgr } from "../data/ActivityDataMgr";

export class ActivityDialogViewMgr {
    private static _instance: ActivityDialogViewMgr;
    private _rootNode: Node;
    private _bundles: Map<ActivityDialogViewBundleName, AssetManager.Bundle> = new Map();
    private _dialogDataMap: Map<ActivityDialogViewID, DialogData> = new Map();
    private _openDialogMap: Map<ActivityDialogViewID, ActivityDialogViewBase> = new Map(); //已经打开的窗口（已经加载完毕显示出来的）
    private _loadIngs: Map<ActivityDialogViewID, OpenDialogData> = new Map(); //加载中的窗口
    private _allDialogMap: Map<ActivityDialogViewID, OpenDialogData> = new Map(); //所有已经被open过的窗口 包含已经加载完毕和未加载完毕的
    private _onylIDInx: number = 0; //每个窗口打开时会分配一个唯一 当有多个同样窗口在加载中 加载完毕时 用这个区分
    constructor() {
        this.initRegister();
    }

    public static get instance(): ActivityDialogViewMgr {
        if (!this._instance) {
            this._instance = new ActivityDialogViewMgr();
        }
        return this._instance;
    }
    public addBundle(bundleName: ActivityDialogViewBundleName, bundle: AssetManager.Bundle): void {
        if (this._bundles.has(bundleName)) {
            return;
        }
        this._bundles.set(bundleName, bundle);
    }
    public getBundleName(id: ActivityDialogViewID): ActivityDialogViewBundleName {
        return this._dialogDataMap.get(id).bundleName;
    }
    public getBundle(id: ActivityDialogViewID): AssetManager.Bundle {
        return this._bundles.get(this.getBundleName(id));
    }
    //预加载
    public preload(id: ActivityDialogViewID): Promise<void> {
        let bundleName: ActivityDialogViewBundleName = this.getBundleName(id);
        let bundle: AssetManager.Bundle = this._bundles.get(bundleName);
        let dialogData: DialogData = this._dialogDataMap.get(id);
        let prefabPath: string;
        if (this.getSkin() == "skin-high") {
            prefabPath = "skin-high/prefabs" + dialogData.prefabPath;
        } else {
            prefabPath = "skin-low/prefabs" + dialogData.prefabPath;
        }
        return new Promise((resolve, reject) => {
            bundle.preload(prefabPath, (err, asset) => {
                if (err) {
                    PackageFacade.instance.error(
                        `ID=${id} prefab load failed: ${dialogData.prefabPath}`,
                        err
                    );
                    reject(err);
                }
                resolve();
            });
        });
    }
    private initRegister(): void {
        this.registerDialog(
            ActivityDialogViewID.entry,
            ActivityDialogViewPath.entry,
            ActivityDialogViewBundleName.common
        );
        this.registerDialog(
            ActivityDialogViewID.backpack,
            ActivityDialogViewPath.backpack,
            ActivityDialogViewBundleName.backpack
        );
        this.registerDialog(
            ActivityDialogViewID.giftBox,
            ActivityDialogViewPath.giftBox,
            ActivityDialogViewBundleName.giftBox
        );
        this.registerDialog(
            ActivityDialogViewID.dailyMission,
            ActivityDialogViewPath.dailyMission,
            ActivityDialogViewBundleName.dailyMission
        );
        this.registerDialog(
            ActivityDialogViewID.dailyMissionDescription,
            ActivityDialogViewPath.dailyMissionDescription,
            ActivityDialogViewBundleName.dailyMission
        );
        this.registerDialog(
            ActivityDialogViewID.richCardDescription,
            ActivityDialogViewPath.richCardDescription,
            ActivityDialogViewBundleName.dailyMission
        );
        this.registerDialog(
            ActivityDialogViewID.achievement,
            ActivityDialogViewPath.achievement,
            ActivityDialogViewBundleName.achievement
        );
        this.registerDialog(
            ActivityDialogViewID.achievementDescription,
            ActivityDialogViewPath.achievementDescription,
            ActivityDialogViewBundleName.achievement
        );
        this.registerDialog(
            ActivityDialogViewID.achievementBadgeDetails,
            ActivityDialogViewPath.achievementBadgeDetails,
            ActivityDialogViewBundleName.achievement
        );
        this.registerDialog(
            ActivityDialogViewID.achievementRebateDetails,
            ActivityDialogViewPath.achievementRebateDetails,
            ActivityDialogViewBundleName.achievement
        );
        this.registerDialog(
            ActivityDialogViewID.achievementRichCard,
            ActivityDialogViewPath.achievementRichCard,
            ActivityDialogViewBundleName.achievement
        );
        this.registerDialog(
            ActivityDialogViewID.achievementRandomRichCard,
            ActivityDialogViewPath.achievementRandomRichCard,
            ActivityDialogViewBundleName.achievement
        );
        this.registerDialog(
            ActivityDialogViewID.achievementReward,
            ActivityDialogViewPath.achievementReward,
            ActivityDialogViewBundleName.achievement
        );
        this.registerDialog(
            ActivityDialogViewID.giftBoxGoodsDetails,
            ActivityDialogViewPath.giftBoxGoodsDetails,
            ActivityDialogViewBundleName.giftBox
        );

        this.registerDialog(
            ActivityDialogViewID.toast,
            ActivityDialogViewPath.toast,
            ActivityDialogViewBundleName.common
        );
        this.registerDialog(
            ActivityDialogViewID.cardEffect,
            ActivityDialogViewPath.cardEffect,
            ActivityDialogViewBundleName.backpack
        );
        this.registerDialog(
            ActivityDialogViewID.freeSpin,
            ActivityDialogViewPath.freeSpin,
            ActivityDialogViewBundleName.freeSpin
        );
        this.registerDialog(
            ActivityDialogViewID.freeSpinEffect,
            ActivityDialogViewPath.freeSpinEffect,
            ActivityDialogViewBundleName.freeSpin
        );
    }

    private registerDialog(
        ID: ActivityDialogViewID,
        prefabPath: ActivityDialogViewPath,
        bundleName: ActivityDialogViewBundleName,
        type: DialogType = DialogType.multiple
    ): void {
        this._dialogDataMap.set(ID, { ID, prefabPath, bundleName, type });
    }

    /**获取已打开的窗口 如果未打开则返回null*/
    public getDialog<T extends ActivityDialogViewBase>(ID: ActivityDialogViewID): T | null {
        if (this._openDialogMap.has(ID)) {
            const dialog = this._openDialogMap.get(ID);
            return dialog as T;
        }
        return null;
    }
    /**判断某个窗口已打开或者已经在加载中*/
    public hasDiaLog(ID: ActivityDialogViewID): boolean {
        if (this._openDialogMap.has(ID) || this._loadIngs.has(ID)) {
            return true;
        }
        return false;
    }
    /**
     *
     * @param ID
     * @param data  要传的自定义数据
     * @param parent 指定父类 如果不指定则会用 this._rootNode
     * @returns
     */
    public openDialog(ID: ActivityDialogViewID, data?: any, parent?: any): void {
        PackageFacade.instance.log("open dialog ID=" + ID, data);
        const dialogData = this._dialogDataMap.get(ID);
        PackageFacade.instance.log(dialogData);
        if (this._openDialogMap.has(ID)) {
            PackageFacade.instance.log("dialog already opened");
            this._openDialogMap.get(ID).setData(data);
            return;
        }
        if (this._loadIngs.has(ID)) {
            PackageFacade.instance.log("dialog loading");
            return;
        }
        if (!dialogData) {
            PackageFacade.instance.error(`Dialog ID=${ID} not registered.`);
            return;
        }
        let openDialogData: OpenDialogData = {
            ID: ID,
            onylID: this._onylIDInx,
        };
        this._allDialogMap.set(ID, openDialogData);
        this._loadIngs.set(ID, openDialogData);
        this._onylIDInx++;
        let bundle: AssetManager.Bundle = this._bundles.get(dialogData.bundleName);
        if (!bundle) {
            PackageFacade.instance.error(`ID=${ID} bundleName not found: ${dialogData.bundleName}`);
            return;
        }
        let prefabPath: string;
        if (this.getSkin() == "skin-high") {
            prefabPath = "skin-high/prefabs" + dialogData.prefabPath;
        } else {
            prefabPath = "skin-low/prefabs" + dialogData.prefabPath;
        }
        bundle.load(prefabPath, (err, prefab) => {
            let localData: OpenDialogData = this._loadIngs.get(ID);
            if (localData && localData.onylID == openDialogData.onylID) {
                this._loadIngs.delete(ID);
                if (err) {
                    PackageFacade.instance.error(
                        `ID=${ID} prefab load failed: ${dialogData.prefabPath}`,
                        err
                    );
                    return;
                }
                const dialogNode: any = instantiate(prefab);
                const dialogViewBase = dialogNode.getComponent(ActivityDialogViewBase);
                const designSize = view.getDesignResolutionSize();
                const scale = designSize.width / 750;
                ActivityDataMgr.instance.setRootNodeScale(scale);
                dialogNode.scale = new Vec3(scale, scale, 1);
                if (dialogViewBase) {
                    dialogViewBase.inspectID(ID);
                } else {
                    PackageFacade.instance.error(
                        `ID=${ID} Dialog prefab ${dialogData.prefabPath} does not have DialogViewBase component.`
                    );
                    return;
                }
                let parentNode: Node;
                if (parent && parent.isValid) {
                    parentNode = parent;
                } else {
                    parentNode = PackageFacade.instance.getRootNode();
                }
                if (parentNode && parentNode.isValid) {
                    dialogNode.parent = parentNode;
                } else {
                    PackageFacade.instance.error(`ID=${ID} parent is null`);
                    return;
                }
                if (dialogData.type === DialogType.only) {
                    let id: ActivityDialogViewID;
                    this._openDialogMap.forEach((v, k) => {
                        const dialogData: DialogData = this._dialogDataMap.get(v.getDialogViewID());
                        if (dialogData.type == DialogType.only) {
                            id = v.getDialogViewID();
                        }
                    });
                    if (id) {
                        this.closeDialog(id);
                    }
                }
                // 记录已打开的对话框实例
                this._openDialogMap.set(ID, dialogViewBase);
                dialogViewBase.show();
                dialogViewBase.setData(data);
            } else {
                PackageFacade.instance.log(
                    "reject a dialog ID=" + ID + " uniqueID=" + openDialogData.onylID
                );
            }
        });
    }
    public closeDialog(ID: ActivityDialogViewID): void {
        PackageFacade.instance.log("close dialog ID=" + ID);
        const dialogNode = this._openDialogMap.get(ID);
        this._allDialogMap.delete(ID);
        if (dialogNode) {
            if (dialogNode.node) {
                dialogNode.node.destroy();
            }
            this._openDialogMap.delete(ID);
        } else if (this._loadIngs.has(ID)) {
            this._loadIngs.delete(ID);
        } else {
            PackageFacade.instance.error(`Dialog with ID ${ID} is not currently open.`);
        }
    }
    //因为不需要切高低清了 所以返回固定值
    private getSkin(): "skin-low" | "skin-high" {
        return "skin-high";
    }
}
export enum DialogType {
    only = "only", // 只允许同时打开一个实例:场景里只会有一个only类型的窗口
    multiple = "multiple", // 允许同时打开多个实例:场景里可以有多个multiple类型的窗口 但DialogViewID不同
}
interface DialogData {
    ID: ActivityDialogViewID;
    prefabPath: ActivityDialogViewPath;
    type: DialogType;
    bundleName: ActivityDialogViewBundleName;
}
/**已经打开窗口数据 包含加载中的*/
interface OpenDialogData {
    ID: ActivityDialogViewID;
    onylID: number; //唯一ID在open时自动分配给它的
}
