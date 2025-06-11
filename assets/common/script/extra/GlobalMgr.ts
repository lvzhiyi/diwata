import { _decorator, Component, Node } from 'cc';
import { GameEventMgrEventsType, GameMrgEvent } from './GameMrsEvent';
const { ccclass } = _decorator;

export const AchievementErrorCodeList = [
  '25001',
  '25002',
  '25003',
  '25004',
  '25005',
  '25006',
  '25007',
  '25008',
  '25009',
  '25010',
  '25011',
  '25012',
  '25013',
  '25014',
  '25015',
  '24014'
];
@ccclass('GlobalMgr')
export class GlobalMgr extends Component {
  private static _inst: GlobalMgr;
  ///是否显示活动入口，默认为true
  public showActivity: boolean = true;
  ///根节点
  public rootNode: Node;
  //用户id
  public playerId: string;
  // 用户名
  public playerName: string;
  ///游戏id
  public gameId: string;
  // 用户等级
  public userLevel: number;

  // 用户余额
  public balance: number;

  // 自动轮
  public _autoPlayMode: boolean;

  // 用户是否正在游戏中
  private _isGameing: boolean;

  public get isGameing(): boolean {
    return this._isGameing;
  }

  public set isGameing(value: boolean) {
    this._isGameing = value;
    if (this.autoPlayMode == true) {
      console.log('自动模式游戏状态', GlobalMgr.instance.isGameing);
      GameMrgEvent.instance.dispatchEvent(GameEventMgrEventsType.updateGaming, true);
    } else {
      console.log('非自动模式游戏状态', GlobalMgr.instance.isGameing);
      GameMrgEvent.instance.dispatchEvent(GameEventMgrEventsType.updateGaming, this._isGameing);
    }
  }

  public get autoPlayMode(): boolean {
    return this._autoPlayMode;
  }

  public set autoPlayMode(value: boolean) {
    this._autoPlayMode = value;
    if (value == true) {
      GameMrgEvent.instance.dispatchEvent(GameEventMgrEventsType.updateGaming, true);
    } else {
      GameMrgEvent.instance.dispatchEvent(GameEventMgrEventsType.updateGaming, false);
    }
  }
  // 用户token
  private token: string | null = null;
  ///http域名
  private hostUrl: string | null = null;
  // ws域名
  private wshostUrl: string | null = null;

  public static get instance(): GlobalMgr {
    if (this._inst == null) {
      this._inst = new GlobalMgr();
    }
    return this._inst;
  }

  public getToken(): string | null {
    return this.token;
  }

  public setToken(token: string | null) {
    this.token = token;
  }
  public getHostUrl(): string | null {
    return this.hostUrl;
  }
  public setHostUrl(hostUrl: string | null) {
    this.hostUrl = hostUrl;
  }

  public getwsHostUrl(): string | null {
    return this.wshostUrl;
  }
  public setwsHostUrl(hostUrl: string | null) {
    this.wshostUrl = hostUrl;
  }

}
