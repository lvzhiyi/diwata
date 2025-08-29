
/**
 * symbol元素
 */
declare interface SymbolItem {
  /** 元素ID */
  symbolId: string;
  /** 元素类型 */
  symbolType?: SymbolTypeEnum;
  /**是否是主元素*/
  main?: boolean;
}

/**
 * symbol位置
 */
declare interface SymbolPosition {
  /** 列索引 */
  columnIndex: number;
  /** 行索引 */
  rowIndex: number;
}

/**
 * symbol动画数据
 */
declare interface ISymbolAnimationData {
  /** symbol节点 */
  symbolNode: any;
  /** 是否需要消除 */
  isNeedRemove: boolean;
  /** 下坠次数 */
  fallDownCount: number;
  /** 符号ID */
  symbolId: string;
  /** 符号类型 */
  symbolType: string;
}

/**
 * symbol大小
 * 1,2,3
 */
declare type SymbolSize = 1 | 2 | 3;
/**
 * symbol大小映射
 */
declare type SymbolSizeMap = {
  [key: string]: number;
};
/**
 * symbol类型枚举
 */
declare type SymbolTypeEnum = 'NORMAL'| '4010'  | '4011' | '4001';

