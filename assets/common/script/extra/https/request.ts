import { http } from "../Request";

/**
 * 获取大奖信息
 */
export const getReward = async () => {
  return http.get('/reward/get', null, {
    headers: {
      // 禁用缓存
      'Cache-Control': 'no-cache', 
      // 兼容旧浏览器
      Pragma: 'no-cache', 
      // 设置为过期时间为 0，避免缓存
      Expires: '0', 
    },
    autoIntercept: false,
  });
};