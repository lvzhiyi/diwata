import { IStore } from '../../../extensions/app/assets/base/BaseModel';
// store中只允许在根路径下定义方法，任何变量在外部访问都是readonly
// store类型的引入是借鉴了Web前端框架中全局状态管理的思路，意图是让数据更安全，更可控。同时框架中还提供了数据绑定的扩展包，可以通过pkg的方式安装，实现「数据->视图」的单向绑定。
export default class Gameresult implements IStore<Gameresult> {
    count = 0;
    setCount(v: number) {
        this.count = v;
    }
}

export const transformSpinsResult = (spinsResult: string[][]): string[][] => {
    const transformed: string[][] = [];
    /// 如果没有任何数据，返回空数组
    if (spinsResult.length === 0) {
      return transformed;
    }
    /// 获取每个子数组的长度
    const numberOfRows = spinsResult[0].length;
  
    for (let i = 0; i < numberOfRows; i++) {
      const row: string[] = [];
      for (let j = 0; j < spinsResult.length; j++) {
        /// 将每个子数组的第 i 个元素添加到新行
        row.push(spinsResult[j][i]);
      }
      /// 将新行添加到 transformed 数组
      transformed.push(row);
    }
  
    return transformed;
  };