import { _decorator, CCInteger, Component, instantiate, Material, Node, NodePool, Prefab, sp, Sprite, Tween, tween, UITransform, Vec3 } from 'cc';
import { Symbol, SYMBOL_WILD_IDS } from './Symbol';
import { delay } from 'db://assets/common/script/extra/Utils/common';
import { SymbolType } from 'db://assets/basePlate/middleWare/enums/bet';
import { GameResourceManager, SPINE_RESOURCE_NAMES } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';

const { ccclass, property } = _decorator;

const SYMBOL_IDS = ['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008', '1009', '1010',];

@ccclass('Roll')
export class Roll extends Component {
    @property(Prefab)
    private symbolPrefab: Prefab = null;

    @property(CCInteger)
    private itemHeight: number = 163;

    @property(CCInteger)
    private itemCount: number = 5;
    
    private nodePool: NodePool = new NodePool();

    private rollTween: Tween | null = null;

    // 剑动画
    private swordAnimationNode: Node = null;

    // 游戏是否正在滚动中
    public isRolling: boolean = false;

    // 当前roll的symbol列表
    private rollList: SymbolItem[] = [];

    // 当前roll的消除数据
    private rollRemoveData: {
      rowIndex: number,
      columnIndex: number
    }[] = [];

    // 滚动结束回调
    private onRollComplete: () => void = null;

    // 消除、下坠动画数据
    private symbolAnimationData: ISymbolAnimationData[] = [];

    // 顶部首个Symbol节点y坐标
    private firstSymbolY: number = 0;

    protected onLoad(): void {
      this.initNodePool();
      this.initSymbols();
    }

    /**
     * 初始化数据
     */
    initData() {
      this.rollList = [];
      this.symbolAnimationData = [];
      this.firstSymbolY = 0;
    }

    /**
     * 设置round数据
     */
    setRoundData(rollList: SymbolItem[], rollRemoveData: {
      rowIndex: number,
      columnIndex: number
    }[]) {
      this.rollList = rollList.filter((item: any) => item !== null);
      console.log('rollList-数据', this.rollList);
      this.rollRemoveData = rollRemoveData;
    }

    /**
     * 初始化节点池
     */
    initNodePool() {
      for (let i = 0; i < this.itemCount ; i++) {
        const node = instantiate(this.symbolPrefab);
        this.nodePool.put(node);
      }
    }

    /**
     * 初始化符号
     */
    initSymbols() {
      const itemCount = this.itemCount ?? 5;
      const rollHeight = (this.itemCount - 1) * this.itemHeight;
      const firstSymbolY = rollHeight / 2 + this.itemHeight / 2;
  
      for (let i = 0; i < itemCount; i++) {
        let symbolId = this.randomSymbolId();

        // 初始化面板不随机出symbolId为3001
        if (symbolId === '3001') {
          symbolId = '1005';
        }

        const symbol = this.createSymbol(symbolId,);
        const symbolY = firstSymbolY - this.itemHeight * i;
        symbol.setPosition(0, symbolY, 0);

        this.node.addChild(symbol);
      }
    }

    /**
     * 开始滚动
     */
    startRolling() {
      if (this.isRolling) {
        return;
      }

      this.isRolling = true;

      this.startRollingAnimation();
    }

    /**
     * 开始滚动动画
     */
    startRollingAnimation() {
      const parentNode = this.node;
      const start = tween(parentNode)
        .by(0.15, { position: new Vec3(0, -this.itemHeight, 0) }, { easing: 'quadIn' })
        .call(() => this.updateNode());
      const going = tween(parentNode)
        .by(0.04, { position: new Vec3(0, -this.itemHeight, 0) }, { easing: 'quadIn' })
        .call(() => {
          this.updateNode();

          // 如果当前roll的结果列表不为空，则停止滚动
          if (this.rollList.length > 0) {
            this.stopRollingAnimation(this.rollList, this.onRollComplete);
          }
        });

      this.rollTween = tween(parentNode);
      this.rollTween.then(start).repeatForever(going).start();
    }

    /**
     * 停止滚动
     * @param onComplete 完成回调
     * @param reslutSymbols 结果符号
     */
    stopRolling(rollList: SymbolItem[], onComplete?: () => void) {
      this.rollList = rollList;
      this.onRollComplete = onComplete;
    }

    /**
     * 停止滚动动画
     */
    stopRollingAnimation(reslutSymbols: SymbolItem[] | null = null, onComplete?: () => void) {
      if (!this.isRolling) return;

      const parentNode = this.node;

      Tween.stopAllByTarget(parentNode);
      // 反转结果symbols，需要从下往上添加symbol
      const reverseReslutSymbols = reslutSymbols?.reverse();
    
      // 先向下移动20像素
      // const initialMove = tween(parentNode)
      //   .by(0.1, { position: new Vec3(0, -20, 0) }, { easing: 'quartIn' });
      const going = tween(parentNode)
        .by(0.06, { position: new Vec3(0, -this.itemHeight, 0) }, { easing: 'quintOut' })
        .call(() => this.updateNode(reverseReslutSymbols));
      const end = tween(parentNode)
        .by(0.35, { position: new Vec3(0, -this.itemHeight, 0) }, { easing: 'quintOut' })
        .call(() => { 
          this.updateNode(); 
          this.isRolling = false;

          this.firstSymbolY = this.node.children[0].position.y;

          this.removeTopExcessSymbol();

          onComplete?.();
        });

      this.rollTween = tween(parentNode);
      this.rollTween.repeat(reverseReslutSymbols.length, going).then(end).start();
    }

    /**
     * 创建或复用符号
     * @param symbolId 符号ID
     * @returns 符号节点
     */
    private createSymbol(symbolId: string, symbolType: SymbolTypeEnum = 'NORMAL', fromServer: boolean = false, isBlur: boolean = false) {
      let symbol;

      if (this.nodePool.size() > 0) {
        symbol = this.nodePool.get();
      } else {
        symbol = instantiate(this.symbolPrefab);
      }

      if(isBlur) {
        symbol.getComponent(Symbol).initBlurSymbol(symbolId, symbolType);
      } else {
        symbol.getComponent(Symbol).initSymbol(symbolId, symbolType, fromServer);
      }

      return symbol;
    }
    
    /**
     * 随机SymbolId
     * @returns 随机符号ID
     */
    randomSymbolId() {
      let index = Math.floor(SYMBOL_IDS.length * Math.random());

      if (index > 4 && Math.random() > 0.6) {
        index = Math.floor(index / 2);
      }

      return SYMBOL_IDS[index];
    }

    /**
     * 更新节点位置
     * @param resultSymbols 最终结果符号
     */
    updateNode(resultSymbols: SymbolItem[] | null = null) {
      const children = this.node.children;
      const lastIndex = children.length - 1;
      if (lastIndex <= 0) return;

      // 移除最后一个symbol
      const lastNode = children[lastIndex];
      this.nodePool.put(lastNode);
      this.node.removeChild(lastNode);

      let  resultSymbol =   resultSymbols?.shift();
      
      // 如果resultSymbols不为空，则创建symbolId，否则随机一个symbolId
      let SymbolNode = this.createSymbol(this.randomSymbolId(), 'NORMAL', false, resultSymbols?.length > 0 ? false : true);
     
      if (children.length > 0) { 
        const firstChildPos = children[0].position.clone();
          
        // 设置新的symbol位置
        SymbolNode.setPosition(0, firstChildPos.y + this.itemHeight, 0);
      
        // 插入新的symbol到顶部
        this.node.insertChild(SymbolNode, 0);

        if (resultSymbol) {
          SymbolNode.getComponent(Symbol).initSymbol(resultSymbol.symbolId, resultSymbol.symbolType, true);
        }
      }
    }

    /**
     * 初始化symbolAnimationData
     */
    initSymbolAnimationData() {
      this.symbolAnimationData = [];

      return Promise.resolve();
    }

    /**
     * 展示剑的动画
    */
    showSwordAnimation(): Promise<boolean> {
      return this.addRollSwordAnimation();
    }

    /**
     * 当前roll是否存在剑
     */
    currentRollHaveSword(): boolean {
      // 如果当前实际展示的元素已经是wild，则不展示剑
      const isAllWild = this.node.children.every(child => {
        const symbol = child.getComponent(Symbol);
        const symbolId = symbol.getSymbolId() || '';

        return symbolId === SymbolType.WILD;
      });

      if (isAllWild) {
        return false;
      }

      return this.rollList.every(item => {
        return item.symbolId === SymbolType.SWORD || item.symbolId === SymbolType.OVERLAP;
      });
    }

    /**
     * 处理是否需要展示剑,并把剑的节点返回用于储存
     */
    showSwordSymbol(): Promise<Node> {
      let hasShowSwordNode = this.currentRollHaveSword()  ;

      // 如果剑的数量等于符号数量，则展示剑,随机任意一个节点变成剑的符号
      if (hasShowSwordNode) {
        const randomIndex = Math.floor(Math.random() * this.node.children.length);
        const symbolNode = this.node.children[randomIndex];
        const symbol = symbolNode.getComponent(Symbol);
        symbol.initSymbol('4010');

        return Promise.resolve(symbolNode);
      }

      return Promise.resolve(null);
    }

    /**
     * 处理是否需要展示棒子,并把棒子的节点返回用于储存
     */
    showBowSymbol(): Promise<Node[]> {
      let showBowNode: Node[] = [];
      this.node.children.forEach((child, index) => {
        const symbol = child.getComponent(Symbol);
        const symbolId = symbol.getSymbolId() || '';

        if(symbol.currentSymbolItem) {
          if (symbol.currentSymbolItem.symbolId  === SymbolType.BOW && symbolId !== SymbolType.WILD) {
            showBowNode.push(child);
          }
        }
      });

      return Promise.resolve(showBowNode);
    }

    /**
     * 处理消除数据，将处理好的数据push到symbolAnimationData中
     */
    dealRemoveData() {
      let fallDownCount = 0;
      // 当前roll是否存在剑则把所有元素变成剑
      const haveSword = this.currentRollHaveSword();
      console.log('当前roll是否存在剑-数据', haveSword);

      for (let i = this.node.children.length - 1; i >= 0; i--) {
        const symbolNode = this.node.children[i];
        const currentSymbolObj:any = symbolNode.getComponent(Symbol)?.currentSymbolItem || null;
        // 当需要消除时，如果当前symbol
        const isNeedRemove = this.rollRemoveData.some(remove => remove.rowIndex === i);
        this.symbolAnimationData.unshift({ 
          symbolNode,
          isNeedRemove,
          fallDownCount,
          symbolId: haveSword ? SymbolType.SWORD : currentSymbolObj?.symbolId,
          symbolType: haveSword ? SymbolType.SWORD : currentSymbolObj?.symbolType,
          isPlayScatterAddTimeAnimation: false
        });

        if (isNeedRemove) {
          fallDownCount++;
        }
      }

      return Promise.resolve(this.symbolAnimationData);
    }

    /**
     * 开始闪烁动画
     */
    async startLightAnimation() {
      console.log('开始闪烁动画-数据', );

      return await Promise.all(this.rollRemoveData.map(async item => {
        const { rowIndex } = item;

        return this.node.children[rowIndex].getComponent(Symbol).startLightAnimation();
      }));
    }

    /**
     * 结束闪烁动画
     */
    async endLightAnimation() {
      return await Promise.all(this.rollRemoveData.map(async item => {
        const { rowIndex } = item;

        return this.node.children[rowIndex].getComponent(Symbol).destoryLightNode();
      }));
    }

    /**
     * 消除Smybol
     */
    removeSymbol() {
      return new Promise(resolve => {
        const removeSymbolNodeList: Node[] = [];
        console.log('this.symbolAnimationData过滤前-数据', this.symbolAnimationData.length);
        this.symbolAnimationData.forEach(item => {
          const { symbolNode, isNeedRemove } = item;
  
          // 如果symbol需要被消除，并且symbol没有金边，则将symbol添加到removeSymbolNodeList中
          if (isNeedRemove) {
            removeSymbolNodeList.push(symbolNode);
          }
        });
  
        removeSymbolNodeList.forEach((node: Node) => {
          this.nodePool.put(node);
          this.node.removeChild(node);
        });
  
        // 过滤掉需要消除的symbol,
        this.symbolAnimationData = this.symbolAnimationData.filter(item => !item.isNeedRemove);
        console.log('this.symbolAnimationData-数据', this.symbolAnimationData);

        resolve(removeSymbolNodeList.length > 0);
      });
    }

    /**
     * 添加symbol节点到顶部，添加smybol数据到顶部，用于下坠
     */
    async addNewSymbolToTop(nextRoundList: SymbolItem[]) {
      let  nextRoundNewList = nextRoundList.filter(item => (item !== null && item !== undefined));
      // nextRoundList是新一轮的数据，symbolAnimationData是当前回合的剩余数据 相减就是需要添加的数据
      const length = nextRoundNewList.length - this.symbolAnimationData.length;

      for (let i = length - 1; i >= 0; i--) {
        const { symbolId, symbolType } = nextRoundNewList[i] || {};
        const symbolNode = this.createSymbol(symbolId, symbolType, true);
        symbolNode.setPosition(0, this.firstSymbolY + this.itemHeight * (length - i - 1), 0);
        this.symbolAnimationData.unshift({
          symbolNode,
          isNeedRemove: false,
          fallDownCount: length,
          symbolId,
          symbolType,
          isPlayScatterAddTimeAnimation: false
        });
          
        this.node.insertChild(symbolNode, 0);
      }

      await delay(50);
  
      return Promise.resolve(this.symbolAnimationData);
    }

    /**
     * AnimationData中symbolNode下坠
     */
    fallDownSymbol(): Promise<boolean> {
      return new Promise(resolve => {
        // 筛选需要下坠的节点
        const fallDownItems = this.symbolAnimationData.filter(item => item.fallDownCount > 0);
  
        // 如果没有需要下坠的节点，则直接返回 false
        if (fallDownItems.length === 0) {
          resolve(false);

          return;
        }
  
        // 收集所有动画的 Promise
        const animationPromises = fallDownItems.map(item => {
          return new Promise<void>(innerResolve => {
            const { fallDownCount, symbolNode } = item;
            const wildNode = symbolNode.getComponent(Symbol)?.getWildNode();
            const targetY = symbolNode.position.y - this.itemHeight * fallDownCount;
  
            // 主节点动画
            const symbolTween = tween(symbolNode)
              .to(0.25, { position: new Vec3(0, targetY, 0) }, { easing: 'quartIn' });
  
            // 如果有 wildNode，也添加动画
            if (wildNode) {
              const wildTween = tween(wildNode)
                .to(0.25, { position: new Vec3(wildNode.position.x, targetY, 0) }, { easing: 'quartIn' });
                      
              tween(this.node)
                .parallel(symbolTween, wildTween)
                .call(() => innerResolve())
                .start();
            } else {
              symbolTween.call(() => innerResolve()).start();
            }
          });
        });
  
        // 所有动画完成后 resolve(true)
        Promise.all(animationPromises)
          .then(() => resolve(true))
          .catch(() => resolve(false));
      });
    }

    /**
     * 移除顶部多余符号
     */
    removeTopExcessSymbol() {
      const node = this.node.children[0];
      this.nodePool.put(node);
      this.node.removeChild(node);
    }

    /**
     * 添加顶部多余符号
     */
    addTopExcessSymbol() {
      if (this.node.children.length === this.itemCount - 1) {
        const node = this.nodePool.get();
        node.getComponent(Symbol).initSymbol(this.randomSymbolId());
        this.node.insertChild(node, 0);
      }
    }

    /**
     * symbol变为wild，当本回合wild会被消除时，symbol才会变成wild
     */
    async symbolChangeToWild() {
      let hasChangeWild = false;
      // 收集所有异步操作的Promise
      console.log('symbol变为wild-数据', this.symbolAnimationData);
      const promises = this.symbolAnimationData.map((item, index) => {
        const itemSymbolId = item.symbolId;
        
        if (SYMBOL_WILD_IDS.indexOf(itemSymbolId) !== -1 ) {
          hasChangeWild = true;

          return this.symbolChangeToSingleWild(index);
        }
    
        return Promise.resolve();
      });

      // 等待所有异步操作完成
      await Promise.all(promises);

      // 所有操作完成后返回
      return Promise.resolve(hasChangeWild);
    }

    /**
     * symbol变为小wild
     */
    async symbolChangeToSingleWild(index: number) {
      // 将当前symbol变为小wild
      this.node.children[index].getComponent(Symbol).changeToSingleWild();

      return Promise.resolve();
    }

    /**
     * 给当前的roll 添加剑wild
     */
    addRollSwordAnimation(): Promise<boolean> {
      return new Promise<boolean>(async (resolve) => {
        // 获取当前symbol的位置
        const originalPos = this.node.getWorldPosition().clone();
        // 创建一个动画节点，用于播放wild动画
        this.swordAnimationNode = new Node('Animation');
        this.swordAnimationNode.addComponent(UITransform);
        this.swordAnimationNode.getComponent(UITransform).setContentSize(this.node.getComponent(UITransform).contentSize);
        this.swordAnimationNode.layer = this.node.layer;
        this.swordAnimationNode.setParent(this.node.parent.parent.parent);
        this.swordAnimationNode.setWorldPosition(originalPos);
        console.log('添加剑动画节点-数据', this.swordAnimationNode.position, originalPos);
        // 播放wild动画，动画完成后删除动画，并在wildNode设置图片
        await this.playSwordAnimation(this.swordAnimationNode, 'mfl',);

        resolve(true);
      });
    }

    /**
     * 播放、动画，动画完成后删除动画，
     */
    async playSwordAnimation(aniNode: Node, animationName: string,) {
      return new Promise<void>(async (resolve) => {
        try {
          // 添加动画
          const skeleton = aniNode.getComponent(sp.Skeleton) || aniNode.addComponent(sp.Skeleton);
          skeleton.premultipliedAlpha = false;
          skeleton.skeletonData = await GameResourceManager.instance.getSpineAnimationDataByName(SPINE_RESOURCE_NAMES.MFL);
          skeleton.setAnimation(0, animationName, true);
          console.log('播放动画-数据', animationName);
          skeleton.setCompleteListener(() => {
            this.destoryWildAnimationNode();
            resolve();
          });
        } catch (error) {
          console.error('加载spine/动画失败', error);
          this.destoryWildAnimationNode();
          resolve();
        }
      });
    }

    /**
     * 销毁动画Node
     */
    destoryWildAnimationNode() {
      this.swordAnimationNode?.getComponent(sp.Skeleton)?.destroy();
      this.swordAnimationNode?.destroy();
      this.swordAnimationNode = null;
    }

    /**
     * 播放scatter增加次数动画
     */
    async playScatterAddTimeAnimation(targetPosition: Vec3) {
      const needScatterAddTimeSymbolList: Node[] = [];

      this.symbolAnimationData.forEach(item => {
        const { symbolId, symbolNode } = item;

        if (symbolId === '3002' && !item.isPlayScatterAddTimeAnimation) {
          item.isPlayScatterAddTimeAnimation = true;
          needScatterAddTimeSymbolList.push(symbolNode);
        }
      });

      await Promise.all(needScatterAddTimeSymbolList.map(item => {
        return item.getComponent(Symbol).playScatterAddTimeAnimation(targetPosition);
      }));
    }
}
