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

    init(obj: { icon: SpriteFrame, value1: number, value2: number, value3: number }) {
      this.SymbolIconNode.getComponent(Sprite).spriteFrame = obj.icon;
      this.Value1Node.getComponent(Label).string = `3x${obj.value1}`;
      this.Value2Node.getComponent(Label).string = `4x${obj.value2}`;
      this.Value3Node.getComponent(Label).string = `5x${obj.value3}`;
    }
}
