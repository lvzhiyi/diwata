import { _decorator, Component, Label, Node, Sprite, SpriteFrame } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('SymbolBox')
export class SymbolBox extends Component {
    @property(Node)
    private SymbolIconNode: Node = null;

    @property(Node)
    private Value1Node: Node = null;

    @property(Node)
    private Value2Node: Node = null;

    @property(Node)
    private Value3Node: Node = null;

    @property(Node)
    private Value4Node: Node = null;

    @property(Node)
    private bgViewImageNode: Node = null;

    @property(SpriteFrame)
    private bgViewImageFrames: SpriteFrame[] = [];

    init(obj: { icon: SpriteFrame, value1: number, value2: number, value3: number, value4: number, border: number}) {
      this.SymbolIconNode.getComponent(Sprite).spriteFrame = obj.icon;
      this.Value1Node.getComponent(Label).string = `3 x ${obj.value1}`;
      this.Value2Node.getComponent(Label).string = `4 x ${obj.value2}`;
      this.Value3Node.getComponent(Label).string = `5 x ${obj.value3}`;
      this.Value4Node.getComponent(Label).string = `6 x ${obj.value4}`;
      this.bgViewImageNode.getComponent(Sprite).spriteFrame = this.bgViewImageFrames[obj.border];
    }
}
