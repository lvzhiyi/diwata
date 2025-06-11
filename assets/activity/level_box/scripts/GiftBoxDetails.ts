import {
    _decorator,
    Component,
    instantiate,
    Node,
    Prefab,
    Size,
    sp,
    Sprite,
    SpriteFrame,
    UITransform,
    Vec3,
} from "cc";
import { GiftBoxItemData } from "db://assets/common/script/data/dataModels/GiftBoxItemData";
import { GiftBoxGoodsItem } from "./GiftBoxGoodsItem";
import { DataReportMgr } from "db://assets/common/script/managers/DataReportMgr";
import { DataReporEvents } from "db://assets/common/script/data/dataModels/DataReporEvents";
const { ccclass, property } = _decorator;

@ccclass("GiftBoxDetails")
export class GiftBoxDetails extends Component {
    @property(SpriteFrame)
    vipSpriteFrames: Array<SpriteFrame> = [];
    @property(Sprite)
    vipSprite: Sprite = null;
    @property(sp.Skeleton)
    boxAni: sp.Skeleton = null;
    @property(Node)
    goodsNode: Node = null;
    @property(Prefab)
    goodsItemDetailsPrefab: Prefab = null;
    @property(Prefab)
    goodsItemPrefab: Prefab = null;
    private _data: GiftBoxItemData = null;
    start() {}

    public open(data: GiftBoxItemData) {
        this.node.active = true;
        this._data = data;
        this.updataUI();

        let reward_options = [];
        for (let i = 0; i < this._data.rewards.length; i++) {
            const element = this._data.rewards[i];
            reward_options.push(JSON.stringify(element));
        }

        let eventData = {
            vip_level: `VIP${this._data.vipLevel}`,
            chest_id: this._data.treasureId,
            reward_options: reward_options,
        }
        DataReportMgr.instance.track(DataReporEvents.ViewWinMoreRewardPreview,eventData);
    }
    private updataUI(): void {
        if (!this._data) {
            return;
        }
        this.vipSprite.spriteFrame = this.vipSpriteFrames[this._data.vipLevel - 1];
        this.boxAni.setSkin("chest" + this._data.vipLevel);
        this.boxAni.setAnimation(0, "idle", true);
        this.goodsNode.children.forEach((item) => {
            item.destroy();
        });
        this._data.rewards.forEach((item) => {
            let goodsItem: GiftBoxGoodsItem = instantiate(this.goodsItemPrefab).getComponent(
                GiftBoxGoodsItem
            );
            goodsItem.node.setScale(0.774, 0.774);
            goodsItem.getComponent(UITransform).setContentSize(new Size(132 * 0.774, 166 * 0.774));
            //设置宽高
            goodsItem.setData(item, true, true);
            this.goodsNode.addChild(goodsItem.node);
        });
    }
    public close(): void {
        if (this._data && this.node.active) {
            let eventData = {
                chest_id: this._data.treasureId,
                vip_level: `VIP${this._data.vipLevel}`,
                reward_options: this._data.rewards.map((item) => JSON.stringify(item)),
            }
            DataReportMgr.instance.track(DataReporEvents.ExitWinMoreRewardPreview,eventData);
        }
        this.node.active = false;
    }

    protected onDestroy(): void {

    }
}
