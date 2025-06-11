import { GoodsItemData } from "../../../data/dataModels/GoodsItemData";

export class ResGetBagData {
    channelId: string;
    pId: string;
    playerName: string;
    refId: string;
    rewardBag: RewardBag[];
    rewardDetails: RewardBag[];
    public static toGoodsItemData(rewardBag: RewardBag): GoodsItemData {
        let goodsItemData: GoodsItemData = new GoodsItemData();
        goodsItemData.name = rewardBag.name;
        goodsItemData.balanceRequired = rewardBag.balanceRequired / 1000.0;
        goodsItemData.rewardId = rewardBag.rewardId;
        goodsItemData.rewardConfigId = rewardBag.rewardConfigId;
        goodsItemData.imgUrl = rewardBag.imgUrl;
        goodsItemData.gameId = rewardBag.gameId;
        goodsItemData.gameCode = rewardBag.gameCode;
        goodsItemData.gameName = rewardBag.gameName;
        goodsItemData.starLv = rewardBag.starLevel;
        goodsItemData.rewardDate = rewardBag.effectTime;
        goodsItemData.expiryDate = rewardBag.expiredTime;
        goodsItemData.betValue = rewardBag.betValue / 1000.0;
        return goodsItemData;
    }
}
/**
 * 奖励包类
 */
export class RewardBag {
    /**
     * 奖励名称
     */
    name: string;
    /**
     * 奖励描述
     */
    description: string;
    /**
     * 所需余额
     */
    balanceRequired: number;
    /**
     * 奖励 ID
     */
    rewardId: string;
    /**
     * 奖励配置 ID
     */
    rewardConfigId: string;
    /**
     * 图片链接
     */
    imgUrl: string;
    /**
     * 游戏 ID
     */
    gameId: string;
    /**
     * 游戏代码
     */
    gameCode: string;
    /**
     * 游戏名称
     */
    gameName: string;
    /**
     * 奖励类型
     */
    rewardType: string;
    /**
     * 投注值
     */
    betValue: number;
    /**
     * 星级
     */
    starLevel: number;
    /**
     * 奖励时间
     */
    rewardDate: string;
    /**
     * 过期时间
     */
    expiryDate: string;

     /**
     * 奖励时间2
     */
     effectTime: string;
     /**
      * 过期时间3
      */
     expiredTime: string;
}
