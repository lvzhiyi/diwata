import { _decorator, Component, Node, UITransform, view } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('NavBar')
export class NavBar extends Component {
  protected onLoad(): void {
    const { width, height } = view.getDesignResolutionSize();
    let w = width;
    let h = height;

    if (w / h < window.innerWidth / window.innerHeight) {
      w = h * window.innerWidth / window.innerHeight;
    }

    this.node.getComponent(UITransform).width = w;
  }
}
