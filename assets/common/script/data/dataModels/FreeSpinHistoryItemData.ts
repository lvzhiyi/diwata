import { FreeSpinHistory } from "../../network/http/HttpDataModels/ResfreeSpinHistoryOfPlayer";

export class FreeSpinHistoryItemData {
    /**免费次数*/
    usedCount: number;
    /**
     * 游戏名称
     */
    gameName: string;

    /**
     * 总旋转收益金额
     */
    totalWin: number;
    freeBet: number = 0;
    /**
     * 首次使用时间
     */
    firstUsedTime: number;
    /**
     * 将后端数据转换为FreeSpinHistoryItemData
     * @param freeSpinHistory
     * @returns
     */
    public static toFreeSpinHistoryItemData(
        freeSpinHistory: FreeSpinHistory
    ): FreeSpinHistoryItemData {
        let freeSpinHistoryItemData: FreeSpinHistoryItemData = new FreeSpinHistoryItemData();
        freeSpinHistoryItemData.usedCount = freeSpinHistory.usedCount;
        freeSpinHistoryItemData.gameName = freeSpinHistory.gameName;
        freeSpinHistoryItemData.totalWin = freeSpinHistory.totalWin;
        freeSpinHistoryItemData.firstUsedTime = freeSpinHistory.firstUsedTime;
        freeSpinHistoryItemData.freeBet = freeSpinHistory.freeBet;
        return freeSpinHistoryItemData;
    }
}
