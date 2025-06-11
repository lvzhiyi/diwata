import { _decorator, } from 'cc';

export class MoneyUtil  {
  /** 余额显示的小数位数 */
  public static readonly BALANCE_DECIMAL_PLACES: number = 2;

  /** 货币显示的小数位数 */
  public static readonly CURRENCY_DECIMAL_PLACES: number = 3;

  /** 货币转换比例 */
  private static readonly CURRENCY_RATIO: number = 1000;

  /**
   * 将显示金额转换为服务端金额（乘以比例）
   * @param displayAmount 显示给用户的金额
   * @returns 服务端接受的金额值
   */
  public static displayToInternal(displayAmount: number): number {
    return displayAmount * this.CURRENCY_RATIO;
  }

  /**
   * 将服务端金额转换为显示金额（除以比例）
   * @param internalAmount 服务端接受的金额值
   * @returns 显示给用户的金额
   */
  public static internalToDisplay(internalAmount: number): number {
    return internalAmount / this.CURRENCY_RATIO;
  }

  /**
   * 将服务端金额转换为显示金额（除以比例），并格式化显示金额
   * @param internalAmount 服务端接受的金额值
   * @param decimalPlaces 小数位数，默认为3
   * @returns 显示给用户的金额
   */
  public static internalToDisplayWithComma(internalAmount: number, decimalPlaces: number = MoneyUtil.CURRENCY_DECIMAL_PLACES): string {
    const displayAmount = this.internalToDisplay(internalAmount);

    return this.formatDisplayAmountWithComma(displayAmount, decimalPlaces);
  }

  /**
   * 将服务端金额转换为显示金额（除以比例），并格式化显示金额
   * @param internalAmount 服务端接受的金额值
   * @param decimalPlaces 小数位数，默认为3
   * @returns 显示给用户的金额
   */
  public static internalToDisplayAndFormat(internalAmount: number, decimalPlaces: number = MoneyUtil.CURRENCY_DECIMAL_PLACES): string {
    const displayAmount = this.internalToDisplay(internalAmount);

    return this.formatDisplayAmount(displayAmount, decimalPlaces);
  }

  /**
   * 格式化显示金额
   * @param amount 需要格式化的金额
   * @param decimalPlaces 小数位数，默认为3
   * @returns 格式化后的金额字符串
   */
  public static formatDisplayAmount(amount: number, decimalPlaces: number = MoneyUtil.CURRENCY_DECIMAL_PLACES): string {
    // 处理数字精度
    const fixedAmount = amount.toFixed(decimalPlaces);
    const parts = fixedAmount.split('.');

    if (parts.length > 1) {
      const decimalPart = parts[1].replace(/0+$/, '');

      return decimalPart ? `${parts[0]}.${decimalPart}` : parts[0];
    }

    return parts[0];
  }

  /**
   * 格式化显示金额
   * @param amount 需要格式化的金额, 每隔三位显示一个逗号
   * @param decimalPlaces 小数位数，默认为3
   * @param isTrimDecimaZero 是否移除小数部分末尾的0，如果全为0则不显示小数部分
   * @returns 格式化后的金额字符串
   */
  public static formatDisplayAmountWithComma(amount: number, decimalPlaces: number = MoneyUtil.CURRENCY_DECIMAL_PLACES, isTrimDecimaZero: boolean = false): string {
    // 处理数字精度
    const fixedAmount = amount.toFixed(decimalPlaces);
    const parts = fixedAmount.split('.');
    
    // 处理整数部分
    const integerPart = parts[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    
    // 处理小数部分：移除末尾的0，如果全为0则不显示小数部分
    if (parts.length > 1) {
      const decimalPart = isTrimDecimaZero ? parts[1].replace(/0+$/, '') : parts[1];

      return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
    }
    
    return integerPart;
  }
}
