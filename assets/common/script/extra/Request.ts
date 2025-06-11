import { ArmsReportUtil } from './armsSDK/reportUtil';
import { mockUrl } from '../constants';
/**
 * 请求选项接口，定义了所有可选的配置参数。
 */
interface RequestOptions {
  /**
   * 查询参数对象。
   */
  query?: Record<string, any>;

  /**
   * 发送的数据主体，适用于 POST、PUT、PATCH 等请求。
   */
  data?: any;

  /**
   * 自定义请求头。
   */
  headers?: HeadersInit;

  /**
   * 请求超时时间，单位毫秒。默认值为 10000（10 秒）。
   */
  timeout?: number;

  /**
   * 定义请求的凭证模式，如 'include'、'same-origin' 等。
   */
  credentials?: RequestCredentials;

  /**
   * 定义请求的模式，如 'cors'、'no-cors'、'same-origin' 等。
   */
  mode?: RequestMode;

  /**
   * 定义缓存模式，如 'default'、'no-store'、'reload' 等。
   */
  cache?: RequestCache;

  /**
   * 定义重定向模式，如 'follow'、'error'、'manual' 等。
   */
  redirect?: RequestRedirect;

  /**
   * 定义引用策略，如 'no-referrer'、'origin' 等。
   */
  referrerPolicy?: ReferrerPolicy;

  /**
   * 定义请求的基础 URL，用于覆盖全局配置。
   */
  BASE_URL?: string;
  /**
   * 是否自动拦截接口返回失败状态的请求
   * - 如果为 false，要手动处理接口返回的失败状态。
   * - 默认为 true，自动拦截接口返回的失败状态。
   */
  autoIntercept?: boolean;
  /**
   * 重试请求的次数
   * - 默认为 0，不重连
   */
  reTryCount?: number;
  /**
   * 重试请求的间隔时间
   * - 默认为 1000，单位为毫秒。
   */
  reTryInterval?: number;

  /**
   * 是否在请求URL后添加时间戳参数，用于避免浏览器缓存
   * - 默认为 false，不添加时间戳
   */
  noCache?: boolean;

  /**
   * 是否为mock请求
   * - 默认为 false，不是mock请求
   */
  isMock?: boolean;
}

/**
 * HTTP 配置接口
 */
interface HttpConfig {
  /**
   * 基础URL
   */
  baseURL?: string;
  /**
   * 默认请求头
   */
  headers?: HeadersInit;
  /**
   * 默认超时时间
   */
  timeout?: number;
  /**
   * 默认请求选项
   */
  defaultOptions?: Partial<RequestOptions>;
  /**
   * 请求拦截器
   */
  requestInterceptors?: RequestInterceptor[];
  /**
   * 响应拦截器
   */
  responseInterceptors?: ResponseInterceptor[];
  /**
   * 错误拦截器
   */
  responseErrorInterceptors?: ErrorInterceptor[];
  /**
   * 重试拦截器
   */
  retryResponseInterceptors?: RetryResponseInterceptor[];
}

/**
 * HTTP错误类型
 */
interface HttpError {
  /** 错误类型 */
  type: 'http' | 'network' | 'timeout' | 'api';
  /** HTTP状态码 */
  status?: number;
  /** 错误消息 */
  message: string;
  /** 原始错误对象 */
  originalError: any;
  /** 请求URL */
  url: string;
}

export enum HTTP_STATUS_CODES {
  // 接口响应操作成功的状态码，一般是指接口具体逻辑成功
  SUCCESS = '1',
  // 余额不足
  BALANCE_NOT_ENOUGH = '6001',
  // 未登录
  NOT_LOGIN = '5000000001',
  // 服务器维护中
  SERVER_MAINTENANCE = '5001000',
  // freespin 活动id 已失效
  FREE_SPIN_ACTIVITY_ID_INVALID = '8001',
  // 星卡使用失败
  STAR_CARD_USE_FAILED = '7000',
  // 星卡过期
  STAR_CARD_EXPIRED = '7002',
  // freespin 过期
  FREE_SPIN_EXPIRED = '8001',
  // 星卡使用余额不足
  ACHIEVEMENT_BALANCE_NOT_ENOUGH = '24014',
  // 时间签名错误
  TIME_SIGNATURE_ERROR = '5000000002',
  // 时间签名错误，自定义错误码
  TIME_SIGNATURE_ERROR_CUSTOM = '-5000007893',
  // 投注错误
  BET_ERROR = '4014',
}

/**
 * 构建简单查询字符串的共用函数。
 * 仅处理键值对，不支持数组或嵌套对象。
 * @param query 查询参数对象。
 * @param noCache 是否在请求URL后添加时间戳参数，用于避免浏览器缓存
 * @returns 编码后的查询字符串。
 */
const buildSimpleQueryString = (query: Record<string, any>, noCache?: boolean): string => {
  const queryParts = Object.keys(query)
    .map((key) => {
      const value = query[key];

      if (value === undefined || value === null) {
        return '';
      }

      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .filter((part) => part.length > 0);

  if (noCache) {
    queryParts.push(`_t=${Date.now()}`);
  }

  return queryParts.join('&');
};

// 定义请求和响应拦截器的类型
type RequestInterceptor = (config: RequestInit, path: string) => RequestInit | Promise<RequestInit>;

type ResponseInterceptor = (
  /**
   * 接口响应数据
   */
  response: ApiResponse<any>,
  /**
   * 接口路径
   */
  path: string
) => ApiResponse<any> | Promise<ApiResponse<any>>;

// 新增错误拦截器的类型定义
type ErrorInterceptor = (
  /**
   * 错误对象
   */
  error: HttpError,
  /**
   * 接口路径
   */
  path: string
) => void | Promise<void>;

/**
 * 重试响应拦截器的返回结果
 */
interface RetryResponseResult {
  /**
   * 是否需要重试请求
   */
  shouldRetry: boolean;
  /**
   * 重试请求时的新选项，可用于修改请求参数
   */
  newOptions?: RequestOptions;
}

/**
 * 重试响应拦截器类型定义
 */
type RetryResponseInterceptor = (
  /**
   * 接口响应数据
   */
  response: ApiResponse<any>,
  /**
   * 接口路径
   */
  path: string,
  /**
   * 当前请求的方法
   */
  method: string,
  /**
   * 当前请求的选项
   */
  options: RequestOptions
) => RetryResponseResult | Promise<RetryResponseResult>;

// 全局配置
let BASE_URL = '';
// 默认请求超时时间 30 秒
const DEFAULT_TIMEOUT = 30000;
let controllerList: AbortController[] = [];
let defaultConfig: HttpConfig = {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    // 不走代理缓存
    'X-Proxy-Cache': 'no-cache',
  },
};

const removeAbortController = (abortController?: AbortController) => {
  if (abortController) {
    const index = controllerList.indexOf(abortController);

    if (index !== -1) {
      controllerList.splice(index, 1);
    }
  }

  controllerList = [];
};

/**
 * 创建标准化的HTTP错误对象
 */
const createHttpError = (
  type: HttpError['type'],
  message: string,
  originalError: any,
  url: string,
  status?: number
): HttpError => {
  return {
    type,
    status,
    message,
    originalError,
    url,
  };
};

export const http = {
  /**
   * 初始化HTTP配置
   * @param config HTTP配置
   */
  init(config: HttpConfig) {
    defaultConfig = {
      ...defaultConfig,
      ...config,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        // 不走代理缓存
        'X-Proxy-Cache': 'no-cache',
        ...defaultConfig.headers,
        ...config.headers,
      },
    };

    if (config.baseURL) {
      BASE_URL = config.baseURL;
    }
    if (config.requestInterceptors) {
      this.requestInterceptors.push(...config.requestInterceptors);
    }
    if (config.responseInterceptors) {
      this.responseInterceptors.push(...config.responseInterceptors);
    }
    if (config.responseErrorInterceptors) {
      this.responseErrorInterceptors.push(...config.responseErrorInterceptors);
    }
    if (config.retryResponseInterceptors) {
      this.retryResponseInterceptors.push(...config.retryResponseInterceptors);
    }
  },

  /**
   * 修改全局配置的基础 URL。
   * @param url http开头的URL地址。
   */
  setBaseUrl(url: string) {
    BASE_URL = url;
  },

  /**
   * 修改默认请求头
   * @param headers 请求头
   */
  setDefaultHeaders(headers: HeadersInit) {
    defaultConfig.headers = { ...defaultConfig.headers, ...headers };
  },

  /**
   * 取消所有请求
   */
  cancelAllRequest() {
    controllerList.forEach((controller) => {
      controller.abort();
    });
    removeAbortController();
  },

  // 拦截器列表
  requestInterceptors: [] as RequestInterceptor[],
  responseInterceptors: [] as ResponseInterceptor[],
  responseErrorInterceptors: [] as ErrorInterceptor[],
  retryResponseInterceptors: [] as RetryResponseInterceptor[],

  /**
   * 添加请求拦截器。
   * @param interceptor 拦截器函数。
   */
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  },

  /**
   * 添加响应拦截器。
   * @param interceptor 拦截器函数。
   */
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  },

  /**
   * 添加响应错误拦截器
   * @param interceptor 错误拦截器函数
   */
  addResponseErrorInterceptor(interceptor: ErrorInterceptor) {
    this.responseErrorInterceptors.push(interceptor);
  },

  /**
   * 添加重试响应拦截器
   * @param interceptor 重试拦截器函数
   */
  addRetryResponseInterceptor(interceptor: RetryResponseInterceptor) {
    this.retryResponseInterceptors.push(interceptor);
  },

  /**
   * 移除请求拦截器
   * @param interceptor 拦截器函数
   */
  removeRequestInterceptor(interceptor: RequestInterceptor) {
    const index = this.requestInterceptors.indexOf(interceptor);

    if (index !== -1) {
      this.requestInterceptors.splice(index, 1);
    }
  },

  /**
   * 移除响应拦截器
   * @param interceptor 拦截器函数
   */
  removeResponseInterceptor(interceptor: ResponseInterceptor) {
    const index = this.responseInterceptors.indexOf(interceptor);

    if (index !== -1) {
      this.responseInterceptors.splice(index, 1);
    }
  },

  /**
   * 移除响应错误拦截器
   * @param interceptor 错误拦截器函数
   */
  removeResponseErrorInterceptor(interceptor: ErrorInterceptor) {
    const index = this.responseErrorInterceptors.indexOf(interceptor);

    if (index !== -1) {
      this.responseErrorInterceptors.splice(index, 1);
    }
  },

  /**
   * 移除重试响应拦截器
   * @param interceptor 重试拦截器函数
   */
  removeRetryResponseInterceptor(interceptor: RetryResponseInterceptor) {
    const index = this.retryResponseInterceptors.indexOf(interceptor);

    if (index !== -1) {
      this.retryResponseInterceptors.splice(index, 1);
    }
  },

  /**
   * 处理 HTTP 请求的通用方法。
   * @param method 请求方法（GET, POST 等）。
   * @param serviceUrl API 接口路径（相对于 Base URL）。
   * @param options 请求选项，包括查询参数、头部、主体等。
   * @returns 解析后的 API 响应数据。
   * @throws 如果响应不成功或 API 返回 success 为 false，则抛出 APIError。
   */
  request: async <T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    serviceUrl: string,
    options?: RequestOptions
  ) => {
    // 合并默认配置和请求配置
    const mergedOptions = {
      ...defaultConfig.defaultOptions,
      // 默认自动拦截
      autoIntercept: true,
      ...options,
      headers: {
        ...defaultConfig.headers,
        ...options?.headers,
      },
    };

    // 执行实际的请求逻辑
    const doRequest = async (requestOptions: RequestOptions): Promise<ApiResponse<T>> => {
      // 是否自动拦截接口返回失败状态的请求
      const autoIntercept = !!requestOptions.autoIntercept;
      const url = `${mergedOptions.isMock ? mockUrl : BASE_URL}${serviceUrl}`;
      const controller = new AbortController();
      const timeout = requestOptions.timeout || DEFAULT_TIMEOUT;
      controllerList.push(controller);
      const timeoutId = setTimeout(() => {
        removeAbortController(controller);
        controller.abort();
      }, timeout);

      let finalUrl = url;

      try {
        // 处理查询参数
        if (requestOptions.query || requestOptions.noCache) {
          const queryString = buildSimpleQueryString(
            requestOptions.query || {},
            requestOptions.noCache
          );

          if (queryString) {
            finalUrl += (finalUrl.indexOf('?') === -1 ? '?' : '&') + queryString;
          }
        }

        // 构建请求头
        let headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          ...requestOptions.headers,
        };

        // 构建请求配置
        let fetchOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal,
          credentials: requestOptions.credentials || 'same-origin',
          mode: requestOptions.mode || 'cors',
          cache: requestOptions.cache || 'default',
          redirect: requestOptions.redirect || 'follow',
          referrerPolicy: requestOptions.referrerPolicy || 'no-referrer',
        };

        // 如果有主体数据，进行序列化
        if (requestOptions.data) {
          fetchOptions.body = JSON.stringify(requestOptions.data);
        }

        // 应用所有请求拦截器
        for (const interceptor of http.requestInterceptors) {
          fetchOptions = await interceptor(fetchOptions, serviceUrl);
        }

        // 重试请求的次数
        let reTryCount = requestOptions.reTryCount ?? 0;
        // 重试请求的间隔时间
        let reTryInterval = requestOptions.reTryInterval ?? 1000;
        // 第一次正常请求
        let response!: Response;
        // 重试请求
        const tryRequest = async () => {
          try {
            // 请求
            response = await fetch(finalUrl, fetchOptions);
          } catch (error) {
            // 如果请求失败，并且重试次数大于0，则重试
            if (reTryCount > 0) {
              reTryCount--;
              await new Promise((resolve) => setTimeout(resolve, reTryInterval));
              tryRequest();
            } else {
              throw error;
            }
          }
        };

        await tryRequest();
        clearTimeout(timeoutId);

        // 检查 HTTP 响应状态
        if (!response?.ok) {
          const errorBody = await response?.text();
          const httpError = createHttpError(
            'http',
            errorBody || response?.statusText,
            response,
            serviceUrl,
            response?.status
          );

          // 如果设置了自动拦截，则直接抛出错误
          if (autoIntercept) {
            throw httpError;
          }

          // 否则返回错误响应，由调用方处理
          return {
            code: response?.status?.toString(),
            msg: errorBody || response?.statusText,
            data: null,
          } as ApiResponse<T>;
        }

        // 解析 JSON 响应
        let apiResponse: ApiResponse<T> = await response.json();

        // 检查是否需要重试请求 - 在其他所有拦截器之前执行
        for (const retryInterceptor of http.retryResponseInterceptors) {
          const result = await retryInterceptor(apiResponse, serviceUrl, method, requestOptions);

          if (result.shouldRetry) {
            // 如果需要重试，使用新的选项再次请求
            const newOptions: RequestOptions = {
              ...requestOptions,
              ...result.newOptions,
            };

            return await doRequest(newOptions);
          }
        }

        // 应用所有响应拦截器
        for (const interceptor of http.responseInterceptors) {
          apiResponse = await interceptor(apiResponse, serviceUrl);
        }

        // 检查 API 响应的 success 标志
        if (apiResponse.code !== HTTP_STATUS_CODES.SUCCESS) {
          const apiError = createHttpError(
            'api',
            apiResponse.msg,
            apiResponse,
            serviceUrl,
            +apiResponse.code
          );
          const err = new Error(apiResponse?.msg);
          ArmsReportUtil.reportHttpError(err, {
            ...fetchOptions,
            url: finalUrl,
            traceId: response.headers.get('traceId'),
          });
          // 如果设置了自动拦截，则直接抛出错误
          if (autoIntercept) {
            throw apiError;
          }

          // 否则返回错误响应，由调用方处理
          return apiResponse;
        }

        return apiResponse;
      } catch (error: any) {
        let errorResponse = error;
        clearTimeout(timeoutId);

        if (requestOptions.autoIntercept) {
          // 使用 serviceUrl 而不是 finalUrl，这样更容易识别是哪个接口
          for (const interceptor of http.responseErrorInterceptors) {
            await interceptor(errorResponse, serviceUrl);
          }

          console.error(`HTTP ${method} Error:`, errorResponse);
        }

        return {
          code: errorResponse.status?.toString() || '-1',
          msg: errorResponse.message || '请求失败',
          data: null,
        } as ApiResponse<T>;
      }
    };

    // 开始执行请求
    return await doRequest(mergedOptions);
  },

  /**
   * 处理 HTTP GET 请求。
   * @param path 接口路径。
   * @param query 可选的查询参数。
   * @param headers 可选的自定义头部。
   * @param {RequestOptions} options 可选的请求选项。
   * @returns 解析后的 API 响应数据。
   */
  get: async <T = any>(path: string, query?: Record<string, any>, options?: RequestOptions) => {
    return http.request<T>('GET', path, { query, ...options });
  },

  /**
   * 处理 HTTP POST 请求。
   * @param path 接口路径。
   * @param data 发送的数据。
   * @param {RequestOptions} options 可选的请求选项。
   * @returns 解析后的 API 响应数据。
   */
  post: async <T = any>(path: string, data: any, options?: RequestOptions) => {
    return http.request<T>('POST', path, { data, ...options });
  },
};
