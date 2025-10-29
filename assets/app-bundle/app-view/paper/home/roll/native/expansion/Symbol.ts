import { _decorator, Component, Material, Node, Size, sp, Sprite, SpriteFrame, tween, UIOpacity, UITransform, Vec2, Vec3 } from 'cc';
import { app } from 'db://assets/app/app';
import { loadResource } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';
import { SymbolType } from 'db://assets/basePlate/middleWare/enums/bet';
import { GameResourceManager, ROLL_RESOURCE_NAMES, SPINE_RESOURCE_NAMES } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';
import { delay } from 'db://assets/common/script/extra/Utils/common';
import { HomeRollTool } from './HomeRollTool';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const SYMBOL_NORMAL_IDS = ['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008', '1009', '1010'];
export const SYMBOL_WILD_IDS = ['4001', '4010', '4011'];
const { ccclass, property } = _decorator;

@ccclass('Symbol')
export class Symbol extends Component {
    @property(Node)
    private iconNode: Node = null;

    // 中奖动画
    @property(Node)
    private LightSpine: Node = null;

    // 消除节点
    @property(Node)
    private removeUpSpineNode: Node = null;

    // 消除底部节点
    @property(Node)
    private removeDownSpineNode: Node = null;

    @property({ type: [SpriteFrame], tooltip: 'symbol icon' })
    private symbolIcons: SpriteFrame[] = [];

    @property({ type: [SpriteFrame], tooltip: 'symbol icon' })
    private symbolBlurIcons: SpriteFrame[] = [];
  
    private mapSymbols: Map<string, SpriteFrame> = new Map();

    private mapBlurSymbols: Map<string, SpriteFrame> = new Map();

    private parentNode: Node;

    // wild Node
    private wildNode: Node = null;

    // 动画
    private wildAnimationNode: Node = null;

     // scatter动画Node
     public scatterAnimationNode: Node = null;

    // scatter增加次数动画Node
    private scatterAddTimeAnimationNode: Node = null;

    public currentSymbolItem: SymbolItem = null;

    // 当前图标的大小
    private _currentIconSize: Size = new Size();

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
    async initSymbol(symbolItem?: SymbolItem, fromServer: boolean = false) {
      if(!symbolItem) {
        return;
      }
      if (this.mapSymbols.size === 0) {
        this.initSprites();
      }

      this.checkOpacity();

      // 从服务器获取数据时
      if(fromServer) {
        this.currentSymbolItem = {
          symbolId: symbolItem.symbolId,
          symbolType: symbolItem.symbolType,
          main: symbolItem.main,
        };

        // 从服务器获取数据时，4001的symbolId需要特殊处理，随机一个normal的symbolId
        if(SYMBOL_WILD_IDS.indexOf(symbolItem.symbolId) !== -1 && !symbolItem.main) {
          const randomIndex = Math.floor(Math.random() * SYMBOL_NORMAL_IDS.length);
          const randomSymbolId = SYMBOL_NORMAL_IDS[randomIndex];
          const spriteFrame = this.mapSymbols.get(`${randomSymbolId}`);
          this.iconNode.getComponent(Sprite).spriteFrame = spriteFrame;
          // 执行落地回弹动画
          await this.startElementFallBackAnimation(randomSymbolId);
        }else{
          this.iconNode.getComponent(Sprite).spriteFrame = this.mapSymbols.get(`${symbolItem.symbolId}`);
          // 执行落地回弹动画
          await this.startElementFallBackAnimation(symbolItem.symbolId);
        }
      }else{
        this.iconNode.getComponent(Sprite).spriteFrame = this.mapSymbols.get(`${symbolItem.symbolId}`);
      }
    }

    /** 检查透明度 */
    checkOpacity() {
      this.LightSpine.getComponent(UIOpacity).opacity = 255;

      this.iconNode.getComponent(UIOpacity).opacity = 255;
    }

    initBlurSymbol(symbolId: string) {
      if (this.mapBlurSymbols.size === 0) {
        this.initSprites();
      }

      this.checkOpacity();
      
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

      return this.currentSymbolItem.symbolId;
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
        await this.playWildAnimation(this.wildAnimationNode, 'gun_in', this.iconNode, '5001');

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
     * 获取wild节点，如果存在则返回，否则返回null
     */
    getWildNode() {
      return this.wildNode;
    }

    /** 播放剑或者棒子的动画 */
    async playSwordOrBowAnimation(symbolId: string) {
      try {
        /// 根据当前图片的尺寸，设置LightSpine的尺寸
        const iconSize = this.iconNode.getComponent(UITransform).contentSize;
        this.LightSpine.getComponent(UITransform).setContentSize(iconSize);
        this.LightSpine.active = true;
        this.iconNode.active = false;
        const skeleton = this.LightSpine.getComponent(sp.Skeleton) || this.LightSpine.addComponent(sp.Skeleton);
        const animationName = 'symbol_' + symbolId;
        skeleton.timeScale = app.manager.global.gameSpeed;
        skeleton.skeletonData = await GameResourceManager.instance.getRollSpineAnimationDataByName(animationName);
        const animationPlayName = animationName + '_2';
        skeleton.setAnimation(0, animationPlayName, false);
        skeleton.setCompleteListener(() => {
          this.LightSpine.active = false;
          this.iconNode.active = true;
          skeleton.setCompleteListener(null);
          skeleton.skeletonData = null;
        });
      }catch(error){
        console.error('startElementFallBackAnimation 执行出错:', error);
        this.LightSpine.active = false;
        this.iconNode.active = true;
      }
    }

    /**
     * 开始元素落地回弹动画
     */
    async startElementFallBackAnimation(symbolId: string): Promise<void> {
      return new Promise<void>(async (resolve) => {
        try {
          const timeout = setTimeout(() => {
            resolve();
          }, 1000);
          
          /// 根据当前图片的尺寸，设置LightSpine的尺寸
          const iconSize = this.iconNode.getComponent(UITransform).contentSize;
          this._currentIconSize = iconSize.clone();
          this.LightSpine.getComponent(UITransform).setContentSize(iconSize);
          this.LightSpine.active = true;
          this.iconNode.active = false;
          const skeleton = this.LightSpine.getComponent(sp.Skeleton) || this.LightSpine.addComponent(sp.Skeleton);
          const animationName = 'symbol_' + symbolId;
          skeleton.timeScale = app.manager.global.gameSpeed;
          skeleton.skeletonData = await GameResourceManager.instance.getRollSpineAnimationDataByName(animationName);
          const animationPlayName = animationName + '_1';
          skeleton.setAnimation(0, animationPlayName, false);

          // 如果当前元素是3001，则播放scatter出现音频
          if(symbolId === '3001') {
            EffectManager.inst.playEffect(AudioPath.GAME.SCATTER_SHOW, false, null, true);
          }

          skeleton.setCompleteListener(() => {
            clearTimeout(timeout);
            this.LightSpine.active = false;
            this.iconNode.active = true;
            resolve();
            skeleton.setCompleteListener(null);
            skeleton.skeletonData = null;
          });
        }catch(error){
          console.error('startElementFallBackAnimation 执行出错:', error);
          this.LightSpine.active = false;
          this.iconNode.active = true;
          resolve();
        }
      });
    }

    /**
     * 开始闪烁中奖和消除动画
     */
    async startLightAndRemoveAnimation(): Promise<void> {
      return new Promise<void>(async (resolve, reject) => {
        try {
          // 设置节点尺寸和状态
          const iconSize = this.iconNode.getComponent(UITransform).contentSize;
          this.LightSpine.getComponent(UITransform).setContentSize(iconSize);
          this.LightSpine.active = true;
          this.removeUpSpineNode.active = true;
          this.removeDownSpineNode.active = true;

          // 获取或添加Skeleton组件
          const skeleton = this.LightSpine.getComponent(sp.Skeleton) || this.LightSpine.addComponent(sp.Skeleton);
          skeleton.timeScale = app.manager.global.gameSpeed;
          const removeUpSkeleton = this.removeUpSpineNode.getComponent(sp.Skeleton) || this.removeUpSpineNode.addComponent(sp.Skeleton);
          removeUpSkeleton.timeScale = app.manager.global.gameSpeed;
          const removeDownSkeleton = this.removeDownSpineNode.getComponent(sp.Skeleton) || this.removeDownSpineNode.addComponent(sp.Skeleton);
          removeDownSkeleton.timeScale = app.manager.global.gameSpeed;
          // 播放消除动画
          removeUpSkeleton.setAnimation(0, 'xiaochu_up', false);
          removeDownSkeleton.setAnimation(0, 'xiaochu_down', false);

          // 加载并播放中奖动画
          const animationName = 'symbol_' + this.getSymbolId();
          skeleton.skeletonData = await GameResourceManager.instance.getRollSpineAnimationDataByName(animationName);
          const animationPlayName = animationName + '_2';
          EffectManager.inst.playEffect(AudioPath.GAME.SYMBOL_WIN);
          skeleton.setAnimation(0, animationPlayName, false);
          skeleton.setCompleteListener(() => {
            skeleton.setCompleteListener(null);
            skeleton.skeletonData = null;
            this.LightSpine.active = false;
            this.iconNode.getComponent(UIOpacity).opacity = 0;
          });
          removeUpSkeleton.setEventListener((trackEntry, event: sp.spine.Event) => {
            if (event.data.name === 'baozha') {
              EffectManager.inst.playEffect(AudioPath.GAME.SYMBOL_CLEAR);
              resolve();
              this.LightSpine.active = false;
              this.removeDownSpineNode.active = false;
              this.iconNode.getComponent(UIOpacity).opacity = 0;
            }
          });
          removeUpSkeleton.setCompleteListener(() => {
            removeUpSkeleton.setCompleteListener(null);
            this.removeUpSpineNode.active = false;
          });

          // 添加超时保护
          const timeout = setTimeout(() => {
            console.warn('startLightAndRemoveAnimation 超时，强制完成');
            this.cleanupAnimationNodes();
            resolve();
          }, 2500);

          // 在resolve时清除超时
          const originalResolve = resolve;

          resolve = () => {
            clearTimeout(timeout);
            originalResolve();
          };
        } catch (error) {
          console.error('startLightAndRemoveAnimation 执行出错:', error);
          this.cleanupAnimationNodes();
          reject(error);
        }
      });
    }

    /**
     * 清理动画节点状态
     */
    private cleanupAnimationNodes(): void {
      this.removeUpSpineNode.active = false;
      this.LightSpine.active = false;
      this.removeDownSpineNode.active = false;
    }

    /**
     * 播放渐隐动画
     */
    private playFadeOutAnimation(): Promise<void> {
      return new Promise<void>((resolve) => {
        // 获取或添加UIOpacity组件
        const lightUIOpacity = this.LightSpine.getComponent(UIOpacity) || this.LightSpine.addComponent(UIOpacity);
        const iconUIOpacity = this.iconNode.getComponent(UIOpacity) || this.iconNode.addComponent(UIOpacity);

        if (lightUIOpacity && iconUIOpacity) {
          // 设置初始透明度
          lightUIOpacity.opacity = 255;
          iconUIOpacity.opacity = 255;

          // 创建渐隐动画 - 同时进行
          tween(lightUIOpacity)
            .timeScale(app.manager.global.gameSpeed)
            .to(0.5, { opacity: 0 })
            .start();

          tween(iconUIOpacity)
            .timeScale(app.manager.global.gameSpeed)
            .to(0.5, { opacity: 0 })
            .call(() => {
              resolve();
            })
            .start();
        } else {
          // 如果没有相应组件，直接完成
          resolve();
        }
      });
    }

    /**
     * 播放scatter中奖动画
     */
    async startScatterActionAnimation(animationName: string): Promise<void> {
      return new Promise<void>(async (resolve) => {
        this.LightSpine.active = true;
        const skeleton = this.LightSpine.getComponent(sp.Skeleton) || this.LightSpine.addComponent(sp.Skeleton);
        skeleton.timeScale = app.manager.global.gameSpeed;
        skeleton.skeletonData = await GameResourceManager.instance.getRollSpineAnimationDataByName(animationName);
        skeleton.setAnimation(0, 'symbol_3001_2', false);
        console.log('播放scatter高亮动画2');
        skeleton.setCompleteListener(() => {
          this.LightSpine.active = false;
          resolve();
          skeleton.setCompleteListener(null);
          skeleton.skeletonData = null;
        });
      });
    }

    /**
     * 一旦出现了scatter，播放scatter高亮动画
     */
    playScatterHighlightAnimation(): Promise<void> {
      if(this.getSymbolId() !== '3001') {
        return Promise.resolve();
      }

      return new Promise<void>(async (resolve) => {
        this.LightSpine.active = true;
        const skeleton = this.LightSpine.getComponent(sp.Skeleton) || this.LightSpine.addComponent(sp.Skeleton);
        skeleton.timeScale = app.manager.global.gameSpeed;
        const skeletonData = await GameResourceManager.instance.getRollSpineAnimationDataByName(ROLL_RESOURCE_NAMES.LAMANG_ICON_SCATTER);
        skeleton.skeletonData = skeletonData;
        skeleton.setAnimation(0, 'symbol_3001_3', true);
        console.log('播放scatter高亮动画3');
        resolve();
      });
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

    // 抽取公共的完成逻辑
    private completeDestoryLightNode(skeleton: sp.Skeleton | null) {
      this.LightSpine.active = false; 
      this.removeUpSpineNode.active = false;

      if (skeleton) {
        // skeleton.setToSetupPose();
      }
    }

    /**
     * 销毁动画Node
     */
    destoryWildAnimationNode() {
      this.wildAnimationNode?.getComponent(sp.Skeleton)?.destroy();
      this.wildAnimationNode?.destroy();
      this.wildAnimationNode = null;
    }

    clearLightNode() {
      this.LightSpine.active = false;
      const skeleton = this.LightSpine.getComponent(sp.Skeleton);

      if(skeleton) {
        // 清除所有事件监听器
        skeleton.setCompleteListener(null);
        skeleton.setEventListener(null);
        // 清除动画数据引用
        skeleton.skeletonData = null;
        // 停止所有动画
        skeleton.clearTracks();
      }
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
          skeleton.timeScale = app.manager.global.gameSpeed;
          skeleton.skeletonData = await GameResourceManager.instance.getRollSpineAnimationDataByName(ROLL_RESOURCE_NAMES.LAMANG_WILD);
          skeleton.setAnimation(0, animationName, false);
          console.log('播放wild动画-数据', animationName);
          iconNode.getComponent(Sprite).spriteFrame = this.mapSymbols.get(symbolId);
          EffectManager.inst.playEffect(AudioPath.GAME.CHANGE_WILD);
          skeleton.setCompleteListener(() => {
            // iconNode.getComponent(Sprite).spriteFrame = this.mapSymbols.get(symbolId);
            this.destoryWildAnimationNode();
            resolve();
          });
          // 播放wild动画
          // 设置节点尺寸和状态
          const iconSize = this.iconNode.getComponent(UITransform).contentSize;
          this.LightSpine.getComponent(UITransform).setContentSize(iconSize);
          this.LightSpine.active = true;
        
          // 获取或添加Skeleton组件
          const wildSkeleton = this.LightSpine.getComponent(sp.Skeleton) || this.LightSpine.addComponent(sp.Skeleton);
          wildSkeleton.timeScale = app.manager.global.gameSpeed;
          wildSkeleton.skeletonData = await GameResourceManager.instance.getRollSpineAnimationDataByName(ROLL_RESOURCE_NAMES['5001']);
          const wildPlayName = 'symbol_5001_4';
          this.iconNode.active = false;
          wildSkeleton.setAnimation(0, wildPlayName, false);
          wildSkeleton.setCompleteListener(() => {
            this.iconNode.active = true;
            wildSkeleton.setCompleteListener(null);
            wildSkeleton.skeletonData = null;
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
          skeleton.timeScale = app.manager.global.gameSpeed;
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
      this.clearLightNode();
      this.destoryWildAnimationNode();
    }
}
