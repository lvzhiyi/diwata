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

  /**
   * 动态调整Scale
   */
  private adjustScale(textContainer: Node, label: Label) {
    const parentWidth = this.REWARD_LINE_TEXT_CONTAINER_WIDTH;
    // SYMBOL图标大小+PAYS图标大小+间距+label宽度
    const textContainerWidth = 50 + 52 + 20 + label.node.getComponent(UITransform).width;

    if (textContainerWidth > parentWidth) {
      const scale = parentWidth / textContainerWidth;
      textContainer.scale = new Vec3(scale, scale, 1);
    }

    textContainer.getComponent(Layout).updateLayout();
  }

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
    this.node.getComponent(UITransform).height = maxRewardLineCount * 60 + 380;
  }

  addRewardItems(data: BetRewardLineItem[], cards: SpriteFrame[]) {
    if(!data || data.length === 0) {
      return;
    }

    data.map((itemData) => {
      const newItem = instantiate(this.RewardPrefab);
      this.rewardLineList.addChild(newItem);

      // 设置图标
      const RewardIconNode = this.findNodeByName(newItem, 'RewardIcon');

      if (RewardIconNode) {
        const tranform = RewardIconNode.getComponent(UITransform);
        tranform.setContentSize(45, 50);
        
        // 安全地获取或添加Sprite组件
        let sprite = RewardIconNode.getComponent(Sprite);

        if (!sprite) {
          sprite = RewardIconNode.addComponent(Sprite);
        }
        
        // 加载图标资源
        const findIcon = cards.find((item) => {
          return item.name.indexOf(itemData.symbolId) !== -1;
        });
        sprite.spriteFrame = findIcon;
      }

      // 设置中奖线
      const RewardIconNumNode = this.findNodeByName(newItem, 'RewardIconNumLable');

      const RewardLineType = {
        THREE: '3',
        FOUR: '4',
        FIVE: '5',
        SIX: '6',
      };

      if (RewardIconNumNode) {
        if (itemData.rewardLineCount > 0) {
          RewardIconNumNode.active = true;
          const label = RewardIconNumNode.getComponent(Label);
          label.string =
            RewardLineType[itemData.rewardLineType as keyof typeof RewardLineType] || '';
        } else {
          // 隐藏
          RewardIconNumNode.active = false;
        }
      }

      // 设置文案
      const RewardContainer = this.findNodeByName(newItem, 'RewardContainer');

      if (RewardContainer) {
        // 中奖金额
        const textNode = RewardContainer.getChildByName('PaysAmoutLable');

        if (textNode) {
          const label = textNode.getComponent(Label);
          const betNumber = MoneyUtil.formatDisplayAmount(MoneyUtil.internalToDisplay(itemData.betAmount) * itemData.odds);
          let content = `₱ ${betNumber} X ${itemData.rewardLineCount}WAYS = ₱${MoneyUtil.internalToDisplay(itemData.rewardAmount)
          }`;

          if (itemData.multiple > 1 && itemData.symbolId != '3001') {
            content = `₱ ${betNumber} X ${itemData.rewardLineCount}WAYS X ${itemData.multiple
            } = ₱ ${MoneyUtil.internalToDisplay(itemData.rewardAmount)}`;
          }

          label.string = content;
          
          // 获取容器宽度并调整字体大小
          this.scheduleOnce(() => {
            this.adjustScale(RewardContainer, label);
          }, 0.01);
        }
      }
      
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
