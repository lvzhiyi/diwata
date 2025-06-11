import { EventTarget } from "cc";
import { ActivityDataMgr } from "./data/ActivityDataMgr";
import { FreeSpin } from "./network/http/HttpDataModels/ResFreeSpinOfPlayer";

export enum ActivityEventMgrEventsType {
    ////////////////////////活动通知主包//////////////////////////
    useGoods = "useGoods", // 参数 UseGoodsEventData
    starCardEnd = "starCardEnd", //使用星卡动画完毕 参数无
    useFreeSpin = "useFreeSpin", //开启freeSpin 参数 UseFreeSpinEventData
    cancelUseFreeSpin = "cancelUseFreeSpin", //取消使用freeSpin 参数无
    ////////////////////////主包通知活动/////////////////////////
    useGoodsSuccess = "useGoodsSuccess", //主包使用道具成功
    addRedData = "addRedData", //添加红点 参数活动id:ActivityID
    hideStarCard = "hideStarCard", //关闭使用星卡流程 可以任何时候调用中断使用星卡流程  参数 无
    endFreeSpin = "endFreeSpin", //结束freeSpin 参数无
    otherMessage = "otherMessage", // 其他消息
}
//和主包通信的event
export class ActivityEventMgr {
    private static _instance: ActivityEventMgr;
    private _eventTarget: EventTarget = new EventTarget();
    public static get instance(): ActivityEventMgr {
        if (!this._instance) {
            this._instance = new ActivityEventMgr();
        }
        return this._instance;
    }
    constructor() {
        this.initRegister();
    }
   
    public useGoods(reward_id: string, rewardConfigId: string, starLv: number, bet: number): void {
        const useGoodsData: UseGoodsEventData = {
            reward_id: reward_id,
            rewardConfigId: rewardConfigId,
            starLv: starLv,
            bet: bet,
        };
        this.dispatchEvent(ActivityEventMgrEventsType.useGoods, useGoodsData);
        ActivityDataMgr.instance.updateGoodsData(useGoodsData);
    }
    public starCardEnd(): void {
        this.dispatchEvent(ActivityEventMgrEventsType.starCardEnd);
    }
    public useFreeSpin(data: FreeSpin): void {
        this.dispatchEvent(ActivityEventMgrEventsType.useFreeSpin, {
            campaignId: data.campaignId,
            freeBet: data.freeBet,
            count: data.remainingCount,
            totalAward: data.totalWin,
        });
    }
    public cancelUseFreeSpin(): void {
        this.dispatchEvent(ActivityEventMgrEventsType.cancelUseFreeSpin);
    }

    private initRegister(): void {
        this.on(ActivityEventMgrEventsType.useGoodsSuccess, this.onUseGoodsSuccess, this);
        this.on(ActivityEventMgrEventsType.hideStarCard, this.onUseStarCardFinish, this);
    }

    private onUseStarCardFinish(): void {
        ActivityDataMgr.instance.updateGoodsData(null);
    }

    private onUseGoodsSuccess(): void {
        ActivityDataMgr.instance.updateBagData(false);
    }
    public dispatchEvent(type: ActivityEventMgrEventsType, arg0?: any): void {
        this._eventTarget.emit(type, arg0);
    }
    public on(type: ActivityEventMgrEventsType, callback: any, thisArg: any, once?: boolean): void {
        this._eventTarget.on(type, callback, thisArg, once);
    }
    public off(type: ActivityEventMgrEventsType, callback: any, thisArg: any): void {
        this._eventTarget.off(type, callback, thisArg);
    }
    public offAll(thisArg?: any): void {
        this._eventTarget.removeAll(thisArg);
    }
}
export type UseGoodsEventData = {
    reward_id: string;
    rewardConfigId: string;
    starLv: number;
    bet: number;
};
export type UseFreeSpinEventData = {
    campaignId: string;
    freeBet: number;
    count: number; //剩余次数
    totalAward: number; //总奖励
};
