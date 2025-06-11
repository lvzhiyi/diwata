import { _decorator, Component, easing, Mask, Node, Tween, tween, UIOpacity, Vec3 } from "cc";
import { PackageFacade } from "../PackageFacade";
import { ActivityDialogViewMgr } from "./ActivityDialogViewMgr";
import { ActivityDialogViewID } from "./ActivityDialogViewID";
import { Handler } from "../tools/Handler";
const { ccclass, property } = _decorator;

/**
 * 对话框基类
 * @class ActivityDialogViewBase
 * @extends {Component}
 */
@ccclass("ActivityDialogViewBase")
export abstract class ActivityDialogViewBase extends Component {
    /**主界面*/
    @property(Node)
    protected content: Node = null;
    /**背景遮罩*/
    @property(Node)
    protected bgMask: Node;
    /** 是否添加Mask遮罩,用来裁剪超出屏幕部分 */
    @property({ tooltip: "是否添加Mask遮罩,超出屏幕部分将被裁剪" })
    protected isAddScreenMask: boolean = false;
    private _isClose: boolean = false;
    private _moveTween: any;
    protected _dialogViewID: ActivityDialogViewID;
    private _bgMoveTween: any;
    private _isAnimating: boolean = false;
    private _handlerMap: Map<Function, Handler<any>> = new Map();
    private readonly OPEN_DURATION: number = 0.2;
    private readonly CLOSE_DURATION: number = 0.2;
    private readonly INIT_SCALE: number = 0.5;
    private readonly TARGET_SCALE: number = 1.0;

    protected start(): void {
        this.refreshLanguage();
    }

    /** 添加弹窗遮罩 */
    private addScreenMask(): void {
        if (!this.node.getComponent(Mask) && this.isAddScreenMask) {
            const screenMask = this.node.addComponent(Mask);
            screenMask.type = Mask.Type.GRAPHICS_RECT;
        }
    }

    public inspectID(dialogViewID: string): void {
        if (this._dialogViewID != dialogViewID) {
            PackageFacade.instance.log(
                `窗口ID与注册ID不一致注册ID：${dialogViewID}，本地设置id:${this._dialogViewID}`
            );
        }
    }

    /**预制体加载完毕 这个方法会被调用*/
    public setData(data?: any): void {}

    public show(data?: any): void {
        if (this._isAnimating) return;
        this.addScreenMask();

        PackageFacade.instance.log("显示窗口ID=" + this._dialogViewID);
        if (this.content) {
            this.content.scale = new Vec3(0, 0, 0);
            if (this._moveTween) {
                this._moveTween.stop();
            }
            this._moveTween = tween(this.content)
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: easing.circOut })
                .call(() => {})
                .start();
        }
        if (this.bgMask) {
            if (this._bgMoveTween) {
                this._bgMoveTween.stop();
            }
            if (!this.bgMask.getComponent(UIOpacity)) {
                this.bgMask.addComponent(UIOpacity);
            }
            let c = this.bgMask.getComponent(UIOpacity);
            // 设置初始透明度为0
            c.opacity = 100;
            // 创建背景遮罩的缓动动画，将透明度从0变为1
            this._bgMoveTween = tween(c)
                .to(1, { opacity: 255 }) // 255 表示完全不透明，这里的取值范围根据你的需求来调整
                .start();
        }
        this.playOpenAnim();
    }

    public getDialogViewID(): ActivityDialogViewID {
        return this._dialogViewID;
    }

    public close(): void {
        if (this._isAnimating) return;
        this._isClose = true;
        ActivityDialogViewMgr.instance.closeDialog(this.getDialogViewID());
        this.playCloseAnim();
    }

    /**切换语言时这个函数会触发*/
    refreshLanguage() {}

    protected onDestroy(): void {
        if (this._bgMoveTween) {
            this._bgMoveTween.stop();
        }
        this._handlerMap.forEach((v, k) => {
            v.clear();
        });
        this._handlerMap.clear();
        if (!this._isClose) {
            //防止界面不是通过close关闭的 这里强制把界面从管理类移除
            ActivityDialogViewMgr.instance.closeDialog(this.getDialogViewID());
        }
    }

    protected playOpenAnim(): void {
        this._isAnimating = true;

        if (this.content) {
            this.content.scale = new Vec3(this.INIT_SCALE, this.INIT_SCALE, 1);

            tween(this.content)
                .to(this.OPEN_DURATION, {
                    scale: new Vec3(this.TARGET_SCALE, this.TARGET_SCALE, 1),
                })
                .call(() => {
                    this._isAnimating = false;
                    this.onShowComplete();
                })
                .start();
        } else {
            this._isAnimating = false;
        }
    }

    protected playCloseAnim(): void {
        this._isAnimating = true;

        if (this.content) {
            tween(this.content)
                .to(this.CLOSE_DURATION, { scale: new Vec3(this.INIT_SCALE, this.INIT_SCALE, 1) })
                .call(() => {
                    this._isAnimating = false;
                    this.node.active = false;
                    this.onCloseComplete();
                })
                .start();
        } else {
            this._isAnimating = false;
        }
    }

    public getHandler(callback: Function): Handler<any> {
        let h: Handler<any> = new Handler(this, callback);
        this._handlerMap.set(callback, h);
        return h;
    }

    public removeHandler(callback: Function) {
        let h: Handler<any> = this._handlerMap.get(callback);
        if (h) {
            h.clear();
            this._handlerMap.delete(callback);
        }
    }
    protected onShowComplete(): void {
        // 子类实现具体逻辑
    }

    protected onCloseComplete(): void {
        // 子类实现具体逻辑
    }

    private addTouchEvent(): void {
        const mask = this.node.getChildByName("mask");
        if (mask) {
            mask.on(Node.EventType.TOUCH_END, this.onTouchMask, this);
        }
    }

    protected onTouchMask(): void {
        this.close();
    }
}
