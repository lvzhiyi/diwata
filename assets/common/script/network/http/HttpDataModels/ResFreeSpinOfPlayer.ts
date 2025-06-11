export interface ResFreeSpinOfPlayer {
    playerName: string;
    refId: string;
    current: Array<FreeSpin>;
    others: Array<FreeSpin>;
}

export interface FreeSpin {
    /**
     * 渠道 ID
     */
    channelId: string;
    /**
     * 活动 ID
     */
    campaignId: string;
    campaignName: string; //活动name
    initCount: number;
    remainingCount: number;
    expireDate: number;

    /**
     * 游戏唯一 ID
     */
    gameId: string;

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
     * 请求的请求 ID
     */
    requestId: string;
    /**
     * 是否展开
     */
    isSpread: boolean; //这个属性是客户端后续加上去的
}
