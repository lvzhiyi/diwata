export enum ActivityDialogViewID {
    entry = "entry", // 入口
    backpack = "backpack", // 背包
    giftBox = "giftBox", // 礼包
    giftBoxGoodsDetails = "giftBoxGoodsDetails", // 礼包物品详情 数据参数GiftBoxReward
    dailyMission = "dailyMission", // 每日任务
    dailyMissionDescription = "dailyMissionDescription", // 每日任务描述
    richCardDescription = "richCardDescription", // 每日任务星卡描述
    achievement = "achievement", // 成就
    achievementDescription = "achievementDescription", // 成就描述
    achievementBadgeDetails = "achievementBadgeDetails", // 成就徽章详情
    achievementRebateDetails = "achievementRebateDetails", // 成就返利详情
    achievementRichCard = "achievementRichCard", // 成就星卡详情
    achievementRandomRichCard = "achievementRandomRichCard", // 成就随机星卡详情
    achievementReward = "achievementReward", // 成就奖励
    toast = "toast", //弱提示
    cardEffect = "cardEffect", //卡片特效 数据参数星卡url
    freeSpin = "freeSpin",
    freeSpinEffect = "freeSpinEffect", //freeSpin特效  参数 FreeSpin
}

export enum ActivityDialogViewPath {
    entry = "/ActivityEntryDialogView", //入口
    backpack = "/BagDialogView", //背包
    giftBox = "/GiftBoxDialogView", //礼包
    giftBoxGoodsDetails = "/GiftBoxGoodsDetails", //礼包物品详情
    dailyMission = "/DailyMissionView", //每日任务
    achievement = "/AchievementView", //成就
    dailyMissionDescription = "/DailyMissionDescriptionView", //每日任务描述
    richCardDescription = "/RichCardDescriptionView", //每日任务星卡描述
    achievementDescription = "/AchievementDescriptionView", //成就描述
    achievementBadgeDetails = "/AchievementBadgeDetailsView", //成就徽章详情
    achievementRebateDetails = "/AchievementRebateDetailsView", //成就返利详情
    achievementRichCard = "/AchievementRichCardView", //成就星卡详情
    achievementRandomRichCard = "/AchievementRandomRichCardView", //成就随机星卡详情
    achievementReward = "/AchievementRewardView", //成就奖励
    toast = "/ActivityToastDialogView", //弱提示
    cardEffect = "/CardEffectDialogView", //卡片特效
    freeSpin = "/FreeSpinDialogView", //freeSpin
    freeSpinEffect = "/FreeSpinEffectDialogView", //freeSpin特效
}
export enum ActivityDialogViewBundleName {
    common = "commonBundle",
    backpack = "backpack",
    giftBox = "level_box",
    dailyMission = "daily_mission",
    achievement = "achievement",
    freeSpin = "freeSpin",
}
