/**
 * 投注类型，包含正常投注和免费轮投注
 */
export enum BetTypes {
  /** 正常投注 */
  normal = 'NORMAL_BET',
  /** 购买免费轮投注 */
  buy = 'BUY_BET',
}

/**
 * 包含正常投注、购买的免费轮投注、非购买的赠送的免费轮投注
 */
export enum BetSubTypes {
  /** 正常投注中的正常轮 */
  normal = 'NORMAL_BET',
  /** 正常投注中的免费轮 */
  normalFreeSpin = 'FREE_SPINS_NORMAL_BET',

  /** 购买免费轮中的正常轮 */
  buySpinNormal = 'BUY_BET',
  /** 购买免费轮中的免费轮 */
  buySpinFreeSpin = 'FREE_SPINS_BUY_BET',
}

/**
 * 中奖 类型
 */
export enum RewardType {
  /** 没有中奖 */
  none = 'NONE',
  /** 单线中奖 */
  single = 'SINGLE',
  /** 多线中奖 */
  multiple = 'MULTIPLE',
}
/**
 * 奖励子类型枚举
 */
export enum RewardSubTypeEnum {
  /** 无奖励 */
  NONE = 'none',
  /** 其他奖励 */
  OTHER = 'other',
  /** 不错奖励 */
  NICE = 'nice',
  /** 超级奖励 */
  MEGA = 'mega',
  /** 特级奖励 */
  SUPER = 'super',
  /** 惊人奖励 */
  SENSATIONAL = 'sensational',
}
