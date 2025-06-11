import { AudioClip, EventTarget, Node } from "cc";
import { ActivityServicesMgr } from "../network/http/services/ActivityServicesMgr";
import { HttpDataBase } from "../network/http/services/HttpDataBase";
import { ResGetBagData, RewardBag } from "../network/http/HttpDataModels/ResGetBagData";
import { GoodsItemData } from "./dataModels/GoodsItemData";
import { GiftBoxItemData } from "./dataModels/GiftBoxItemData";
import { ResGetLvBox, Treasure } from "../network/http/HttpDataModels/ResGetLvBox";
import { ResAchievement } from "../network/http/HttpDataModels/ResAchievement";
import { ResDailyMission } from "../network/http/HttpDataModels/ResDailyMission";
import { Handler } from "../tools/Handler";
import { ActivityID, PackageFacade, ReportData } from "../PackageFacade";
import { OtherGameItemData } from "./dataModels/OtherGameItemData";
import { ResOtherGame } from "../network/http/HttpDataModels/ResOtherGame";
import { ActivityUtils } from "../tools/ActivityUtils";
import { UseGoodsEventData } from "../ActivityEventMgr";
import { FreeSpin, ResFreeSpinOfPlayer } from "../network/http/HttpDataModels/ResFreeSpinOfPlayer";
import { FreeSpinItemData } from "./dataModels/FreeSpinItemData";
import { ActivityGlobleMgr } from "../managers/ActivityGlobleMgr";
export enum GameDataMgrEventsType {
    updateVipLv = "updateVipLv", //更新vip等级
    updateBalance = "updateBalance", //更新余额
    updateGaming = "updateGaming", //更新是否在游戏中
    updateBuyFreeCount = "updateBuyFreeCount", // 更新免费游戏次数
    updateVolume = "updateVolume", //更新音效音量
}
export class ActivityDataMgr {
    private static _instance: ActivityDataMgr;
    private _redDatas: Array<ActivityID> = []; //哪些功能有红点
    private _eventTarget: EventTarget = new EventTarget();
    private _bagDatas: GoodsItemData[] = []; //背包数据
    private _levelBoxDatas: GiftBoxItemData[] = []; //等级宝箱数据
    private _noticeDatas: Array<ActivityID> = []; //哪些功能需要公告
    private _achievementData: ResAchievement = null; //成就数据
    private _dailyMissionData: ResDailyMission = null; //每日任务数据
    private _otherGameDatas: Array<OtherGameItemData> = []; //背包其他游戏数据
    private _tier: number = 0; //当前等级
    private _goodsData: UseGoodsEventData = null; //使用物品数据
    private _isBuyFreeIng: boolean = false; //是否在购买免费游戏中
    private _gameState: boolean = false; //游戏状态 false:正常 true:游戏中
    private _buyFreeGameState: boolean = false; //购买免费轮游戏状态 false:正常 true:游戏中
    private _balance: number = 0; //余额
    private _vipLv: number = 3; //VIP等级
    private _useEffect: boolean = true; //是否使用音效
    private _volume: number = 1; // 音效音量
    private _volumeClip: AudioClip = null; //音效资源
    private _gameEnv: string; //游戏环境
    private _rootNodeScale: number = 1; //根节点缩放（用作适配主游戏非750*1334设计尺寸)
    private _isUseStarCard: boolean = false; //是否在请求使用星卡中
    private _cardNode: Node = null; //卡片父节点
    private _openActivityIds: Array<ActivityID> = []; //打开的活动
    private _serverTimeDelta: number = 0; //服务器时间戳和本地时间戳的差值
    private _thisGameFreeSpinDatas: Array<FreeSpinItemData> = []; //当前游戏freeSpin数据
    private _otherGameFreeSpinDatas: Array<FreeSpinItemData> = []; //其他游戏freeSpin数据
    private _freeSpinCampaignId: string = null; //当前在使用的freeSpin活动id null表示没有在使用
    private _reportData: ReportData = null; //埋点上报主包传参

    public static get instance(): ActivityDataMgr {
        if (!this._instance) {
            this._instance = new ActivityDataMgr();
        }
        return this._instance;
    }

    public registerEvent() {
        const commonEvent = PackageFacade.instance.getCommonEventTarget();
        if (!commonEvent) return;
        commonEvent.on(GameDataMgrEventsType.updateBalance, this.updateBalance, this);
        commonEvent.on(GameDataMgrEventsType.updateBuyFreeCount, this.updateBuyFreeCount, this);
        commonEvent.on(GameDataMgrEventsType.updateGaming, this.updateGameState, this);
        
        commonEvent.on(GameDataMgrEventsType.updateVipLv, this.updateVipLv, this);
        commonEvent.on(GameDataMgrEventsType.updateVolume, this.updateVolume, this);
    }

    public offEvent() {
        const commonEvent = PackageFacade.instance.getCommonEventTarget();
        if (!commonEvent) return;
        commonEvent.off(GameDataMgrEventsType.updateBalance, this.updateBalance, this);
        commonEvent.off(GameDataMgrEventsType.updateBuyFreeCount, this.updateBuyFreeCount, this);
        commonEvent.off(GameDataMgrEventsType.updateGaming, this.updateGameState, this);
        commonEvent.off(GameDataMgrEventsType.updateVipLv, this.updateVipLv, this);
        commonEvent.off(GameDataMgrEventsType.updateVolume, this.updateVolume, this);
    }
    public setOpenActivityIds(ids: Array<ActivityID>): void {
        this._openActivityIds = ids;
    }
    /** 获取卡片父节点 */
    public getCardNode(): Node {
        return this._cardNode;
    }
    /** 设置卡片父节点 */
    public setCardNode(cardNode: Node): void {
        this._cardNode = cardNode;
    }
    /** 获取根节点缩放 */
    public getRootNodeScale(): number {
        return this._rootNodeScale;
    }
    /** 设置根节点缩放 */
    public setRootNodeScale(scale: number): void {
        if (this._rootNodeScale == scale) return;
        this._rootNodeScale = scale;
    }

    /** 获取游戏环境 */
    public getGameEnv(): string {
        return this._gameEnv;
    }
    /** 设置游戏环境 */
    public setGameEnv(gameEnv: string): void {
        this._gameEnv = gameEnv;
    }

    /** 设置埋点上报主包传参 */
    public setReportData(reportData: ReportData): void {
        this._reportData = reportData;
    }
    /** 获取埋点上报主包传参 */
    public getReportData(): ReportData {
        return this._reportData;
    }

    /** 更新物品数据 */
    public updateGoodsData(goods: UseGoodsEventData) {
        this._goodsData = goods;
    }
    /** 返回物品数据 */
    public getGoodsData() {
        return this._goodsData;
    }
    /** 获取服务器时间戳 单位毫秒 */
    public getTimestamp(): number {
        return new Date().getTime() + this._serverTimeDelta;
    }
    /** 设置服务器时间戳 单位秒 */
    public setTimestamp(delta: number): void {
        this._serverTimeDelta = delta - new Date().getTime();
    }
    /**更新免费游戏次数 */
    private updateBuyFreeCount(freeCount: number) {
        if (freeCount > 0) {
            this._isBuyFreeIng = true;
        } else {
            this._isBuyFreeIng = false;
        }
    }
    public getIsBuyFreeIng(): boolean {
        return this._isBuyFreeIng;
    }
    public setIsUseStarCard(isUseStarCard: boolean): void {
        this._isUseStarCard = isUseStarCard;
    }
    public getIsUseStarCard(): boolean {
        return this._isUseStarCard;
    }
    public getThisGameFreeSpinDatas(): Array<FreeSpinItemData> {
        return this._thisGameFreeSpinDatas;
    }
    public getOtherGameFreeSpinDatas(): Array<FreeSpinItemData> {
        return this._otherGameFreeSpinDatas;
    }
    /** 获取freeSpin活动id  null表示没有在使用*/
    public getFreeSpinCampaignId(): string {
        return this._freeSpinCampaignId;
    }
    /** 设置freeSpin活动id  null表示没有在使用*/
    public setFreeSpinCampaignId(campaignId: string): void {
        this._freeSpinCampaignId = campaignId;
        this.dispatchEvent(ActivityDataMgrEventsType.updateFreeSpinCampaignId);
    }
    /** 更新是否免费轮区间 */
    public updateFreeSpinning(freeSpinning: boolean) {
        this._buyFreeGameState = freeSpinning;
    }
    /** 返回是否免费轮区间 */
    public getFreeSpinning() {
        return this._buyFreeGameState;
    }
    /** 更新游戏状态 */
    private updateGameState(gaming: boolean): void {
        this._gameState = gaming;
    }
    /**获取游戏状态 false:正常 true:游戏中*/
    public getGameState(): boolean {
        return this._gameState;
    }

    /** 更新余额 */
    public updateBalance(balance: number): void {
        this._balance = balance;
    }

    /** 获取余额 */
    public getBalance() {
        return this._balance;
    }

    /** 更新VIP等级 */
    public updateVipLv(vipLv: number) {
        this._vipLv = vipLv;
    }

    /** 获取VIP等级 */
    public getVipLv(): number {
        return this._vipLv;
    }

    /** 设置是否使用音效 */
    public setUseEffect(useEffect: boolean) {
        this._useEffect = useEffect;
    }
    /** 获取是否使用音效 */
    public getUseEffect(): boolean {
        return this._useEffect;
    }

    /** 更新音量 */
    public updateVolume(volume: number) {
        this._volume = volume;
    }

    /** 获取音量 */
    public getVolume() {
        return this._volume;
    }

    /** 音效资源 */
    public setVolumeClip(clip: AudioClip) {
        this._volumeClip = clip;
    }

    /** 音效资源 */
    public getVolumeClip() {
        return this._volumeClip;
    }

    public setTier(tier: number): void {
        this._tier = tier;
    }
    public getTier(): number {
        return this._tier;
    }
    public addRedData(type: ActivityID): void {
        if (this._openActivityIds.indexOf(type) == -1) {
            return;
        }
        if (this._redDatas.indexOf(type) == -1) {
            if (type != ActivityID.dailyMission) {
                this._redDatas.push(type);

                //任何功能有红点，则入口也有红点
                if (this._redDatas.indexOf(ActivityID.entry) == -1) {
                    this._redDatas.push(ActivityID.entry);
                }
                this.dispatchEvent(ActivityDataMgrEventsType.updateRedData);
            }
        }
        this.addNoticeData(type);
    }
    public removeRedData(type: ActivityID): void {
        if (this._redDatas.indexOf(type) == -1) {
            return;
        }
        this._redDatas.splice(this._redDatas.indexOf(type), 1);
        if (this._redDatas.length == 1) {
            this._redDatas.length = 0;
        }
        this.dispatchEvent(ActivityDataMgrEventsType.updateRedData);
    }
    public getRedData(type: ActivityID): boolean {
        return this._redDatas.indexOf(type) != -1;
    }
    public getBagDatas(): GoodsItemData[] {
        return this._bagDatas;
    }
    public getOtherGameDatas(): Array<OtherGameItemData> {
        return this._otherGameDatas;
    }
    public getLevelBoxDatas(): GiftBoxItemData[] {
        return this._levelBoxDatas;
    }
    public getAchievementData(): ResAchievement {
        return this._achievementData;
    }
    public setAchievementData(data: ResAchievement): void {
        this._achievementData = data;
    }
    public getDailyMissionData(): ResDailyMission {
        return this._dailyMissionData;
    }
    public setDailyMissionData(data: ResDailyMission): void {
        this._dailyMissionData = data;
    }
    public getNoticeDatas(): Array<ActivityID> {
        return this._noticeDatas;
    }
    public addNoticeData(data: ActivityID): void {
        if (this._noticeDatas.indexOf(data) == -1) {
            this._noticeDatas.push(data);

            // 定义优先级映射 (数字越小优先级越高,排在越前面)
            const priorityMap = new Map<ActivityID, number>([
                [ActivityID.backpack, 0], // 背包 (2) 最高优先级
                [ActivityID.dailyMission, 1], // 任务 (5) 第二优先级
                [ActivityID.giftBox, 2], // 宝箱 (3) 第三优先级
                [ActivityID.achievement, 3], // 成就 (4) 最低优先级
            ]);

            // 根据优先级排序
            this._noticeDatas.sort((a, b) => {
                const priorityA = priorityMap.get(a) ?? 999; // 未定义优先级的放最后
                const priorityB = priorityMap.get(b) ?? 999;
                return priorityA - priorityB; // 优先级数字小的排在前面
            });
            this.dispatchEvent(ActivityDataMgrEventsType.updateNoticeData);
        }
    }
    //移除公告第一个
    public removeNoticeData(): void {
        if (this._noticeDatas.length > 0) {
            this._noticeDatas.shift();
        }
    }
    public clearNoticeData(): void {
        this._noticeDatas.length = 0;
    }
    //更新背包数据
    public updateBagData(isRed: boolean = true): void {
        ActivityServicesMgr.instance.getBagData(
            new Handler(this, (data: HttpDataBase<ResGetBagData>) => {
                if (data.isSuccessful) {
                    this._bagDatas.length = 0;
                    if (data.data.rewardBag) {
                        for (let i = 0; i < data.data.rewardBag.length; i++) {
                            let rewardBag = data.data.rewardBag[i];
                            this._bagDatas.push(ResGetBagData.toGoodsItemData(rewardBag));
                        }
                    }
                    if (isRed && this._bagDatas.length > 0) {
                        this.addRedData(ActivityID.backpack);
                    }
                    this.dispatchEvent(ActivityDataMgrEventsType.updateBagData);
                }
            })
        );
    }
    //更新等级宝箱数据
    public updateLevelBoxData(isUpdateRed: boolean = true): void {
        if (this._openActivityIds.indexOf(ActivityID.giftBox) == -1) {
            return;
        }
        ActivityServicesMgr.instance.getLevelBoxData(
            new Handler(this, (data: HttpDataBase<ResGetLvBox>) => {
                if (data.isSuccessful) {
                    let isRed = false;
                    this._levelBoxDatas.length = 0;
                    if(data.data.treasure == undefined && data.data instanceof Array){
                        data.data.treasure = data.data;
                    }
                    if (data.data.treasure) {
                        for (let i = 0; i < data.data.treasure.length; i++) {
                            let treasure = data.data.treasure[i];
                            let giftBoxItemData = ResGetLvBox.toGiftBoxItemData(treasure);
                            this._levelBoxDatas.push(giftBoxItemData);
                            if (PackageFacade.instance.getVipLv() >= giftBoxItemData.vipLevel) {
                                if (treasure.status == 2) {
                                    isRed = true;
                                }
                            }
                        }
                        if (isRed && isUpdateRed) {
                            this.addRedData(ActivityID.giftBox);
                        } else {
                            if (!isRed) {
                                this.removeRedData(ActivityID.giftBox);
                            }
                        }
                        this.dispatchEvent(ActivityDataMgrEventsType.updateLevelBoxData);
                    }
                }
            })
        );
    }
    //更新其他游戏数据
    public updateOtherGameData(): void {
        ActivityServicesMgr.instance.getOtherGame(
            new Handler(this, (data: HttpDataBase<ResOtherGame>) => {
                if (!data.isSuccessful) {
                    return;
                }
                this._otherGameDatas.length = 0;
                if(data.data.rewardBag == undefined && data.data.rewardDetails != undefined) {
                    data.data.rewardBag = data.data.rewardDetails;
                }
                if (data.data.rewardBag) {
                    for (let i = 0; i < data.data.rewardBag.length; i++) {
                        let rewardBag = data.data.rewardBag[i];
                        this._otherGameDatas.push(ResOtherGame.toOtherGameItemData(rewardBag));
                    }
                }
                this.dispatchEvent(ActivityDataMgrEventsType.updateOtherGameData);
            })
        );
    }

    /** 更新成就数据 */
    public updateAchievementData(): void {
        if (this._openActivityIds.indexOf(ActivityID.achievement) == -1) {
            return;
        }
        let preloadUrlSet: Set<string> = new Set(); // 预加载成就奖励图标Url

        // 获取成就数据
        ActivityServicesMgr.instance.getAchievement(
            new Handler(this, (data: HttpDataBase<ResAchievement>) => {
                if (data?.isSuccessful && data.data?.achievementList) {
                    this._achievementData = data.data;
                    let canReceive = false;
                    for (let i = 0; i < this._achievementData.achievementList.length; i++) {
                        let achievement = this._achievementData.achievementList[i];

                        if (achievement.status == 2 && !canReceive) {
                            canReceive = true;
                        }
                        preloadUrlSet.add(achievement.iconUrl);
                        if (achievement.status == 3) {
                            for (let j = 0; j < achievement.rewards.length; j++) {
                                preloadUrlSet.add(achievement.rewards[j].imgUrl);
                            }
                        }
                    }
                    // 预加载成就奖励图标
                    for (let url of preloadUrlSet) {
                        ActivityUtils.loadServerImage(url);
                    }

                    if (canReceive) this.addRedData(ActivityID.achievement);
                }
            })
        );
    }
    public updateFreeSpinData(): Promise<void> {
        let isResolved = false;
        return new Promise((resolve, reject) => {
            // 设置超时机制
            const timeout = setTimeout(() => {
                if (!isResolved) {
                    console.log('获取freeSpin数据超时');
                    resolve();
                }
             }, 3000); 
            ActivityServicesMgr.instance.getFreeSpinData(
                new Handler(this, (data: HttpDataBase<ResFreeSpinOfPlayer>) => {
                    if (!isResolved) {
                        clearTimeout(timeout);
                        isResolved = true;
                        resolve();
                    }
                    //是否异常
                    let isError: boolean = false;
                    if (this._freeSpinCampaignId) {
                        isError = true;
                    }
                    if (data.isSuccessful) {
                        this._thisGameFreeSpinDatas = data.data.current
                            .filter((item) => item.remainingCount > 0)
                            .map((item) => FreeSpinItemData.toFreeSpinItemData(item));
                        this._otherGameFreeSpinDatas = data.data.others.map((item) =>
                            FreeSpinItemData.toFreeSpinItemData(item)
                        );
                        this._thisGameFreeSpinDatas.forEach((item) => {
                            if (item.campaignId == this._freeSpinCampaignId) {
                                isError = false;
                            }
                        });
                        if (isError) {
                            ActivityGlobleMgr.instance.cancelUseFreeSpin();
                        }
                        this.dispatchEvent(ActivityDataMgrEventsType.updateFreeSpinData);
                    }
                })
            );
        });
    }
    public on(
        type: ActivityDataMgrEventsType,
        callback: (...any: any[]) => void,
        thisArg: any,
        once?: boolean
    ): void {
        this._eventTarget.on(type, callback, thisArg, once);
    }
    public off(
        type: ActivityDataMgrEventsType,
        callback: (...any: any[]) => void,
        thisArg: any
    ): void {
        this._eventTarget.off(type, callback, thisArg);
    }
    public offAll(thisArg?: any): void {
        this._eventTarget.removeAll(thisArg);
    }
    /**派发事件**/
    private dispatchEvent(type: ActivityDataMgrEventsType, arg0?: any): void {
        this._eventTarget.emit(type, arg0);
    }
    private getTestData(): FreeSpinItemData[] {
        let arr: FreeSpinItemData[] = [];
        let type = [1, 2, 3, 4, 5, 6];
        for (let i: number = 0; i < 15; i++) {
            let item: FreeSpinItemData = new FreeSpinItemData();
            item.playerName = "玩家" + i;
            item.campaignId = "任务" + i;
            item.gameName = "任务名称" + i;
            item.gameIdRef = "任务描述" + i;
            item.totalWin = 100;
            item.freeBet = 100;
            item.initCount = 2;
            item.remainingCount = 2;
            item.expireDate = 100;
            arr.push(item);
        }
        return arr;
    }
}
export enum ActivityDataMgrEventsType {
    updateRedData = "updateRedData", //更新红点数据
    updateBagData = "updateBagData", //更新背包数据
    updateLevelBoxData = "updateLevelBoxData", //更新等级宝箱数据
    updateNoticeData = "updateNoticeData", //更新公告数据
    updateOtherGameData = "updateOtherGameData", //更新其他游戏数据
    updateFreeSpinData = "updateFreeSpinData", //更新freeSpin数据
    updateFreeSpinCampaignId = "updateFreeSpinCampaignId", //更新freeSpin活动id
}
