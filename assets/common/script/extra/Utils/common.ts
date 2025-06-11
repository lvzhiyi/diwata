import { assetManager, ImageAsset, SpriteFrame, view } from 'cc';
import { CopyUtils } from './CopyUtils';
import md5 from 'md5';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  /** 网络错误 */
  NetError = 'netError',
  /** 服务器错误 */
  ServerError = 'serverError',
  /** 充值 */
  Recharge = 'recharge',
  /** 投注错误 */
  BetError = 'betError',
  /** 网络慢 */
  SlowNetTips = 'slowNetTips',
}

/** 游戏的appId */
export const APP_ID = 'com.wegame.capi';
/** 游戏的appSecret */
export const APP_SECRET = 'MIIEowIBAAKCAQEAmP8M8b1C12VA9hB3iIHjvQYnda1QovLp+zKTbY2WRRAIGPfT';

/** 游戏的wsAppId */
export const WS_APP_ID = 'com.wegame.ws';

/**
 * 解析当前URL的查询参数，并返回一个键值对对象。
 * @returns {Record<string, any>} 查询参数对象。
 */
export const getUrlParameters = (): Record<string, any> => {
  const params: Record<string, any> = {};
  const queryString = window.location.search.substring(1);
  const pairs = queryString.split('&');

  for (const pair of pairs) {
    if (pair === '') continue;
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }

  return params;
};

/**
 * 复制文本
 */
export const copyText = async (text: string) => {
  const result = await CopyUtils.copyText(text);
  return result;
};

/**
 * 等待指定的毫秒数后resolve
 * @param time 等待的毫秒数
 * @returns 一个Promise，resolve后不带任何参数
 */
export const delay = (time: number) => {
  return new Promise<number>((resolve) => {
    setTimeout(() => {
      resolve(time);
    }, time);
  });
};

/**
 * 判断当前原型环境是本地开发环境还是线上生产环境
 * @param params url的查询参数
 * @returns
 */
export const getRuntimeEnv = (params: Record<string, any>) => {
  const hostname = window.location.hostname;
  // 本地开发环境或者本地预览
  if (/localhost|192\.168/.test(hostname)) {
    return 'local';
  }
  // 直接打开游戏页面，是不带第三方渠道等参数的
  if (!params.channelId || !params.pId) {
    return 'outside';
  }
  // 通过第三方渠道内嵌页面的形式打开
  return 'inside';
};

/**
 * 获取视口的宽高
 * @returns 视口的宽高
 */
export const getViewportSize = () => {
  const { width, height } = view.getDesignResolutionSize();
  let w = width;
  let h = height;

  if (w / h < window.innerWidth / window.innerHeight) {
    // 实际效果比canvas宽
    w = (h * window.innerWidth) / window.innerHeight;
  } else {
    // 实际效果比canvas高
    h = (w * window.innerHeight) / window.innerWidth;
  }
  return {
    width: w,
    height: h,
  };
};

/**
 * 将数字转换为货币格式(xx.xxxx,xxxx.xx)
 * @param num 需要转换的数字
 * @param fractionDigits 保留小数点后几位
 * @param isRemoveZero 是否去掉小数点后多余的0
 * @returns 转换后的货币格式
 */
export const numberToMoney = (num: number | string, fractionDigits = 3, isRemoveZero = true) => {
  let number;
  if (typeof num === 'string') {
    number = Number(num);
  } else if (typeof num === 'number') {
    number = num;
  }
  // 先格式化数字
  let result: string = number.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  // 去掉小数点后多余的0
  if (isRemoveZero) {
    if (result.includes('.')) {
      result = result.replace(/\.?0+$/, '');
    }
  }

  return result;
};

/**
 * 将数字除以或乘以指定基数
 * @param num 需要处理的数字
 * @param isDivide 是否除以基数，true为除以，false为乘以
 * @param base 基数，默认为1000
 * @returns 处理后的数字
 */
export const calculateWithBase = (
  num: number,
  isDivide: boolean = true,
  base: number = 1000
): number => {
  if (isDivide) {
    return num / base;
  } else {
    return num * base;
  }
};

// 获取当前时间以前多少分钟的时间戳
export const getTimestampsNowAgoMinutes = (agoMinutes: number) => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - agoMinutes);
  return now.getTime();
};

/**
 * 判断当前屏幕是否为大屏手机
 */
export const isLargeScreenPhone = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const minSide = Math.min(width, height);
  const maxSide = Math.max(width, height);
  const aspectRatio = maxSide / minSide;
  // 小屏条件：物理尺寸较小 或 宽高比较高（针对全面屏手机）
  return minSide >= 480 || aspectRatio >= 1.83;
};

/**
 * 判断当前屏幕是否为小屏手机
 */
export const isSmallScreenPhone = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const minSide = Math.min(width, height);
  const maxSide = Math.max(width, height);
  const aspectRatio = maxSide / minSide;
  // 小屏条件：物理尺寸较小 或 宽高比较高（针对全面屏手机）
  return minSide <= 375 || (aspectRatio < 1.83 && minSide <= 480);
};

/**
 * 获取服务器真正的时间戳
 * @param spaceTime 服务器时间戳
 * @returns 当前时间戳与服务器时间戳的差值
 */
export const getRealServerTime = (): number => {
  let timeDifferent: number | string = sessionStorage.getItem('timeDifferent');
  if (timeDifferent) {
    timeDifferent = parseInt(timeDifferent, 10);
  } else {
    timeDifferent = 0;
  }
  return Date.now() + timeDifferent;
};

/**
 * 加载服务器图片
 * @param url 图片URL
 * @param success 成功回调函数
 * @param fail 失败回调函数
 */
export const loadRemoteImage = (
  url: string,
  success?: (spriteFrame: SpriteFrame) => void,
  fail?: (error: Error) => void
) => {
  // Check if asset is already loaded
  if (!url) return;
  const asset = assetManager.assets.get(url);
  if (asset instanceof ImageAsset) {
    const spriteFrame = SpriteFrame.createWithImage(asset);
    if (spriteFrame) {
      success?.(spriteFrame);
    } else {
      fail?.(new Error('Failed to create sprite frame from cached asset'));
    }
    return;
  }

  assetManager.loadRemote<ImageAsset>(
    url,
    {
      ext: '.png', // 指定文件扩展名，提高加载效率
    },
    (err, imageAsset) => {
      if (err) {
        console.error(`Failed to load image from ${url}:`, err);
        fail?.(err);
        return;
      }
      const spriteFrame = SpriteFrame.createWithImage(imageAsset);
      if (spriteFrame) {
        success?.(spriteFrame);
      } else {
        const error = new Error('Failed to create sprite frame from loaded asset');
        console.error(error);
        fail?.(error);
      }
    }
  );
};

/**
 * 生成接口请求鉴权所需要的请求头
 * @param timeDiff 时间差(毫秒)
 * @returns
 */
export const createAuthHeaders = (timeDiff: number): HeadersInit => {
  // 获取当前时间戳，单位为毫秒
  const timestamp = timeDiff;
  // 生成随机字符串，长度为10
  const noncestr = Math.random().toString(36).slice(2, 12);
  return {
    timestamp: timestamp.toString(),
    noncestr: noncestr,
    signature: createSignature(timestamp, noncestr),
  };
};

/**
 * 生成接口请求所需要的签名
 * @returns
 */
export const createSignature = (timestamp: number, noncestr: string): string => {
  // 拼接预签名字符串
  const preSign = `appid=${APP_ID}&timestamp=${timestamp}&noncestr=${noncestr}&appsecret=${APP_SECRET}`;
  return md5(preSign.toUpperCase());
};

/**
 * 生成ws接口请求所需要的签名
 * @returns
 */
export const createWSSignature = (timestamp: number, noncestr: string): string => {
  // 拼接预签名字符串
  const preSign = `appid=${WS_APP_ID}&timestamp=${timestamp}&noncestr=${noncestr}&appsecret=${APP_SECRET}`;
  const upperCasePreSign = preSign.toUpperCase();
  console.log('upperCasePreSign', upperCasePreSign);
  return md5(upperCasePreSign);
};
/**
 * 生成ws接口请求鉴权所需签名,传入到url中
 * 签名规则:
 * 1. 将appid、timestamp、noncestr、appsecret拼接成字符串
 * 2. 将字符串转换为大写
 * 3. 使用md5加密
 * 4. 返回签名前10位
 * @param timeDiff 时间差(毫秒)
 * @returns
 */
export const createWSAuthString = (timestamp: number): string => {
  // 生成随机字符串，长度为10
  const noncestr = 'dreamcraft';
  const signature = createWSSignature(timestamp, noncestr);
  console.log('signature', signature);
  return signature.substring(0, 10);
};

/**
 * 判断当前设备是否为PC
 * @returns 是否为PC
 */
export function isPC() {
	const userAgent = navigator.userAgent;
	const isWindows = userAgent.includes('Windows');
	const isMac = userAgent.includes('Macintosh');
	const isLinux = userAgent.includes('Linux') && !userAgent.includes('Android');

	return isWindows || isMac || isLinux;
}
/**
 * 计算文本宽度
 * @param text 文本
 * @param fontSize 字体大小
 * @param fontFamily 字体
 * @returns 文本宽度
 */
export const calculateTextWidth = (text: string, fontSize: number, fontFamily: string = 'Arial'): number => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (context) {
    context.font = `${fontSize}px ${fontFamily}`;
    const metrics = context.measureText(text);

    return metrics.width;
  }

  return 0;
}
