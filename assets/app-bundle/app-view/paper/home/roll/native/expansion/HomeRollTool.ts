import { _decorator, EventTouch, instantiate, isValid, math, Node, NodePool, ParticleSystem2D, PolygonCollider2D, Prefab, sp, tween, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { GameResourceManager, ROLL_RESOURCE_NAMES, } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';
import { Symbol } from './Symbol';
import { SymbolType } from 'db://assets/basePlate/middleWare/enums/bet';
import { delay } from 'db://assets/common/script/extra/Utils/common';
import { Roll } from './Roll';
import { app } from 'db://assets/app/app';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass,  } = _decorator;

export interface ChangeWildData {
  node?: Node;
  nodes?: Node[];
  type: SymbolType;
  rollNode?: Node;
  hasShow?: boolean;
  rollIndex?: number;
}
@ccclass('HomeRollTool')
export class HomeRollTool  {
  // private nodePool: NodePool = new NodePool();
  
  // setLightNode(lightNode: Prefab) {
  //   for (let i = 0; i < 6; i++) {
  //     const node = instantiate(lightNode);
  //     node.name = 'lightNode' + i;
  //     this.nodePool.put(node);
  //   }
  // }

  /**
   * 
   * @param {Node} targetNode - 需要显示光环动画的目标节点
   * @param {Node} overlayNode - 用于显示光环动画的覆盖节点
   * @param {number} scaleRatio - 缩放比例，默认为0.8
   * @returns {Promise<void>} - 返回一个在动画完成时解析的 Promise
   */
  async showSwordHaloAnimation(
    targetNode: Node,
    overlayNode: Node,
  ): Promise<void> {
    const spineManager = GameResourceManager.instance;
    const skeleonData = await spineManager.getRollSpineAnimationDataByName(ROLL_RESOURCE_NAMES.SWORD_HIT);

    if (skeleonData != null) {
      // 创建spine节点并设置大小
      const spineNode = this.createSpineNode(targetNode, overlayNode, true);
            
      return new Promise<void>(async (resolve) => {
        // 0.3秒后执行
        setTimeout(() => {
          resolve();
        }, 600);

        try {
          // 添加动画
          const skeleton = spineNode.getComponent(sp.Skeleton) || spineNode.addComponent(sp.Skeleton);
          skeleton.premultipliedAlpha = false;
          skeleton.skeletonData = skeleonData;
          skeleton.timeScale = app.manager.global.gameSpeed;
       
          // 播放多个动画序列
          EffectManager.inst.playEffect(AudioPath.GAME.SWORD_RETURN, false, null, true);
          HomeRollTool.playAnimationSequence(skeleton, ['dao_atk', 'dao_hit'], async () => {
            console.log('播放剑动画序列完成');
          });
        } catch (error) {
          console.error('加载spine/LamAng_wild动画失败', error);
          this.destoryAnimationNode(spineNode);
        }
      });
    } else {
      return Promise.resolve();
    }
  }

  creatSwordLightSpineNode(targetNode: Node, rollNode: Node): Node[] {
    let lightSpineNodes: Node[] = [];
    const itemCount = rollNode.getComponent(Roll).getItemCount();
    const itemHeight = rollNode.getComponent(Roll).getItemHeight();

    if(itemCount > 0) {
      const rollHeight = (itemCount - 1) * itemHeight;
      const firstSymbolY = rollHeight / 2 - itemHeight / 2;
      
      for (let i = 0; i < itemCount - 1; i++) {
        const lightSpineNode = new Node('DaoSpineNode');
        const spineTransform = lightSpineNode.addComponent(UITransform);
        spineTransform.setContentSize(116, itemHeight);
        
        lightSpineNode.layer = targetNode.layer;

        const skeleton = lightSpineNode.getComponent(sp.Skeleton) || lightSpineNode.addComponent(sp.Skeleton);
        skeleton.premultipliedAlpha = false;
        const symbolY = firstSymbolY - itemHeight * i;
        lightSpineNode.setPosition(0, symbolY, 0);
        
        // 确保父节点存在且有效
        if (targetNode && targetNode.isValid) {
          // 使用 addChild 方法替代 setParent，这样更可靠
          targetNode.addChild(lightSpineNode);
          // 确保节点被激活
          lightSpineNode.active = true;
        } else {
          console.error('目标节点无效，无法添加发光节点:', targetNode);
        }
        
        lightSpineNodes.push(lightSpineNode);
      }
    }

    return lightSpineNodes;
  }

  /**
   * 多个点同时飞向女神的动画
   * */ 
  async showFlyingToGoddessAnimation(
    targetNodes: Node[],
    overlayNode: Node,
    goddessTargetNode: Node,
    lightPrefab: Prefab,
    goddessNode: Node
  ): Promise<void> {
    return new Promise<void>(async (resolve) => {
      targetNodes.forEach((node) => {
        const lightNode = instantiate(lightPrefab);
        lightNode.setParent(overlayNode);
        lightNode.setWorldPosition(node.getWorldPosition());
        tween(lightNode)
          .timeScale(app.manager.global.gameSpeed)
          .to(
            0.65,
            { worldPosition: goddessTargetNode.getWorldPosition(), scale: v3(0.6, 0.6, 1) },
            { easing: 'quadIn' } 
          )
          .call(() => {
            this.forceDestroyParticleNode(lightNode);
            console.log('轨迹动画执行动画完毕');
          })
          .start();
      });
      await delay(500);
      
      // 女神执行动画
      const goddessSkeleton = goddessNode.getComponent(sp.Skeleton) || goddessNode.addComponent(sp.Skeleton);
      goddessSkeleton.premultipliedAlpha = false;
      const animationName = this.getGoddessAnimation(targetNodes);
     
      goddessSkeleton.setAnimation(0, animationName, false);
      goddessSkeleton.setCompleteListener(() => {
        // 女神执行待机动画
        goddessSkeleton.setAnimation(0, 'animation', true);
      });
      await delay(500);
      resolve();
    });
  }

  // 强制销毁粒子节点的方法
  forceDestroyParticleNode(node: Node) {
    if (!node || !node.isValid) return;
  
    // 1. 获取所有粒子系统组件
    const particleSystems = node.getComponent(ParticleSystem2D);
    particleSystems.stopSystem();
    // 禁用粒子系统
    particleSystems.enabled = false;

    // 清除所有已发射的粒子
    if (particleSystems.resetSystem) {
      particleSystems.resetSystem();
    }

    const child = node.getChildByName('Particle2D-001');

    if (child) {
      const particleSystems = child.getComponent(ParticleSystem2D);
      particleSystems.stopSystem();
      // 禁用粒子系统
      particleSystems.enabled = false;
  
      // 清除所有已发射的粒子
      if (particleSystems.resetSystem) {
        particleSystems.resetSystem();
      }
    }

    node.destroy();
    // this.nodePool.put(node);
  }

  /**
   * 播放棍子击中动画
   * */ 
  async showBowHitAnimation(
    targetNodes: Node[],
    overlayNode: Node,
  ): Promise<void> {
    const spineManager = GameResourceManager.instance;
    const skeleonData = await spineManager.getRollSpineAnimationDataByName(ROLL_RESOURCE_NAMES.BOW_EXPLODE);
   
    if (skeleonData != null) {
      return new Promise<void>(async (resolve) => {
        // 0.3秒后执行
        const time = setTimeout(() => {
          clearTimeout(time);
          resolve();
        }, 600 / app.manager.global.gameSpeed);
        EffectManager.inst.playEffect(AudioPath.GAME.STICK_BEAT, false, null, true);
        targetNodes.map(item => {
          // 过滤主元素
          const isMain = item.getComponent(Symbol).currentSymbolItem.main;

          if(!isMain){
            // 创建spine节点并设置大小
            const spineNode = this.createSpineNode(item, overlayNode, false);
            console.log('spineNode', spineNode.name);

            try {
              // 添加动画
              const skeleton = spineNode.getComponent(sp.Skeleton) || spineNode.addComponent(sp.Skeleton);
              skeleton.premultipliedAlpha = false;
              skeleton.skeletonData = skeleonData;
              skeleton.timeScale = app.manager.global.gameSpeed;
              
              skeleton.setAnimation(0, 'gun_atk', false);
           
              skeleton.setCompleteListener((track) => {
                if (track.animation.name === 'gun_atk') {
                }
              });
            } catch (error) {
              console.error('加载spine/gun动画失败', error);
              this.destoryAnimationNode(spineNode);
            }
          }
        });
      });
    } else {
      return Promise.resolve();
    }
  }

  /**
   * 播放女神举手动画
  */
  async showGoddessPraiseAnimation(
    goddessNode: Node
  ): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const goddessSkeleton = goddessNode.getComponent(sp.Skeleton) || goddessNode.addComponent(sp.Skeleton);
      goddessSkeleton.premultipliedAlpha = false;
      // EffectManager.inst.playEffect(AudioPath.GAME.GODDESS_CHEER5);
      goddessSkeleton.setAnimation(0, 'animation5', false);
      goddessSkeleton.setCompleteListener(() => {
        goddessSkeleton.setAnimation(0, 'animation', true);
      });
      resolve();
    });
  }

  /**
   * 根据中的图标决定女神播放什么动效
  */
  getGoddessAnimation(
    changeWildData: Node[]
  ):string{
    const hasSword = changeWildData.some(item => item.getComponent(Symbol).currentSymbolItem.symbolId === SymbolType.SWORD);
    const hasMainBow = changeWildData.some(item => item.getComponent(Symbol).currentSymbolItem.symbolId === SymbolType.BOW);

    if (hasSword && !hasMainBow) {
      EffectManager.inst.playEffect(AudioPath.GAME.GODDESS_CHEER1);

      return 'animation3';
    // 返回女神挥剑animation3
    } else if (!hasSword && hasMainBow) {
      EffectManager.inst.playEffect(AudioPath.GAME.GODDESS_CHEER2);

      return 'animation2';
    } else if (hasSword && hasMainBow) {
      EffectManager.inst.playEffect(AudioPath.GAME.GODDESS_CHEER3);
      // const timeOut = setTimeout(() => {
      //   EffectManager.inst.playEffect(AudioPath.GAME.SWORD_AND_STICK);
      //   clearTimeout(timeOut);
      // }, 500);

      return 'animation4';
    }
  }

  /**
   * 连续播放多个动画
   * @param {sp.Skeleton} skeleton - Spine骨架组件
   * @param {string[]} animationNames - 要播放的动画名称数组
   * @param {Function} onComplete - 所有动画播放完成后的回调
   */
  static  playAnimationSequence(skeleton: sp.Skeleton, animationNames: string[], onComplete: () => void): void {
    if (!animationNames || animationNames.length === 0) {
      onComplete();

      return;
    }

    let currentIndex = 0;
    
    const playNextAnimation = () => {
      if (currentIndex >= animationNames.length) {
        // 所有动画播放完成
        onComplete();

        return;
      }

      const animationName = animationNames[currentIndex];
      console.log(`播放动画: ${animationName}, 索引: ${currentIndex}`);
      
      // 设置动画完成监听器
      skeleton.setCompleteListener(() => {
        currentIndex++;
        
        // 延迟一帧播放下一个动画，确保当前动画完全结束
        setTimeout(() => {
          playNextAnimation();
        }, 0);
      });

      // 播放当前动画
      skeleton.setAnimation(0, animationName, false);
    };

    // 开始播放第一个动画
    playNextAnimation();
  }

  /**
   * 创建并配置spine节点
   * @param {Node} targetNode - 目标节点
   * @param {Node} overlayNode - 覆盖节点
   * @param {number} scaleRatio - 缩放比例
   * @returns {Node} 配置好的spine节点
   */
  private createSpineNode(targetNode: Node, overlayNode: Node, isRoll: boolean = false): Node {
    const targetTransform = targetNode.getComponent(UITransform);
    const spineNodeName = isRoll ? 'spineNoderoll' : 'spineNodeitem';
    const spineNode = new Node(spineNodeName);
    
    // 设置UITransform组件
    const spineTransform = spineNode.addComponent(UITransform);
    spineTransform.setContentSize(targetTransform.contentSize);
    
    spineNode.layer = overlayNode.layer;
    
    // 添加到覆盖节点
    overlayNode.addChild(spineNode);

    if (isRoll) {
      const parent = targetNode.parent;
      spineNode.setPosition(parent.position.x, parent.position.y, parent.position.z);
    }else{
      // 直接使用目标节点的世界坐标来设置 spine 节点的世界坐标
      const targetWorldPos = targetNode.getWorldPosition();
      // 直接设置世界坐标，这样无论在哪一层都能正确显示
      spineNode.setWorldPosition(targetWorldPos.x, targetWorldPos.y, targetWorldPos.z);
    }

    spineNode.active = true;
    
    return spineNode;
  }

  /**
   * 动态调整Skeleton大小
   * @param {Node} skeletonNode - Skeleton节点
   * @param {Node} targetNode - 目标节点（用于参考大小）
   * @param {number} scaleRatio - 缩放比例
   */
  adjustSkeletonSize(skeletonNode: Node, targetNode: Node, scaleRatio: number = 1.0): void {
    const targetTransform = targetNode.getComponent(UITransform);
    const skeletonTransform = skeletonNode.getComponent(UITransform);
    
    if (targetTransform && skeletonTransform) {
      // 设置内容大小
      skeletonTransform.setContentSize(targetTransform.width, targetTransform.height);
      
      // 设置缩放
      skeletonNode.setScale(scaleRatio, scaleRatio, 1);
    }
  }

  /**
   * 移除overlayNode上面的发光节点
  */
  destoryOverlayNodeLight(overlayNode: Node) {
    if(overlayNode.children.length > 0) {
      overlayNode.children.forEach(child => {
        console.log('child', child.name);

        if (child.name === 'spineNodeitem') {
        // 移除spineNode节点
          this.destoryAnimationNode(child);
          child.removeFromParent();
          child.destroy();
        }
        if (child.name === 'spineNoderoll') {
          const lightSpineNodes = child.children;
          lightSpineNodes.forEach(item => {
            this.destoryAnimationNode(item);
            item.destroy();
          });
          child.removeFromParent();
          child.destroy();
        }
      });
    }

    console.log('overlayNode', overlayNode.children.length);
  }

  destoryAnimationNode(aniNode: Node) {
    const skeleton = aniNode.getComponent(sp.Skeleton);

    if(skeleton) {
      // 1. 停止所有动画
      skeleton.clearTracks();
        
      // 2. 移除监听器
      skeleton.setCompleteListener(null);
      skeleton.setEventListener(null);
      
      // 3. 清空动画数据
      skeleton.skeletonData = null;
      
      // 4. 重置到初始状态
      skeleton.setToSetupPose();
      
      // 5. 销毁组件
      skeleton.destroy();
    }
  }

  /**
   * 销毁动画Node
   */
  static destoryAnimationNode(animationNode: Node) {
    if (!animationNode || !animationNode.isValid) {
      return;
    }

    try {
      const skeleton = animationNode.getComponent(sp.Skeleton);

      if (skeleton) {
        // 清除所有事件监听器
        skeleton.setCompleteListener(null);
        skeleton.setEventListener(null);
        
        // 清除动画数据引用
        skeleton.skeletonData = null;
        
        // 停止所有动画
        skeleton.clearTracks();
        
        // 销毁组件
        skeleton.destroy();
      }

      // 销毁节点
      animationNode.destroy();
      animationNode = null;
    } catch (error) {
      console.error('销毁动画节点失败:', error);
      // 强制清理引用
      animationNode = null;
    }
  }

  static playRollStopAudio(rollIndex: number) {
    switch (rollIndex) {
      case 0:
      case 5:
        EffectManager.inst.playEffect(AudioPath.GAME.ROLL_STOP_3, false, null, true);
        break;
      case 1:
      case 4:
        EffectManager.inst.playEffect(AudioPath.GAME.ROLL_STOP_4, false, null, true);
        break;
      case 2:
      case 3:
        EffectManager.inst.playEffect(AudioPath.GAME.ROLL_STOP_5, false, null, true);
        break;
      default:
        break;
    }
  }

  /**
   * 判断点击事件是否在多边形内
   * @param btnNode 按钮节点
   * @param event 触摸事件
   * @returns 是否在多边形内
   */
  static isCheckAreaSuccess(btnNode: Node, event: EventTouch): boolean {
    if (!isValid(btnNode) || !event) {
      return false;
    }

    let collider: PolygonCollider2D = btnNode.getComponent(PolygonCollider2D);
    let mathV2: math.Vec2 = event.getUILocation();
    let local: Vec3 = btnNode.getComponent(UITransform).convertToNodeSpaceAR(v3(mathV2.x, mathV2.y));

    return this.isPointInPolygon(v2(local.x, local.y), collider.points);
  }

  /**
   * 判断点是否在多边形内（射线法）
   * @param point 待检测的点
   * @param polygon 多边形顶点数组
   * @returns 是否在多边形内
   */
  static isPointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
    let inside = false;
    console.log('point', point, polygon);

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * 根据roll所在的Index,返回scatter期待的动画名字
  */
  static getScatterRunAnimationName(rollIndex: number): string {
    switch (rollIndex) {
      case 2:
      case 3:
        return 'chang';
      case 1:
      case 4:
        return 'zhong';
      case 0:
      case 5:
        return 'duan';
      default:
        return '';
    }
  }

  static getRandomIndex(rollIndex: number): number {
    if (rollIndex === 0) {
      return Math.floor(Math.random() * 3) + 0; 
    } else if (rollIndex === 1) {
      return Math.floor(Math.random() * 3) + 3; 
    } else if (rollIndex === 2) {
      return Math.floor(Math.random() * 3) + 6; 
    }
  }
}
