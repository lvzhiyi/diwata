
import { sys } from 'cc';

/**
	* @description 初始化 ARMS 前端监控
	* @param env 环境
	* @param pid 项目ID
	* @param endpoint 数据上报地址
	* @param user 用户信息
	* @param properties 自定义属性
*/
export const initARMS = (
	{env, pid, endpoint, user, properties}:
	{env: string, pid: string, endpoint: string, user: object, properties: Record<string, any>}
): void => {
  const armsRum = window.RumSDK.default;

	if(!sys.isBrowser) {
		console.log('[ARMS] 当前环境不是浏览器，不初始化ARMS');
		return;
	};
  try {
    // ARMS 配置
    const armsConfig = {
      pid: pid,
      env: env,
      endpoint: endpoint , // 数据上报地址
      sample: env === 'prod' ? 30 : 100, // 生产环境采样率30%，其他环境100%
      enableSPA: true, // 启用单页应用监控
			// beforeReport: (reportData) => {
			// 	reportData.events.forEach((event) => {

			// 		if(event.type === 'error') {
			// 			reportLark(event.name.toString(), event.message.toString());
			// 		}
			// 	});
			// 	return reportData;
			// },
			user,
      // 忽略特定错误
      filters: {
        exception: [
          /\/google-analytics\//i,
          /extension\//i,
          /^chrome/i,
					/cp-images/i,
					/Clipboard/i,
        ],
        resource: [
          /^Script error\.?$/,
          /localhost/i,
					/cp-images/i,
          /^chrome/i,
        ]
      },
			evaluateApi: async (options, response, error) => {
				let respText = '';
				// 当前为使用fetch请求的情况
				if (response && response.text) {
					respText = await response.text();
				}
				// 返回的字段会覆盖默认内容，不返回的字段会依然使用SDK自定生成内容
				return {
					name: options.url,
					success: error ? 0 : 1,
					// 以下可选
					snapshots: JSON.stringify({
						...options,
						response: respText.substring(0, 2000), // 返回值
						reqHeaders: options.headers, // 请求头
						resHeaders: response.headers, // 响应头
					}),
					properties: {
						appTraceId: response?.headers?.get('trace-id'),
					},
					appTraceId: response?.headers?.get('trace-id'),
				};
			},
			properties: properties
    };
    // 初始化
		armsRum.setConfig(armsConfig);
    // 集成全局错误监控
    // setupGlobalErrorHandling(logger);
    console.log('[ARMS] 初始化成功 - 环境:', env, '采样率:', armsConfig.sample, '%');
  } catch (error) {
    console.error('[ARMS] 初始化失败:', error);
    return null;
  }
};

// /**
//  * @description 上报日志到飞书
//  * @param text 日志信息
//  * @param url 错误地址
//  */
// const reportLark = (text: string, url: string) => {
// 	const data = {
//     msg_type: 'post',
//     content: {
//       post: {
//         zh_cn: {
//           title: '⚠️ 线上报错，请及时处理！',
//           content: [
//             [
//               {
//                 tag: 'text',
//                 un_escape: true,
//                 text: text,
//               },
//               {
//                 tag: 'a',
//                 text: '点击前往错误地址',
//                 href: url,
//               },
//             ],
//           ],
//         },
//       },
//     },
//   };


// 	fetch('https://open.larksuite.com/open-apis/bot/v2/hook/d1e19c6a-bee1-45da-ac3e-1b3b42d96d5a', {
// 		method: 'POST',
// 		body: JSON.stringify(data),
// 		headers: {
// 			'Content-Type': 'application/json',
// 		},
// 	});
// };

declare global {
	interface Window {
		RumSDK: {
			default: any;
		};
	}
}


