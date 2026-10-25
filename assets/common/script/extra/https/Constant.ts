import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export const RICH_CARD_USE_FAILED_MSG = 'Rich card failed to use, please try again';
export const RICH_CARD_EXPIRED_MSG = 'The Rich Card has expired and cannot be used';
/**
 * 服务器维护提示模板
 */
export const SERVER_MAINTENANCE_TIP_TEMPLATES = [
  'The game is currently undergoing maintenance and updates, with an estimated duration on{{range}}. The service opening time may be advanced or postponed.',
  'During this time, you will be unable to log into the server. Please be patient, and thank you for your understanding.'
];

/**
 * API路径枚举
 */
export enum ApiPath {
  /** 投注接口 */
  bet = '/bet/bet',
  /** 奖励获取接口 */
  rewardGet = '/reward/get',
  /** 登录接口 */
  login = '/user/login',
  /** 用户余额接口 */
  userCredit = '/user/getCredit',
  /** 投注记录接口 */
  recordHistory = '/betRecord/pageQuery',
  /** 投注记录详情接口 */
  recordDetail = '/betRecord/get',
  /** 免费轮投注详情接口 */
  freeSpinDetail = '/bet/bet/queryFreeSpinDetail',
  /** 心跳接口 */
  ping = '/common/ping',
  /** freeSpin接口 */
  freeSpin = '/freeSpin/freeSpinOfPlayer',
  /** 奖池接口 */
  jackpot = '/jackpot/getJackpot',
}

/**
 * 错误类型枚举
 */
export enum ErrorType {
  /** 网络错误 */
  NetError = 'netError',
  /** 服务器错误 */
  ServerError = 'serverError',
  /** 登录错误 */
  LoginError = 'loginError',
  /** 充值 */
  Recharge = 'recharge',
  /** 投注错误 */
  BetError = 'betError',
  /** 网络慢 */
  SlowNetTips = 'slowNetTips',
  /** 服务器维护 */
  ServerMaintenance = 'serverMaintenance',
  /** freespin 活动id 已失效 */
  FreeSpinActivityIdInvalid = 'freeSpinActivityIdInvalid',
  /** 普通提示弹框 */
  NormalTips = 'normalTips',
}


@ccclass('httpConst')
export class httpConst {
   
}

