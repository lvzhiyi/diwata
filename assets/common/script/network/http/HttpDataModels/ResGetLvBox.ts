import { GiftBoxItemData, GiftBoxReward } from "../../../data/dataModels/GiftBoxItemData";

export class ResGetLvBox {
    channelId: string;
    pId: string;
    playerName: string;
    refId: string;
    treasure: Treasure[];
    public static toGiftBoxItemData(treasure: Treasure): GiftBoxItemData {
        let giftBoxItemData: GiftBoxItemData = new GiftBoxItemData();
        giftBoxItemData.treasureId = treasure.treasureId;
        giftBoxItemData.name = treasure.name;
        giftBoxItemData.vipLevel = treasure.level + 1; //后端是从0开始
        giftBoxItemData.needExp = treasure.targetExperience;
        giftBoxItemData.nowExp = treasure.currentExperience;
        giftBoxItemData.status = treasure.status;
        if (treasure.rewards) {
            for (let i = 0; i < treasure.rewards.length; i++) {
                let reward = treasure.rewards[i];
                giftBoxItemData.rewards.push(TreasureReward.toTreasureReward(reward));
            }
        }
        return giftBoxItemData;
    }
}
export class Treasure {
    channelId: string; // 渠道ID
    experience: number; // 当前经验
    level: number; // 等级
    vipLevel: number; // vip等级
    name: string; // 名称
    status: number; // 状态1 - in progress , 2 - redeemable , 3 - redeemed
    target: number; // 目标经验
    targetExperience: number; // 目标经验
    currentExperience: number; // 当前经验
    treasureId: string; // 宝箱ID
    rewards: TreasureReward[];
}
/**
 * 宝箱奖励类
 */
/**
 * 宝藏奖励类，用于存储宝藏奖励相关的信息
 */
export class TreasureReward {
    /**
     * 奖励配置的唯一标识ID，用于关联特定的奖励配置规则
     */
    rewardId: string;
    /**
     * 奖励的名称，用于直观描述该奖励是什么
     */
    rewardName: string;
    /**
     * 奖励的数量，表明该奖励的具体个数
     */
    rewardCount: number;
    /**
     * 奖励的数量，表明该奖励的具体个数
     */
    count: number;
    /**
     * 奖励对应的图片链接，方便在界面上展示奖励的外观
     */
    imgUrl: string;
    /**
     * 投注值，可能与获取该奖励所需的投注金额或奖励价值计算有关
     */
    betValue: number;
    /**
     * 获得该奖励所需的账户余额，只有账户余额满足此要求才能获取奖励
     */
    balanceRequired: number;
    /**
     * 奖励的星级等级，可用于区分奖励的稀有度或品质
     */
    starLevel: number;

    public static toTreasureReward(treasureReward: TreasureReward): GiftBoxReward {
        let giftBoxReward: GiftBoxReward = new GiftBoxReward();
        giftBoxReward.rewardConfigId = treasureReward.rewardId;
        giftBoxReward.name = treasureReward.rewardName;
        giftBoxReward.count = treasureReward.rewardCount;
        giftBoxReward.imgUrl = treasureReward.imgUrl;
        giftBoxReward.betValue = treasureReward.betValue;
        giftBoxReward.balanceRequired = treasureReward.balanceRequired;
        giftBoxReward.starLevel = treasureReward.starLevel;
        return giftBoxReward;
    }

    public static toGiftBoxReward(treasureReward: TreasureReward): GiftBoxReward {
        let giftBoxReward: GiftBoxReward = new GiftBoxReward();
        giftBoxReward.rewardConfigId = treasureReward.rewardId;
        giftBoxReward.name = treasureReward.rewardName;
        giftBoxReward.count = treasureReward.count;
        giftBoxReward.imgUrl = treasureReward.imgUrl;
        giftBoxReward.betValue = treasureReward.betValue;
        giftBoxReward.balanceRequired = treasureReward.balanceRequired;
        giftBoxReward.starLevel = treasureReward.starLevel;
        return giftBoxReward;
    }
}
