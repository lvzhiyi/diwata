import { HttpDataBase } from './HttpDataBase';
import { ErrorCode, HttpClient } from './HttpClient';
import { PackageFacade, pathSuffix } from '../../../PackageFacade';
import { ResGetBagData } from '../HttpDataModels/ResGetBagData';
import { ResGetLvBox } from '../HttpDataModels/ResGetLvBox';
import { ResGetBoxReward } from '../HttpDataModels/ResGetBoxReward';
import {
  RedeemAchievementData,
  ReqRedeemAchievement,
  ResAchievement,
} from '../HttpDataModels/ResAchievement';
import { ReqChestRewardClaim } from '../HttpDataModels/ReqChestRewardClaim';
import { ResDailyMission } from '../HttpDataModels/ResDailyMission';
import { ResOtherGame } from '../HttpDataModels/ResOtherGame';
import { ResGetRewardDetail } from '../HttpDataModels/ResGetRewardDetail';
import { ReqGetRewardDetail } from '../HttpDataModels/ReqGetRewardDetail';
import { Handler } from '../../../tools/Handler';
import { ResGetHistoryMessage, ResGetPageResMessage } from '../HttpDataModels/ResGetHistoryMessage';
import { ReqGetHistoryMessage } from '../HttpDataModels/ReqGetHistoryMessage';
import { ResFreeSpinOfPlayer } from '../HttpDataModels/ResFreeSpinOfPlayer';
import { ResFreeSpinHistoryOfPlayer } from '../HttpDataModels/ResfreeSpinHistoryOfPlayer';
import { ReqGetFreeSpinHistory } from '../HttpDataModels/ReqGetFreeSpinHistory';
import { ActivityDataMgr } from '../../../data/ActivityDataMgr';
import { IReportData } from '../../../managers/DataReportMgr';
import { ResTrackEvent } from '../HttpDataModels/ResTrackEvent';
import { GlobalMgr } from '../../../extra/GlobalMgr';

export class ActivityServicesMgr {
  private static _inst: ActivityServicesMgr;
  public static get instance(): ActivityServicesMgr {
    if (this._inst == null) {
      this._inst = new ActivityServicesMgr();
    }
    return this._inst;
  }

  /**
   * 上报数据
   * @param data 上报数据
   * @param handleResult 回调函数
   */
  public trackEvent(
    url: string,
    data: IReportData,
    handleResult: Handler<HttpDataBase<ResTrackEvent>>
  ): void {
    let handle: Handler<HttpDataBase<any>> = new Handler(this, (data: HttpDataBase<any>) => {
      handleResult.runWith(data);
      if (!data.isSuccessful) {
        //后续如果需要统一对各种异常进行分类处理，可以在这里进行处理
        PackageFacade.instance.openToast(data.errorMsg);
      } else {
        ActivityDataMgr.instance.setTimestamp(data.timestamp);
      }
    });
    HttpClient.getObject().sendRequest('POST', url, handle, data);
  }

  /**
   * 获取背包数据
   * @param handleResult 回调函数
   */
  public getBagData(handleResult: Handler<HttpDataBase<ResGetBagData>>): void {
    this.send(
      'POST',
      pathSuffix.getBagData,
      new Handler(this, (data: HttpDataBase<ResGetBagData>) => {
        if (data.isSuccessful == false) {
          PackageFacade.instance.openToast(data.errorMsg);
        } else {
          if (data.data.rewardDetails != null && data.data.rewardBag == undefined) {
            data.data.rewardBag = data.data.rewardDetails;
          }
          handleResult.runWith(data);
        }
      }),
      { gameId: GlobalMgr.instance.gameId }
    );
  }
  // /**
  //  * 获取历史消息
  //  * @param handleResult 回调函数
  //  */
  // public getHistoryMessage(
  //     handleResult: Handler<HttpDataBase<ResGetHistoryMessage>>,
  //     page: number = 1,
  //     limit: number = 10
  // ): void {
  //     let data: ReqGetHistoryMessage = new ReqGetHistoryMessage();
  //     data.page = page;
  //     data.limit = limit;
  //     this.send("POST", pathSuffix.getHistoryMessage, handleResult, data);
  // }
  /**
   * 获取等级宝箱数据
   * @param handleResult 回调函数
   */
  public getLevelBoxData(handleResult: Handler<HttpDataBase<ResGetLvBox>>): void {
    this.send(
      'POST',
      pathSuffix.getLevelBoxData,
      new Handler(this, (data: HttpDataBase<ResGetLvBox>) => {
        handleResult.runWith(data);
      }),
      {}
    );
  }
  /**
   * 获取宝箱奖励
   * @param data 请求数据
   * @param handleResult 回调函数
   */
  public getBoxReward(
    data: ReqChestRewardClaim,
    handleResult: Handler<HttpDataBase<ResGetBoxReward>>
  ): void {
    //用的时候减1
    data.level = GlobalMgr.instance.userLevel;
    this.send(
      'POST',
      pathSuffix.getBoxReward,
      new Handler(this, (data: HttpDataBase<ResGetBoxReward>) => {
        if (data.data != null && data.data.level != undefined) {
          data.data.level += 1;
        }
        if (data.isSuccessful == false) {
          //500错误码表示礼包已领取
          PackageFacade.instance.openToast(data.errorMsg);
        }
        handleResult.runWith(data);
      }),
      data
    );
  }
  /**
   * 获取成就数据
   * @param handleResult 回调函数
   */
  public getAchievement(handleResult: Handler<HttpDataBase<ResAchievement>>): void {
    this.send(
      'POST',
      pathSuffix.getAchievement,
      new Handler(this, (data: HttpDataBase<ResAchievement>) => {
        if (data?.data?.achievementList == undefined && data?.data instanceof Array) {
          data.data.achievementList = data.data;
        }
        if (data.isSuccessful == false) {
          //500错误码表示礼包已领取
          PackageFacade.instance.openToast(data.errorMsg);
        }
        handleResult.runWith(data);
      }),
      {}
    );
  }
  /**
   * 领取成就奖励
   * @param data 请求数据
   * @param handleResult 回调函数
   */
  public redeemAchievement(
    data: ReqRedeemAchievement,
    handleResult: Handler<HttpDataBase<RedeemAchievementData>>
  ): void {
    this.send(
      'POST',
      pathSuffix.redeemAchievement,
      new Handler(this, (data: HttpDataBase<RedeemAchievementData>) => {
        handleResult.runWith(data);
      }),
      data
    );
  }
  /**
   * 获取每日任务数据
   * @param handleResult 回调函数
   */
  public getDailyMission(handleResult: Handler<HttpDataBase<ResDailyMission>>): void {
    this.send(
      'POST',
      pathSuffix.getDailyMission,
      new Handler(this, (data: HttpDataBase<ResDailyMission>) => {
        if (data.isSuccessful == false) {
          PackageFacade.instance.openToast(data.errorMsg);
        } else {
          data.data.timestamp = data.timestamp; // 添加服务器时间戳
          if (data.timestamp == undefined && data.time != undefined) {
            data.data.timestamp = data.time; //
          }
          handleResult.runWith(data);
        }
      }),
      {}
    );
  }
  /**
   * 获取其他游戏数据
   * @param handleResult 回调函数
   */
  public getOtherGame(handleResult: Handler<HttpDataBase<ResOtherGame>>): void {
    this.send(
      'POST',
      pathSuffix.getOtherGame,
      new Handler(this, (data: HttpDataBase<ResOtherGame>) => {
        handleResult.runWith(data);
      }),
      { gameId: GlobalMgr.instance.gameId }
    );
  }
  /**
   * 获取奖励详情
   * @param handleResult 回调函数
   */
  public getRewardDetail(
    rewardConfigId: string,
    handleResult: Handler<HttpDataBase<ResGetRewardDetail>>
  ): void {
    let data: ReqGetRewardDetail = new ReqGetRewardDetail();
    data.rewardConfigId = rewardConfigId;
    this.send(
      'POST',
      pathSuffix.getRewardDetail,
      new Handler(this, (data: HttpDataBase<ResGetRewardDetail>) => {
        handleResult.runWith(data);
      }),
      data
    );
  }
  public getFreeSpinData(handleResult: Handler<HttpDataBase<ResFreeSpinOfPlayer>>): void {
    this.send(
      'POST',
      pathSuffix.getFreeSpinData,
      new Handler(this, (data: HttpDataBase<ResFreeSpinOfPlayer>) => {
        handleResult.runWith(data);
      }),
      {},
      {
        autoIntercept: false,
      }
    );
  }
  /**
   * 获取历史消息
   * @param handleResult 回调函数
   */
  public getHistoryMessage(
    handleResult: Handler<HttpDataBase<ResGetHistoryMessage>>,
    page: number = 1,
    limit: number = 10
  ): void {
    let data: ReqGetHistoryMessage = new ReqGetHistoryMessage();
    data.pageNo = page;
    data.pageSize = limit;
    this.send(
      'POST',
      pathSuffix.getHistoryMessage,
      new Handler(this, (data: HttpDataBase<ResGetHistoryMessage>) => {
        if (data?.data != null && data.data.messages == undefined) {
          data.data = ResGetHistoryMessage.toHistoryMessage(data.data);
        }
        handleResult.runWith(data);
      }),
      data
    );
  }

  public getFreeSpinHistory(
    handleResult: Handler<HttpDataBase<ResFreeSpinHistoryOfPlayer>>,
    page: number = 1,
    limit: number = 10
  ): void {
    let data: ReqGetFreeSpinHistory = new ReqGetFreeSpinHistory();
    data.page = page;
    data.limit = limit;
    this.send(
      'POST',
      pathSuffix.getFreeSpinHistory,
      new Handler(this, (data: HttpDataBase<ResFreeSpinHistoryOfPlayer>) => {
        handleResult.runWith(data);
      }),
      data
    );
  }

  private send(
    method: 'GET' | 'POST',
    url: string,
    handleResult: Handler<HttpDataBase<any>>,
    data: any,
    options: {
      isMock?: boolean;
      autoIntercept?: boolean;
      reTryCount?: number;
    } = {}
  ): void {
    let handle: Handler<HttpDataBase<any>> = new Handler(this, (data: HttpDataBase<any>) => {
      handleResult.runWith(data);
      if (!data.isSuccessful) {
        //后续如果需要统一对各种异常进行分类处理，可以在这里进行处理
        PackageFacade.instance.openToast(data.errorMsg);
      }
    });
    HttpClient.getObject().sendRequest(method, url, handle, data, options);
  }
}
