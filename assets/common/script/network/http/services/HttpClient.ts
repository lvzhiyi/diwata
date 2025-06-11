import { HttpDataBase } from './HttpDataBase';
import { ActivityGlobleMgr } from '../../../managers/ActivityGlobleMgr';
import { PackageFacade } from '../../../PackageFacade';
import { Handler } from '../../../tools/Handler';
import { http } from '../../../extra/Request';
export enum ErrorCode {
  NetworkError = 'NetworkError', //网络错误
  UserBanned = 'UserBanned', // 用户禁用
  VerificationFailed = 'VerificationFailed', //验证失败
  FrequentOperation = 'FrequentOperation', // 操作频繁
  ServiceSuspension = 'ServiceSuspension', // 服务暂停
  InsufficientBalance = 'InsufficientBalance', // 余额不足
  UnexpectedError = 'UnexpectedError', // 意料之外的错误
}

export class HttpClient {
  private _callbackHandler: Handler<any> | null = null;

  public static getObject(): HttpClient {
    return new HttpClient();
  }

  /**
   * 改造成自己项目的Http请求
   */
  public async sendRequest(
    method: 'GET' | 'POST',
    pathSuffix: string,
    callbackHandler: Handler<any>,
    data: any | null = null,
    options: {
      isMock?: boolean;
      autoIntercept?: boolean;
      reTryCount?: number;
    } = {}
  ): Promise<void> {
    this._callbackHandler = callbackHandler;

    if (method === 'POST') {
      try {
        http.post(pathSuffix, data, options).then((res) => {
          this.handleResult(res);
        });
      } catch (error) {
        this.handleResult(error);
      }
      return;
    }

    if (method === 'GET') {
      try {
        http
          .get(pathSuffix, options, {
            headers: {
              'Cache-Control': 'no-cache', // 禁用缓存
              Pragma: 'no-cache', // 兼容旧浏览器
              Expires: '0', // 设置为过期时间为 0，避免缓存
            },
          })
          .then((res) => {
            this.handleResult(res);
          });
      } catch (error) {
        this.networkError(pathSuffix, error.msg);
      }
    }
  }

  private handleResult(resultData: any): void {
    let data: HttpDataBase<any> = new HttpDataBase();
    if (resultData.code == 1) {
      data.data = resultData.data;
      data.time = resultData.time;
      data.isSuccessful = true;
      this._callbackHandler.runWith(data);
    } else {
      data.isSuccessful = false;
      data.errorMsg = resultData.msg;
      data.code = resultData.code;
      this._callbackHandler.runWith(data);
    }
  }

  private networkError(url: string, msg: string): void {
    PackageFacade.instance.error('网络异常请求失败 url=' + url);
    let data: HttpDataBase<any> = new HttpDataBase();
    data.isSuccessful = false;
    data.errorMsg = msg;
    data.errorCode = ErrorCode.NetworkError;
    this._callbackHandler.runWith(data);
  }
}
interface CommonResult {
  /** 业务错误代码，请求成功时此项为 0 */
  code: number;
  /** 业务错误提示文本，请求成功时此项为 '' */
  msg: string;
  /** 数据 '' */
  data?: any;
  /** 服务器时间戳 '' */
  timestamp: number;
}
