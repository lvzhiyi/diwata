import {
  _decorator,
  Component,
  Node,
  Label,
  Prefab,
  instantiate,
  Sprite,
  Layout,
  UITransform,
  SpriteFrame,
  Vec3,
  Vec2,
} from 'cc';
import { MoneyUtil } from 'db://assets/basePlate/core/baseUtil/MoneyUtil';
import { BetRewardLineItem } from 'db://assets/basePlate/middleWare/services/bet';
import { RecordItemCard } from './RecordItemCard';
import { RewardLine } from './RewardLine';

const { ccclass, property } = _decorator;

@ccclass('DetailListItem')
export class DetailListItem extends Component {
  @property(Label)
  private title: Label = null;

  @property(Label)
  private win: Label = null;

  @property(Label)
  private odd: Label = null;

  @property(Node)
  private imageBox: Node;

  @property(Prefab)
  private Col: Prefab;

  @property(Prefab)
  private ItemCard: Prefab;

  @property(Prefab)
  private rowItemCard: Prefab;

  @property({
    type: Prefab,
    tooltip: '中奖线',
  })
  private RewardPrefab: Prefab;

  @property({
    type: Node,
    tooltip: '中奖线列表容器',
  })
  private rewardLineList: Node;

  private readonly REWARD_LINE_TEXT_CONTAINER_WIDTH = 304;

  public initValue(item: any, maxRewardLineCount: number, imgSprite: SpriteFrame[][], cards: SpriteFrame[], otherList: SymbolItem[][]) {
    this.title.string = item.freeWheelFlag ? 'Free Game' : 'Main Game';
    this.win.string = `Win:₱ ${MoneyUtil.internalToDisplayAndFormat(item.rewardAmount)}`;
    this.odd.string = `${item.multiple || 1}X`;

    if (imgSprite) {
      // 过滤掉null值的二维数组
      const boxList = imgSprite.map(row => row.filter(item => item !== null));

      for (let i = 0; i < boxList.length; i++) {
        const _col = instantiate(this.Col);

        for (let j = 0; j < boxList[i].length; j++) {
          const element = boxList[i][j];
      
          if (element) {
            const _itemCard = instantiate(this.ItemCard);
            
            // 安全地获取或添加Sprite组件
            let sprite = _itemCard.getComponent(Sprite);

            if (!sprite) {
              sprite = _itemCard.addComponent(Sprite);
            }

            sprite.spriteFrame = element;

            // _itemCard.getComponent(UITransform).width = 52;
            _col.addChild(_itemCard);
          }
        }

        _col.getComponent(Layout).updateLayout();
        this.imageBox.addChild(_col);
      }

      this.imageBox.getComponent(Layout).updateLayout();
    }
    
    // 中奖线
   
    this.rewardLineList.getComponent(UITransform).height = maxRewardLineCount * 60 + 10;
    this.addRewardItems(item.rewardLineList, cards);
    // this.node.getComponent(UITransform).height = maxRewardLineCount * 60 + 380;
  }

  addRewardItems(data: BetRewardLineItem[], cards: SpriteFrame[]) {
    if(!data || data.length === 0) {
      return;
    }

    data.map((itemData) => {
      const newItem = instantiate(this.RewardPrefab);
      this.rewardLineList.addChild(newItem);
      const  rewardLineItem = newItem.getComponent(RewardLine);
        
      // 加载图标资源
      const findIcon = cards.find((item) => {
        return item.name.indexOf(itemData.symbolId) !== -1;
      });

      rewardLineItem.initValue(itemData, findIcon);
      
      return newItem;
    });
  }

  /**
   * 递归查找节点
   */
  findNodeByName(node: Node, name: string): Node | null {
    // 检查当前节点
    if (node.name === name) {
      return node;
    }

    // 遍历子节点
    for (const child of node.children) {
      const foundNode = this.findNodeByName(child, name);

      if (foundNode) {
        return foundNode;
      }
    }

    return null;
  }
}
