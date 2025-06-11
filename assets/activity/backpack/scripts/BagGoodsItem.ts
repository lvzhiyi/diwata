import {
    _decorator,
    assetManager,
    Component,
    ImageAsset,
    Label,
    Node,
    sp,
    Sprite,
    SpriteFrame,
    Texture2D,
} from "cc";
import { GoodsItemData } from "db://assets/common/script/data/dataModels/GoodsItemData";
const { ccclass, property } = _decorator;

@ccclass("BagGoodsItem")
export class BagGoodsItem extends Component {
    @property(Sprite)
    img: Sprite;
    @property(Node)
    loadfailed_node: Node;
    private _data: GoodsItemData = null;
    private _isStart: boolean = false;
    start() {
        this._isStart = true;
        this.updataUI();
    }

    update(deltaTime: number) {}
    public setData(data: GoodsItemData): void {
        this._data = data;
        this.loadfailed_node.active = false;
        this.updataUI();
    }
    public getData(): GoodsItemData {
        return this._data;
    }
    private updataUI(): void {
        if (!this._isStart) {
            return;
        }
        this.setImgUrl(this._data.imgUrl);
    }
    //远程加载图片显示出来
    private setImgUrl(url: string): void {
        this.img.spriteFrame = null;
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
