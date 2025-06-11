import { _decorator, Component, Label, Node, Sprite, SpriteFrame, UITransform } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ButtonItem')
export class ButtonItem extends Component {
    @property(Node)
    private IconNode: Node = null;
    
    @property(Node)
    private DesIcon: Node = null;

    init(obj: { icon: SpriteFrame, value: string, height:number}) {
      this.IconNode.getComponent(Sprite).spriteFrame = obj.icon;
      this.DesIcon.getComponent(Label).string = obj.value;
      this.node.getComponent(UITransform).height = obj.height;

      if(obj.height <= 150) {
        this.DesIcon.getComponent(UITransform).setContentSize(78, 78);
      } else {
        this.DesIcon.getComponent(UITransform).setContentSize(104, 104);
      }
    }
}
