import { _decorator, Component, instantiate, Node, Prefab } from "cc";
import { GiftBoxDetails } from "./GiftBoxDetails";
import { GiftRewardPopupPanel } from "./GiftRewardPopupPanel";
import { ActivityDialogViewID } from "db://assets/common/script/DialogView/ActivityDialogViewID";
import { GiftBoxItem } from "./GiftBoxItem";
import {
    GiftBoxItemData,
    GiftBoxReward,
} from "db://assets/common/script/data/dataModels/GiftBoxItemData";
import { Handler } from "db://assets/common/script/tools/Handler";
import { ActivityDialogViewBase } from "db://assets/common/script/DialogView/ActivityDialogViewBase";
import {
    ActivityDataMgr,
    ActivityDataMgrEventsType,
} from "db://assets/common/script/data/ActivityDataMgr";
import { ActivityServicesMgr } from "db://assets/common/script/network/http/services/ActivityServicesMgr";
import { ReqChestRewardClaim } from "db://assets/common/script/network/http/HttpDataModels/ReqChestRewardClaim";
import { ResGetBoxReward } from "db://assets/common/script/network/http/HttpDataModels/ResGetBoxReward";
import { ActivityID, PackageFacade } from "db://assets/common/script/PackageFacade";
import { HttpDataBase } from "db://assets/common/script/network/http/services/HttpDataBase";
import { TreasureReward } from "db://assets/common/script/network/http/HttpDataModels/ResGetLvBox";
import { DataReportMgr } from "db://assets/common/script/managers/DataReportMgr";
import { DataReporEvents } from "db://assets/common/script/data/dataModels/DataReporEvents";
const { ccclass, property } = _decorator;

@ccclass("GiftBoxDalogView")
export class GiftBoxDialogView extends ActivityDialogViewBase {
    @property(Prefab)
    itemPrefab: Prefab = null;
    @property(Node)
    listNode: Node = null;
    @property(Node)
    tipsNode: Node = null;
    @property(GiftBoxDetails)
    details: GiftBoxDetails = null;
    @property(GiftRewardPopupPanel)
    rewardPopupPanel: GiftRewardPopupPanel = null;
    @property(Node)
    redNode: Node = null;
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.giftBox;
    private _boxList: Array<GiftBoxItem> = [];
    private _boxDatas: Array<GiftBoxItemData> = [];
    private _boxVipLevel: number = 0;
    start() {
        this.closeTips();
        this.details.close();
        ActivityDataMgr.instance.updateLevelBoxData(false);
        this.updateBoxList();
        this.onUpdateRedUi();
        this.initEvents();
        this.addTrackOpenWinMoreChest();
    }
    private initEvents(): void {
        ActivityDataMgr.instance.on(
            ActivityDataMgrEventsType.updateLevelBoxData,
            this.updateBoxList,
            this
        );
        ActivityDataMgr.instance.on(
            ActivityDataMgrEventsType.updateRedData,
            this.onUpdateRedUi,
            this
        );
    }
    update(deltaTime: number) { }
    private onClick(e, data: string): void {
        switch (data) {
            case "close":
                this.close();
                break;
            case "tips":
                this.openTips();
                break;
            case "tipsClose":
                this.closeTips();
                break;
        }
    }
    private updateBoxList(): void {
        this._boxDatas = ActivityDataMgr.instance.getLevelBoxDatas();
        if (this._boxDatas.length == 0) {
            return;
        }

        //删除多余的
        if (this._boxList.length > this._boxDatas.length) {
            for (let i = this._boxList.length - 1; i >= this._boxDatas.length; i--) {
                this._boxList[i].destroy();
                this._boxList.splice(i, 1);
            }
        }
        for (let i = 0; i < this._boxDatas.length; i++) {
            const item = this._boxDatas[i];
            if (this._boxList[i]) {
                this._boxList[i].setData(item);
            } else {
                const itemNode = instantiate(this.itemPrefab);
                this.listNode.addChild(itemNode);
                this._boxList.push(itemNode.getComponent(GiftBoxItem));
                this._boxList[i].setData(item);
                this._boxList[i].setCallback(new Handler(this, this.onItemClick));
            }
        }
    }
    //type:0点击礼包，1点击奖励
    private onItemClick({ type, vipLevel }: { type: number; vipLevel: number }): void {
        if (type == 0) {
            this.details.open(this.getGiftBoxData(vipLevel));
        } else {
            let data: ReqChestRewardClaim = new ReqChestRewardClaim();
            data.level = ActivityDataMgr.instance.getVipLv();
            data.treasureId = this.getGiftBoxData(vipLevel).treasureId;
            this._boxVipLevel = vipLevel;
            ActivityServicesMgr.instance.getBoxReward(data, this.getHandler(this.onGetBoxReward));
        
        }
    }
    private onGetBoxReward(data: HttpDataBase<ResGetBoxReward>): void {
        this.removeHandler(this.onGetBoxReward);
        if (!data.isSuccessful) {
            return;
        }
        let rewardData: GiftBoxReward = TreasureReward.toGiftBoxReward(data.data.reward);
        this.openRewardPopup(rewardData, data.data.level);
        ActivityDataMgr.instance.updateLevelBoxData();
        ActivityDataMgr.instance.updateBagData(false);
        ActivityDataMgr.instance.addRedData(ActivityID.backpack);
        let giftBoxData: GiftBoxItemData = this.getGiftBoxData(data.data.level + 1);
        if (giftBoxData) {
            giftBoxData.status = 3;
            let item: GiftBoxItem = this.getGiftBoxItem(data.data.level + 1);
            item.setData(giftBoxData);
            this.addTrackGetWinMoreReward(data.data.reward, this._boxVipLevel);
        } else {
            PackageFacade.instance.log("领取宝箱异常LV=" + data.data.level);
        }

    }
    /**
     * 添加点击获取宝箱奖励的跟踪
     * @param data 
     * @param vipLevel 
     */
    private addTrackGetWinMoreReward(data: GiftBoxReward, vipLevel: number): void {
        let eventData = {
            chest_id: data.rewardConfigId,
            vip_level: `VIP${vipLevel}`,
            reward_type: "",
            reward_quantity: data.count,
            card_star_level: data.starLevel,
            max_progress: this.getGiftBoxData(vipLevel).needExp
        }
        DataReportMgr.instance.track(DataReporEvents.ClickGetWinMoreReward, eventData);
    }

    private addTrackOpenWinMoreChest(): void {
        let vipLevels = [];
        let progressSnapshot = {};
        let availableToClaim = 0;
        for (let i = 0; i < this._boxDatas.length; i++) {
            const item = this._boxDatas[i];
            if (item.status == 2) {
                availableToClaim++;
            }
            vipLevels.push("VIP" + (item.vipLevel));
            progressSnapshot[`VIP${item.vipLevel}`] = `${item.nowExp}/${item.needExp}`;
        }
        let eventData = {
            available_chests: vipLevels,
            progress_snapshot: JSON.stringify(progressSnapshot),
            available_to_claim: availableToClaim,
            highest_vip_opened: `VIP${ActivityDataMgr.instance.getVipLv()}`
        }
        DataReportMgr.instance.track(DataReporEvents.ClickMenuWinMore, eventData);
    }


    private onUpdateRedUi(): void {
        this.redNode.active = ActivityDataMgr.instance.getRedData(ActivityID.giftBox);
    }
    private openTips(): void {
        this.tipsNode.active = true;
    }
    private closeTips(): void {
        this.tipsNode.active = false;
    }
    private openRewardPopup(data: GiftBoxReward, vipLevel: number): void {
        this.rewardPopupPanel.open(data, vipLevel);
    }
    private getGiftBoxItem(vipLevel: number): GiftBoxItem {
        return this._boxList.find((item) => item.getVipLevel() === vipLevel);
    }
    private getGiftBoxData(vipLevel: number): GiftBoxItemData {
        return this._boxDatas.find((item) => item.vipLevel === vipLevel);
    }
    protected onDestroy(): void {
        super.onDestroy();
        ActivityDataMgr.instance.off(
            ActivityDataMgrEventsType.updateLevelBoxData,
            this.updateBoxList,
            this
        );

        let eventData = {
            is_reward_claimable: this._boxDatas.find((item) => item.status == 2) ? true : false,
        }
        DataReportMgr.instance.track(DataReporEvents.ExitWinMore, eventData);
    }
}
