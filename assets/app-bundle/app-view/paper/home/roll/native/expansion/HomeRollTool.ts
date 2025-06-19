import { _decorator, Node, sp, UITransform, Vec3 } from 'cc';
import { GameResourceManager, SPINE_RESOURCE_NAMES } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';

const { ccclass,  } = _decorator;

@ccclass('HomeRollTool')
export class HomeRollTool  {
  /**
   * scatter显示散射光环动画
   * @param {Node} targetNode - 需要显示光环动画的目标节点
   * @param {Node} overlayNode - 用于显示光环动画的覆盖节点
   * @returns {Promise<void>} - 返回一个在动画完成时解析的 Promise
   */
  async showSwordHaloAnimation(
    targetNode: Node,
    overlayNode: Node,
  ): Promise<void> {
    const spineManager = GameResourceManager.instance;
    const skeleonData = await spineManager.getSpineAnimationDataByName(SPINE_RESOURCE_NAMES.LAMANG_SWORD_HIT);

    if (skeleonData != null) {
      // 深拷贝目标节点
      const targetTransForm = targetNode.getComponent(UITransform);
      const spineNode = new Node('spineNode');
      const trasform = spineNode.addComponent(UITransform);
      trasform.setContentSize(targetTransForm.width, targetTransForm.height);
      spineNode.setScale(0.8, 0.8, 1);
      spineNode.layer = overlayNode.layer;
      // 将克隆的节点添加到 createOverlayNode
      overlayNode.addChild(spineNode);
      const parent = targetNode.parent;
      // 设置克隆节点的位置
      spineNode.setPosition(parent.position.x, parent.position.y, parent.position.z);

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

  destoryAnimationNode(aniNode: Node) {
    aniNode.getComponent(sp.Skeleton)?.destroy();
    aniNode.destroy();
  }
}
