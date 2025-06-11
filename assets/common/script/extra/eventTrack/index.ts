import { EventTrackMgr } from "../https/EventTrackMgr";
import { ActivityDataMgr } from "../../data/ActivityDataMgr";
import { TRACK_URLS } from "./trackEnv";
import { isPC } from "../Utils/common";

/** 埋点上报地址 */
export const TRACK_URL = '/e/?compression=gzip-js';

export interface IEventTrackCommonOpts {
  device_type?: string;
  player_id: string;
  player_name: string;
  provider_id: string;
  game_id: string;
  game_ver: string;
  timestamp?: number;
  extra?: Record<string, any>;
}

/**
 * 事件埋点
 * @param event 埋点事件名称
 * @param data 埋点事件数据
 */
class EventTrack {

  private TRACK_LIST = 'TRACK_LIST';

  private lastTime: number = 0;

  private DEBOUNCE_TIME = 100;

  // 上报地址
  private reportUrl: string = '';

  /**
   * 埋点基础参数
   * playerId 用户Id
   * playerName 用户名
   * gameId 游戏Id
   * gameVer 游戏版本
   * timestamp 时间戳
   */
  private commonOpts: IEventTrackCommonOpts = {
		device_type: isPC() ? 'PC' : 'H5',
    player_id: '',
    player_name: '',
    provider_id: '',
    game_id: '',
    game_ver: '',
    timestamp: 0,
		extra: {}
  }

  public init(env: string, params: IEventTrackCommonOpts) {
    this.reportUrl = TRACK_URLS[env];

    this.commonOpts = { ...this.commonOpts, ...params, extra: { env, ...params.extra } };

    setInterval(() => {
      this.batchSendTrackListToServer();
    }, 5000);

    /**
     * 将埋点基础参数传递给成就系统
     */
    ActivityDataMgr.instance.setReportData({
      playerId: params.player_id,
      playerName: params.player_name,
      gameId: params.game_id,
      gameVer: params.game_ver,
      abTestData: {},
      reportUrl: this.reportUrl
    });
  }

  /**
   * 埋点
   * @param event 埋点事件名称
   * @param data 埋点事件数据
	 * @param debounce
   */
  public track(event: string, data: Record<string, any> = {}, debounce: boolean = false) {

    if (debounce) {
      const now = new Date().getTime();
      if (now - this.lastTime <= this.DEBOUNCE_TIME) {
        return;
      }
      this.lastTime = now;
    }

    // 更新埋点基础参数 (timestamp)
    this.commonOpts.timestamp = new Date().getTime();

    const trackParam = {
      event,
      ...this.commonOpts,
      data
    }

    console.log(`添加埋点数据到本地存储 ... >>> `, event, trackParam);

    this.saveTrackToLocalStorage(trackParam);
  }

  /**
   * 保存埋点数据到本地存储
   * @param event 埋点事件名称
   * @param data 埋点事件数据
   */
  private saveTrackToLocalStorage(trackParam) {
    const trackList = this.getTrackListFromLocalStorage();
    if (trackList) {
      trackList.push(trackParam);
      localStorage.setItem(this.TRACK_LIST, JSON.stringify(trackList));
    } else {
      localStorage.setItem(this.TRACK_LIST, JSON.stringify([trackParam]));
    }
  }

  /**
   * 从本地存储获取埋点数据
   * @returns 埋点数据列表
   */
  private getTrackListFromLocalStorage() {
    const trackList = localStorage.getItem(this.TRACK_LIST);
    return trackList ? JSON.parse(trackList) : [];
  }

  /**
   * 批量发送埋点数据
   */
  private batchSendTrackListToServer() {
    const trackParams = this.getTrackListFromLocalStorage();
    if (trackParams?.length > 0) {
      // 每次最多上报10条数据
      const trackData = trackParams.splice(0, 10);
      this.sendTrack(trackData);
      localStorage.setItem(this.TRACK_LIST, JSON.stringify(trackParams));
    }
  }

  /**
   * 上报埋点
   * @param trackParams 埋点参数
   */
  private async sendTrack(trackParams) {
    try {
      EventTrackMgr.instance.sendTrack(trackParams, this.reportUrl).then(() => {

        console.log(`上报埋点成功 ... >>> `, trackParams);
      }).catch((error) => {
        // 上报失败，保存上报失败的到本地存储
        console.error(`上报埋点失败 ... >>> `, trackParams);
        const trackList = this.getTrackListFromLocalStorage();
        localStorage.setItem(this.TRACK_LIST, JSON.stringify([...trackList, ...trackParams]));

      });
    } catch (error) {
      console.error('上报埋点失败 ... >>> ', error);
      const trackList = this.getTrackListFromLocalStorage();
      localStorage.setItem(this.TRACK_LIST, JSON.stringify([...trackList, ...trackParams]));
    }

  }
}

const eventTrack = new EventTrack();

export default eventTrack;
