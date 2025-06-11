import { _decorator, Color, Component, Node, Sprite, Vec2, Vec3 } from "cc";
const { ccclass, property } = _decorator;

@ccclass("ActivitySmallLoadingUI")
export class ActivitySmallLoadingUI extends Component {
    @property(Node)
    icon: Node;
    private _uiRotation: number = 0;
    private _isHide: boolean = false;
    start() {}
    update(deltaTime: number) {
        this._uiRotation += 10;
        this.icon.angle = -this._uiRotation;
    }
    public setColor(hexColor: string): void {
        let color = new Color();
        Color.fromHEX(color, hexColor);
        this.node.getChildByPath("loading_icon").getComponent(Sprite).color = color;
    }
    public show(position: Vec3 = null): void {
        this.node.active = true;
        this._isHide = false;
        if (position) {
            this.node.setPosition(position);
        }
    }
    public hide(): void {
        if (this.node && this.node.isValid) {
            this.node.active = false;
            this._isHide = true;
        }
    }
}
