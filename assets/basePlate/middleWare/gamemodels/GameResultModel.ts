import { BetSubTypes, BetTypes, RewardType } from '../enums/bet';

export enum Direction {
  Up,
  Down,
}

export interface GameResultModel {
  /** 游戏记录/投注记录 ID */
  betRecordId: string;
  /** 游戏 ID */
  gameId: string;
  /** 投注类型 */
  betType: BetTypes;
  /** 投注子类型 */
  betSubType: BetSubTypes;
  /** 用户余额 */
  credit: number;
  /** 合计中奖总金额 */
  overallRewardAmount: number;
  /** 中奖结果明细 */
  resultDetail: ResultDetail;
}

export interface ResultDetail {
  /** 当前轮盘结果，二维数组 */
  wheel: string[][];
  /** 当前轮盘结果，二维数组把服务器的数组转化成可用的数组 */
  switchResult?: string[][];
  /** 中奖元素列表 */
  rewardLineList?: RewardLine[];

  /** 中奖元素结果的坐标 */
  rewardSymbolIndexSet?: IndexObject[];

  /** 中奖子类型,none:未中大奖: nice,mega,super,sensational */
  rewardSubType: string;
  /** 中奖类型:SINGLE单奖励，MULTIPLE多奖励 */
  rewardType: RewardType;
  /** 中奖总金额 (分)，使用 long 类型 */
  totalRewardAmount: number;
  /** 中奖总倍数 */
  totalRewardMultiple: number;
  /** 免费轮标识,0:否,1:是", 是否属于免费轮区间，如果是中了wild后需要悬浮 */
  freeWheelFlag: number;
  /** 是否属于免费轮区间 */
  freePeriod?: boolean;
  /** 免费轮游戏记录Id列表 */
  gameRecordIds: string[];

  /** 是否累计达到最大倍数 */
  accumulateReachMaxMultiple: boolean;

  /** 免费轮游戏记录Id列表副本 */
  gameRecordIdsCopy: string[];
}

export interface RewardLine {
  /** 投注金额 */
  betAmount: number;
  /** 倍数 */
  multiple: number;
  /** 赔率 */
  odds: number;
  /** 中奖金额 */
  rewardAmount: number;
  /** 中奖线数量 */
  rewardLineCount: number;

  /** 中奖线子类型 COMMON（普通），SCATTER（SCATTER） */
  rewardLineSubType: string;
  /** 中奖线类型 THREE（三连），FOUR（四连）FIVE（5连） */
  rewardLineType: RewardLineType | string;
  /** 中奖的图标 */
  symbolId: string;
}

export enum RewardLineType {
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
}

export interface IndexObject {
  /** 列索引 */
  columnIndex: number;
  /** 行索引 */
  rowIndex: number;
}

export const transformSpinsResult = (wheel: string[][]): string[][] => {
  const transformed: string[][] = [];

  /// 如果没有任何数据，返回空数组
  if (wheel === null || wheel?.length === 0) {
    return transformed;
  }

  /// 获取每个子数组的长度
  const numberOfRows = wheel[0].length;

  for (let i = 0; i < numberOfRows; i++) {
    const row: string[] = [];

    for (let j = 0; j < wheel.length; j++) {
      /// 将每个子数组的第 i 个元素添加到新行
      row.push(wheel[j][i]);
    }

    /// 将新行添加到 transformed 数组
    transformed.push(row);
  }

  return transformed;
};

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// export enum Direction {
//     Up,
//     Down,
// }
