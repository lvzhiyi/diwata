import {
    _decorator,
    assetManager,
    Component,
    ImageAsset,
    Node,
    sp,
    Sprite,
    SpriteFrame,
    Texture2D,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("CardEeffct")
export class CardEeffct extends Component {
    @property(Sprite)
    img: Sprite = null;
    @property(Node)
    loadfailed_node: Node = null;

    @property(sp.Skeleton)
    bgEeffct: sp.Skeleton = null;
    @property(sp.Skeleton)
    cardEeffct: sp.Skeleton = null;
    private _isStart: boolean = false;
    private _url: string = "";
    start() {
        this._isStart = true;
        if (this._url) {
            this.setImgUrl(this._url);
        }
    }
    public showEeffct(): void {
        this.bgEeffct.node.active = true;
        this.cardEeffct.node.active = true;
    }
    public setUrl(url: string): void {
        this._url = url;
        if (this._isStart) {
            this.setImgUrl(this._url);
        }
    }
    
    update(deltaTime: number) {}
    //远程加载图片显示出来
    private setImgUrl(url: string): void {
        if (!url) {
            return;
        }
        // 设置crossOrigin属性以支持跨域加载
        assetManager.loadRemote<ImageAsset>(url, { ext: ".png" }, (err, imageAsset: ImageAsset) => {
            if (err) {
                console.error("Load remote image failed:", err);
                if (this.loadfailed_node && this.loadfailed_node.isValid) {
                    this.loadfailed_node.active = true;
                }
                return;
            }

            // 检查组件是否有效
            if (!this.img || !this.img.isValid) {
                return;
            }

            // 从 ImageAsset 创建 SpriteFrame
            const spriteFrame = new SpriteFrame();
            const texture = new Texture2D();
            texture.image = imageAsset;
            spriteFrame.texture = texture;

            // 设置到 Sprite 组件
            this.img.spriteFrame = spriteFrame;
        });
    }
}
