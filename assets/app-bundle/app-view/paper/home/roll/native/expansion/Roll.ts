import { _decorator, CCInteger, Component, instantiate, Node, NodePool, Prefab, Tween, tween, Vec3 } from 'cc';
import { Symbol } from './Symbol';
import { delay } from 'db://assets/common/script/extra/Utils/common';

const { ccclass, property } = _decorator;

const SYMBOL_IDS = ['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008', '3001'];

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
    private symbolAnimationData: { 
        // symbol节点
        symbolNode: any, 
        // 是否需要消除
        isNeedRemove: boolean, 
        // 下坠次数
        fallDownCount: number, 
        // 符号ID
        symbolId: string, 
        // 是否需要金边
        symbolGoldBorder: boolean 
    }[] = [];

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
      console.log('rollList', rollList);
      this.rollList = rollList;
      this.rollRemoveData = rollRemoveData;
    }

    /**
     * 初始化节点池
     */
    initNodePool() {
      for (let i = 0; i < 10; i++) {
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

        const symbol = this.createSymbol(symbolId);
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
        .by(0.25, { position: new Vec3(0, -this.itemHeight, 0) }, { easing: 'quartIn' })
        .call(() => this.updateNode());
      const going = tween(parentNode)
        .by(0.05, { position: new Vec3(0, -this.itemHeight, 0) })
        .call(() => {
          this.updateNode();

          // 如果当前roll的结果列表不为空，则停止滚动
          if (this.rollList.length > 0) {
            this.stopRollingAnimation(this.rollList, this.onRollComplete);
          }
        });

      this.rollTween = tween(parentNode);
      this.rollTween.then(start).repeatForever(going).start();

      // 最外层小wild跟随滚动
      this.wildFollowRolling();
    }

    /**
     * 最外层小wild跟随滚动
     */
    wildFollowRolling() {
      this.node.children.forEach(child => {
        const wildNode = child.getComponent(Symbol)?.getWildNode();

        if (wildNode) {
          const start = tween(wildNode)
            .by(0.25, { position: new Vec3(0, -this.itemHeight, 0) }, { easing: 'quartIn' });
          const going = tween(wildNode)
            .by(0.05, { position: new Vec3(0, -this.itemHeight, 0) });
          tween(wildNode).then(start).repeatForever(going).start();
        }
      });
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

      const going = tween(parentNode)
        .by(0.05, { position: new Vec3(0, -this.itemHeight, 0) })
        .call(() => this.updateNode(reverseReslutSymbols));
      const end = tween(parentNode)
        .by(0.25, { position: new Vec3(0, -this.itemHeight, 0) }, { easing: 'bounceOut' })
        .call(() => { 
          this.updateNode(); 
          this.isRolling = false;

          this.firstSymbolY = this.node.children[0].position.y;

          this.removeTopExcessSymbol();

          onComplete?.();
        });

      this.rollTween = tween(parentNode);
      this.rollTween.repeat(this.itemCount - 1, going).then(end).start();
    }

    /**
     * 创建或复用符号
     * @param symbolId 符号ID
     * @returns 符号节点
     */
    private createSymbol(symbolId: string, symbolGoldBorder: boolean = false) {
      let symbol;

      if (this.nodePool.size() > 0) {
        symbol = this.nodePool.get();
      } else {
        symbol = instantiate(this.symbolPrefab);
      }

      symbol.getComponent(Symbol).initSymbol(symbolId, symbolGoldBorder);

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

      // 如果resultSymbols为空，则再往前进行一次shift
      if(resultSymbol == null && resultSymbols?.length > 0){
        resultSymbol = resultSymbols?.shift();
      }

      // 如果resultSymbols不为空，则创建symbolId，否则随机一个symbolId
      let SymbolNode = this.createSymbol(this.randomSymbolId());

      if (children.length > 0) { 
        const firstChildPos = children[0].position.clone();
          
        // 设置新的symbol位置
        SymbolNode.setPosition(0, firstChildPos.y + this.itemHeight, 0);
      
        // 插入新的symbol到顶部
        this.node.insertChild(SymbolNode, 0);

        if (resultSymbol) {
          SymbolNode.getComponent(Symbol).initSymbol(resultSymbol.symbolId, resultSymbol.symbolGoldBorder);
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
     * 处理消除数据，将处理好的数据push到symbolAnimationData中
     */
    dealRemoveData() {
      let fallDownCount = 0;

      for (let i = this.node.children.length - 1; i >= 0; i--) {
        const symbolNode = this.node.children[i];
        const currentSymbolObj = this.rollList[i];
        // 当需要消除时，如果当前symbol没有金边，则需要消除
        const isNeedRemove = this.rollRemoveData.some(remove => remove.rowIndex === i && !currentSymbolObj?.symbolGoldBorder);
        this.symbolAnimationData.unshift({ 
          symbolNode,
          isNeedRemove,
          fallDownCount,
          symbolId: currentSymbolObj?.symbolId,
          symbolGoldBorder: currentSymbolObj?.symbolGoldBorder
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
    startLightAnimation() {
      return new Promise(resolve => {
        this.rollRemoveData.forEach(item => {
          const { rowIndex } = item;
          this.node.children[rowIndex].getComponent(Symbol).startLightAnimation();
        });

        resolve(this.rollRemoveData.length > 0);
      });
    }

    /**
     * 结束闪烁动画
     */
    endLightAnimation() {
      this.rollRemoveData.forEach(item => {
        const { rowIndex } = item;
        this.node.children[rowIndex].getComponent(Symbol).destoryLightNode();
      });
    }

    /**
     * 消除Smybol
     */
    removeSymbol() {
      return new Promise(resolve => {
        const removeSymbolNodeList: Node[] = [];

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

        resolve(removeSymbolNodeList.length > 0);
      });
    }

    /**
     * 添加symbol节点到顶部，添加smybol数据到顶部，用于下坠
     */
    async addNewSymbolToTop(nextRoundList: SymbolItem[]) {
      const length = nextRoundList.length - this.symbolAnimationData.length;
  
      for (let i = length - 1; i >= 0; i--) {
        const { symbolId, symbolGoldBorder } = nextRoundList[i] || {};
        let newSymbolId = symbolId;

        // 如果symbolId为super wild，则随机一个symbolId
        if (symbolId && symbolId !== '4007') {
          newSymbolId = symbolId;
        } else {
          newSymbolId = this.randomSymbolId();
        }

        const symbolNode = this.createSymbol(newSymbolId, symbolGoldBorder);
        symbolNode.setPosition(0, this.firstSymbolY + this.itemHeight * (length - i - 1), 0);
        this.symbolAnimationData.unshift({
          symbolNode,
          isNeedRemove: false,
          fallDownCount: length,
          symbolId,
          symbolGoldBorder
        });
          
        symbolNode.setPosition(0, this.firstSymbolY + this.itemHeight * (length - i - 1), 0);
          
        this.node.insertChild(symbolNode, 0);
      }
  
      console.log('消除后的消除数据', this.symbolAnimationData);

      await delay(50);
  
      return Promise.resolve();
    }

    /**
     * AnimationData中symbolNode下坠
     */
    fallDownSymbol(): Promise<boolean> {
      console.log('开始下坠', this.symbolAnimationData);
  
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
      const promises = this.symbolAnimationData.map((item, index) => {
        if (item.symbolId === '4001') {
          hasChangeWild = true;

          return this.symbolChangeToSingleWild(index);
        }

        if (item.symbolId === '4006') {
          hasChangeWild = true;

          return this.symbolChangeToBigWild(index);
        }

        if (item.symbolId === '4007') {
          hasChangeWild = true;

          return this.symbolChangeToSuperWild();
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
     * 注意，这里需要将中间的三个roll传入进来，因为在setSiblingIndex后，roll的顺序会变化，在roll内部没法根据this.parent.children来准确获取中间三个roll
     * 
     * symbol变为大wild，大wild占三格，只会显示在第二、三、四格内
     */ 
    async symbolChangeToBigWild(index: number) {
      const rollNodes = this.node.parent.children;
      const leftNodeScript = rollNodes[1].children[index].getComponent(Symbol);
      const centerNodeScript = rollNodes[2].children[index].getComponent(Symbol);
      const rightNodeScript = rollNodes[3].children[index].getComponent(Symbol);

      // 销毁金边
      this.node.children[index].getComponent(Symbol).changeToBigWild(leftNodeScript, centerNodeScript, rightNodeScript);

      return Promise.resolve();
    }

    /**
     * symbol变为super wild
     */
    async symbolChangeToSuperWild() {
      const centerRoll = this.node.parent.parent.children[2];
      centerRoll.children[2].getComponent(Symbol).changeToSuperWild();

      return Promise.resolve();
    }

    /**
     * 添加金边
     */
    async symbolAddGoldSide() {
      this.symbolAnimationData.forEach(item => {
        if (item.symbolGoldBorder) {
          item.symbolNode.getComponent(Symbol).addGoldSide();
        }
      });

      return Promise.resolve();
    }

    /**
     * 改变其他symbol，除了wild
     */
    changeOtherSymbolExceptWild(nextRoundList: SymbolItem[]) {
      nextRoundList.forEach((item, index) => {
        if (item && item.symbolId !== '4007') {
          if (!item.symbolGoldBorder) {
            this.node.children[index].getComponent(Symbol).destoryGoldSideNode();
          }

          this.node.children[index].getComponent(Symbol).initSymbol(item.symbolId);
        }
      });

      return Promise.resolve();
    }
}
