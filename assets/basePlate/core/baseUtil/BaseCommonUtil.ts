import { _decorator, Component, Node } from 'cc';
import { BUILD } from 'cc/env';
import dayjs from 'dayjs';
import { PopErrorPop } from 'db://assets/app-bundle/app-view/pop/error-pop/native/PopErrorPop';
import { app } from 'db://assets/app/app';
import { ErrorType, SERVER_MAINTENANCE_TIP_TEMPLATES } from 'db://assets/common/script/extra/https/Constant';
import CpPostMessage from 'db://assets/common/script/extra/tmBridge/cpPostMessage';

const { ccclass, property } = _decorator;

/**
 * 获取游戏的环境类型
 * @param presetEnv 本地开发环境时的预设环境变量
 * @returns {EnvType} 游戏的环境类型
 */
export const getGameEnv = (presetEnv = app.config.app.LOCAL_ENV) => {
  const hostname = window.location.hostname;

  switch (true) {
    case BUILD && hostname.indexOf('.net') > -1:
      return 'qat';
    case BUILD && hostname.indexOf('.info') > -1:
      return 'info';
    case BUILD && hostname.indexOf('.org') > -1:
      return 'uat';
    case BUILD && hostname.indexOf('.com') > -1:
      return 'prod';
    default:
      return 'dev';
  }
};

/**
* 获取接口请求的基础 URL
* @param {keyof typeof API_HOST_URLS} env 环境类型
* @returns {string} 基础 URL
*/
export const getApiHost = (env: keyof typeof app.config.env): string => {
  return app.config.env[env];
};
  
/**
   * 获取ws接口请求的基础 URL
   * @param {keyof typeof API_HOST_URLS} env 环境类型
   * @returns {string} 基础 URL
   */
export const getWsHost = (wsenv: keyof typeof app.config.wsenv): string => {
  const wsModel = app.config.wsenv;

  return wsModel[wsenv];
};

/**
* 通用的资源加载方法，支持缓存
* @param loadType 加载类型，load为加载单个资源，preloadDir为加载资源文件夹，preload为预加载资源
* @param bundle 包名
* @param path 资源路径
* @param type 资源类型
*/
export const loadResource = <T>(
  loadType: 'load' | 'preloadDir' | 'preload' | 'loadDir',
  bundle: string,
  path: string,
  type?: any
): Promise<T> => {
  // 加载新资源并缓存
  return new Promise<T>((resolve) => {
    app.manager.loader[loadType]({
      bundle,
      path,
      type,
      onComplete: (asset) => {
        console.log('资源文件加载完成', asset);
        resolve(asset as T);
      },
    });
  });
};

/**
 * 预加载bundle
 * @param bundle
 * @returns
 */
export const loadBundle = (bundle: any) => {
  console.log('执行loadBundle开始', bundle);

  return new Promise<void>((resolve, reject) => {
    app.manager.ui.load(bundle, () => {
      console.log('执行loadBundle完成', bundle);
      resolve();
    });
  });
};

/**
 * 显示错误弹窗
 * @param type 错误类型 tips 或者是 error
 * @param msg 错误信息
 * @param serviceUrl 服务URL
 * @param confirmCallback 确认回调
 * @param cancelCallback 取消回调
 */
export const showErrorPop = (params: {
  type: ErrorType;
  msg: string;
  serviceUrl?: string;
  confirmCallback?: () => void;
  cancelCallback?: () => void;
}) => {
  app.manager.ui.show({
    name: 'PopErrorPop',
    data: params,
  });
};

/**
 * 显示余额不足提示
 */
export const showInsufficientCreditAlert = () => {
  app.manager.ui.show({
    name: 'PopErrorPop',
    data: {
      type: ErrorType.Recharge,
      msg: 'Insufficient credit , Do you want to recharge ?',
      onConfirm: () => {
        CpPostMessage.goDeposit();
        app.manager.ui.hide({ name: 'PopErrorPop' });
      },
      onCancel: () => {
        app.manager.ui.hide({ name: 'PopErrorPop' });
      },
    },
  });
};

/**
 * 获取服务器维护提示，如果是同一天，则只显示开始日期，和开始时间以及结束时间，否则开始日期和结束日期都需要显示
 * @param start 开始时间
 * @param end 结束时间
 * @returns 服务器维护提示
 */
export const getServerMaintenanceTip = (start: number, end: number) => {
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const isSameDay = startDate.format('YYYY-MM-DD') === endDate.format('YYYY-MM-DD');

  const formatDate = (date: dayjs.Dayjs) =>
    `${date.format('MMMM D, YYYY')} ${date.format('hh:mm a')}`;
  const rangeText = isSameDay
    ? `<color=#00ffff> ${startDate.format('MMMM D, YYYY')} from ${startDate.format(
      'hh:mm a'
    )} to ${endDate.format('hh:mm a')}</color>`
    : `<color=#00ffff> ${formatDate(startDate)} to ${formatDate(endDate)}</color>`;

  return SERVER_MAINTENANCE_TIP_TEMPLATES.map((template: string) =>
    template.replace('{{range}}', rangeText)
  ).join('<br/><br/>');
};

/**
 * 显示服务器维护提示
 * @param start 开始时间
 * @param end 结束时间
 */
export const showServerMaintenanceTip = (start: number, end: number) => {
  app.manager.ui.show({
    name: 'PopErrorPop',
    data: {
      msg: getServerMaintenanceTip(start, end),
      type: ErrorType.ServerMaintenance,
      enableRichText: true,
      closeable: false,
    },
    onShow: () => {},
  });
};

export function preventRapidClickDecorator(clickDelay: number = 1000) {
  let lastClickTime = 0;

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const currentTime = Date.now();

      if (currentTime - lastClickTime < clickDelay) {
        return;
      }

      lastClickTime = currentTime;

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}