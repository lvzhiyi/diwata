import { _decorator, Component, Node, sp, Sprite, SpriteFrame, UITransform } from 'cc';
import { loadResource } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';

const { ccclass, property } = _decorator;

@ccclass('Symbol')
export class Symbol extends Component {
    @property(Node)
    private iconNode: Node = null;
    
    @property({ type: [SpriteFrame], tooltip: 'symbol icon' })
    private symbolIcons: SpriteFrame[] = [];

    @property({ type: SpriteFrame, tooltip: 'gold side icon' })
    private goldSideIcon: SpriteFrame = null;

    private mapSymbols: Map<string, SpriteFrame> = new Map();

    private parentNode: Node;

    // wild Node
    private wildNode: Node = null;

    // 金边
    private goldSideNode: Node = null;

    // 闪烁
    private lightNode: Node = null;

    protected onLoad(): void {
      this.parentNode = this.node.parent;

      this.initSprites();
    }

    initSprites() {
      this.symbolIcons.forEach((spriteFrame) => {
        this.mapSymbols.set(spriteFrame.name, spriteFrame);
      });
    }

    initSymbol(symbolId: string, isGoldSide: boolean = false) {
      if (this.mapSymbols.size === 0) {
        this.initSprites();
      }

      this.iconNode.getComponent(Sprite).spriteFrame = this.mapSymbols.get(`${symbolId}`);

      if (isGoldSide) {
        this.addGoldSide();
      }
    }

    /**
     * 添加金边
     */
    async addGoldSide() {
      if (this.goldSideNode) {    
        return;
      }

      this.goldSideNode = new Node('GoldSide');
      this.goldSideNode.layer = this.node.layer;
      this.node.addChild(this.goldSideNode);
      // const skeleton = this.goldSideNode.addComponent(sp.Skeleton);
      // skeleton.skeletonData = await loadResource('load', 'commonBundle', 'skin-high/spine/use_shangmian', sp.SkeletonData);
      // skeleton.setAnimation(0, '1_star', true);
      const sprite = this.goldSideNode.addComponent(Sprite);
      sprite.spriteFrame = this.goldSideIcon;
    }

    /**
     * 变为小wild，symbol变为空，创建一个wild节点，wild节点位于wheel节点中，将wild覆盖在symbol之上
     */
    changeToSingleWild() {
      if (this.wildNode) {
        // 如果wildNode存在，则不进行操作
        return;
      }

      // 获取当前symbol的位置
      const originalPos = this.node.getWorldPosition().clone();
      // 创建一个wild节点，将wild覆盖在symbol之上
      this.wildNode = new Node('SmallWild');
      this.wildNode.layer = this.node.layer;
      this.wildNode.setParent(this.parentNode.parent);
      this.wildNode.setWorldPosition(originalPos);
      this.wildNode.addComponent(Sprite).spriteFrame = this.mapSymbols.get('4001');

      // 变成wild后
      // 将当前symbol变为空
      this.initSymbol('');
      // 销毁金边
      this.destoryGoldSideNode();
    }

    /**
     * 变为大wild
     */
    changeToBigWild(leftNodeScript: Symbol, centerNodeScript: Symbol, rightNodeScript: Symbol) {
      if (this.wildNode) {
        // 如果wildNode存在，则不进行操作
        return;
      }
          
      // 隐藏左中右三个symbol
      leftNodeScript.initSymbol('');
      centerNodeScript.initSymbol('');
      rightNodeScript.initSymbol('');

      // 显示大wild
      // 获取当前symbol的位置
      const originalPos = centerNodeScript.node.getWorldPosition().clone();
      // 创建一个wild节点，将wild覆盖在symbol之上
      this.wildNode = new Node('BigWild');
      this.wildNode.layer = this.node.layer;
      this.wildNode.setParent(this.parentNode.parent);
      this.wildNode.setWorldPosition(originalPos);
      this.wildNode.addComponent(Sprite).spriteFrame = this.mapSymbols.get('4006');

      // 销毁金边
      if (leftNodeScript.goldSideNode) {
        leftNodeScript.goldSideNode.destroy();
      }
      if (centerNodeScript.goldSideNode) {
        centerNodeScript.goldSideNode.destroy();
      }
      if (rightNodeScript.goldSideNode) {
        rightNodeScript.goldSideNode.destroy();
      }
    }

    /**
     * 变为super wild
     */
    changeToSuperWild() {
      const originalPos = this.node.getWorldPosition().clone();
      const symbolHeight = this.node.getComponent(UITransform).contentSize.height;
      originalPos.y += symbolHeight / 2;
      
      this.wildNode = new Node('SuperWild');
      this.wildNode.layer = this.node.layer;
      this.wildNode.setParent(this.parentNode.parent);
      this.wildNode.setWorldPosition(originalPos);
      this.wildNode.addComponent(Sprite).spriteFrame = this.mapSymbols.get('4007');
    }

    /**
     * 获取wild节点，如果存在则返回，否则返回null
     */
    getWildNode() {
      return this.wildNode;
    }

    /**
     * 开始闪烁动画
     */
    async startLightAnimation() {
      if (this.lightNode) {
        return;
      }

      this.lightNode = new Node('Light');
      this.lightNode.layer = this.node.layer;
      this.lightNode.setParent(this.parentNode.parent);
      this.lightNode.setScale(0.15, 0.15, 0.15);
      this.lightNode.setWorldPosition(this.node.getWorldPosition());
      const skeleton = this.lightNode.getComponent(sp.Skeleton) || this.lightNode.addComponent(sp.Skeleton);
      skeleton.skeletonData = await loadResource('load', 'resources', 'spine/mfl', sp.SkeletonData);
      skeleton.setAnimation(0, 'mfl', true);
    }

    /**
     * 销毁wildNode
     */
    destoryWildNode() {
      if (this.wildNode) {
        this.wildNode.removeFromParent();
        this.wildNode = null;
      }
    }

    /**
     * 销毁金边Node
     */
    destoryGoldSideNode() {
      if (this.goldSideNode) {
        this.goldSideNode.destroy();
        this.goldSideNode = null;

        this.destoryLightNode();
      }
    }

    /** 
     * 销毁闪烁Node
     */
    destoryLightNode() {
      if (this.lightNode) {
        this.lightNode.destroy();
        this.lightNode = null;
      }
    }

    /**
     * symbol销毁时，同时销毁变成的 wild
     */
    protected onDisable(): void {
      this.destoryWildNode();
      this.destoryGoldSideNode();
      this.destoryLightNode();
    }
}
