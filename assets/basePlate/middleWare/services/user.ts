import { http } from 'db://assets/common/script/extra/Request';
import { JackpotType } from '../enums/jackpot';
import { PlayerLevelData } from 'db://assets/common/script/ActivityDefine';

export interface BetRecordListModel {
  id: string;
  userId: string;
  playerId: string;
  playerName: string;
  betPromotionType: number | null;
  betAmount: number;
  payAmount: number;
  payOutAmount: number;
  reachMaxMultiple: boolean;
  status: number;
  extendInfo: {
    rewardUrl: string;
  } | null;
  createTime: number;
  gameRecordList: any | null;
}
export interface IRecordDetail {
  betAmount: number;
  createTime: number;
  gameRecordList: IGameRecord[];
  id: string;
  payAmount: number;
  payOutAmount: number;
  playerName: string;
  reachMaxMultiple: boolean;
  status: number;
  userId: string;
}

export interface IGameRecord {
  accumulateReachMaxMultiple: boolean;
  betAmount: number;
  id: string;
  index: number;
  multiple: number;
  overallRewardAmount: number;
  rewardAmount: number;
  rewardLineList: IRewardLine[];
  wheel: IWheel[][];
}

export interface IWheel {
  breakTimes: number;
  id: string;
}

export interface IRewardLine {
  betAmount: number;
  multiple: number;
  odds: number;
  rewardAmount: number;
  rewardLineCount: number;
  rewardLineSubType: string;
  rewardLineType: string;
  symbolId: string;
}
// jackpot大奖信息
export interface JackpotInfoModel {
  amount:number,
  id:string,
  // 1,mini 2,minor 3,major 4,grand
  type:JackpotType,
}
// jackpot大奖记录模型
export interface JackpotRecordModel {
  // 投注id
  betId: string;
  betRecordId: number;
  // 创建时间
  createTime: number;
  // 创建者
  creator: string;
  // 游戏记录id
  gameRecordId: number;
  // 主键id
  id: string;
  // 玩家名称
  playerName: string;
  // 奖励金额
  rewardAmount: number;
  // 奖励序列号
  rewardGrantSerialNo: string;
  // 奖励状态
  rewardGrantStatus: number;
  // 奖励时间
  rewardGrantTime: number;
  // 奖励池id
  rewardPoolId: string;
  // 奖励池类型 1,grand 2:major 3:minor 4:mini 5:betBonus
  rewardPoolType: JackpotType;
  // 更新时间
  updateTime: number;
  // 更新者
  updater: string;
  userId: string;
}

/**
 * 登录，保存用户信息
 * @param params
 * @returns
 */
export const login = async <T>(params: Record<string, any>) => {
  return http.post<T>('/user/login', params);
};

/**
 * 获取用户余额
 * @returns
 */
export const getUserCredit = async () => {
  return http.get<number>('/user/getCredit', { reTryCount: 3, }, {
    headers:{
      // 禁用缓存
      'Cache-Control': 'no-cache', 
      // 兼容旧浏览器
      Pragma: 'no-cache', 
      // 设置为过期时间为 0，避免缓存
      Expires: '0', 
      // 不走代理缓存
      'X-Proxy-Cache': 'no-cache' 
    }
  });
};

/**
 * 查询投注记录
 */
export const getRecordHistory = async (params: Record<string, any>) => {
  return http.post('/betRecord/pageQuery', params);
};

/**
 * 查询投注记录详情
 */
export const getRecordDetail = async (id: string) => {
  return http.get<IRecordDetail>(`/betRecord/get/${id}`);
};

/**
 * 获取玩家等级
 * @returns
 */
export const getPlayerLevel = async () => {
  return http.post<PlayerLevelData>('/level/getPlayerLevel', {}, {
    headers: {
      // 禁用缓存
      'Cache-Control': 'no-cache', 
      // 兼容旧浏览器
      Pragma: 'no-cache',
    },
    autoIntercept: false,
  });
};

/**
 * 获取大奖信息
 */
export const getReward = async () => {
  return http.get('/reward/get', null, {
    headers: {
      // 禁用缓存
      'Cache-Control': 'no-cache', 
      // 兼容旧浏览器
      Pragma: 'no-cache', 
      // 设置为过期时间为 0，避免缓存
      Expires: '0', 
    },
    autoIntercept: false,
  });
};

/**
 * 获取jackpot奖池信息
 */
export const fetchJackpotInfo = async () => {
  return http.get('/jackpotRewardPool/list', null, { autoIntercept: false, });
};

/**
 * 获取jackpot最大奖记录
 */
export const fetchJackpotMaxRecord = async () => {
  return http.get('/jackpotUserRewardRecord/get/highest/user/reward/record', null, { autoIntercept:false,  });
};

/**
 * 获取jackpot中奖记录
 */
export const fetchJackpotRecord = async (rewardPoolTypeList:number[], pageSize:number) => {
  const dataParams = {
    rewardPoolTypeList : rewardPoolTypeList,
    pageSize : pageSize,
    pageNum : 0,
  };

  return http.post('/jackpotUserRewardRecord/pageQuery', dataParams, { autoIntercept:false, });
};
