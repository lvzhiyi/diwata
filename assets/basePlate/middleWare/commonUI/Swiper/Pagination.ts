import { _decorator, CCFloat, CCInteger, Component, Layout, Node, Sprite, SpriteFrame, UITransform } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('Pagination')
export class Pagination extends Component {
    @property(SpriteFrame)
    activeSpriteFrame: SpriteFrame = null;

    @property(SpriteFrame)
    inactiveSpriteFrame: SpriteFrame = null;

    currentIndex: number = 0;

    public init(count: number, defaultIndex: number) {
      this.currentIndex = defaultIndex;

      for (let i = 0; i < count; i++) {
        const item = new Node();
        item.layer = this.node.layer;
        item.addComponent(Sprite).spriteFrame = i === defaultIndex ? this.activeSpriteFrame : this.inactiveSpriteFrame;
        this.node.addChild(item);
      }
    }

    public setActive(i: number) {
      if (i === this.currentIndex) return;

      this.currentIndex = i;
      this.node.children.forEach((child, index) => {
        child.getComponent(Sprite).spriteFrame = this.currentIndex === index ? this.activeSpriteFrame : this.inactiveSpriteFrame;
      });
    }
}
