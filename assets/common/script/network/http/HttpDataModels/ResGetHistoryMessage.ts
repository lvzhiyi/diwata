export class ResGetHistoryMessage {
    /**
     * 引用 ID
     */
    refId: string;

    /**
     * 消息列表
     */
    messages: messages[];

    /**
     * 总数量
     */
    totalCount: number;

    /**
     * 总页数
     */
    totalPages: number;

     /**
     * 总数量
     */
     total: number;

    /**
     * 当前页码
     */
    page: number;

    /**
     * 每页显示的数量限制
     */
    limit: number;

    public static toHistoryMessage(PageRes: any): ResGetHistoryMessage {
        let HistoryMessage: ResGetHistoryMessage = new ResGetHistoryMessage();
        HistoryMessage.messages = PageRes.list;
        HistoryMessage.totalPages = Math.ceil(PageRes.total / PageRes.pageSize);
        HistoryMessage.page = PageRes.pageNo;
        HistoryMessage.limit = PageRes.pageSize;
        return HistoryMessage;
    }
}

export class ResGetPageResMessage {
    /**
     * 引用 ID
     */
    refId: string;

    /**
     * 消息列表
     */
    list: messages[];

    /**
     * 总数量
     */
    total: number;

    /**
     * 当前页码
     */
    pageNo: number;

    /**
     * 每页显示的数量限制
     */
    pageSize: number;
}

export class messages {
    /**
     * 玩家名称
     */
    playerName: string;

    /**
     * 频道 ID
     */
    channelId: string;

    /**
     * 任务 ID
     */
    missionId: string;

    /**
     * 任务名称
     */
    missionName: string;

    /**
     * 任务描述
     */
    missionDescription: string;

    /**
     * 奖励 ID（获胜时的奖励）
     */
    rewardId: string;

    /**
     * 奖励名称
     */
    rewardName: string;

    /**
     * 奖励描述
     */
    rewardDescription: string;

    /**
     * 平台 ID
     */
    pId: string;

    /**
     * 类型
     * 1: COMPLETE_ACHIEVEMENT
     * 2: COMPLETE_TREASURE
     * 3: COMPLETE_DAILY_MISSION
     * 4: REDEEM_ACHIEVEMENT
     * 5: REDEEM_TREASURE
     * 6: REDEEM_REWARD
     */
    type: number;

    /**
     * 创建时间
     */
    createTime: string;

    /**
     * 奖励详情
     */
    rewardDetails: rewardDetails;
}

export class rewardDetails {
    count: number;
    starLevel: number;
}
