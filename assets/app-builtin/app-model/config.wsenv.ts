import { IModel } from '../../../extensions/app/assets/base/BaseModel';

// config中不能定义任何方法, 任何变量在外部访问都是readonly
// 如果config中的内容是服务器下发的，可以使用Object.assign覆盖config中的内容
export default class Wsenv implements IModel<Wsenv> {
   // 开发环境
   dev = 'wss://dev-client.sportslive.com.ph/ws/game/websocket';

   // 测试环境
   qat = 'wss://ws.makillingslot.net/ws/game/websocket';

   // 压测环境
   info = 'wss://ws.makillingslot.info/ws/game/websocket';

   // 预发布环境也就是 pre
   uat = 'wss://ws.makillingslot.org/ws/game/websocket';

   // 生产环境
   prod = 'wss://ws.makillingslot.com/ws/game/websocket';
}