import {
    _decorator,
    assetManager,
    Component,
    ImageAsset,
    instantiate,
    Label,
    Node,
    Prefab,
    Sprite,
    SpriteFrame,
    Texture2D,
} from "cc";
import { GiftBoxReward } from "db://assets/common/script/data/dataModels/GiftBoxItemData";
import { ActivityDialogViewMgr } from "db://assets/common/script/DialogView/ActivityDialogViewMgr";
import { ActivityDialogViewID } from "db://assets/common/script/DialogView/ActivityDialogViewID";
const { ccclass, property } = _decorator;

@ccclass("GiftBoxGoodsItem")
export class GiftBoxGoodsItem extends Component {
    @property(Sprite)
    img: Sprite;
    @property(Label)
    countLabel: Label = null;
    @property(Node)
    loadfailed_node: Node = null;
    private _data: GiftBoxReward = null;
    private _isStart: boolean = false;
    private _isShowDetails: boolean = false; //点击是否显示物品详情
    private _isShowCount: boolean = false; //是否显示数量
    start() {
        this._isStart = true;
        this.updataUI();
    }

    update(deltaTime: number) {}
    onClick(): void {
        if (this._isShowDetails) {
            this.openGoodsDetails();
        }
    }
    public setData(
        data: GiftBoxReward,
        isShowDetails: boolean = true,
        isShowCount: boolean = false
    ): void {
        this._data = data;
        this.loadfailed_node.active = false;
        this._isShowDetails = isShowDetails;
        this._isShowCount = isShowCount;
        this.updataUI();
    }
    public getData(): GiftBoxReward {
        return this._data;
    }
    private updataUI(): void {
        if (!this._isStart) {
            return;
        }
        this.setImgUrl(this._data.imgUrl);
        if (this._isShowCount) {
            this.countLabel.string = "x" + this._data.count;
        } else {
            this.countLabel.string = "";
        }
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
    private openGoodsDetails(): void {
        ActivityDialogViewMgr.instance.openDialog(
            ActivityDialogViewID.giftBoxGoodsDetails,
            this._data
        );
    }
}
