import { _decorator, CCInteger, Component, instantiate, Material, Node, NodePool, Prefab, sp, Sprite, Tween, tween, UITransform, Vec3 } from 'cc';
import { Symbol, SYMBOL_WILD_IDS } from './Symbol';
import { delay } from 'db://assets/common/script/extra/Utils/common';
import { SymbolType } from 'db://assets/basePlate/middleWare/enums/bet';
import { GameResourceManager, ROLL_RESOURCE_NAMES, SPINE_RESOURCE_NAMES } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';
import { app } from 'db://assets/app/app';
import { HomeRollTool } from './HomeRollTool';
import { IQuickMode } from 'db://assets/app-builtin/app-manager/global/GlobalManager';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

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

    @property(CCInteger)
    private rollIndex: number = 0;
    
    private overlayNode: Node = null;

    private nodePool: NodePool = new NodePool();

    private rollTween: Tween | null = null;

    // 剑动画
    private swordAnimationNode: Node = null;

    // 游戏是否正在滚动中
    public isRolling: boolean = false;

    // 当前roll的symbol列表
    private rollList: SymbolItem[] = [];

    // 是否可以停止滚动
    private canStopRolling: boolean = true;

    // 当前roll的消除数据
    private rollRemoveData: {
      rowIndex: number,
      columnIndex: number
    }[] = [];

    // 滚动结束回调
    private onRollComplete: () => void = null;

    // 消除、下坠动画数据
    public symbolAnimationData: ISymbolAnimationData[] = [];

    // 顶部首个Symbol节点y坐标
    private firstSymbolY: number = 0;

    private originalWorldPosition: Vec3 = new Vec3();

    // 是否在播放rollframe动画
    private rollFrameAnimiationIsPlaying: boolean = false;

    protected onLoad(): void {
      this.initNodePool();
      this.initSymbols();
      this.originalWorldPosition = this.node.parent.getPosition().clone();
      this.originalWorldPosition.x = this.originalWorldPosition.x;
    }

    /**
     * 初始化数据
     */
    initData() {
      this.rollList = [];
      this.symbolAnimationData = [];
      this.firstSymbolY = 0;
    }

    setOverlayNode(overlayNode: Node) {
      this.overlayNode = overlayNode;
    }

    /**
     * 设置round数据
     */
    setRoundData(rollList: SymbolItem[], rollRemoveData: {
      rowIndex: number,
      columnIndex: number
    }[]) {
      this.rollList = rollList.filter((item: any) => item !== null);
      this.rollRemoveData = rollRemoveData;

      if(rollRemoveData.length > 0) {
        app.manager.event.emit('roll:reward', 'start');
        console.log('需要消除的节点-数据', rollRemoveData);
      }
    }

    getCurrentIndex() {
      return this.rollIndex;
    }

    getItemCount() {
      return this.itemCount;
    }

    getItemHeight() {
      return this.itemHeight;
    }

    getRollRemoveData() {
      return this.rollRemoveData;
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
        let symbolId;

        if(this.rollIndex < 3) {
          symbolId = this.randomSymbolId(HomeRollTool.getRandomIndex(this.rollIndex));
        } else {
          symbolId = this.randomSymbolId();
        }

        // 初始化面板不随机出symbolId为3001
        if (symbolId === '3001') {
          symbolId = '1005';
        }

        const symbol = this.createSymbol({
          symbolId, symbolType: 'NORMAL', main: false 
        });
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
     * 检查当前roll元素是否齐全，不齐全需要补齐
     */
    checkRollElement() {
      const children = this.node.children;
      
      if (children.length < this.itemCount - 1) {
        console.log('补齐roll元素');

        for (let i = children.length; i < this.itemCount - 1; i++) {
          const node = this.nodePool.get();
          node.getComponent(Symbol).initSymbol({
            symbolId: this.randomSymbolId(), symbolType: 'NORMAL', main: false 
          });
          this.node.insertChild(node, 0);
        }
      }
    }

    /**
     * 开始滚动动画
     */
    startRollingAnimation() {
      this.canStopRolling = true;
      const parentNode = this.node;
      // 检查当前roll元素是否齐全，不齐全需要补齐
      const start = tween(parentNode)
        .by(0.15, { position: new Vec3(0, -this.itemHeight, 0) }, { easing: 'quadIn' })
        .call(() => this.updateNode());
      const going = tween(parentNode)
        .by(0.04, { position: new Vec3(0, -this.itemHeight, 0) }, { easing: 'quadIn' })
        .call(() => {
          this.updateNode();

          // 如果当前roll的结果列表不为空，则停止滚动
          if (this.rollList.length > 0 && this.canStopRolling) {
            this.canStopRolling = false;
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
    async stopRolling(rollList: SymbolItem[], onComplete?: () => void, rollFrameAnimiationIsPlaying: boolean = false) {
      // if (rollFrameAnimiationIsPlaying) {
      //   await delay(900 / app.manager.global.gameSpeed);
      // }

      this.rollList = rollList;
      this.onRollComplete = onComplete;
      this.rollFrameAnimiationIsPlaying = rollFrameAnimiationIsPlaying;
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
        .by(0.05, { position: new Vec3(0, -this.itemHeight, 0) }, { easing: 'quintOut' })
        .call(() => this.updateNode(reverseReslutSymbols));
      const end = tween(parentNode)
        .by(0.15, { position: new Vec3(0, -this.itemHeight, 0) }, { easing: 'quintOut' })
        .call(() => { 
          this.updateNode(); 
          this.isRolling = false;

          this.firstSymbolY = this.node.children[0]?.position?.y ?? 0;

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
    private createSymbol(symbolItem?: SymbolItem, fromServer: boolean = false, isBlur: boolean = false) {
      let symbol;

      if (this.nodePool.size() > 0) {
        symbol = this.nodePool.get();
      } else {
        symbol = instantiate(this.symbolPrefab);
      }

      if(isBlur) {
        symbol.getComponent(Symbol).initBlurSymbol(symbolItem?.symbolId);
      } else {
        symbol.getComponent(Symbol).initSymbol(symbolItem, fromServer);
      }

      return symbol;
    }
    
    /**
     * 随机SymbolId
     * @returns 随机符号ID
     */
    randomSymbolId(Index?: number) {
      const random = Math.random();
      let randomIndex: number ;

      if(Index){
        randomIndex = Index;
      } else {
        if (random < 0.85) {
          // 75%的概率选择0-10，// 0-4
          randomIndex = Math.floor(Math.random() * 9); 
        } else {
          // 25%的概率选择1-10，// 5-10
          randomIndex = Math.floor(Math.random() * 5) + 4; 
        }
        if (randomIndex >= SYMBOL_IDS.length - 1) {
          randomIndex = 5;
        }
      }

      return SYMBOL_IDS[randomIndex];
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

      if (lastNode.name === 'Symbol') {
        this.nodePool.put(lastNode);
      }

      this.node.removeChild(lastNode);

      let  resultSymbol =   resultSymbols?.shift();
      let   symbol = resultSymbol;

      if(!resultSymbol) {
        symbol = {
          symbolId: this.randomSymbolId(), symbolType: 'NORMAL', main: false 
        };
      }

      const needBlur = resultSymbols?.length > 0 ? false : true;
      const fromServer = resultSymbols?.length > 0 ? true : false;
      // 如果resultSymbols不为空，则创建symbolId，否则随机一个symbolId
      let SymbolNode = this.createSymbol(symbol, fromServer, needBlur);
     
      if (children.length > 0) { 
        const firstChildPos = children[0].position.clone();
          
        // 设置新的symbol位置
        SymbolNode.setPosition(0, firstChildPos.y + this.itemHeight, 0);
      
        // 插入新的symbol到顶部
        this.node.insertChild(SymbolNode, 0);

        if (resultSymbol) {
          SymbolNode.getComponent(Symbol).initSymbol(resultSymbol, true);
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
     * 播放scatter高亮动画
    */
    playScatterHighlightAnimation(): Promise<void> {
      const children = this.node.children;
      children.map(itemNode => {
        const symbol = itemNode.getComponent(Symbol);
        const symbolId = symbol.getSymbolId() || '';

        if(symbolId === '3001') {
          symbol.playScatterHighlightAnimation();
        }
      });

      return Promise.resolve();
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

      return !!this.rollList.find(item => {
        return item.symbolId === SymbolType.SWORD && item.main === true;
      });
    }

    /**
     * 处理是否需要展示剑,并把剑的节点返回用于储存
     */
    showSwordSymbol(): Promise<Node> {
      let hasShowSwordNode = this.currentRollHaveSword()  ;

      return new Promise<Node>(resolve => {
        // 如果剑的数量等于符号数量，则展示剑,随机任意一个节点变成剑的符号
        if (hasShowSwordNode) {
          let symbolNode: Node = null;
         
          this.rollList.forEach((item, index) => {
            if(item.main === true && item.symbolId === SymbolType.SWORD ) {
              symbolNode = this.node.children[index] || null;
              symbolNode?.getComponent(Symbol)?.playSwordOrBowAnimation('4010');
            }
          });

          return resolve(symbolNode);
        }else{
          resolve(null);
        }
      });
    }

    /**
     * 处理是否需要展示拍打棒子,并把棒子的节点返回用于储存
     */
    showBowSymbol(): Promise<Node[]> {
      return new Promise<Node[]>(resolve => {
        let showBowNode: Node[] = [];
        this.rollList.forEach((Item, index) => {
          const child = this.node.children[index] || null;
          const symbol = child?.getComponent(Symbol) || null;
          const symbolId = symbol?.getSymbolId() || '';
  
          if (Item.symbolId  === SymbolType.BOW && (symbolId !== SymbolType.WILD && symbolId !== '')) {
            if (Item.main === true) {
              EffectManager.inst.playEffect(AudioPath.GAME.STICK_START, false, null, true);
              symbol?.playSwordOrBowAnimation('4011');
              showBowNode.push(child);
            }else{
              showBowNode.push(child);
            }
          }
        });
        resolve(showBowNode);
      });
    }

    /**
     * 处理消除数据，将处理好的数据push到symbolAnimationData中
     */
    async dealRemoveData() {
      let fallDownCount = 0;
      // 当前roll是否存在剑则把所有元素变成剑
      const haveSword = this.currentRollHaveSword();
      const children = this.node.children;
      const reversedChildren = Array.from(children).reverse();

      for (const [index, symbolNode] of reversedChildren.entries()) {
        const originalIndex = children.length - 1 - index;
        const currentSymbolObj = this.rollList[originalIndex] || null;
        // const currentSymbolObj:any = symbolNode.getComponent(Symbol)?.currentSymbolItem || null;
        // 当需要消除时，如果当前symbol
        const isNeedRemove = this.rollRemoveData.some(
          remove => remove.rowIndex === originalIndex
        );
        this.symbolAnimationData.unshift({ 
          symbolNode,
          isNeedRemove,
          fallDownCount,
          symbolId: haveSword ? SymbolType.SWORD : currentSymbolObj?.symbolId,
          symbolType: haveSword ? SymbolType.SWORD : currentSymbolObj?.symbolType,
        });

        if (isNeedRemove) {
          fallDownCount++;
        }
      }

      return Promise.resolve(this.symbolAnimationData);
    }

    /**
     * 显示rollFrameSpine，展示完毕后停止滚动
     */
    async showRollFrameSpine(rollFrameSkeleton: sp.Skeleton) {
      rollFrameSkeleton.node.active = true;
      console.log('this.originalWorldPosition', this.originalWorldPosition);
      rollFrameSkeleton.node.setPosition(this.originalWorldPosition);
      rollFrameSkeleton.timeScale = app.manager.global.gameSpeed;
      const scatterAnimationName = HomeRollTool.getScatterRunAnimationName(this.rollIndex);
      rollFrameSkeleton.setAnimation(0, scatterAnimationName, true);
      EffectManager.inst.playEffect(AudioPath.GAME.SCATTER_EXPECT, false, null, true);

      return new Promise(async resolve => {
        rollFrameSkeleton.setCompleteListener(() => {
          resolve(true);
        });
      });
    }

    /**
     * 隐藏rollFrameSpine
     */
    async hideRollFrameSpine(rollFrameSkeleton: sp.Skeleton) {
      rollFrameSkeleton.node.active = false;
      rollFrameSkeleton.clearAnimation();
    }

    /**
     * 开始中奖闪烁
     */
    async startLightAndRemoveAnimation() {
      if(this.rollRemoveData.length > 0) {
        EffectManager.inst.playEffect(AudioPath.GAME.SYMBOL_WIN);
        setTimeout(() => {
          EffectManager.inst.playEffect(AudioPath.GAME.SYMBOL_CLEAR);
        }, 1000 / app.manager.global.gameSpeed);
      }

      return await Promise.all(this.rollRemoveData.map(async item => {
        const { rowIndex } = item;
        const symbol = this.node.children[rowIndex]?.getComponent(Symbol);

        if (symbol) {
          return symbol.startLightAndRemoveAnimation();
        }

        return Promise.resolve();
      }));
    }

    // /**
    //  * 播放消除闪烁动画
    //  */
    // async endLightAnimation() {
    //   // 获取需要消除的数组
    //   const needRemoveSymbolData = this.symbolAnimationData.filter(item => item.isNeedRemove);

    //   if (needRemoveSymbolData.length === 0) {
    //     return Promise.resolve();
    //   }

    //   const endLightAnimationPromises = needRemoveSymbolData.map(item => {
    //     const { symbolNode } = item;
    //     const symbol = symbolNode?.getComponent(Symbol);
        
    //     if (symbol) {
    //       return symbol.beginDestoryLightNode();
    //     }

    //     return Promise.resolve();
    //   });

    //   await Promise.all(endLightAnimationPromises);
    // }

    /**
     * 消除Smybol
     */
    removeSymbol() {
      return new Promise(resolve => {
        const removeSymbolNodeList: Node[] = [];
        const filterSymbolAnimationData: ISymbolAnimationData[] = [];
        this.symbolAnimationData.forEach((item: ISymbolAnimationData) => {
          // 如果symbol需要被消除
          if (item.isNeedRemove) {
            removeSymbolNodeList.push(item.symbolNode);
          } else {
            filterSymbolAnimationData.push(item);
          }
        });
         
        removeSymbolNodeList.forEach((node: Node) => {
          if (node.name === 'Symbol') {
            this.nodePool.put(node);
          }

          this.node.removeChild(node);
        });
        
        this.symbolAnimationData = filterSymbolAnimationData;

        resolve(this.symbolAnimationData);
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
        const {
          symbolId, symbolType, main
        } = nextRoundNewList[i] || {};
        const symbolNode = this.createSymbol({
          symbolId, symbolType, main: main 
        }, true);
        symbolNode.setPosition(0, this.firstSymbolY + this.itemHeight * (length - i - 1), 0);
        this.symbolAnimationData.unshift({
          symbolNode,
          isNeedRemove: false,
          fallDownCount: length,
          symbolId,
          symbolType,
        });
          
        this.node.insertChild(symbolNode, 0);
      }

      // await delay(50);
  
      return Promise.resolve(this.symbolAnimationData);
    }

    /**
     * AnimationData中symbolNode下坠
     */
    fallDownSymbol() {
      return new Promise<ISymbolAnimationData[]>(resolve => {
        // 筛选需要下坠的节点
        const fallDownItems = this.symbolAnimationData.filter(item => item.fallDownCount > 0);
  
        // 如果没有需要下坠的节点，则直接返回 false
        if (fallDownItems.length === 0) {
          resolve([]);

          return;
        }
  
        // 收集所有动画的 Promise
        const animationPromises = fallDownItems.map((item, index) => {
          return new Promise<void>(innerResolve => {
            const { fallDownCount, symbolNode } = item;
            const wildNode = symbolNode.getComponent(Symbol)?.getWildNode();
            const targetY = symbolNode.position.y - this.itemHeight * fallDownCount;
            item.fallDownCount = 0;
  
            // 根据下落距离调整动画时长，让动画更自然
            const fallDistance = Math.abs(fallDownCount * this.itemHeight);
            // 基础时长
            const baseDuration = app.manager.global.quikeMode !== IQuickMode.nomal ? 0.1 : 0.2;
            // 距离因子，最大为1
            const distanceFactor = Math.min(fallDistance / (this.itemHeight * 2), 1);
            // 0.3-0.5秒之间
            const animationDuration = baseDuration + distanceFactor * 0.1;
            
            // 添加轻微的延迟，让不同高度的元素有层次感
            // 每个元素延迟20ms
            const delayTime = index * 0.01;
            
            // 主节点动画 - 使用更平滑的缓动
            const symbolTween = tween(symbolNode)
              .delay(delayTime)
              .to(animationDuration, { position: new Vec3(0, targetY, 0) }, {
                // 使用cubicOut让动画更丝滑
                easing: 'cubicOut'
              });
           
            // 如果有 wildNode，也添加动画
            if (wildNode) {
              const wildTween = tween(wildNode)
                .delay(delayTime)
                .to(animationDuration, { position: new Vec3(wildNode.position.x, targetY, 0) }, { easing: 'cubicOut' });
                      
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
          .then(() => resolve(this.symbolAnimationData))
          .catch(() => resolve([]));
      });
    }

    /**
     * 移除顶部多余符号
     */
    removeTopExcessSymbol() {
      if (this.node.children.length === this.itemCount) {
        const node = this.node.children[0];

        if (node.name === 'Symbol') {
          this.nodePool.put(node);
        }

        this.node.removeChild(node);
      }
    }

    /**
     * 添加顶部多余符号
     */
    addTopExcessSymbol() {
      if (this.node.children.length === this.itemCount - 1) {
        const node = this.nodePool.get();
        node.getComponent(Symbol).initSymbol({
          symbolId: this.randomSymbolId(), symbolType: 'NORMAL', main: false 
        });
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

      return  await this.node.children[index].getComponent(Symbol).changeToSingleWild();
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
        this.swordAnimationNode.layer = this.overlayNode.layer;
        this.swordAnimationNode.setParent(this.overlayNode);
        this.swordAnimationNode.setWorldPosition(originalPos);
        // 播放wild动画，动画完成后删除动画，并在wildNode设置图片
        console.log('播放dao动画');
        await this.playSwordAnimation(this.swordAnimationNode, 'dao_atk',);

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
          skeleton.timeScale = app.manager.global.gameSpeed;
          const  skeletonData = await GameResourceManager.instance.getRollSpineAnimationDataByName(ROLL_RESOURCE_NAMES.SWORD_HIT);

          if (skeletonData) {
            skeleton.skeletonData = skeletonData;
            
            skeleton.setAnimation(0, animationName, false);
          }

          skeleton.setCompleteListener(() => {
            this.destoryWildAnimationNode();
            resolve();
          });
        } catch (error) {
          console.error('加载dao/动画失败', error);
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
}
