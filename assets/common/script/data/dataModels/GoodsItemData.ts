/**
 * 物品数据结构
 */
export class GoodsItemData {
    /**
     * 奖励包名称
     */
    name: string;
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
     * 图片 URL
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
    starLv: number;
    /**
     * 奖励时间
     */
    rewardDate: string;
    /**
     * 过期时间
     */
    expiryDate: string;
}
