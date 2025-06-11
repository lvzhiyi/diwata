import { DEBUG } from "cc/env";

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
		if(!DEBUG) {
			const armsRum = window.RumSDK.default;
			armsRum.sendException({
				// 必选
			name: '请求错误',
			message: error.message,
			stack: error.stack,
			properties: {
				// traceId: response.headers.get('traceId'),
				...fetchOptions
			},
		});
		}
	}

	/**
	 * 上报自定义错误
	 * @param error 错误对象
	 * @param fetchOptions 请求参数
	 */
	static reportCustomError = (error: any, fetchOptions: any) => {
		if(!DEBUG) {
			const armsRum = window.RumSDK.default;
			armsRum.sendException({
				// 必选
			name: '自定义错误',
			message: error.message,
			stack: error.stack,
			properties: {
				// traceId: response.headers.get('traceId'),
				...fetchOptions
			},
		});
		}
	}
}
