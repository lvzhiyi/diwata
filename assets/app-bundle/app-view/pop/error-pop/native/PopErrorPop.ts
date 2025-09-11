import { _decorator, Label, Node, RichText, Sprite, SpriteAtlas, UITransform } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { app } from 'db://assets/app/app';
import { ApiPath, ErrorType } from 'db://assets/common/script/extra/https/Constant';
import { mockFailedData } from 'db://assets/basePlate/core/baseUtil/mockDataUtils';

const { ccclass, property } = _decorator;

@ccclass('PopErrorPop')
export class PopErrorPop extends BaseView {
  @property(Node) private cancelBtn: Node;

  @property(Node) private confirmBtn: Node;

  @property(Node) private confirmLable: Node;

  /** 文本节点 */
  @property(Node) private toastText: Node;

  @property(Node) private tipsNode: Node;

  @property(Node) private errorNode: Node;

  /** 文本节点容器 */
  @property(Node) private textContainer: Node;

  // @property(SpriteAtlas) private confirmBtnSprite: SpriteAtlas;

  private richText: RichText;

  private labelText: Label;

  private enableRichText: boolean = false;

  private errorType: string;

  private serviceUrl: string;

  private closeable: boolean = true;

  private _confirmCallback: () => void;

  private _cancelCallback: () => void;

  // 点击取消按钮
  clickCancelBtn() {
    if (this._cancelCallback) {
      this._cancelCallback();

      if (this.closeable) {
        this.hide();
      }

      return;
    }
    if (this.serviceUrl === ApiPath.bet) {
      app.controller.slots.stopRolling(mockFailedData);
      app.manager.event.emit('resetAutoPlay', true);
    }

    if (this.closeable) {
      this.hide();
    }
  }

  // 点击确认按钮
  clickConfirmBtn() {
    if (this._confirmCallback) {
      this._confirmCallback();

      if (this.closeable) {
        this.hide();
      }

      return;
    }

    switch (this.errorType) {
      case ErrorType.LoginError:
      case ErrorType.ServerError:
        // 网络或服务器错误，刷新页面
        window.location.reload();
        break;
      case ErrorType.Recharge:
        // 充值，跳转到充值页面
        window.parent.postMessage({ type: 'gameDeposit' }, '*');
        break;
      case ErrorType.ServerMaintenance:
      case ErrorType.BetError:
        // 投注错误，登出
        window.location.reload();
        window.parent.postMessage({ type: 'LogoutEvent' }, '*');
        break;
      case ErrorType.FreeSpinActivityIdInvalid:
        // freespin 活动id 已失效
        app.manager.event.emit('freeSpinActivityIdInvalid');
        app.controller.slots.stopRolling(mockFailedData);
        app.manager.event.emit('resetAutoPlay', true);
        break;
    }

    if (this.closeable) {
      this.hide();
    }
  }

  // 初始化的相关逻辑
  onLoad() {}

  // 界面打开时的相关逻辑(onShow可被多次调用-它与onHide不成对)
  onShow(params: {
    confirmCallback?: () => void;
    cancelCallback?: () => void;
    type: ErrorType;
    msg: string;
    icon?: string;
    serviceUrl?: string;
    enableRichText?: boolean;
    closeable?: boolean;
  }) {
    if (!params) return;

    // 保存回调函数
    this._confirmCallback = params.confirmCallback;
    this._cancelCallback = params.cancelCallback;
    console.log('this.errorType', this.errorType, params);
    // 保存参数
    const {
      type, msg, serviceUrl, enableRichText, closeable = true 
    } = params;
    this.errorType = type;
    this.enableRichText = enableRichText;
    this.updateTextLayout();
    this.updateTextLabel(msg);
    this.updateTextContainerSize();
    this.serviceUrl = serviceUrl;
    // 设置界面元素显示状态
    this.updateUIState(type);
    // 设置确认按钮图标
    this.updateConfirmButtonSprite(type);
    this.closeable = closeable;
  }

  private updateTextLayout() {
    if (this.enableRichText && !this.richText) {
      this.richText =
        this.toastText.getComponent(RichText) || this.toastText.addComponent(RichText);
      this.richText.fontSize = 32;
      this.richText.lineHeight = 33;
      this.richText.maxWidth = this.textContainer.getComponent(UITransform).width;
      this.richText.horizontalAlign = RichText.HorizontalAlign.CENTER;
      this.richText.verticalAlign = RichText.VerticalAlign.CENTER;
      this.labelText?.destroy();

      return;
    }
    if (!this.enableRichText && !this.labelText) {
      this.labelText = this.toastText.getComponent(Label) || this.toastText.addComponent(Label);
      this.labelText.fontSize = 32;
      this.labelText.lineHeight = 33;
      this.labelText.horizontalAlign = Label.HorizontalAlign.CENTER;
      this.labelText.verticalAlign = Label.VerticalAlign.CENTER;
      this.richText?.destroy();
    }
  }

  private updateTextLabel(msg: string) {
    if (this.enableRichText) {
      this.richText.string = msg;
    } else {
      this.labelText.string = msg;
    }
  }

  private updateTextContainerSize() {
    const textTransform = this.toastText.getComponent(UITransform);
    this.textContainer
      .getComponent(UITransform)
      .setContentSize(textTransform.width, Math.max(textTransform.height, 250));
  }

  // 更新UI状态
  private updateUIState(type: ErrorType) {
    const isNetError = type === ErrorType.NetError;
    const isServerError = type === ErrorType.ServerError;
    const isRecharge = type === ErrorType.Recharge;
    const isBetError = type === ErrorType.BetError;
    const isSlowNetTips = type === ErrorType.SlowNetTips;

    this.tipsNode.active = !isNetError && !isServerError;
    this.errorNode.active = isNetError || isServerError;
    this.cancelBtn.active = isRecharge || isBetError || isSlowNetTips || isServerError;
  }

  // 更新确认按钮图标
  private updateConfirmButtonSprite(type: ErrorType) {
    let confirmText = '';
    const spriteFrameMap = {
      netError: 'Refresh',
      recharge: 'Recharge',
      serverError: 'Confirm',
      betError: 'Confirm',
      loginError: 'Refresh',
      slowNetTips: 'Confirm',
      normalTips: 'Confirm',
      serverMaintenance: 'Refresh',
    };
    confirmText = spriteFrameMap[type as keyof typeof spriteFrameMap];

    const textLabel = this.confirmLable.getComponent(Label);

    if (textLabel.isValid) {
      textLabel.string = confirmText;
    }
  }

  // 界面关闭时的相关逻辑(已经关闭的界面不会触发onHide)
  onHide(result: undefined) {
    return result;
  }
}
