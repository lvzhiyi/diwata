import { _decorator, Button, Component, Node, sp, tween, UIOpacity } from 'cc';
import { app } from 'db://assets/app/app';

const { ccclass, property } = _decorator;

@ccclass('AutoModeBtn')
export class AutoModeBtn extends Component {
    @property(sp.Skeleton)
    private spine: sp.Skeleton | null = null;

    @property(Node)
    private tipsNode: Node | null = null;

    private timer: any = null;

    private touchStartTime = 0;

    protected onLoad(): void {
      this.show();

      this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
      this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    protected update(dt: number): void {
      if (this.touchStartTime > 0 && Date.now() - this.touchStartTime > 1500) {
        // 长按1.5秒打开自动模式设置弹窗
        if (app.manager.global.isGoing === false && !app.manager.global.isFreespinMode && !app.manager.global.allwaysAutoPlay) {
          app.manager.ui.show({ name: 'PopAutosetting' });
          this.touchStartTime = 0;
        }
      }
        
      if (app.manager.global.isGoing && this.spine.node.active && this.tipsNode.active) {
        // 游戏进行中，隐藏按钮
        this.spine.node.active = false;
        this.tipsNode.active = false;
      } else if (!app.manager.global.isGoing && !app.manager.global.allwaysAutoPlay && !app.manager.global.startAutoPlay && !this.spine.node.active && !this.tipsNode.active)   {
        // 游戏未进行中，显示按钮
        this.spine.node.active = true;
        this.tipsNode.active = true;
      }
    }

    onTouchStart() {
      this.touchStartTime = Date.now();
    }

    onTouchEnd() {
      if (this.touchStartTime > 0 ) {
        this.touchStartTime = 0;

        // 点击按钮执行自动游戏
        if (this.getComponent(Button).interactable) {
          app.manager.event.emit('clickAllwaysAutoPlay');
        }
      }
    }
    
    show() {
      this.showSpineAnimation();
      this.timer = setTimeout(() => {
        this.hide();
      }, 3000);
    }

    hide() {
      this.hideSpineAnimation();
      this.timer = setTimeout(() => {
        this.show();
      }, 5000);
    }

    showSpineAnimation() {
      tween(this.spine.getComponent(UIOpacity)).to(0.5, { opacity: 255 }).start();
      tween(this.tipsNode.getComponent(UIOpacity)).to(0.5, { opacity: 255 }).start();
    }

    hideSpineAnimation() {
      tween(this.spine.getComponent(UIOpacity)).to(0.5, { opacity: 0 }).start();
      tween(this.tipsNode.getComponent(UIOpacity)).to(0.5, { opacity: 0 }).start();
    }

    protected onDestroy(): void {
      if (this.timer) {
        clearTimeout(this.timer);
      }
    }
}
