import { _decorator, Component, Node, sp } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('SpineTool')
export class SpineTool  {
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
        skeleton.setToSetupPose();
        
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

  /**
   * 清除动画Node
   */
  static clearAnimationNode(animationNode: Node) {
    if (!animationNode || !animationNode.isValid) {
      return;
    }

    try {
      const skeleton = animationNode.getComponent(sp.Skeleton);

      if (skeleton) {
        // 清除所有事件监听器
        skeleton.setCompleteListener(null);
        skeleton.setEventListener(null);
        skeleton.setToSetupPose();
        
        // 清除动画数据引用
        skeleton.skeletonData = null;
        
        // 停止所有动画
        skeleton.clearTracks();
        
        // 销毁组件
        skeleton.destroy();
      }
    } catch (error) {
      console.error('销毁动画节点失败:', error);
    }
  }
}
