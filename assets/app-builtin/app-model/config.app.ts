import { IModel } from '../../../extensions/app/assets/base/BaseModel';

// config中不能定义任何方法, 任何变量在外部访问都是readonly
// 如果config中的内容是服务器下发的，可以使用Object.assign覆盖config中的内容
export default class App implements IModel<App> {
    APP_ID = 'com.wegame.capi';

    /** 游戏的channelId */
    CHANNEL_ID = '1050';

    APP_SECRET =
        'MIIEowIBAAKCAQEAmP8M8b1C12VA9hB3iIHjvQYnda1QovLp+zKTbY2WRRAIGPfT';

    GAME_ID = 'zhumeng004';

    DREAMCRAFT = 'dreamcraft';

    GAME_PID = '50';

    /** 游戏版本号 */
    GAME_VER = '1.0.0';

    /** 购买免费轮次数的倍数 */
    BUY_FREE_SPIN_TIMES_RATIO = 35;

    /** 游戏主场景 */
    MAIN_SCENE = 'Game';

    /** 本地开发环境要使用接口环境 */
    LOCAL_ENV = 'qat';

    /**
     * 用来做网络环境测试的文件地址，用来测试网络速度
     */
    SPEED_TEST_FILE_URL =
        'https://cocos.makillingslot.net/images/logo.png';

    /** 网络质量检测时间间隔，单位：秒 */
    NETWORK_QUALITY_CHECK_INTERVAL = 10;

    /** 投注结果动画最小时间，单位：毫秒 */
    BET_EFFECT_MIN_TIME = 550;

    /** 图片处理服务地址 */
    IMAGE_HANDLER_API_POINT_URL =
        'https://d26qtmqq28kv6s.cloudfront.net';

    /** 游戏版本号 */
     APP_VERSION = '1.0.0';
}