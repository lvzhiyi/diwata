import { IStore } from '../../../extensions/app/assets/base/BaseModel';
// store中只允许在根路径下定义方法，任何变量在外部访问都是readonly
// store类型的引入是借鉴了Web前端框架中全局状态管理的思路，意图是让数据更安全，更可控。同时框架中还提供了数据绑定的扩展包，可以通过pkg的方式安装，实现「数据->视图」的单向绑定。
export default class Bet implements IStore<Bet> {
  /**
   * 预设投注金额可选项列表
   */
  presetAmountList: number[] = [
    0.3, 0.5, 1,
    2, 3, 5,
    10, 20, 30,
    40, 50, 80,
    100, 200, 500,
    1000, 5000, 10000
  ];
}
