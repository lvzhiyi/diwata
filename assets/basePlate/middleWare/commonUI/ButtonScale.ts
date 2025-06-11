import { _decorator, Button, Component, NodeEventType, Vec3, tween } from 'cc';

const { ccclass } = _decorator;

@ccclass('ButtonScale')
export class ButtonScale extends Component {
  private button: Button = null;
  private readonly DEFAULT_SCALE = new Vec3(1, 1, 1);
  private readonly PRESSED_SCALE = new Vec3(1.2, 1.2, 1.2);
  private readonly ANIMATION_DURATION = 0.1;

  start() {
    this.button = this.getComponent(Button);
    if (!this.button) {
      console.warn('ButtonScale component must be attached to a node with Button component');
      return;
    }

    this.node.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(NodeEventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(NodeEventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  onDestroy() {
    this.node.off(NodeEventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(NodeEventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(NodeEventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  private onTouchStart() {
    if (this.button && this.button.interactable) {
      tween(this.node).to(this.ANIMATION_DURATION, { scale: this.PRESSED_SCALE }).start();
    }
  }

  private onTouchEnd() {
    if (this.button) {
      tween(this.node).to(this.ANIMATION_DURATION, { scale: this.DEFAULT_SCALE }).start();
    }
  }
}
