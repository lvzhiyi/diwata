import { _decorator, Component, instantiate, Node, Prefab, resources, sp, SpriteAtlas, SpriteFrame } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('GameResourceManager')
export class GameResourceManager  {
    private static _instance: GameResourceManager = null;

    // 图片的动画集合字典
    private spineAnimations: { [key: string]: sp.SkeletonData } = {};

    // 图标的集合字典
    private iconTextures: { [key: string]: SpriteFrame } = {};

    private spinePool: Node[] = [];
  
    private _toastNode: Node = null;
  
    // 单例访问方法
    public static getInstance(): GameResourceManager {
      if (!this._instance) {
        // 如果没有实例，则在场景中查找或创建
        this._instance = new GameResourceManager();
      }

      return this._instance;
    }

    // 预加载所有 ICon 图片
    preloadLocalICons() {
      return new Promise<void>((resolve) => {
        const imagePath = 'Images/icons/rollIcon/rollIcon';
        resources.load(imagePath, SpriteAtlas, (err, atlas) => {
          if (err) {
            console.error(`Error loading ${atlas}:`, err);
            // 继续处理其他动画
            resolve();
          } else {
            this.iconTextures = atlas.spriteFrames;
            console.log('atlas', this.iconTextures, atlas.getSpriteFrame('1001'));
  
            resolve();
            console.log('所有本地icon动画已经预加载完成');
          }
        });
      });
    }
  
    //  预加载所有 Spine 动画
    preloadLocalAnimations() {
      const iconNames = this.getSpineImageIndexs();
      const loadPromises = iconNames.map((name) => {
        return new Promise<void>((resolve) => {
          const spinePath = `Images/icons/rollSpine/${name}`;
          resources.load(spinePath, sp.SkeletonData, (err, skeletonData) => {
            // console.log(name);
            if (err) {
              console.error(`Error loading ${name}:`, err);
              resolve(); 
            } else {
              // 存储加载的动画
              this.spineAnimations[name] = skeletonData; 
              resolve();
            }
          });
        });
      });
      Promise.all(loadPromises).then(() => {
        console.log('所有本地spine动画已经预加载完成');
      });
    }
  
    // 获取 Spine 动画实例
    getSpineAnimationDataWithName(indexName: string): sp.SkeletonData | null {
      if (Object.keys(this.spineAnimations).length > 0) {
        const skeletonData = this.spineAnimations[indexName];

        return skeletonData;
      } else {
        return null;
      }
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
      }else{
        return this._toastNode;
      }
    }
  
    getSpineImageIndexs(): string[] {
      return [
        '1001',
        '1002',
        '1003',
        '1004',
        '1005',
        '2001',
        '2002',
        '2003',
        '2004',
        '2005',
        '3001',
        '4001',
        '4002',
        '4003',
        '4004',
        '4005',
        '4006',
        '4007',
        'bk',
        'bz',
        'skeleton',
        'wheelhalo',
        'bianhuan',
        'trans_wild'
      ];
    }
  
    getIconImageIndexs(): string[] {
      return [
        '1001',
        '1002',
        '1003',
        '1004',
        '1005',
        '2001',
        '2002',
        '2003',
        '2004',
        '2005',
        '3001',
        '4001',
        '4002',
        '4003',
        '4004',
        '4005',
        '4006',
        '4007',
      ];
    }
}
