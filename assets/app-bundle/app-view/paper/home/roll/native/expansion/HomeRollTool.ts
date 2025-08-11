import { _decorator, EventTouch, Intersection2D, isValid, math, Node, PolygonCollider2D, sp, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { GameResourceManager, SPINE_RESOURCE_NAMES } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';

const { ccclass,  } = _decorator;

@ccclass('HomeRollTool')
export class HomeRollTool  {
  /**
   * scatter显示散射光环动画
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
    const skeleonData = await spineManager.getSpineAnimationDataByName(SPINE_RESOURCE_NAMES.LAMANG_SWORD_HIT);

    if (skeleonData != null) {
      // 创建spine节点并设置大小
      const spineNode = this.createSpineNode(targetNode, overlayNode, 0.8);

      return new Promise<void>(async (resolve) => {
        try {
          // 添加动画
          const skeleton = spineNode.getComponent(sp.Skeleton) || spineNode.addComponent(sp.Skeleton);
          skeleton.premultipliedAlpha = false;
          skeleton.skeletonData = skeleonData;
          skeleton.setAnimation(0, 'wheelhalo', false);
          skeleton.setCompleteListener(() => {
            this.destoryAnimationNode(spineNode);
            console.log('播放剑动画完成-数据', 'wheelhalo');
            resolve();
          });
        } catch (error) {
          console.error('加载spine/LamAng_wild动画失败', error);
          this.destoryAnimationNode(spineNode);
          resolve();
        }
      });
    } else {
      return Promise.resolve();
    }
  }

  /**
   * 创建并配置spine节点
   * @param {Node} targetNode - 目标节点
   * @param {Node} overlayNode - 覆盖节点
   * @param {number} scaleRatio - 缩放比例
   * @returns {Node} 配置好的spine节点
   */
  private createSpineNode(targetNode: Node, overlayNode: Node, scaleRatio: number = 0.8): Node {
    const targetTransform = targetNode.getComponent(UITransform);
    const spineNode = new Node('spineNode');
    
    // 设置UITransform组件
    const spineTransform = spineNode.addComponent(UITransform);
    spineTransform.setContentSize(targetTransform.width, targetTransform.height);
    
    // 设置缩放
    spineNode.setScale(scaleRatio, scaleRatio, 1);
    spineNode.layer = overlayNode.layer;
    
    // 添加到覆盖节点
    overlayNode.addChild(spineNode);
    
    // 设置位置
    const parent = targetNode.parent;
    spineNode.setPosition(parent.position.x, parent.position.y, parent.position.z);
    
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
   * 根据节点大小自适应Skeleton
   * @param {Node} skeletonNode - Skeleton节点
   * @param {Node} targetNode - 目标节点
   * @param {boolean} maintainAspectRatio - 是否保持宽高比
   */
  fitSkeletonToNode(skeletonNode: Node, targetNode: Node, maintainAspectRatio: boolean = true): void {
    const targetTransform = targetNode.getComponent(UITransform);
    const skeletonTransform = skeletonNode.getComponent(UITransform);
    
    if (targetTransform && skeletonTransform) {
      if (maintainAspectRatio) {
        // 保持宽高比，取较小的缩放比例
        const scaleX = targetTransform.width / skeletonTransform.width;
        const scaleY = targetTransform.height / skeletonTransform.height;
        const scale = Math.min(scaleX, scaleY);
        
        skeletonNode.setScale(scale, scale, 1);
      } else {
        // 直接拉伸到目标大小
        skeletonTransform.setContentSize(targetTransform.width, targetTransform.height);
      }
    }
  }

  destoryAnimationNode(aniNode: Node) {
    aniNode.getComponent(sp.Skeleton)?.destroy();
    aniNode.destroy();
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
}
