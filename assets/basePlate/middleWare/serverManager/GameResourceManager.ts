import { _decorator, instantiate, Node, Prefab, resources, sp, SpriteFrame } from 'cc';
import logger from 'db://app/lib/logger/logger';
import { loadResource } from '../../core/baseUtil/BaseCommonUtil';

const { ccclass, property } = _decorator;

export const SPINE_RESOURCE_NAMES: { [key: string]: string } = {
  // 开始动画
  LAMANG_START: 'LamAng_start',
  // 剑被劈中的动画
  // LAMANG_SWORD_HIT: 'wheelhalo',

};
/// 滚动元素
export const ROLL_RESOURCE_NAMES: { [key: string]: string } = {
 
  // wild动画
  LAMANG_WILD: 'bianhuan',
  // scatter动画
  LAMANG_ICON_SCATTER: 'symbol_3001',
  // 剑被劈中的动画
  SWORD_HIT: 'dao',
  
  // 棒子爆炸的动画
  BOW_EXPLODE: 'gun',

  MFL: 'mfl',

  // 元素消除
  XIAO_CHU: 'xiaochu',

  // 滚轴动画
  LAMANG_RUN: 'gunzhou',
  // 刀 发光动画
  SWORD_HIT_LIGHT: 'dao_in',
  /// 1001-1014 图标动画
  '1001':'symbol_1001',
  '1002':'symbol_1002',
  '1003':'symbol_1003',
  '1004':'symbol_1004',
  '1005':'symbol_1005',
  '1006':'symbol_1006',
  '1007':'symbol_1007',
  '1008':'symbol_1008',
  '1009':'symbol_1009',
  '1010':'symbol_1010',
  '3001':'symbol_3001',
  '4010':'symbol_4010',
  '4011':'symbol_4011',
  '5001':'symbol_5001',

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
  
    //  预加载所有 OtherSpine 动画，
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

    // 预加载所有 RollSpine 动画，
    preloadAllRollAnimations(names?: string[]) {
      const resourceNames = names || this.getRollResourceNames();
      const loadPromises = resourceNames.map((name) => {
        return new Promise<void>((resolve) => {
          // 获取spine动画
          this.getRollSpineAnimationDataByName(name).then(() => {
            resolve();
          });
        });
      });

      return Promise.all(loadPromises).then(() => {
        logger.success(`${resourceNames.toString()} roll动画已经预加载完成`);
      });
    }

    // 获取 OtherSpine 动画实例
    async getSpineAnimationDataByName(spineName: string): Promise<sp.SkeletonData> {
      return new Promise(async (resolve) => {
        let spineData = this.spineResopurceMap[spineName];

        if (spineData) {
          resolve(spineData);
          logger.log(`预加载spine动画 ${spineName} 完成（缓存中获取）`);
        } else {
          spineData = await loadResource('load', 'resources', `Spines/OtherSpine/${spineName}`, sp.SkeletonData);
          this.spineResopurceMap[spineName] = spineData;
          resolve(spineData);
          logger.log(`预加载spine动画 ${spineName} 完成`);
        }
      });
    }

    /**
     * 获取 RollSpine 动画实例
     * @param spineName 
     * @returns 
     */
    async getRollSpineAnimationDataByName(spineName: string): Promise<sp.SkeletonData> {
      return new Promise(async (resolve) => {
        let spineData = this.spineResopurceMap[spineName];

        if (spineData) {
          resolve(spineData);
          logger.log(`预加载spine动画 ${spineName} 完成（缓存中获取）`);
        } else {
          spineData = await loadResource('load', 'resources', `Spines/RollSpine/${spineName}`, sp.SkeletonData);
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

    // 获取resource中所有role资源名称列表
    getRollResourceNames(): string[] {
      return Object.keys(ROLL_RESOURCE_NAMES).map(key => ROLL_RESOURCE_NAMES[key]);
    }
}
