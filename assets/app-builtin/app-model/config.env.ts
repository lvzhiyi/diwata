import { IModel } from '../../../extensions/app/assets/base/BaseModel';

// config中不能定义任何方法, 任何变量在外部访问都是readonly
// 如果config中的内容是服务器下发的，可以使用Object.assign覆盖config中的内容
export default class Env implements IModel<Env> {
  // 开发环境
  dev = 'http://server1.makillingslot.net/capi/game';

  // 测试环境
  qat = 'https://capi.makillingslot.net/capi/game'; 

  // 压测环境
  info = 'https://capi.makillingslot.info/capi/game';
  // 预发布环境也就是 pre

  uat = 'https://capi.makillingslot.org/capi/game';

  // 生产环境
  prod = 'https://capi.makillingslot.com/capi/game';
}
