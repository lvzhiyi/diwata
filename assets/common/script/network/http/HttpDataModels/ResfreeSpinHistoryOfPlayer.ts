export interface ResFreeSpinHistoryOfPlayer {
    playerName: string;
    refId: string;
    /**
     * 总页数
     */
    totalPages: number;
    /**
     * 当前页数
     */
    page: number;
    /**
     * 每页显示的数量限制
     */
    history: Array<FreeSpinHistory>;
}

export interface FreeSpinHistory {
    /**
     * 请求的请求 ID
     */
    campaignId: string;

    initCount: number;

    remainingCount: number;

    /**
     * 游戏唯一 ID
     */
    gameId: string;

    /**
     * 游戏名称
     */
    gameName: string;

    /**
     * 总旋转收益金额
     */
    totalWin: number;

    firstUsedTime: number;
    freeBet: number;
    usedCount: number;
}
