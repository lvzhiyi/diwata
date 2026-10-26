import { APP_ENV, Environment } from './env';

// 本地开发环境
export const LOCAL_ENV: Environment = Environment.QAT;

// 环境配置接口
interface EnvironmentConfig {
  readonly apiHost: string; // HTTP API地址
  readonly websocket: string; // WebSocket地址
  readonly minesHost: string; // 扫雷地址
  readonly minesWebsocket: string; // 扫雷ws地址
  readonly crashHost:string; // jeepNey地址
  readonly crashWebsocket:string; // jeepNey ws地址
  readonly turnstileVerifyUrl: string; // turnstile验证url
}

// 所有环境的完整配置
export const CONFIG = {
  [Environment.DEV]: {
    apiHost: 'http://server1.makillingslot.net',
    websocket: 'ws://dev-client.sportslive.com.ph',
    minesHost: 'https://dev-mines-capi.cpegame.com',
    minesWebsocket: 'https://dev-mines-capi.cpegame.com',
    crashHost: 'https://dev-capi.cpegame.com',
    crashWebsocket: 'https://dev-ws.cpegame.com',
		turnstileVerifyUrl: 'http://dev-turnstile.cpegame.com/captcha/verify'
  },
  [Environment.QAT]: {
    apiHost: 'http://47.131.56.191:9500',
    websocket: 'wss://qat-ws.cpegame.com',
    minesHost: 'https://qat-capi.cpegame.com',
    minesWebsocket: 'wss://qat-ws.cpegame.com',
    crashHost: 'https://qat-capi.cpegame.com',
    crashWebsocket: 'https://qat-ws.cpegame.com',
		turnstileVerifyUrl: 'https://qat-turnstile.cpegame.com/captcha/verify'

  },
  [Environment.INFO]: {
    apiHost: 'https://sts-cocos.cpegame.com',
    websocket: 'wss://sts-ws.cpegame.com',
    minesHost: 'https://sts-capi.cpegame.com',
    minesWebsocket: 'wss://sts-ws.cpegame.com',
    crashHost: 'https://sts-capi.cpegame.com',
    crashWebsocket: 'https://sts-ws.cpegame.com',
		turnstileVerifyUrl: 'https://sts-turnstile.cpegame.com/captcha/verify'
  },
  [Environment.UAT]: {
    apiHost: 'https://uat-capi.cpegame.com',
    websocket: 'wss://uat-ws.cpegame.com',
    minesHost: 'https://uat-capi.cpegame.com',
    minesWebsocket: 'https://uat-ws.cpegame.com',
    crashHost: 'https://uat-capi.cpegame.com',
    crashWebsocket: 'https://uat-ws.cpegame.com',
    turnstileVerifyUrl: 'https://uat-turnstile.cpegame.com/captcha/verify'


  },
  [Environment.TRIAL]: {
    apiHost: 'https://qat-capi.cpegame.com',
    websocket: 'wss://qat-ws.cpegame.com',
    minesHost: 'https://qat-mines-capi.cpegame.com',
    minesWebsocket: 'https://qat-mines-capi.cpegame.com',
    crashHost: 'https://qat-capi.cpegame.com',
    crashWebsocket: 'https://qat-ws.cpegame.com',
    turnstileVerifyUrl: 'https://qat-turnstile.cpegame.com/captcha/verify'
  },
  [Environment.PROD]: {
    apiHost: 'https://prod-capi.cmakilingslot.com',
    websocket: 'wss://prod-ws.cmakilingslot.com',
    minesHost: 'https://prod-capi.cpegame.com',
    minesWebsocket: 'https://prod-ws.cpegame.com',
    crashHost: 'https://prod-capi.cpegame.com',
    crashWebsocket: 'https://prod-ws.cpegame.com',
    turnstileVerifyUrl: 'https://prod-turnstile.cpegame.com/captcha/verify'
  },

} as const satisfies Record<Environment, EnvironmentConfig>;

export const DEFAULT_API_PREFIX: string = '/capi/game';

export const DEFAULT_WS_PREFIX: string = '/ws/game/websocket';

export const DEFAULT_MINES_PREFIX: string = '/capi/mines';

export const DEFAULT_MINES_WS_PREFIX: string = '/capi/mines/ws';

export const DEFAULT_CRASH_PREFIX:string = '/capi/crash';

export const DEFAULT_CRASH_WS_PREFIX:string = '/capi/crash/ws';

// 工具函数：根据环境获取配置
export function getConfig(env?: Environment): EnvironmentConfig {
  return CONFIG[env || APP_ENV];
}

// 工具函数：获取当前环境的API地址
export function getApiUrl(env?: Environment, apiPrefix?: string): string {
  return CONFIG[env || APP_ENV].apiHost + (apiPrefix || DEFAULT_API_PREFIX);
}

// 工具函数：获取当前环境的WebSocket地址
export function getWebSocketUrl(env?: Environment, wsPrefix?: string): string {
  return CONFIG[env || APP_ENV].websocket + (wsPrefix || DEFAULT_WS_PREFIX);
}

// 获取当前环境的扫雷地址
export function getMinesHostUrl(env?: Environment, minesPrefix?: string): string {
  return CONFIG[env || APP_ENV].minesHost + (minesPrefix || DEFAULT_MINES_PREFIX);
}

// 获取当前环境的扫雷ws地址
export function getMinesWebSocketUrl(env?: Environment, minesWsPrefix?: string): string {
  return CONFIG[env || APP_ENV].minesWebsocket + (minesWsPrefix || DEFAULT_MINES_WS_PREFIX);
}

// 获取当前环境的jeepNey地址
export function getCrashHostUrl(env?: Environment, crashPrefix?: string): string {
  return CONFIG[env || APP_ENV].crashHost + (crashPrefix || DEFAULT_CRASH_PREFIX);
}

// 获取当前环境的jeepNey ws地址
export function getCrashWebSocketUrl(env?: Environment, crashWsPrefix?: string): string {
  return CONFIG[env || APP_ENV].crashWebsocket + (crashWsPrefix || DEFAULT_CRASH_WS_PREFIX);
}


/**
 * 获取游戏的环境类型
 * @param presetEnv 本地开发环境时的预设环境变量
 * @returns {EnvType} 游戏的环境类型
 */
export const getGameEnv = () => {
  // 如果是试玩环境，则返回试用环境
  if (window.location.host.includes('cdtestfe')) {
    return Environment.TRIAL;
  }
  return APP_ENV;
};
