import { _decorator, Component, instantiate, Layout, Node, NodePool, Prefab, resources, SpriteFrame, UITransform, view } from 'cc';
import { DetailCard } from './DetailCard';
import { DetailListItem } from './DetailListItem';
import { getRecordDetail } from 'db://assets/basePlate/middleWare/services/user';
import { Loading } from 'db://assets/basePlate/middleWare/commonUI/Loading';
import { SYMBOL_SIZE_MAP, transformRowListToColumnList } from 'db://assets/basePlate/middleWare/services/bet';
import { app } from 'db://assets/app/app';
import { PopBetrecorddetail } from '../PopBetrecorddetail';
import { IntersectionObserver } from 'db://assets/res-native/script/IntersectionObserver';

const { ccclass, property } = _decorator;

@ccclass('RecordDetailLayout')
export class RecordDetailLayout extends Component {
  @property(Node)
  private cardScrollViewNode: Node;

  @property(Node)
  private detailCard: Node;

  @property(Node)
  private listBox: Node;

  @property(Prefab)
  private DetailItem: Prefab;

  @property(Loading)
  private LoadingScript: Loading;

  @property({
    type: SpriteFrame,
    tooltip: '空卡片图片'
  })
  public emptyCard: SpriteFrame | null = null;

  @property({
    type: [SpriteFrame],
    tooltip: '卡片图片'
  })
  public cards: SpriteFrame[] = [];

  private _isAtBottom = false;

  private _recordDetail: any;

  private id: string = '';

  /// 复用池
  private _nodePool: NodePool;

  protected onLoad(): void {
    // this.initNodePool();
    this.loadCards();

    const { width, height } = view.getDesignResolutionSize();
    let w = width;
    let h = height;

    if (w / h < window.innerWidth / window.innerHeight) {
      // 实际效果比canvas宽
      w = h * window.innerWidth / window.innerHeight;
    } else {
      // 实际效果比canvas高
      h = w * window.innerHeight / window.innerWidth;
    }

    this.createLayoutSize(w, h);

    this.setCardListNodeHeight(h);

    this.node.getComponent(Layout).updateLayout();
  }

  protected onDestroy(): void {
  }

  /**
     * 初始化节点池
     */
  initNodePool() {
    this._nodePool = new NodePool();

    for (let i = 0; i < 6; i++) {
      const RecordCardNode = instantiate(this.DetailItem);
      this._nodePool.put(RecordCardNode);
    }
  }

  loadCards() {
    resources.loadDir('icons/symbols', SpriteFrame, (err, loadedTextures) => {
      if (err) {
        console.error('加载批量图片失败:', err);

        return;
      }

      this.cards = loadedTextures;
      this.cards.push(this.emptyCard);

      this.getData(this.id);
    });
  }

  show(id: string) {
    this.LoadingScript.showLoading();
    this.id = id;
  }

  async getData(id: string) {
    const res = await getRecordDetail(id || '1876958402584887296');
    this._recordDetail = res.data;
    
    this.detailCard.getComponent(DetailCard).initValue(this._recordDetail);
    this.listBox.destroyAllChildren();
    const gameRecordList = res.data?.gameRecordList ?? [];

    if (this.LoadingScript.node.active) {
      this.LoadingScript.hideLoading();
    }

    if (!gameRecordList.length) {
      return;
    }

    // 找出每两个数据中的最大中奖线个数 
    const maxRewardLineCounts = this.findMaxRewardLineCount(gameRecordList);
    gameRecordList.forEach((element: any, index: number) => {
      const maxRewardLineCount = maxRewardLineCounts[Math.floor(index / 2)];
      const itemNode = instantiate(this.DetailItem);

      const otherList = element.wheel;

      const _otherList = transformRowListToColumnList(otherList);
      const imgSprites = _otherList.map((item: any) => {
        return item.map((spinItem: any) => {
          if (spinItem) {
            return this.mapIdToSpriteFrame(spinItem.symbolId,);
          }

          return null;
        });
      });
      // this.insertItem(element, maxRewardLineCount, imgSprites, this.cards, _otherList);
      this.listBox.addChild(itemNode);
      itemNode.getComponent(DetailListItem).initValue(element, maxRewardLineCount, imgSprites, this.cards, _otherList);
    });
    this.listBox.getComponent(UITransform).height = (gameRecordList.length / 2 + gameRecordList.length % 2) * 550;
  }

  /**
   * 复用池插入item
  */
  private insertItem(element: any, maxRewardLineCount: number, imgSprite: SpriteFrame[][], cards: SpriteFrame[], otherList: SymbolItem[][]) {
    const itemNode = new Node();
    itemNode.layer = this.listBox.parent.layer;
    const lineCount = element.rewardLineList?.length > 0 ?  element.rewardLineList?.length : 1;
    const itemHeight = lineCount * 60 + 380;
    itemNode.addComponent(UITransform).setContentSize(346, itemHeight);

    this.listBox.addChild(itemNode);
    /// 复用池加载
    itemNode.addComponent(IntersectionObserver).observe(this.listBox.parent.parent, { rootMargin: 60 }, (isIntersecting) => {
      /// 进入可视区域内
      if (isIntersecting) {
        if (itemNode.children.length === 0) {
          const node = this._nodePool.get() || instantiate(this.DetailItem);
          node.getComponent(DetailListItem).initValue(element, maxRewardLineCount, imgSprite, cards, otherList);
          itemNode.addChild(node);
        }
      } else {
        /// 移除可视区域
        if (itemNode.children.length > 0) {
          this._nodePool.put(itemNode.children[0]);
          itemNode.removeAllChildren();
        }
      }
    });
  }

  private findMaxRewardLineCount(data: any[]):number[] {
    const result: number[] = [];
  
    for (let i = 0; i < data.length; i += 2) {
      const first = data[i];
      const second = data[i + 1] !== undefined ? data[i + 1] : first;
      const maxInGroup = Math.max(first.rewardLineList.length, second.rewardLineList.length);
      result.push(maxInGroup);
    }

    return result;
  }

  /**
   * 映射 id 到渲染的SpriteFrame
   * @param id
   * @param size 大小
   * @returns
   */
  mapIdToSpriteFrame(id: string,) {
    return this.cards.find((card: SpriteFrame) => {
      return card.name === `${id}`;
    });
  }

  // 创建当前layout size
  private createLayoutSize(w: number, h: number) {
    const uiTransform = this.node.getComponent(UITransform);
    uiTransform.setContentSize(w, h);
  }

  // 设置CardList的高度
  private setCardListNodeHeight(h: number) {
    this.cardScrollViewNode.getComponent(UITransform).height = h - 132;
  }

  /**
   * 返回点击事件
  */
  public onBackClick() {
    // EventTrackManager.inst.trackExitBetRecordDetail(this.id);
    console.log('onBackClick', this.id);
    app.manager.ui.hide<PopBetrecorddetail>({ name: 'PopBetrecorddetail' });
  }
}
