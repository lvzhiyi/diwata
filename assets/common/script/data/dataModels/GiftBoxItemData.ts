export class GiftBoxItemData {
    treasureId: string;
    name: string = "";
    vipLevel: number = 0;
    needExp: number = 0;
    nowExp: number = 0;
    status: number = 1; //1 - in progress , 2 - redeemable , 3 - redeemed
    rewards: GiftBoxReward[] = [];
}
/**
 * 礼盒奖励类，用于存储礼盒奖励的相关信息
 */
export class GiftBoxReward {
    /**
     * 奖励配置 ID
     */
    rewardConfigId: string;
    /**
     * 奖励的名称
     */
    name: string;
    /**
     * 奖励的数量，即该礼盒中包含的奖励物品的具体个数
     */
    count: number;
    /**
     * 奖励的图片链接
     */
    imgUrl: string;
    /**
     * 投注值
     */
    betValue: number;
    /**
     * 所需余额
     */
    balanceRequired: number;
    /**
     * 星级等级
     */
    starLevel: number;
}
