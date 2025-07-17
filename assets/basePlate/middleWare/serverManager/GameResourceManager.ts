import { _decorator, instantiate, Node, Prefab, resources, sp, SpriteAtlas, SpriteFrame } from 'cc';
import logger from 'db://app/lib/logger/logger';
import { loadResource } from '../../core/baseUtil/BaseCommonUtil';

const { ccclass, property } = _decorator;

export const SPINE_RESOURCE_NAMES: { [key: string]: string } = {
  // 开始动画
  LAMANG_START: 'LamAng_start',
  // wild动画
  LAMANG_WILD: 'bianhuan',
  // scatter动画
  LAMANG_ICON_SCATTER: 'LamAng_icon_scatter',
  // 剑被劈中的动画
  LAMANG_SWORD_HIT: 'wheelhalo',
  // 棒子爆炸的动画
  LAMANG_BOW_EXPLODE: 'bz',

  MFL: 'mfl',

  // 滚轴动画
  LAMANG_RUN: 'LamAng_run',

};

@ccclass('GameResourceManager')
export class GameResourceManager {
    private static _instance: GameResourceManager = null;

    // 动画集合字典
    private spineResopurceMap: { [key: string]: sp.SkeletonData } = {};

    // 图标的集合字典
    private iconTextures: { [key: string]: SpriteFrame } = {};

    private spinePool: Node[] = [];
  
    private _toastNode: Node = null;
  
    private static initInstance() {
      this._instance = new GameResourceManager();
    }

    public static get instance() {
      if (!this._instance) {
        this.initInstance();
      }

      return this._instance;
    }

    // 预加载所有 ICon 图片
    preloadLocalICons() {
      return new Promise<void>((resolve) => {
        const imagePath = 'icons/symbols';
        resources.loadDir(imagePath, SpriteFrame, (err, spriteFrames) => {
          if (err) {
            console.error(`Error loading images from ${imagePath}:`, err);
            resolve();
          } else {
            spriteFrames.forEach((spriteFrame) => {
              this.iconTextures[spriteFrame.name] = spriteFrame;
            });
            console.log('所有本地icon已经预加载完成', this.iconTextures);
            resolve();
          }
        });
      });
    }
  
    //  预加载所有 Spine 动画，
    //  names 为需要预加载的动画名称列表，如果没有则预加载resource中所有spine文件夹下的动画
    preloadLocalAnimations(names?: string[]) {
      const resourceNames = names || this.getSpineResourceNames();
      const loadPromises = resourceNames.map((name) => {
        return new Promise<void>((resolve) => {
          // 获取spine动画
          this.getSpineAnimationDataByName(name).then(() => {
            resolve();
          });
        });
      });

      return Promise.all(loadPromises).then(() => {
        logger.success(`${resourceNames.toString()} 动画已经预加载完成`);
      });
    }
  
    // 获取 Spine 动画实例
    async getSpineAnimationDataByName(spineName: string): Promise<sp.SkeletonData> {
      return new Promise(async (resolve) => {
        let spineData = this.spineResopurceMap[spineName];

        if (spineData) {
          resolve(spineData);
          logger.log(`预加载spine动画 ${spineName} 完成（缓存中获取）`);
        } else {
          spineData = await loadResource('load', 'resources', `spine/${spineName}`, sp.SkeletonData);
          this.spineResopurceMap[spineName] = spineData;
          resolve(spineData);
          logger.log(`预加载spine动画 ${spineName} 完成`);
        }
      });
    }
  
    // 获取 ICon 动画实例
    getIconSpriteFrameWithName(indexName: string): SpriteFrame | null {
      if (Object.keys(this.iconTextures).length > 0) {
        const spriteFrame = this.iconTextures[indexName];

        return spriteFrame;
      } else {
        return null;
      }
    }
  
    // 获取weakToast节点
    async getWeakToastNode(): Promise<Node> {
      if (!this._toastNode) {
        return new Promise<Node>((resolve) => {
          resources.load('Prefab/ToastItem', Prefab, (err, prefab) => {
            if (err) {
              console.error('预制体加载失败:', err);

              return;
            }

            const toastNode = instantiate(prefab);
            this._toastNode = toastNode;
            resolve(toastNode);
          });
        });
      } else {
        return this._toastNode;
      }
    }
  
    // 获取resource中所有spine资源名称列表
    getSpineResourceNames(): string[] {
      return Object.keys(SPINE_RESOURCE_NAMES).map(key => SPINE_RESOURCE_NAMES[key]);
    }
}
