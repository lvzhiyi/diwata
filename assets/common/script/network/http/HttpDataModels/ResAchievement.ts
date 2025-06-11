
/** 成就列表数据 */
export interface ResAchievement {
    achievementList: AchievementItemInfo[];
}

/** 成就数据 */
export interface AchievementItemInfo {

    completeAt: string;
    id: string;
    iconUrl: string;
    name: string;
    description: string;
    status: number;
    progressList: {
        current: number;
        target: number;
    };
    redeemId: string;
    rewards: RewardItemInfo[];
}

/** 成就奖励数据 */
export interface RewardItemInfo {

    name: string;
    count: number;
    imgUrl: string;
    betValue: number;
    starLevel: number;
    rewardConfigId: string;
    balanceRequired: number;
}
   
/** 兑换成就数据 */
export interface ReqRedeemAchievement{
    achievementId: string;
    redeemId: string;
}

/** 兑换成就数据 */
export interface RedeemAchievementData{
    channelId: string;
    pId: string;
    playerName: string;
    refId: string;
    reward: RewardItemInfo
}

