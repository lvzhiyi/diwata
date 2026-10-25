import { DEBUG } from 'cc/env';
import logger from '../Utils/logger';

/**
 * 上报HTTP请求错误
 */
export class ArmsReportUtil {
  /**
   * 上报HTTP请求错误
   * @param error 错误对象
   * @param fetchOptions 请求参数
   */
  static reportHttpError = (error: any, fetchOptions: any) => {
    if (!DEBUG && window.RumSDK) {
      const armsRum = window.RumSDK.default;
      armsRum.sendException({
        // 必选
        name: '请求错误',
        message: error.message,
        stack: error.stack,
        properties: {
          // traceId: response.headers.get('traceId'),
          ...fetchOptions,
        },
      });
    }
  };

  /**
   * 上报自定义错误
   * @param error 错误对象
   * @param fetchOptions 请求参数
   */
  static reportCustomError = (error: any, fetchOptions: any) => {
    if (!DEBUG && window.RumSDK) {
      const armsRum = window.RumSDK.default;
      armsRum.sendException({
        // 必选
        name: '自定义错误',
        message: error.message,
        stack: error.stack,
        properties: {
          // traceId: response.headers.get('traceId'),
          ...fetchOptions,
        },
      });
    }
  };

  /**
   * 上报游戏加载时间
   */
  static reportLoadTime() {
    const loadEndTime = performance.now();
    const loadDuration = loadEndTime - window.loadStartTime;
    logger.log('game Total Load Time', loadDuration);
    if (DEBUG || !window.RumSDK) return;
    const armsRum = window.RumSDK.default;
    // 分段上报游戏加载时间
    const stepTimeArr = [0, 10000, 20000, 30000, 40000, 50000, 60000];

    const prefix = !localStorage.getItem('firstLoad') ? 'firstLoadTime' : 'gameTotalLoadTime';
    stepTimeArr.forEach((step, index) => {
      // 上报区间时间
      if (
        loadDuration > stepTimeArr[index] &&
        stepTimeArr[index + 1] &&
        loadDuration < stepTimeArr[index + 1]
      ) {
        armsRum.sendCustom({
          type: 'loadTime',
          name: `${prefix}_${step}_${stepTimeArr[index + 1]}`,
          value: loadDuration,
        });
      }

      // 上报 > 60 时间
      if (!stepTimeArr[index + 1] && loadDuration > stepTimeArr[index]) {
        armsRum.sendCustom({
          type: 'loadTime',
          name: `${prefix}_${step}_more`,
          value: loadDuration,
        });
      }
    });

		// 每次上报加载时间
		armsRum.sendCustom({
			type: 'loadTime',
			name: `${prefix}`,
			value: loadDuration,
		});

    if (!localStorage.getItem('firstLoad')) {
      localStorage.setItem('firstLoad', 'true');
    }
  }
}
