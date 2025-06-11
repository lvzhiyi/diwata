// 目前仅有正式环境和非正式环境的上报埋点地址
export const TRACK_URLS = {
  // 开发环境
  dev: "https://app-posthog-qat.bi-sage.site/e/?compression=gzip-js",
  // 测试环境
  qat: "https://app-posthog-qat.bi-sage.site/e/?compression=gzip-js",
  // 压测环境
  info: "https://app-posthog-qat.bi-sage.site/e/?compression=gzip-js",
  // 预发布环境也就是 pre
  uat: "https://app-posthog-qat.bi-sage.site/e/?compression=gzip-js",
  // 生产环境
  prod: "https://app-posthog.bi-sage.site/e/?compression=gzip-js",
}