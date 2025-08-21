import { _decorator, Component, Material, Node, sp, Sprite, SpriteFrame, tween, UITransform, Vec2, Vec3 } from 'cc';
import { app } from 'db://assets/app/app';
import { loadResource } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';
import { SymbolType } from 'db://assets/basePlate/middleWare/enums/bet';
import { GameResourceManager, ROLL_RESOURCE_NAMES, SPINE_RESOURCE_NAMES } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';
import { delay } from 'db://assets/common/script/extra/Utils/common';
import { HomeRollTool } from './HomeRollTool';

const SYMBOL_NORMAL_IDS = ['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008', '1009', '1010'];
export const SYMBOL_WILD_IDS = ['4001', '4010', '4011'];
const { ccclass, property } = _decorator;

@ccclass('Symbol')
export class Symbol extends Component {
    @property(Node)
    private iconNode: Node = null;
    
    @property({ type: [SpriteFrame], tooltip: 'symbol icon' })
    private symbolIcons: SpriteFrame[] = [];

    @property({ type: [SpriteFrame], tooltip: 'symbol icon' })
    private symbolBlurIcons: SpriteFrame[] = [];
  
    private mapSymbols: Map<string, SpriteFrame> = new Map();

    private mapBlurSymbols: Map<string, SpriteFrame> = new Map();

    private parentNode: Node;

    // wild Node
    private wildNode: Node = null;

    // 闪烁
    private lightNode: Node = null;

    // 动画
    private wildAnimationNode: Node = null;

     // scatter动画Node
     public scatterAnimationNode: Node = null;

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

      this.symbolBlurIcons.forEach((spriteFrame) => {
        this.mapBlurSymbols.set(spriteFrame.name, spriteFrame);
      });
    }

    /// 赋值数据对象 , fromServer 是否从服务器获取数据
    initSymbol(symbolItem?: SymbolItem, fromServer: boolean = false) {
      if(!symbolItem) {
        return;
      }

      if(fromServer) {
        this.currentSymbolItem = {
          symbolId: symbolItem.symbolId,
          symbolType: symbolItem.symbolType,
          main: symbolItem.main,
        };
      }

      if (this.mapSymbols.size === 0) {
        this.initSprites();
      }
      /// 从服务器获取数据时，4001的symbolId需要特殊处理，随机一个normal的symbolId
      if(fromServer && SYMBOL_WILD_IDS.indexOf(symbolItem.symbolId) !== -1) {
        const randomIndex = Math.floor(Math.random() * SYMBOL_NORMAL_IDS.length);
        const randomSymbolId = SYMBOL_NORMAL_IDS[randomIndex];
        const spriteFrame = this.mapSymbols.get(`${randomSymbolId}`);
        this.iconNode.getComponent(Sprite).spriteFrame = spriteFrame;
      } else {
        this.iconNode.getComponent(Sprite).spriteFrame = this.mapSymbols.get(`${symbolItem.symbolId}`);
      }
    }

    initBlurSymbol(symbolId: string) {
      if (this.mapBlurSymbols.size === 0) {
        this.initSprites();
      }

      this.iconNode.getComponent(Sprite).spriteFrame = this.mapBlurSymbols.get(`${symbolId}`);
    }

    getIconNode() {
      return this.iconNode;
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
    changeToSingleWild(): Promise<void> {
      // 如果当前symbol已经是wild，则不进行操作
      if(this.getSymbolId() === SymbolType.WILD) {
        return Promise.resolve();
      }

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
        await this.playWildAnimation(this.wildAnimationNode, 'bianhuan', this.iconNode, '5001');

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
        console.log('播放gun动画');
        await this.playBowExplodeAnimation(this.wildAnimationNode, 'gun_atk');
        resolve(true);
      });
    }

    /**
     * 播放scatter action动画
     */
    async startScatterActionAnimation(spineResourceName: string) {
      if (!this.scatterAnimationNode) {
        this.scatterAnimationNode = new Node('ScatterAnimationNode');
        this.scatterAnimationNode.layer = this.node.layer;
        this.scatterAnimationNode.setParent(this.node);
      }

      return null;
      const skeletonData = await GameResourceManager.instance.getSpineAnimationDataByName(spineResourceName);
      const skeleton = await this.playAnimationSequence(this.scatterAnimationNode, skeletonData, [{ name: 'action', loop: false }]);

      return skeleton;
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
      skeleton.skeletonData = await GameResourceManager.instance.getRollSpineAnimationDataByName(ROLL_RESOURCE_NAMES.MFL);
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
          skeleton.skeletonData = await GameResourceManager.instance.getRollSpineAnimationDataByName(ROLL_RESOURCE_NAMES.LAMANG_WILD);
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
          const  skeletonData = await GameResourceManager.instance.getRollSpineAnimationDataByName(ROLL_RESOURCE_NAMES.BOW_EXPLODE);

          if (skeletonData) {
            skeleton.skeletonData = skeletonData;
            HomeRollTool.playAnimationSequence(skeleton, ['gun_atk', 'gun_in'], () => {
              this.destoryWildAnimationNode();
              resolve();
            });
          }
        } catch (error) {
          console.error('加载spine/LamAng_wild动画失败', error);
          this.destoryWildAnimationNode();
          resolve();
        }
      });
    }

    /**
     * 播放动画序列
     * @param skeleton 
     * @param animations 
     * @returns 
     */
    /**
     * 播放动画序列
     * @param skeleton 
     * @param animations 
     * @returns 
     */
    async playAnimationSequence(node: Node, skeletonData: sp.SkeletonData, animations: { name: string, loop: boolean }[], onComplete?: () => void) {
      return new Promise<sp.Skeleton>((resolve) => {
        if (animations.length === 0) {
          resolve(null);

          return;
        }

        const skeleton = node.getComponent(sp.Skeleton) || node.addComponent(sp.Skeleton);
        skeleton.premultipliedAlpha = false;
        skeleton.skeletonData = skeletonData;
        skeleton.timeScale = app.manager.global.gameSpeed;

        // 清除之前的监听器
        skeleton.setCompleteListener(null);

        // 添加动画序列
        for (let i = 0; i < animations.length - 1; i++) {
          const { name, loop } = animations[i];

          if (i === 0) {
            skeleton.setAnimation(0, name, loop);
          } else {
            skeleton.addAnimation(0, name, loop, 0);
          }
        }
  
        // 添加最后一个动画并设置监听器
        const { name, loop } = animations[animations.length - 1];
        skeleton.addAnimation(0, name, loop, 0);
  
        // 设置一次性监听器
        skeleton.setCompleteListener((trackEntry: sp.spine.TrackEntry) => {
          if (trackEntry.animation.name === name) {
            onComplete?.();
            resolve(skeleton);
          }
        });
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
