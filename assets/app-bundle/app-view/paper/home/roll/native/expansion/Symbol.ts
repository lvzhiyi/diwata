import { _decorator, Component, Node, sp, Sprite, SpriteFrame, tween, UITransform, Vec2, Vec3 } from 'cc';
import { app } from 'db://assets/app/app';
import { loadResource } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';
import { GameResourceManager, SPINE_RESOURCE_NAMES } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';
import { delay } from 'db://assets/common/script/extra/Utils/common';

const SYMBOL_NORMAL_IDS = ['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008'];

const { ccclass, property } = _decorator;

@ccclass('Symbol')
export class Symbol extends Component {
    @property(Node)
    private iconNode: Node = null;
    
    @property({ type: [SpriteFrame], tooltip: 'symbol icon' })
    private symbolIcons: SpriteFrame[] = [];

    @property({ type: SpriteFrame, tooltip: 'gold side icon' })
    private goldSideIcon: SpriteFrame = null;

    @property({ type: SpriteFrame, tooltip: 'scatter add one spriteframe' })
    private scatterAddOneSpriteFrame: SpriteFrame = null;

    private mapSymbols: Map<string, SpriteFrame> = new Map();

    private parentNode: Node;

    // wild Node
    private wildNode: Node = null;

    // 闪烁
    private lightNode: Node = null;

    // 动画
    private wildAnimationNode: Node = null;

    // scatter增加次数动画Node
    private scatterAddTimeAnimationNode: Node = null;

    public currentSymbolItem: SymbolItem = null;

    protected onLoad(): void {
      this.parentNode = this.node.parent;

      this.initSprites();
    }

    initSprites() {
      this.symbolIcons.forEach((spriteFrame) => {
        this.mapSymbols.set(spriteFrame.name, spriteFrame);
      });
    }

    /// 赋值数据对象 , fromServer 是否从服务器获取数据
    initSymbol(symbolId: string, symbolType: SymbolTypeEnum = 'NORMAL', fromServer: boolean = false) {
      if(fromServer) {
        this.currentSymbolItem = {
          symbolId: symbolId,
          symbolType: symbolType,
        };
      }

      if (this.mapSymbols.size === 0) {
        this.initSprites();
      }
      /// 从服务器获取数据时，4001的symbolId需要特殊处理，随机一个normal的symbolId
      if(fromServer && symbolId === '4001') {
        const randomIndex = Math.floor(Math.random() * SYMBOL_NORMAL_IDS.length);
        const randomSymbolId = SYMBOL_NORMAL_IDS[randomIndex];
        this.iconNode.getComponent(Sprite).spriteFrame = this.mapSymbols.get(`${randomSymbolId}`);
      } else {
        this.iconNode.getComponent(Sprite).spriteFrame = this.mapSymbols.get(`${symbolId}`);
      }
    }

    getSymbolId() {
      const sprite = this.iconNode.getComponent(Sprite);

      if(sprite.spriteFrame) {
        return sprite.spriteFrame.name;
      }

      return '';
    }

    /**
     * 把普通元素变成wild
     */
    changeToSingleWild() {
      return new Promise<void>(async (resolve) => {
        // 获取当前symbol的位置
        const originalPos = this.node.getWorldPosition().clone();
        // 创建一个动画节点，用于播放wild动画
        this.wildAnimationNode = new Node('Animation');
        this.wildAnimationNode.addComponent(UITransform);
        this.wildAnimationNode.getComponent(UITransform).setContentSize(this.iconNode.getComponent(UITransform).contentSize);
        this.wildAnimationNode.layer = this.node.layer;
        this.wildAnimationNode.setParent(this.parentNode);
        this.wildAnimationNode.setWorldPosition(originalPos);

        // 播放wild动画，动画完成后删除动画，并在wildNode设置图片
        await this.playWildAnimation(this.wildAnimationNode, 'bianhuan', this.iconNode, '4001');

        resolve();
      });
    }

    /**
     * 给普通元素添加执行棒子爆炸动画
     */
    async changeToBowAnimation(): Promise<boolean> {
      return new Promise<boolean>(async (resolve) => {
        // 获取当前symbol的位置
        const originalPos = this.node.getWorldPosition().clone();
        // 创建一个动画节点，用于播放wild动画
        this.wildAnimationNode = new Node('Animation');
        this.wildAnimationNode.addComponent(UITransform);
        this.wildAnimationNode.getComponent(UITransform).setContentSize(this.iconNode.getComponent(UITransform).contentSize);
        this.wildAnimationNode.layer = this.node.layer;
        this.wildAnimationNode.setParent(this.parentNode);
        this.wildAnimationNode.setWorldPosition(originalPos);

        // 播放wild动画，动画完成后删除动画，
        await this.playBowExplodeAnimation(this.wildAnimationNode, 'bz');
        resolve(true);
      });
    }

    /**
     * 变为大wild
     */
    async changeToBigWild(leftNodeScript: Symbol, centerNodeScript: Symbol, rightNodeScript: Symbol) {
      if (this.wildNode) {
        // 如果wildNode存在，则不进行操作
        return;
      }

      return new Promise<void>(async (resolve) => {
        const originalPos = centerNodeScript.node.getWorldPosition().clone();
        const layer = this.node.layer;
        const parent = this.parentNode.parent.parent;

        // 创建一个wild节点，用于放置wild图片
        this.wildNode = new Node('BigWild');
        this.wildNode.layer = layer;
        this.wildNode.setParent(parent);
        this.wildNode.setWorldPosition(originalPos);

        // 创建一个动画节点，用于播放wild动画
        this.wildAnimationNode = new Node('Animation');
        this.wildAnimationNode.layer = layer;
        this.wildAnimationNode.setParent(parent);
        this.wildAnimationNode.setWorldPosition(originalPos);

        // 播放wild动画，动画完成后删除动画，并在wildNode设置图片
        await this.playWildAnimation(this.wildAnimationNode, 'show1', this.wildNode, '4006');

        // bigwild动画后隐藏symbol
        this.bigWildHideSymbol(leftNodeScript, centerNodeScript, rightNodeScript);

        resolve();
      });
    }

    /**
     * bigwild动画后隐藏symbol
     */
    bigWildHideSymbol(leftNodeScript: Symbol, centerNodeScript: Symbol, rightNodeScript: Symbol) {
      // 隐藏左中右三个symbol
      leftNodeScript.initSymbol('', );
      centerNodeScript.initSymbol('', );
      rightNodeScript.initSymbol('', );
    }

    /**
     * 变为super wild
     */
    async changeToSuperWild() {
      if (this.wildNode) {
        // 如果wildNode存在，则不进行操作
        return;
      }
      
      return new Promise<void>(async (resolve) => {
        const originalPos = this.node.getWorldPosition().clone();
        const layer = this.node.layer;
        const parent = this.parentNode.parent.parent;

        originalPos.y += this.node.getComponent(UITransform).contentSize.height / 2;

        // 创建一个wild节点，用于放置wild图片
        this.wildNode = new Node('SuperWild');
        this.wildNode.layer = layer;
        this.wildNode.setParent(parent);
        this.wildNode.setWorldPosition(originalPos);

        originalPos.x -= 0.5;
        originalPos.y += 99;

        // 创建一个动画节点，用于播放wild动画
        this.wildAnimationNode = new Node('Animation');
        this.wildAnimationNode.layer = layer;
        this.wildAnimationNode.setParent(parent);
        this.wildAnimationNode.setWorldPosition(originalPos);

        // 播放wild动画，动画完成后删除动画，并在wildNode设置图片
        await this.playWildAnimation(this.wildAnimationNode, 'show2', this.wildNode, '4007');

        // superwild动画后隐藏symbol
        this.superWildHideSymbol();

        resolve();
      });
    }

    /**
     * superwild动画后隐藏symbol
     */
    superWildHideSymbol() {
      this.parentNode.parent.children.forEach((rollNode, rollIndex) => {
        if (rollIndex === 1 || rollIndex === 2 || rollIndex === 3) {
          rollNode.children.forEach((symbolNode, symbolIndex) => {
            if (symbolIndex === 1 || symbolIndex === 2) {
              symbolNode.getComponent(Symbol).initSymbol('', );
            }
          });
        }
      });
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
      skeleton.skeletonData = await GameResourceManager.instance.getSpineAnimationDataByName(SPINE_RESOURCE_NAMES.MFL);
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
     * 销毁闪烁Node
     */
    destoryLightNode() {
      this.lightNode?.getComponent(sp.Skeleton)?.destroy();
      this.lightNode?.destroy();
      this.lightNode = null;
    }

    /**
     * 销毁动画Node
     */
    destoryWildAnimationNode() {
      this.wildAnimationNode?.getComponent(sp.Skeleton)?.destroy();
      this.wildAnimationNode?.destroy();
      this.wildAnimationNode = null;
    }

    /**
     * 销毁scatter增加次数动画Node
     */
    destoryScatterAddTimeAnimationNode() {
      this.scatterAddTimeAnimationNode?.getComponent(sp.Skeleton)?.destroy();
      this.scatterAddTimeAnimationNode?.destroy();
      this.scatterAddTimeAnimationNode = null;
    }

    /**
     * 播放wild动画，动画完成后删除动画，并在wildNode设置图片
     */
    async playWildAnimation(aniNode: Node, animationName: string, iconNode: Node, symbolId: string) {
      return new Promise<void>(async (resolve) => {
        try {
          // 添加动画
          const skeleton = aniNode.getComponent(sp.Skeleton) || aniNode.addComponent(sp.Skeleton);
          skeleton.premultipliedAlpha = false;
          skeleton.skeletonData = await GameResourceManager.instance.getSpineAnimationDataByName(SPINE_RESOURCE_NAMES.LAMANG_WILD);
          skeleton.setAnimation(0, animationName, false);
          console.log('播放wild动画-数据', animationName);
          skeleton.setCompleteListener(() => {
            iconNode.getComponent(Sprite).spriteFrame = this.mapSymbols.get(symbolId);
            this.destoryWildAnimationNode();
            resolve();
          });
        } catch (error) {
          console.error('加载spine/LamAng_wild动画失败', error);
          this.destoryWildAnimationNode();
          resolve();
        }
      });
    }

    /**
     * 播放爆炸动画，动画完成后删除动画，、
     */
    async playBowExplodeAnimation(aniNode: Node, animationName: string,) {
      return new Promise<void>(async (resolve) => {
        try {
          // 添加动画
          const skeleton = aniNode.getComponent(sp.Skeleton) || aniNode.addComponent(sp.Skeleton);
          skeleton.premultipliedAlpha = false;
          skeleton.skeletonData = await GameResourceManager.instance.getSpineAnimationDataByName(SPINE_RESOURCE_NAMES.LAMANG_BOW_EXPLODE);
          skeleton.setAnimation(0, animationName, false);
          console.log('播放棒子动画-数据', animationName);
          skeleton.setCompleteListener(() => {
            this.destoryWildAnimationNode();
            resolve();
          });
        } catch (error) {
          console.error('加载spine/LamAng_wild动画失败', error);
          this.destoryWildAnimationNode();
          resolve();
        }
      });
    }

    /**
     * 播放scatter增加次数动画
     */
    async playScatterAddTimeAnimation(targetPosition: Vec3) {
      return new Promise<void>(async (resolve) => {
        // 如果动画节点存在，代表之前已经播放过，则不进行操作
        if (this.scatterAddTimeAnimationNode) {
          resolve();

          return;
        }

        this.scatterAddTimeAnimationNode = new Node('ScatterAddTimeAnimationNode');
        this.scatterAddTimeAnimationNode.layer = this.node.layer;
        this.scatterAddTimeAnimationNode.setParent(this.node);

        const skeleton = this.scatterAddTimeAnimationNode.getComponent(sp.Skeleton) || this.scatterAddTimeAnimationNode.addComponent(sp.Skeleton);
        skeleton.premultipliedAlpha = true;
        skeleton.skeletonData = await GameResourceManager.instance.getSpineAnimationDataByName(SPINE_RESOURCE_NAMES.LAMANG_ICON_SCATTER);
        await this.playAnimationSequence(skeleton, ['action']);

        const pointNumberBone = skeleton.findSlot('point_number')?.bone;

        if (pointNumberBone) {
          console.log(pointNumberBone.getWorldScaleX, pointNumberBone.worldY);

          const boneWorldX = skeleton.node.worldPosition.x + pointNumberBone.worldX;
          const boneWorldY = skeleton.node.worldPosition.y + pointNumberBone.worldY;

          // 创建scatter+1节点
          const scatterAddOneNode = await this.createScatterAddOneNode(boneWorldX, boneWorldY);

          // scatter+1节点移动到freeSpinTimes节点
          await this.scatterAddOneNodeMoveToFreeSpin(scatterAddOneNode, targetPosition);
        }

        resolve();
      });
    }

    /**
     * 播放动画序列
     * @param skeleton 
     * @param animations 
     * @returns 
     */
    async playAnimationSequence(skeleton: sp.Skeleton, animations: string[]) {
      return new Promise<void>(async (resolve) => {
        if (animations.length === 0) {
          resolve();

          return;
        }

        for (let i = 0; i < animations.length - 1 ; i++) {
          skeleton.addAnimation(0, animations[i], false);
        }

        const track: sp.spine.TrackEntry = skeleton.addAnimation(0, animations[animations.length - 1], false, 0);
        
        skeleton.setTrackCompleteListener(track, (trackEntry: sp.spine.TrackEntry) => {
          if (trackEntry.animation.name === animations[animations.length - 1]) {
            resolve();
            skeleton.setTrackCompleteListener(track, null);
          }
        });
      });
    }

    /**
     * 创建scatter+1节点
     */
    createScatterAddOneNode(boneWorldX: number, boneWorldY: number): Promise<Node> {
      return new Promise<Node>(async (resolve) => {
        const scatterAddOneNode = new Node('ScatterAddOne');
        scatterAddOneNode.layer = this.node.layer;
        scatterAddOneNode.addComponent(Sprite).spriteFrame = this.scatterAddOneSpriteFrame;
        scatterAddOneNode.setParent(this.node.parent.parent.parent);

        const position = new Vec3(boneWorldX, boneWorldY, 0);
        scatterAddOneNode.setWorldPosition(position);
        resolve(scatterAddOneNode);
      });
    }

    /**
     * scatter+1节点移动到freeSpin节点
     */
    scatterAddOneNodeMoveToFreeSpin(scatterAddOneNode: Node, targetPosition: Vec3) {
      return new Promise<void>(async (resolve) => {
        tween(scatterAddOneNode)
          .to(0.5, { worldPosition: targetPosition })
          .call(() => {
            // 销毁scatter+1节点
            scatterAddOneNode.destroy();
            resolve();
          })
          .start();
      });
    }

    /**
     * symbol销毁时，同时销毁变成的 wild
     */
    protected onDisable(): void {
      this.destoryWildNode();
      this.destoryLightNode();
      this.destoryWildAnimationNode();
      this.destoryScatterAddTimeAnimationNode();
    }
}
