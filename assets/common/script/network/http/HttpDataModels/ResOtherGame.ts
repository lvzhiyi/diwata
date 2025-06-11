import { OtherGameItemData } from "../../../data/dataModels/OtherGameItemData";

export class ResOtherGame {
    rewardBag: RewardBag[];
    rewardDetails: RewardBag[];
    public static toOtherGameItemData(rewardBag: RewardBag): OtherGameItemData {
        let otherGameItemData: OtherGameItemData = new OtherGameItemData();
        otherGameItemData.name = rewardBag.name;
        otherGameItemData.imgUrl = rewardBag.imgUrl;
        otherGameItemData.gameId = rewardBag.gameId;
        otherGameItemData.totalCount = rewardBag.totalCount;
        otherGameItemData.gameName = rewardBag.gameName;
        return otherGameItemData;
    }
}
/**
 * 奖励包类，用于存储奖励包相关的信息
 */
export class RewardBag {
    /**
     * 奖励包名称
     */
    name: string;
    /**
     * 奖励包描述
     */
    description: string;
    /**
     * 获得该奖励包所需的余额
     */
    balanceRequired: number;
    /**
     * 奖励的唯一标识 ID
     */
    rewardId: string;
    /**
     * 奖励配置的 ID，用于关联奖励的具体配置信息
     */
    rewardConfigId: string;
    /**
     * 奖励包对应的图片链接地址
     */
    imgUrl: string;
    /**
     * 与该奖励包相关联的游戏的 ID
     */
    gameId: string;
    /**
     * 与该奖励包相关联的游戏的代码
     */
    gameCode: string;
    /**
     * 与该奖励包相关联的游戏的名称
     */
    gameName: string;
    /**
     * 投注值，可能与获得奖励的条件或奖励的价值相关
     */
    betValue: number;
    /**
     * 奖励的总数量
     */
    totalCount: number;
}
