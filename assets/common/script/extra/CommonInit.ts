/**
 * 游戏初始化全局公共
 */

import { profiler } from 'cc';
import { getGameEnv } from './config/envConfig';
import { DEBUG } from 'cc/env';
import { Environment } from './config/env';

class CommonInit {
  private static instance: CommonInit;

  public static getInstance() {
    if (!CommonInit.instance) {
      CommonInit.instance = new CommonInit();
    }

    return CommonInit.instance;
  }

  /** 游戏的appId */
  public APP_ID = 'com.wegame.capi';

  /** 游戏的appSecret */
  public APP_SECRET = 'MIIEowIBAAKCAQEAmP8M8b1C12VA9hB3iIHjvQYnda1QovLp+zKTbY2WRRAIGPfT';

  /** 游戏的wsAppId */
  public WS_APP_ID = 'com.wegame.ws';

  public init() {
    this.initStats();
  }

  /**
   * 初始化性能统计显示
   */
  private initStats() {
    // 在QAT环境或DEBUG模式下显示性能统计
    if (getGameEnv() === Environment.QAT || DEBUG) {
      // profiler.showStats();
    }
  }

  public initAppIdAndSecret(appId?: string, appSecret?: string, wsAppId?: string) {
    this.APP_ID = appId || this.APP_ID;
    this.APP_SECRET = appSecret || this.APP_SECRET;
    this.WS_APP_ID = wsAppId || this.WS_APP_ID;
  }
}

const commonInit = CommonInit.getInstance();

export default commonInit;
