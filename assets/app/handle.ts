import { app, App } from './app';

import { BUILD, DEBUG, EDITOR, PREVIEW } from 'cc/env';


/**
 * ccc除物理引擎等外的基础功能已经准备好了
 */
export function cccReady(app: App) {
  // 在这里初始化需要早期启动的服务
}

/**
 * ccc全部功能都初始化完毕了
 */
export function cccInited(app: App) {
  // 引擎初始化完成后，可以初始化依赖引擎的服务
}

/**
 * app除了用户自定义Manager未加载外，其它都已准备好了
 */
export function appReady(app: App) {
  console.log('appReady');
}

/**
 * app全部功能都初始化完毕了
 */
export function appInited(app: App) {
  // 应用初始化完成
}
