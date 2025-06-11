/**
 * 投注结果
 */
declare interface BetResult {
  /** 投注记录ID */
  betRecordId: string;
  /** 投注子类型 */
  betSubType: BetSubType;
  /** 投注类型 */
  betType: BetType;
  /** 用户余额 */
  credit: number;
  /** 游戏ID */
  gameId: string;
  /** 合计中奖总金额 */
  overallRewardAmount: number;
  /** 游戏结果 */
  resultDetail: BetResultDetail;
  /** 派彩金额 */
  totalPayoutAmount: number;
}

declare interface BetResultDetail {
  /** 是否免费轮 */
  allWheelRewardSubType: RewardSubType;
  /** 中奖结果列表 */
  resultList: BetResultItem[];
  /** 奖池中奖id */
  jackpotRewardGameRecordId: string;
}

/**
 * 中奖结果项
 */
declare interface BetResultItem {
  /** 中奖结果ID */
  id: string;
  /** 是否免费轮 */
  freeWheelFlag: number;
  /** 免费轮ID列表 */
  gameRecordIds: string[];
  /** 中奖线列表 */
  rewardLineList: BetRewardLineList[];
  /** 中奖子类型 */
  rewardSubType: RewardSubType;
  /** 中奖元素坐标集合 */
  rewardSymbolIndexSet: SymbolPosition[];
  /** 中奖类型 */
  rewardType: RewardType;
  /** 中奖金额 */
  totalRewardAmount: number;
  /** 中奖倍率 */
  totalRewardMultiple: number;
  /** 滚盘元素列表 */
  wheel: SymbolItem[][];
  /** 是否触发最大倍数 */
  accumulateReachMaxMultiple: boolean;
}
/**
 * 中奖线列表
 */
declare interface BetRewardLineList {
  /** 投注金额 */
  betAmount: number;
  /** 中奖倍率 */
  multiple: number;
  /** 赔率 */
  odds: number;
  /** 中奖金额 */
  rewardAmount: number;
  /** 中奖线数量 */
  rewardLineCount: number;
  /** 中奖线子类型 */
  rewardLineSubType: string;
  /** 中奖线类型 */
  rewardLineType: string;
  /** 中奖元素ID */
  symbolId: string;
}

declare type RewardType = 'NONE' | 'SINGLE' | 'MULTIPLE';

declare type RewardSubType = 'none' | 'other' | 'nice' | 'mega' | 'super' | 'sensational';

declare type BetType = 'NORMAL_BET' | 'BUY_BET';

declare type BetSubType = 'NORMAL_BET' | 'BUY_BET' | 'FREE_SPINS_NORMAL_BET' | 'FREE_SPINS_BUY_BET';