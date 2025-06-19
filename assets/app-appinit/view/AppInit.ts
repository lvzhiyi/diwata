import { Label, Node, Prefab, SpriteFrame, _decorator, sp } from 'cc';
import BaseAppInit from '../../../extensions/app/assets/base/BaseAppInit';
import { app } from '../../app/app';
import Core from 'db://app/Core';
import { GlobalMgr } from '../../common/script/extra/GlobalMgr';
import { calculateWithBase, getRuntimeEnv, getUrlParameters, } from '../../common/script/extra/Utils/common';
import { getUserCredit, login } from '../../basePlate/middleWare/services/user';
import { ProgressBar } from '../../basePlate/middleWare/commonUI/ProgressBar/ProgressBar';
import { loadBundle, loadResource, showErrorPop } from '../../basePlate/core/baseUtil/BaseCommonUtil';
import { DEBUG } from 'cc/env';
import eventTrack from '../../common/script/extra/eventTrack';
import { serverHookManager } from '../../basePlate/middleWare/serverManager/ServerHookManager';
import { initARMS } from '../../common/script/extra/armsSDK/init';
import CheckNetCtrl from '../../common/script/extra/CheckNetCtrl';
import { ErrorType } from '../../common/script/extra/https/Constant';
import { HTTP_STATUS_CODES } from '../../common/script/extra/Request';
import { Environment, getApiUrl, getGameEnv } from '../../common/script/extra/config/envConfig';

const { ccclass, property } = _decorator;
@ccclass('AppInit')
export class AppInit extends BaseAppInit {
  @property(Node)
  private logo: Node;

  @property(Node)
  private progressBarNode: Node;

  @property(Node)
  private btnPlayNode: Node;

  @property(Node)
  private selectedNode: Node;

	/**
   * 版本号显示节点
  */
	@property(Label)
	private versionNode: Label;

  private runtimeEnv: 'local' | 'outside' | 'inside' = 'local';

  /**
   * 获得用户资源总量，这里返回几，就需要用户自行调用几次nextInit
   */
  protected getUserAssetNum(): number {
    return 5;
  }

  protected async onLoad() {
    // 隐藏启动页
    window?.hideLoadingPage?.();
  }

  // BaseAppInit中使用start方法作为初始化入口，如果重写start方法，请注意调用父类方法
  protected startInit() { 
    super.startInit();
    // 预加载资源
    this._preloadResources();
  }

  /**
   * 初始化完成
   */
  protected onFinish() {
    setTimeout(() => {
      this.progressBarNode.active = false;
      this.btnPlayNode.active = true;
    }, 500);
    this.initEffectVolume();
  }

  /**
   * 初始化音效音量
   */
  private initEffectVolume() {
    app.manager.sound.setEffectMute(app.manager.sound.effectVolumeScale == 0);
    app.manager.sound.setEffectVolumeScale(app.manager.sound?.effectVolumeScale, true);
  }

  /**
   * 用户初始化
   */
  async onUserInit() {
    try {
      await this.loginUser();
      await this._getUserCredit();

      if (this.runtimeEnv != 'local') {
        await this.checkNetQuilty();
      }

      this.versionNode.string = app.config.app.GAME_VER;
      this.nextInit();
    } catch (error) {
      this.nextInit();
      console.error('AppInit onUserInit error', error);
    }

    console.log('AppInit onUserInit');
  }

  /**
   * 登录配置网络和初始化埋点和arms
   */
  async loginUser() {
    console.log('loginUser');
    this._initParams();
    this._initRuntimeEnv();
    this._initGameInternal();
    this._configService();
    await this._configPlayerInfo();
    await this.configureActivityEntry();
    this.appInitArms();
  }

  /**
   * 初始化用户参数
   */
  _initParams() {
    const params = getUrlParameters();
    app.store.user.setUserParams(params);
    console.log('initUserParams', app.store.user.userParams);
  }

  /**
   * 初始化运行环境
   */
  _initRuntimeEnv() {
    this.runtimeEnv = getRuntimeEnv(app.store.user.userParams);
    console.log('initRuntimeEnv', this.runtimeEnv);
  }

  /**
   * 初始化玩家信息
   */
  private async _configPlayerInfo() {
    const useMockData = this.runtimeEnv !== 'inside';
    const {
      accessToken,
      birthday,
      pId,
      channelId,
      gameId,
      playerName,
      userLevel,
      userName,
      nickName,
    } = app.store.user.userParams;

    const mockParams = useMockData
      ? {
        birthday:'01-01-1990',
        channelId:'1050',
        nickName:'cpTest10010',
        gameId:'zhumeng004',
        pId:'50',
        playerId:'cpTest10010',
        playerName:'cpTest10010',
        // eslint-disable-next-line max-len
        token:'253c91327245400092a9a52544bf9d7d18f6ef49d4c1ad7f1b39afe91b5f3615667caaf5aeb9bcdb1f3021a698a903e6effa11ba611f0c97db5d844ee769ba33a0b9a1662832490549fcf18bc09f4b896d6cf6acc793ab1287873a69dd4f14d90cf6b45de4305f683cbe279daa6c31cc',
        userLevel:'1',
        userName:'cpTest10010'
      }
      : {};
    const loginData = {
      birthday,
      channelId,
      nickName,
      gameId,
      pId,
      playerId: playerName,
      playerName,
      token: accessToken,
      userLevel,
      userName,
      ...mockParams,
    };
    app.manager.global.setGameId(loginData.gameId);

    return this._login(loginData);
  }

  /**
   * 检查网络质量
   * 根据网络质量提供不同的游戏体验选项
   */
  async checkNetQuilty() {
    const quality = await CheckNetCtrl.checkQuality(app.config.app.GAME_ID);

    return new Promise((resolve) => {
      if (quality === 'slow') {
        app.manager.global.setNetworkQuality('slow');
        showErrorPop({
          type: ErrorType.SlowNetTips,
          msg: 'The network is slow at present. Would you like to use the smooth mode to play the game?',
          confirmCallback: () => {
            CheckNetCtrl.registerDownloader();
            resolve(true);
          },
          cancelCallback: () => {
            resolve(false);
          },
        });
      } else {
        app.manager.global.setNetworkQuality('fast');
        resolve(false);
      }
    });
  }

  /**
   * 登录，并保存 token
   * @param params
   * @returns
   */
  private async _login(params: Record<string, string>) {
    const res = await login<any>(params);

    if (res.code !== HTTP_STATUS_CODES.SUCCESS) {
      // 清空token
      app.manager.global.setToken('');
      app.manager.global.setUserInfo('', '', '', '');

      return;
    }

    app.manager.global.setToken(res.data.token);
    app.manager.global.setUserInfo(
      res.data.id,
      res.data.playerId,
      res.data.playerName,
      res.data.userLevel
    );
    this.scheduleOnce(() => {
      // 初始化埋点
      this.initTrack();
      eventTrack.track('sys_load_init');
      eventTrack.track('sys_login');
    });
  }

  /**
   * 获取用户余额
   */
  private async _getUserCredit() {
    const res = await getUserCredit();

    if (res.code === HTTP_STATUS_CODES.SUCCESS && res.data !== null) {
      // 后端返回的是1厘比索，前端显示的是1比索，所以需要除以1000
      const creditCount = calculateWithBase(res.data, true);
      app.manager.global.setCreditCount(creditCount);
      GlobalMgr.instance.balance = creditCount;
    }
  }

  /**
   * 初始化游戏设置接口请求
   */
  private _initGameInternal() {
    const env = getGameEnv();
    const hostUrl = getApiUrl(env as Environment);
    this._initParams();
    this._initRuntimeEnv();
    serverHookManager.initApiBaseUrl(hostUrl);
    serverHookManager.initHttpResponseErrorInterceptor();
  }

  /**
   * 配置游戏的接口请求所需要的相关信息
   */
  private async _configService() {
    await serverHookManager.initApiRequestInterceptor(() => app.manager.global.getToken());

    // 服务器维护中不再进行后续的流程
    if (serverHookManager.isServerMaintenance) {
      return;
    }

    // 重试请求拦截器
    serverHookManager.initRetryResponseInterceptor();
  }

  /**
   * 配置活动系统入口的信息
  */
  private async configureActivityEntry() {
    await serverHookManager.configureActivityEntry();
  }

  /**
   * 预加载资源
   *   type === sp.SkeletonData, SpriteFrame 时，bundle 为资源包名，path 为资源路径
   *   type === Prefab 时，bundle 为prefab名
   */
  private _preloadResources() {
    const preloadResources = [
      [
        { type: Prefab, bundle: 'PageHome' }
      ],
      [
        { type: Prefab, bundle: 'PaperHomeRoll' },
        { type: Prefab, bundle: 'PaperHomeBody' },
        { type: Prefab, bundle: 'PopSettings' },
        // { type: Prefab, bundle: 'PopBetamout' }
      ]
    ];

    const task = Core.inst.lib.task.createAny();
    preloadResources.forEach((resources) => {
      task.add(resources.map((item: { bundle: string, path?: string, type: any }) => {
        const {
          bundle, path, type
        } = item;

        return async (next) => {
          if (type === sp.SkeletonData) {
            await loadResource('preloadDir', bundle, path, type);
          } else if (type === SpriteFrame) {
            await loadResource('load', bundle, path, type);
          } else if (type === Prefab) {
            await loadBundle(bundle);
          } else {
            console.error('preloadResources error', type);

            return;
          }

          next();
          this.nextInit();
        };
      }));
    });
    task.start();
  }

  clickSelectedBox() {
    this.selectedNode.active = !this.selectedNode.active;
  }

  clickPlay() {
    this.btnPlayNode.active = false;
    Core.inst.manager.ui.showDefault(() => {
      this.node.destroy();
    });
  }

  /**
   * 登录成功后，初始化埋点
   */
  private initTrack() {
    if (DEBUG) {
      localStorage.removeItem('TRACK_LIST');

      return;
    }

    eventTrack.init(
      getGameEnv(),
      {
        player_id: app.manager.global.playerId,
        player_name: app.manager.global.playerName,
        game_id: app.config.app.GAME_ID,
        game_ver: app.config.app.APP_VERSION,
        provider_id: ''
      }
    );
    eventTrack.track('sys_load_init');
    eventTrack.track('sys_login');
  }

  private appInitArms() {
    if (DEBUG) return;
    const env = getGameEnv();
    // 线上环境单独一个上报应用，其他环境一个
    const pidMap = {
      prod: '1hlahoc4rpc@9224ac96a5dd623',
      info: '1hlahoc4rpc@f3b191fb36fbb85',
      dev: '1hlahoc4rpc@f3b191fb36fbb85',
      uat: '1hlahoc4rpc@f3b191fb36fbb85',
      qat: '1hlahoc4rpc@f3b191fb36fbb85',
      test: '1hlahoc4rpc@f3b191fb36fbb85',
    };
    const pid = pidMap[env as Environment] || 'default_pid';
    initARMS({
      pid: pid,
      endpoint: 'https://1hlahoc4rpc-default-sea.rum.aliyuncs.com',
      env: env,
      user: {
        uid: app.store.user.userParams.pId,
        ...app.store.user.userParams,
      },
      properties: {
        ...app.store.user.userParams,
        appVersion: app.config.app.APP_VERSION,
      },
    });
  }

  protected onProgress(completed: number, total: number) {
    this.progressBarNode.getComponent(ProgressBar).startMove(completed / total);
  }

  protected onDisable(): void {
    this.btnPlayNode.off(Node.EventType.TOUCH_END);
  }
}
