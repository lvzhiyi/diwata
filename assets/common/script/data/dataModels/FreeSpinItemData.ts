import { FreeSpin } from "../../network/http/HttpDataModels/ResFreeSpinOfPlayer";

export class FreeSpinItemData {
    /**
     * 活动 ID
     */
    campaignId: string;
    /**
     * 活动名称
     */
    campaignName: string;
    /**
     * 初始数量
     */
    initCount: number;
    remainingCount: number;
    expireDate: number;
    /**
     * 用于重定向的游戏唯一参考 ID
     */
    gameIdRef: string;

    /**
     * 游戏名称
     */
    gameName: string;

    /**
     * 总旋转收益金额
     */
    totalWin: number;
    /**
     * 免费旋转金额
     */
    freeBet: number;
    /**
     * 玩家姓名
     */
    playerName: string;
    /**
     * 是否展开
     */
    isSpread: boolean = false;
    /**
     * 将后端数据转换为FreeSpinItemData
     * @param freeSpin
     * @returns
     */
    public static toFreeSpinItemData(freeSpin: FreeSpin): FreeSpinItemData {
        let freeSpinItemData: FreeSpinItemData = new FreeSpinItemData();
        freeSpinItemData.campaignId = freeSpin.campaignId;
        freeSpinItemData.initCount = freeSpin.initCount;
        freeSpinItemData.remainingCount = freeSpin.remainingCount;
        freeSpinItemData.expireDate = freeSpin.expireDate;
        freeSpinItemData.gameIdRef = freeSpin.gameIdRef;
        freeSpinItemData.gameName = freeSpin.gameName;
        freeSpinItemData.totalWin = freeSpin.totalWin;
        freeSpinItemData.freeBet = freeSpin.freeBet;
        freeSpinItemData.playerName = freeSpin.playerName;
        freeSpinItemData.isSpread = freeSpin.isSpread;
        freeSpinItemData.campaignName = freeSpin.campaignName;
        return freeSpinItemData;
    }
}
