import { _decorator, Component, Label, Node } from 'cc';
import { app } from 'db://assets/app/app';
import { numberToMoney } from 'db://assets/common/script/extra/Utils/common';
import { PopBuybonus } from '../PopBuybonus';
import { showInsufficientCreditAlert } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';

const { ccclass, property } = _decorator;

type ChangeType = 'add' | 'inc';

const { BUY_FREE_SPIN_TIMES_RATIO } = app?.config?.app || {};

/**
 * 免费轮购买弹窗
 * 负责处理免费轮次的购买、投注金额调整和数量选择
 */
@ccclass('FreeModal')
export class FreeModal extends Component {
  @property({ type: Node, tooltip: '投注金额增加按钮' })
  private BetAddNode: Node = null;

  @property({ type: Node, tooltip: '投注金额减少按钮' })
  private BetIncNode: Node = null;

  @property({ type: Node, tooltip: '投注金额显示文本' })
  private BetLabelNode: Node = null;

  @property({ type: Node, tooltip: '购买数量增加按钮' })
  private quantityAddNode: Node = null;

  @property({ type: Node, tooltip: '购买数量减少按钮' })
  private quantityIncNode: Node = null;

  @property({ type: Node, tooltip: '购买数量显示文本' })
  private quantityLabelNode: Node = null;

  @property({ type: Node, tooltip: '单价显示文本' })
  private priceLabelNode: Node = null;

  @property({ type: Node, tooltip: '总价显示文本' })
  private TotalLabelNode: Node = null;

  @property({ type: Node, tooltip: '信息说明按钮' })
  private InfoBox: Node = null;

  private currentBetVal: number;

  private currentQuantityVal: number;

  private readonly CURRENCY_SYMBOL = '₱';

  private readonly DEFAULT_QUANTITY = 1;

  /** Label组件缓存，避免重复获取 */
  private labelCache: Map<Node, Label> = new Map();

  /**
   * 获取节点上的Label组件
   * @param node 目标节点
   */
  private getLabel(node: Node): Label {
    if (!this.labelCache.has(node)) {
      this.labelCache.set(node, node.getComponent(Label));
    }

    return this.labelCache.get(node);
  }

  /**
   * 设置Label文本
   * @param node 目标节点
   * @param text 文本内容
   */
  private setLabelText(node: Node, text: string) {
    this.getLabel(node).string = text;
  }

  /**
   * 格式化货币显示
   * @param amount 金额
   */
  private formatCurrency(amount: number): string {
    return `${this.CURRENCY_SYMBOL}${amount}`;
  }

  /**
   * 更新总价格显示
   * 计算公式：数量 * 投注金额 * 倍率
   */
  private updateTotalPrice() {
    let total = parseFloat((this.currentQuantityVal * this.currentBetVal * BUY_FREE_SPIN_TIMES_RATIO).toFixed(2));
    
    this.setLabelText(this.TotalLabelNode, this.formatCurrency(total));
  }

  /**
   * 绑定触摸事件
   * @param node 目标节点
   * @param callback 回调函数
   */
  private bindTouchEvent(node: Node, callback: () => void) {
    node.on(Node.EventType.TOUCH_END, callback, this);
  }

  /**
   * 解绑触摸事件
   * @param node 目标节点
   */
  private unbindTouchEvent(node: Node) {
    node.off(Node.EventType.TOUCH_END);
  }

  /**
   * 组件启用时初始化数据和事件
   */
  protected onEnable() {
    this.initializeValues();
    this.bindEvents();
  }

  /**
   * 初始化数值和显示
   */
  private initializeValues() {
    this.currentBetVal = app.manager.global.betCount;
    this.currentQuantityVal = this.DEFAULT_QUANTITY;
    console.log('this.currentBetVal', this.currentBetVal);
    this.setLabelText(this.BetLabelNode, this.formatCurrency(this.currentBetVal));
    this.setLabelText(this.priceLabelNode, this.formatCurrency(this.currentBetVal * BUY_FREE_SPIN_TIMES_RATIO));
    this.setLabelText(this.quantityLabelNode, this.DEFAULT_QUANTITY.toString());
    this.updateTotalPrice();
  }

  /**
   * 绑定UI事件
   */
  private bindEvents() {
    this.bindTouchEvent(this.BetAddNode, () => this.betAmountChange('add'));
    this.bindTouchEvent(this.BetIncNode, () => this.betAmountChange('inc'));
    this.bindTouchEvent(this.quantityAddNode, () => this.quantityChange('add'));
    this.bindTouchEvent(this.quantityIncNode, () => this.quantityChange('inc'));
    this.bindTouchEvent(this.InfoBox, () => {});
  }

  /**
   * 组件禁用时清理事件和缓存
   */
  protected onDisable(): void {
    [
      this.BetAddNode,
      this.BetIncNode,
      this.InfoBox,
      this.quantityAddNode,
      this.quantityIncNode
    ].forEach(node => this.unbindTouchEvent(node));

    this.labelCache.clear();
  }

  /**
   * 投注金额变更
   * @param type 变更类型：add增加/inc减少
   */
  private betAmountChange(type: ChangeType) {
    const presetAmountList = app.store.bet.presetAmountList;
    const currentIndex = presetAmountList.indexOf(this.currentBetVal);
    const targetIndex = type === 'add' ? currentIndex + 1 : currentIndex - 1;

    if (presetAmountList[targetIndex]) {
      this.currentBetVal = presetAmountList[targetIndex];
      this.setLabelText(this.BetLabelNode, this.formatCurrency(this.currentBetVal));
      this.setLabelText(this.priceLabelNode, this.formatCurrency(this.currentBetVal * BUY_FREE_SPIN_TIMES_RATIO));
      this.updateTotalPrice();

      app.manager.event.emit('betCountChange', this.currentBetVal);
      app.manager.global.setBetCount(this.currentBetVal);
    }
  }

  /**
   * 购买数量变更
   * @param type 变更类型：add增加/inc减少
   */
  private quantityChange(type: ChangeType) {
    // 限制购买数量，最多10轮，最少1轮
    this.currentQuantityVal = type === 'add' 
      ? Math.min(this.currentQuantityVal + 1, 10)
      : Math.max(this.currentQuantityVal - 1, 1);

    this.setLabelText(this.quantityLabelNode, this.currentQuantityVal.toString());
    this.updateTotalPrice();
    app.manager.global.setQuantity(this.currentQuantityVal);
  }

  /**
   * 购买免费轮
   * 检查余额是否足够，发送购买事件并关闭弹窗
   */
  public buyFreeSpinTimes() {
    const totalCost = this.currentBetVal * BUY_FREE_SPIN_TIMES_RATIO * this.currentQuantityVal;
    
    if (app.manager.global.creditCount < totalCost) {
      showInsufficientCreditAlert();

      return;
    }

    app.manager.event.emit('buyFreeSpinTimes', this.currentBetVal, this.currentQuantityVal);
    this.closeClickAction();
  }

  /**
   * 关闭弹窗
   */
  public closeClickAction() {
    app.manager.ui.hide<PopBuybonus>({ name: 'PopBuybonus' });
  }
}
