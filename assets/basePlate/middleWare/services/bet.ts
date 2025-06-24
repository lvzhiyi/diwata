import { ApiPath } from 'db://assets/common/script/extra/https/Constant';
// import { SymbolItem } from '../../../../types/symbol';
import { BetSubTypes, BetTypes } from '../enums/bet';
import { http } from 'db://assets/common/script/extra/Request';
import GameProcessCtrl from 'db://assets/common/script/extra/GameProcessCtrl';

/**
 * symbol大小映射
 */
export const SYMBOL_SIZE_MAP = {
  S: 1,
  M: 2,
  L: 3,
  XL: 4,
};

/**
 * 中奖线列表
 */
export declare interface BetRewardLineItem {
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

export interface IJackpotReward {
  betId: string;
  betRecordId: string;
  createTime: number;
  gameRecordId: string;
  id: string;
  playerName: string;
  rewardAmount: number;
  rewardGrantSerialNo: string;
  rewardGrantStatus: number;
  rewardGrantTime: number;
  rewardPoolId: string;
  rewardPoolType: number;
  userId: string;
}

/**
 * 将服务端返回的5行6列的数据结构，转换成6列5行的数据结构
 * @param rowList
 */
export const transformRowListToColumnList = (rowList: SymbolItem[][]) => {
  const transposedBottom: SymbolItem[][] = Array.from({ length: 6 }, () => Array(5).fill(null));
  
  // 先检查是否有4006的wild进行每一行重新排列
  for (let row = 0; row < rowList.length; row++) {
    const rowArray = rowList?.[row];
    rowList[row] = adjustWildOrder(rowArray);
  }

  // 遍历 5 行
  for (let row = 0; row < rowList?.length; row++) {
    // 遍历 6 列
    for (let col = 0; col < rowList?.[row]?.length; col++) {
      // 服务端返回的是从上到下，从左到右的顺序，而实际需要的是从左到右，从下到上的顺序，所以需要进行转换一下
      const item = rowList?.[row]?.[col];
      
      // 将4001、4011、4010替换为5001
      if (item && (item.symbolId === '4001' || item.symbolId === '4011' || item.symbolId === '4010')) {
        item.symbolId = '5001';
      }
      
      transposedBottom[col][row] = item;
    }
  }

  return transposedBottom;
};

/**
 * 调整wild 4006在原始数组的顺序
 * @param originalArray 原始数组
 * @returns 调整后的数组
 */
export  const adjustWildOrder = (originalArray: SymbolItem[]) => {
  // 创建副本避免修改原数组
  const result = [...originalArray]; 
  let i = 0;

  while (i < result.length) {
    if (result[i]?.symbolId === '4006') {
      // 情况1：4006后紧跟两个null
      if (i + 2 < result.length && result[i + 1] === null && result[i + 2] === null) {
        // 替换为 [null, 4006, null]
        result.splice(i, 3, null, result[i], null);
        // 跳过已处理的null
        i += 2; 
      }
      // 情况2：4006前有两个null
      else if (i - 2 >= 0 && result[i - 2] === null && result[i - 1] === null) {
        // 替换为 [null, 4006, null]
        result.splice(i - 2, 3, null, result[i], null); 
        // 跳过已处理的4006
        i++; 
      }
    }

    i++;
  }

  return result;
};

/**
 * 投注接口
 * @param params
 * @returns
 */
export const doBet = async (data: {
  /** 游戏ID */
  gameId: string;
  /** 投注类型 */
  betType: BetTypes;
  /** 投注子类型 */
  betSubType: BetSubTypes;
  /** 投注信息 */
  betDetail: {
    /** 游戏记录Id */
    gameRecordId?: string;
    /** 投注记录Id */
    betRecordId?: string;
    /** 投注金额 */
    betAmount: number;
    /** 购买金额 */
    payAmount: number;
    /** 免费轮投注Id */
    freeSpinsId?: string;
  };
}) => {
  const res = await http.post<BetResult>(ApiPath.bet, data);

  // 如果投注成功，则设置游戏正在进行的ID，用于投注记录过滤
  if (res?.data?.betRecordId) {
    GameProcessCtrl.gamePlayingId = res.data.betRecordId;
  }

  return res;
};

/**
 * 获取免费轮中奖记录
 * @param gameId 游戏ID
 * @param recordId 免费轮投注记录ID
 * @param freeSpinId 免费轮投注ID
 * @returns
 */
export const getFreeSpinDetail = async (
  gameId: string,
  gameRecordId: string,
  freeSpinId: string,
  betType: BetTypes,
  betSubType: BetSubTypes
) => {
  return http.post<any>('/bet/bet/queryFreeSpinDetail', {
    betType,
    betSubType,
    gameId,
    gameRecordId,
    freeSpinId,
  });
};

/**
 * 获取jackpot奖励
 * @param betRecordId 投注记录ID
 * @param gameRecordId 游戏记录ID
 * @returns 
 */
export const getJackpotReward = async (betRecordId: string, gameRecordId: string) => {
  return http.get<IJackpotReward>(`/jackpotUserRewardRecord/get/${betRecordId}/${gameRecordId}`);
};
