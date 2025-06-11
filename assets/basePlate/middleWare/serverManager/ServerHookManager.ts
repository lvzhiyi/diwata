import { _decorator, Component, Node, Vec3 } from 'cc';
import { app } from 'db://assets/app/app';
import { ApiPath, ErrorType } from 'db://assets/common/script/extra/https/Constant';
import { http, HTTP_STATUS_CODES } from 'db://assets/common/script/extra/Request';
import { createAuthHeaders, createWSAuthString, getRealServerTime } from 'db://assets/common/script/extra/Utils/common';
import { getApiHost, getGameEnv, getWsHost, showErrorPop, showServerMaintenanceTip } from '../../core/baseUtil/BaseCommonUtil';
import CpPostMessage from 'db://assets/common/script/extra/tmBridge/cpPostMessage';
import { GlobalMgr } from 'db://assets/common/script/extra/GlobalMgr';
import { PackageFacade } from 'db://assets/common/script/PackageFacade';
import { GameMrgEvent } from 'db://assets/common/script/extra/GameMrsEvent';
import { GameDataMgrEventsType } from 'db://assets/common/script/data/ActivityDataMgr';

const { ccclass } = _decorator;

@ccclass('ServerHookManager')
class ServerHookManager {
  /** 时间戳差值 */
  private timeDifferent: number = 0;

  /** 错误次数 */
  private errorNumber: number = 0;

  /** 服务器是否处于维护状态 */
  public isServerMaintenance: boolean = false;

  private serverMaintenanceCallbackList: (() => void)[] = [];

  private serverErrorCallbackList: ((errorNumber: number) => void)[] = [];

  /** 实例 */
  private static instance: ServerHookManager;

  /** http实例 */
  private http: typeof http;

  private constructor(server: typeof http) {
    this.http = server;
  }

  public static getInstance(): ServerHookManager {
    if (!ServerHookManager.instance) {
      ServerHookManager.instance = new ServerHookManager(http);
    }

    return ServerHookManager.instance;
  }

  /**
   * 配置API接口请求的域名
   */
  public initApiBaseUrl(apiHost: string) {
    this.http.setBaseUrl(apiHost);
  }

  /**
   * 配置API接口请求的拦截器
   * @param token 游戏token
   */
  public async initApiRequestInterceptor(tokenGetter: () => string) {
    this.http.addRequestInterceptor((config) => {
      // 设置请求拦截器, 用于添加 token
      const authHeaders = createAuthHeaders(getRealServerTime());
      config.headers = {
        ...config.headers,
        ...authHeaders,
        gameId: app.config.app.GAME_ID,
        playerId: app.manager.global.getUserInfo().playerId,
      };
    
      if (tokenGetter()) {
        config.headers = {
          ...config.headers,
          'token-game': tokenGetter(),
        };
      }

      return config;
    });
  }

  /**
   * 初始化重试响应拦截器
   */
  public initRetryResponseInterceptor() {
    http.addRetryResponseInterceptor((response) => {
      if (+response.code === +HTTP_STATUS_CODES.TIME_SIGNATURE_ERROR) {
        // 时间签名错误
        this.timeDifferent = response.time - Date.now();
        sessionStorage.setItem('timeDifferent', `${this.timeDifferent}`);

        return { shouldRetry: true };
      }

      return { shouldRetry: false };
    });
  }

  /** 添加http响应拦截器 */
  public initHttpResponseErrorInterceptor() {
    http.addResponseErrorInterceptor((httpError, path) => {
      // 服务器停机维护中
      if (httpError.type === 'api' && httpError.status === +HTTP_STATUS_CODES.SERVER_MAINTENANCE) {
        this.onServerMaintenance(
          httpError.originalError?.data?.maintainStartTime,
          httpError.originalError?.data?.maintainEndTime
        );

        return;
      }
      if (httpError.status === +HTTP_STATUS_CODES.BALANCE_NOT_ENOUGH) {
        // 余额不足
        this.showRechargeDialog();

        return;
      }
      if (httpError.status === +HTTP_STATUS_CODES.NOT_LOGIN) {
        this.showLoginDialog();

        return;
      }
      // 非接口错误，并且是投注接口，就显示登录弹窗
      if (httpError.type !== 'api' && path === ApiPath.bet) {
        this.showLoginDialog();

        return;
      }
      // 接口错误，并且是投注接口，就显示错误弹窗
      if (httpError.type === 'api' && path === ApiPath.bet) {
        showErrorPop({
          type: ErrorType.BetError,
          msg: httpError.message,
          serviceUrl: path,
        });

        return;
      }

      // 接口错误，就显示错误弹窗
      if (httpError.type === 'api') {
        this.apiErrorHandel(httpError, path);

        return;
      }
      // 网络错误，就显示错误弹窗
      if (httpError.type === 'http') {
        let errorType;

        if (path === ApiPath.bet) {
          errorType = ErrorType.BetError;
        } else if (path === ApiPath.login || path === ApiPath.userCredit) {
          errorType = ErrorType.LoginError;
        } else {
          errorType = ErrorType.NetError;
        }

        const errorConfig = {
          type: errorType,
          msg:
            path === ApiPath.bet
              ? 'Unstable Network, Please login again!'
              : 'Unstable Network, Please check your network or restart the game to reconnect!',
          path,
        };

        showErrorPop(errorConfig);

        return;
      }

      this.onServerError(
        'Unstable Network, Please check your network or restart the game to reconnect'
      );
    });
  }

  private apiErrorHandel(error: any, path: string) {
    const ignoreList = ['/freeSpin/freeSpinOfPlayer', '/reward/get'];

    if (ignoreList.some(ignorePath => path.indexOf(ignorePath) !== -1)) {
      return;
    }

    this.showErrorDialog(error, path);
  }

  private showRechargeDialog() {
    app.manager.ui.show({
      name: 'PopErrorPop',
      data: {
        type: ErrorType.Recharge,
        msg: 'Insufficient Credit, Do you want to Recharge ?',
      },
    });
  }

  /** 显示登录弹窗 */
  private showLoginDialog() {
    app.manager.ui.show({
      name: 'PopErrorPop',
      data: {
        msg: 'Unstable network.Please login again.',
        type: ErrorType.LoginError,
        showCancel: false,
        onConfirm: () => {
          app.manager.ui.hide({ name: 'PopErrorPop', onHide: () => { } });
          CpPostMessage.goHome();
        },
      },
      onShow: () => { },
    });
  }

  /** 服务器维护 */
  private onServerMaintenance(startTime: number, endTime: number) {
    this.isServerMaintenance = true;
    this.cancelAllRequests();
    showServerMaintenanceTip(startTime, endTime);
    this.serverMaintenanceCallbackList.forEach((callback) => {
      callback();
    });
  }

  private showErrorDialog(error: any, path: string) {
    // 根据错误码确定错误类型
    let errorType: ErrorType;

    switch (error.status) {
      case HTTP_STATUS_CODES.BET_ERROR:
        errorType = ErrorType.BetError;
        break;
      case HTTP_STATUS_CODES.FREE_SPIN_ACTIVITY_ID_INVALID:
        errorType = ErrorType.FreeSpinActivityIdInvalid;
        break;
      default:
        errorType = ErrorType.ServerError;
        break;
    }
    if (path !== ApiPath.rewardGet && path !== ApiPath.ping) {
      // 显示错误弹窗
      showErrorPop({
        type: errorType,
        msg: error.message,
        serviceUrl: path,
      });
    }
  }

  /** 服务器错误 */
  private onServerError(error: any) {
    showErrorPop({
      type: ErrorType.NetError,
      msg: error,
    });
    this.errorNumber++;

    if (this.errorNumber >= 5) {
      this.cancelAllRequests();
    }

    this.serverErrorCallbackList.forEach((callback) => {
      callback(this.errorNumber);
    });
  }

  /** 添加服务器维护拦截器 */
  public addServerMaintenanceInterceptor(callback: () => void) {
    this.serverMaintenanceCallbackList.push(callback);
  }

  /** 添加服务器错误拦截器 */
  public addServerErrorInterceptor(callback: (errorNumber: number) => void) {
    this.serverErrorCallbackList.push(callback);
  }

  /** 取消所有请求 */
  private cancelAllRequests() {
    this.http.cancelAllRequest();
  }

  /**
    * 配置活动系统入口的信息
   */
  public async configureActivityEntry() {
    GlobalMgr.instance.showActivity = false;

    if(GlobalMgr.instance.showActivity === false) {
      return;
    }

    const env = getGameEnv();
    const wenv = getGameEnv();
    let hostUrl = getApiHost(env as keyof typeof app.config.env);
    let wshostUrl = getWsHost(wenv as keyof typeof app.config.wsenv);
    // 外部必配字段
    const realServerTime = getRealServerTime();
    const wsSignature = createWSAuthString(realServerTime);
    const token = app.manager.global.getToken();
    let wsUrl = `${wshostUrl}/${token}?timestamp=${realServerTime}&signature=${wsSignature}&gameId=${app.config.app.GAME_ID}`;
    console.log('wsUrl', wsUrl);

    // 如果是压测环境还是不走验证签名的
    if (getGameEnv() === 'info') {
      wsUrl = `${wshostUrl}/${token}`;
    }

    GlobalMgr.instance.setToken(token);
    GlobalMgr.instance.setwsHostUrl(wsUrl);
    GlobalMgr.instance.gameId = app.config.app.GAME_ID;
    GlobalMgr.instance.playerId = app.manager.global.playerId;
    GlobalMgr.instance.playerName = app.manager.global.playerName;
    GlobalMgr.instance.userLevel = app.manager.global.getUserInfo().vipLevel;
    await PackageFacade.instance.init({
      activityIDs: [1, 2, 3, 4, 5, 6],
      httpHeadUrl: hostUrl,
      token: token,
      gameID: GlobalMgr.instance.gameId,
      effect: {
        audioClip: null,
        volume: parseFloat(localStorage.getItem('audioSFXVolume') || '1')
      },
      gameEnv: getGameEnv(),
      listener: GameMrgEvent.instance.getEventTarget(),
      moveToPos: new Vec3(),
      cardPos: new Vec3(),
      userInfo: {
        balance: GlobalMgr.instance.balance,
        vipLevel: GlobalMgr.instance.userLevel,
        uid: GlobalMgr.instance.playerId,
      },
    });
    console.time('preloadEntry');
    await PackageFacade.instance.preloadEntry();
    console.timeEnd('preloadEntry');
    // 设置默认成就系统的音效音量
    PackageFacade.instance.getCommonEventTarget().emit(GameDataMgrEventsType.updateVolume, parseFloat(localStorage.getItem('audioSFXVolume') || '1'));
  }
}

export const serverHookManager = ServerHookManager.getInstance();