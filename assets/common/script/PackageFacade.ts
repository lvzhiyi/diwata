// import { LogMgr } from "../../scripts/components/LogMgr";
import {
    ActivityDialogViewBundleName,
    ActivityDialogViewID,
} from "./DialogView/ActivityDialogViewID";
import { assetManager, AudioClip, director, EventTarget, isValid, Node, Vec3 } from "cc";
import { ActivityDialogViewMgr } from "./DialogView/ActivityDialogViewMgr";
import { ActivityGlobleMgr } from "./managers/ActivityGlobleMgr";

import { ActivityConfigDataMgr } from "./data/ActivityConfigDataMgr";
import { ActivityEntryDialogView } from "./DialogView/views/ActivityEntryDialogView";

//玩家信息
export type UserInfo = {
    balance: number; //玩家余额
    vipLevel: number; //玩家vip等级
    uid: string; //玩家id
};

//埋点上报主包传参
export type ReportData = {
    gameId: string; //标识游戏的id,例如ColorCrush,与下面gameID不同
    gameVer: string; //标识游戏的版本
    playerId: string; //fpms用户id
    playerName: string; //用户名称，可用于游戏方的自行标识，若无置为空字符串即可
    abTestData?: Object; //ab实验信息，预留字段，当前置为空对象{}即可
    reportUrl: string; //上报url完整路径，跟httpHeadUrl可能不一致，单独传入
};

export interface IActivityFacade {
    activityIDs: Array<ActivityID>; //活动id
    httpHeadUrl: string; //活动host，通常是游戏服地址
    token: string; //登录token
    gameID: string; //游戏id
    effect: false | { volume?: number; audioClip: AudioClip }; //音效信息(点击音效)
    gameEnv: string; //游戏环境
    listener: EventTarget; //传入主包事件监听
    userInfo: UserInfo; //用户信息
    moveToPos?: Vec3; //星卡特效飞行终点位置
    cardPos?: Vec3; //使用星卡时卡片展示位置
    freeSpinFigurePos?: Vec3; //freeSpin下注金额处闪光位置
    spinPos?: Vec3; //spin按钮位置
    reportData?: ReportData; //埋点上报主包传参
}
// import { GameDataMgr } from "../../scripts/managers/GameDataMgr";
// import { DialogViewManager } from "../../scripts/DialogView/DialogViewManager";
// import { DialogViewID } from "../../scripts/DialogView/DialogViewID";
// import { GlobalMgr } from "../../scripts/managers/GlobalMgr";
import { ActivityDataMgr } from "./data/ActivityDataMgr";
import { GlobalMgr } from "./extra/GlobalMgr";
import { SocketConnect } from "./extra/SocketConnect";
import { WsResMessage } from "./extra/SocketType";
import { ActivityEventMgr, ActivityEventMgrEventsType } from "./ActivityEventMgr";
// import { GlobalDataMgr } from "../../scripts/managers/GlobalDataMgr";

export class PackageFacade {
    private static _inst: PackageFacade;
    //活动id和界面id的映射
    private _activityIDMap: Map<number, ActivityDialogViewID> = new Map();
    private _httpHeadUrl: string = "";
    private _activityIDs: Array<ActivityID> = [];
    private _commonEventTarget: EventTarget = null; //主包传过来事件监听器
    private _defaultRootNode: Node = null; //默认根节点
    private _gameEnv: string = ""; //游戏环境
    public static get instance(): PackageFacade {
        if (this._inst == null) {
            this._inst = new PackageFacade();
        }
        return this._inst;
    }
    constructor() {
        this.initBundleNameMap();
    }

    /**
   * 初始化Socket连接
  */
    public initSocket() {
        const hostUrl = GlobalMgr.instance.getwsHostUrl();
        const socket = new SocketConnect({
            url: hostUrl,
            token: GlobalMgr.instance.getToken(),
        });
        socket.on('message', (message) => {
            console.log('WebSocket message', message);
            this.handleMessage(message);
        });
        socket.connect();
    }

    // 添加处理消息的方法
    handleMessage(data: WsResMessage): void {
        const msgType = data.msgType;
        switch (msgType) {
            //每日任务完成
            case 'DAILY_MISSION_COMPLETE_RES':
                console.log('WebSocket-每日任务完成');
                ActivityDataMgr.instance.addNoticeData(ActivityID.dailyMission);
                break;
            //宝箱任务完成
            case 'TREASURE_MISSION_COMPLETE_RES':
                console.log('WebSocket-宝箱任务完成');
                ActivityDataMgr.instance.addRedData(ActivityID.giftBox);
                break;
            //成就任务完成
            case 'ACHIEVEMENT_MISSION_COMPLETE_RES':
                console.log('WebSocket-成就任务完成');
                ActivityDataMgr.instance.addRedData(ActivityID.achievement);
                break;
            default:
                ActivityEventMgr.instance.dispatchEvent(
                    ActivityEventMgrEventsType.otherMessage,
                    data
                );
        }
    }

    private initBundleNameMap(): void {
        this._activityIDMap.set(ActivityID.entry, ActivityDialogViewID.entry);
        this._activityIDMap.set(ActivityID.backpack, ActivityDialogViewID.backpack);
        this._activityIDMap.set(ActivityID.giftBox, ActivityDialogViewID.giftBox);
        this._activityIDMap.set(ActivityID.achievement, ActivityDialogViewID.achievement);
        this._activityIDMap.set(ActivityID.dailyMission, ActivityDialogViewID.dailyMission);
        this._activityIDMap.set(ActivityID.freeSpin, ActivityDialogViewID.freeSpin);

    }
    public getActivityIDs(): Array<ActivityID> {
        return this._activityIDs;
    }
    //预加载入口资源,如果希望进入游戏后立即显示入口弹窗 在进入游戏前完成这步
    public async preloadEntry(): Promise<void> {
        if(!GlobalMgr.instance.showActivity){
            return;
        }
        return new Promise((resolve, reject) => {
            const entryList = [ActivityID.entry,ActivityID.freeSpin];
            let loadedEntryCount = 0;
            const totalEntryCount = entryList.length;

            this._activityIDs.forEach((activityID) => {
                let bundleName: ActivityDialogViewBundleName =
                    ActivityDialogViewMgr.instance.getBundleName(
                        this._activityIDMap.get(activityID)
                    );
                if (!bundleName) {
                    this.error("ActivityID=" + activityID + "bundleName is null");
                    return;
                }
                assetManager.loadBundle(bundleName, async (err, bundle) => {
                    if (err) {
                        loadedEntryCount++;
                    }
                    ActivityDialogViewMgr.instance.addBundle(bundleName, bundle);

                    if (entryList.indexOf(activityID) != -1) {
                      await ActivityDialogViewMgr.instance.preload(
                        this._activityIDMap.get(activityID)
                      );

                      // 检查是否需要更新freespin数据
                      if (activityID === ActivityID.freeSpin && this._activityIDs.indexOf(ActivityID.freeSpin) != -1) {
                          console.log('加载freespin数据');
                          try {
                            await ActivityDataMgr.instance.updateFreeSpinData();
                          } catch (error) {
                            console.log('加载freespin数据失败', error);
                            resolve();
                          }
                      }

                      // 计数并检查是否所有入口资源都已加载完成
                      loadedEntryCount++;
                      if (loadedEntryCount >= totalEntryCount) {
                          resolve();
                      }
                    }
                });
            });

        });
    }
    //预加载所有活动资源
    public preload(): Promise<void> {
        return new Promise((resolve, reject) => {
            let promises: Array<Promise<void>> = [];
            this._activityIDs.forEach((activityID) => {
                promises.push(
                    ActivityDialogViewMgr.instance.preload(this._activityIDMap.get(activityID))
                );
            });
            Promise.all(promises)
                .then(() => {
                    this.log("预加载活动资源完成");
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /** 预加载活动bundle资源 */
    private async preloadActivityRes(onProgressCb?: Function): Promise<void> {
        if (this._activityIDs.length > 0) {
            let loadedCount = 0;
            this._activityIDs.forEach((activityID) => {
                let bundleName: ActivityDialogViewBundleName =
                    ActivityDialogViewMgr.instance.getBundleName(
                        this._activityIDMap.get(activityID)
                    );
                if (!bundleName) {
                    this.error("ActivityID=" + activityID + "bundleName is null");
                    //失败了只提示，不阻断流程
                    loadedCount++;
                    onProgressCb?.(loadedCount / this._activityIDs.length);
                } else {
                    assetManager.loadBundle(bundleName, async (err, bundle) => {
                        if (err) {
                            //失败了只提示，不阻断流程
                            loadedCount++;
                            this.error("ActivityID=" + activityID + "bundleName is null");
                            onProgressCb?.(loadedCount / this._activityIDs.length);
                        } else {
                            ActivityDialogViewMgr.instance.addBundle(bundleName, bundle);
                            await ActivityDialogViewMgr.instance.preload(
                                this._activityIDMap.get(activityID)
                            );
                            loadedCount++;
                            this.log("活动预加载进度 已加载bundle => ", bundleName);
                            onProgressCb?.(loadedCount / this._activityIDs.length);
                        }
                    });
                }
            });
        } else {
            onProgressCb?.(1);
            this.error("当前没有活动注册");
        }
    }
    /**预加载活动资源和数据  */
    public async preloadAllActivity(onProgressCb?: Function): Promise<void> {
        return new Promise((resolve, reject) => {
            this.preloadActivityRes(async (progress: number) => {
                onProgressCb?.(progress);
                if (progress >= 1) {
                    // 去掉接口请求

                    // if (this._activityIDs.indexOf(ActivityID.freeSpin) != -1) {
                    //     await ActivityDataMgr.instance.updateFreeSpinData();
                    //     this.log("freeSpin数据预加载完成");
                    // }
                    resolve();
                }
            });
        });
    }
    /**
     * 初始化活动包 初始完毕后会调用resolve
     * @param activityIDs 活动id
     * @param httpHeadUrl 请求头
     * @param token 后端请求用
     * @param uid 后端请求用
     * @param gameID
     * @returns
     */
    public init(activityConf: IActivityFacade) {
        ActivityGlobleMgr.instance.initData(
            activityConf.token,
            activityConf.userInfo.uid,
            activityConf.gameID
        );
        this._httpHeadUrl = activityConf.httpHeadUrl;
        this._commonEventTarget = activityConf.listener;
        this._activityIDs = activityConf.activityIDs;
        this._gameEnv = activityConf.gameEnv;
        ActivityDataMgr.instance.updateVipLv(activityConf.userInfo.vipLevel);
        ActivityDataMgr.instance.updateBalance(activityConf.userInfo.balance);
        ActivityDataMgr.instance.setGameEnv(activityConf.gameEnv);
        if (activityConf.effect) {
            ActivityDataMgr.instance.updateVolume(activityConf.effect.volume);
            ActivityDataMgr.instance.setVolumeClip(activityConf.effect.audioClip);
        } else {
            ActivityDataMgr.instance.setUseEffect(false);
        }
        ActivityConfigDataMgr.instance.initPosData(
            activityConf.moveToPos,
            activityConf.cardPos,
            activityConf.freeSpinFigurePos,
            activityConf.spinPos
        );
        ActivityDataMgr.instance.setOpenActivityIds(activityConf.activityIDs);
        ActivityDataMgr.instance.setReportData(activityConf.reportData);
    }

    //设置星卡特效飞行终点位置
    public setStarCardPosData(moveToPosData: Vec3, cardPosData: Vec3, freeSpinFigurePosData?: Vec3, spinPosData?: Vec3): void {
        ActivityConfigDataMgr.instance.initPosData(moveToPosData, cardPosData, freeSpinFigurePosData, spinPosData);
    }

    /**
     * 显示入口弹窗
     */
    public showEntryDialog(parent?: Node, data?: any): void {
        if (GlobalMgr.instance.showActivity) {
            ActivityDataMgr.instance.updateBagData();
            ActivityDataMgr.instance.updateOtherGameData();
            ActivityDataMgr.instance.updateLevelBoxData();
            ActivityDataMgr.instance.updateAchievementData();
            ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.entry, data, parent);
            // 如果token存在，则初始化socket
            if(GlobalMgr.instance.getToken()) {
                this.initSocket();
            }
        }
    }
    /**
     * 设置入口按钮是否显示  给主包临时隐藏入口用
     * @param active
     */
    public setEntryDialogActive(active: boolean): void {
        let entryDialog: ActivityEntryDialogView = ActivityDialogViewMgr.instance.getDialog(
            ActivityDialogViewID.entry
        );
        if (entryDialog) {
            entryDialog.setEntryDialogActive(active);
        }
    }
    /**
     * 设置使用星卡时 卡片的父节点 如果不传则被添加到getRootNode
     * @param cardNode
     */
    public setCardNode(cardNode: Node): void {
        ActivityDataMgr.instance.setCardNode(cardNode);
    }
    /** 如果当前有freeSpin数据，则使用它 */
    public useFreeSpin(): boolean {
        let freeSpinDatas = ActivityDataMgr.instance.getThisGameFreeSpinDatas();
        if (freeSpinDatas.length > 0) {
            ActivityGlobleMgr.instance.useFreeSpin(freeSpinDatas[0]);
            return true;
        }
        return false;
    }
    /** 打开freeSpin窗口*/
    public openFreeSpin(): void {
        ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.freeSpin);
    }
    /////////////////////////////////////////////////需要主包支持/////////////////////////////////////////////////
    //道具是否在使用中 //
    public getIsUseGoods(): boolean {
        if (ActivityDataMgr.instance.getGoodsData() != null) {
            return true;
        }
        return false;
    }
    //是否在购买免费游戏中
    public getIsBuyFreeIng(): boolean {
        return ActivityDataMgr.instance.getFreeSpinning();
    }

    //是否在游戏中
    public getIsInGame(): boolean {
        return GlobalMgr.instance.isGameing;
    }
    //获取当前余额
    public getBalance(): number {
        return GlobalMgr.instance.balance;
    }
    public openToast(text: string): void {
        console.log('openToast', text);
        ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.toast, text);
    }
    //获取根节点 活动的窗口将会挂载到这个节点下
    public getRootNode(): Node {
        return GlobalMgr.instance.rootNode;
    }

    public getVipLv(): number {
        return GlobalMgr.instance.userLevel;
    }
    public log(...args: any[]): void {
        console.log(args);
    }
    public error(...args: any[]): void {
        console.log(args);
    }
    public getHttpUrl(pathSuffix: string): string {
        if (pathSuffix.trim().startsWith("http")) {
            return pathSuffix;
        }
        return this._httpHeadUrl + pathSuffix;
    }

    /** 获取主包事件监听器 */
    public getCommonEventTarget(): EventTarget {
        return this._commonEventTarget;
    }
}
export enum ActivityID {
    entry = 1, // 入口
    backpack = 2, // 背包
    giftBox = 3, // 礼包
    achievement = 4, // 成就
    dailyMission = 5, // 每日任务
    freeSpin = 6, // 免费转盘
}
export class pathSuffix {
    public static getBagData: string = "/bag/queryBagCurrentGameReward"; //获取背包数据
    public static getLevelBoxData: string = "/treasure/getTreasure"; //获取等级宝箱
    public static getBoxReward: string = "/treasure/redeemTreasure"; //领取宝箱奖励
    public static getAchievement: string = "/achievement/getAchievement"; //获取成就数据
    public static getDailyMission: string = "/mission/getDailyMission"; //获取每日任务数据
    public static getTier: string = "/igoReward/getTier"; //获取当前等级
    public static getOtherGame: string = "/bag/queryBagOtherGameReward"; //获取其他游戏数据
    public static getRewardDetail: string = "/bag/getRewardDetail"; //获取奖励详情
    public static redeemAchievement: string = "/achievement/redeemAchievement"; //领取成就奖励
    public static getHistoryMessage: string = "/bag/getHistoryMessage"; //获取历史消息
    public static getFreeSpinData: string = "/freeSpin/freeSpinOfPlayer"; //获取freeSpin数据
    public static getFreeSpinHistory: string ="/freeSpin/freeSpinHistoryOfPlayer"; //获取freeSpin历史
}
