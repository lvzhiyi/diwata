import {
    _decorator,
    assetManager,
    Component,
    ImageAsset,
    Label,
    Node,
    Sprite,
    SpriteFrame,
    Texture2D,
} from "cc";
import { OtherGameItemData } from "db://assets/common/script/data/dataModels/OtherGameItemData";
const { ccclass, property } = _decorator;

@ccclass("OtherGameGoodsItem")
export class OtherGameGoodsItem extends Component {
    @property(Label)
    own_txt: Label = null;
    @property(Sprite)
    img: Sprite = null;
    @property(Node)
    loadfailed_node: Node = null;
    @property(Label)
    gameName_txt: Label = null;
    private _data: OtherGameItemData = null;
    start() {}

    public setData(data: OtherGameItemData): void {
        this.loadfailed_node.active = false;
        this._data = data;
        this.own_txt.string = this._data.totalCount + "";
        this.gameName_txt.string = this._data.gameName;
        this.setImgUrl(this._data.imgUrl);
    }
    public getData(): OtherGameItemData {
        return this._data;
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
