import { _decorator, CCInteger, Component, instantiate, Node, NodePool, Prefab, UITransform } from 'cc';
import { IntersectionObserver } from 'db://assets/res-native/script/IntersectionObserver';

const { ccclass, property } = _decorator;

@ccclass('ZmScrollView')
export class ZmScrollView extends Component {
    @property(Node)
    private content: Node;

    @property(CCInteger)
    private nodePollSize: number = 5;

    @property(Prefab)
    private itemPrefab: Prefab;

    private nodePool: NodePool = new NodePool();

    private itemWidth: number = 0;

    private itemHeight: number = 0;

    protected onLoad(): void {
      for (let i = 0; i < this.nodePollSize; i++) {
        this.nodePool.put(instantiate(this.itemPrefab));
      }

      // TODO 测试
      for (let i = 0; i < 20; i++) {
        this.addItem();
      }
    }

    /**
     * 创建一个IntersectionObserverNode
     * @returns 
     */
    private createIntersectionObserverNode() {
      const IntersectionObserverNode = new Node('IntersectionObserverNode');
      IntersectionObserverNode.layer = this.node.layer;
      IntersectionObserverNode.addComponent(UITransform).setContentSize(this.itemWidth, this.itemHeight);

      return IntersectionObserverNode;
    }

    /**
     * 添加一个Item
     */
    public addItem() {
      const itemNode = this.nodePool.get() || instantiate(this.itemPrefab);

      if (!this.itemWidth || !this.itemHeight) {
        this.itemWidth = itemNode.getComponent(UITransform).width;
        this.itemHeight = itemNode.getComponent(UITransform).height;
      }

      const intersectionObserverNode = this.createIntersectionObserverNode();
      this.content.addChild(intersectionObserverNode);

      intersectionObserverNode.addComponent(IntersectionObserver).observe(this.content.parent, { rootMargin: 100 }, (isIntersecting) => {
        if (isIntersecting) {
          const node = this.nodePool.get() || instantiate(this.itemPrefab);
          intersectionObserverNode.addChild(node);
        } else {
          this.nodePool.put(itemNode);
          intersectionObserverNode.removeAllChildren();
        }
      });
    }
}
