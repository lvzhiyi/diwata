export class ResGetRewardDetail {
    details: RewardDetail;
    refId: string;
    rewardConfigId: string;
}
export class RewardDetail {
    balanceRequired: number; //所需余额
    betValue: number; //投注值
    description: string; //描述
    gameCode: string; //游戏代码
    gameId: string; //游戏ID
    gameName: string; //游戏名称
    imgUrl: string; //图片URL
    name: string; //名称
    periodDay: number; //周期天数
    periodHour: number; //周期小时数
    rewardType: string; //奖励类型
    starLevel: number; //星级
}
