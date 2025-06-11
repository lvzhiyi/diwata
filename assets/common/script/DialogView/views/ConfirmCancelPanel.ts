import { _decorator, Component, Label, Node } from "cc";
import { Handler } from "db://assets/common/script/tools/Handler";
const { ccclass, property } = _decorator;

@ccclass("ConfirmCancelPanel")
export class ConfirmCancelPanel extends Component {
    @property(Label)
    private content_txt: Label = null;
    private _confirmCallback: Handler<null> = null; //确认回调
    private _cancelCallback: Handler<null> = null; //取消回调
    private _closeCallback: Handler<null> = null; //关闭回调
    private _content: string;
    start() {
        this.updateContent();
    }

    update(deltaTime: number) {}

    // =============== 工具方法 ===============
    public setConfirmCallback(callback: Handler<null>): void {
        this._confirmCallback = callback;
    }
    public setCancelCallback(callback: Handler<null>): void {
        this._cancelCallback = callback;
    }
    public setCloseCallback(callback: Handler<null>): void {
        this._closeCallback = callback;
    }
    public setContent(content: string): void {
        this._content = content;
        this.updateContent();
    }
    private onClickConfirm(): void {
        if (this._confirmCallback) {
            this._confirmCallback.run();
        }
        this.destroy();
    }
    private onClickCancel(): void {
        if (this._cancelCallback) {
            this._cancelCallback.run();
        }
        this.destroy();
    }
    private onClickClose(): void {
        if (this._closeCallback) {
            this._closeCallback.run();
        }
        this.destroy();
    }
    private updateContent(): void {
        if (this._content) {
            this.content_txt.string = this._content;
        }
    }
    onDestroy(): void {
        this.node.removeFromParent();
        this._confirmCallback = null;
        this._cancelCallback = null;
        this._content = null;
    }
}
