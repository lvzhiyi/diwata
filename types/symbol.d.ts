/**
 * symbol元素
 */
declare interface SymbolItem {
  /** 元素ID */
  symbolId: string;
  /** 元素金边 */
  symbolGoldBorder: boolean;
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
