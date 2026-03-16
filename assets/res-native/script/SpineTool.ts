import { _decorator, Component, Node, Skeleton, sp } from 'cc';

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
      }
    } catch (error) {
      console.error('销毁动画节点失败:', error);
    }
  }

  /**
   * 获取 Spine 的动画状态。Cocos 不同版本可能用 getState() 或 animationState 属性，此处做兼容。
   */
  private static _getAnimationState(skeleton: sp.Skeleton): sp.spine.AnimationState | null {
    if (!skeleton) return null;
    const sk = skeleton as unknown as { getState?: () => sp.spine.AnimationState; animationState?: sp.spine.AnimationState };
    if (typeof sk.getState === 'function') return sk.getState() || null;

    return sk.animationState ?? null;
  }

  /**
     * 让 Spine 动画在播放完成后停在指定的某一帧
     * 
     * @param spineNode - Spine 节点组件 (sp.Skeleton)
     * @param targetFrameIndex - 目标帧索引 (从 0 开始)
     * @param trackIndex - 轨道索引，默认为 0
     * @param fps - Spine 资源的帧率，默认为 30 (需与 Spine 导出设置一致)
     * @remarks 必须在已设置 skeletonData 并至少调用过 setAnimation 之后再调用，否则 state 可能为 null
     */
  public static stopAtFrameOnComplete(
    spineNode: sp.Skeleton, 
    targetFrameIndex: number, 
    trackIndex: number = 0, 
    fps: number = 30
  ): void {
    if (!spineNode ) {
      console.warn('SpineUtils: 无效的 Spine 节点或未初始化 state。请确保已设置 skeletonData 并已调用 setAnimation 后再调用本方法。', spineNode);

      return;
    }
    
    // 定义处理函数
    const onAnimComplete = () => {
      // 移除监听器 (虽然 once 会自动移除，但为了逻辑清晰显式说明)
      spineNode.setCompleteListener(null);
      console.log('onAnimComplete');
        
      // 执行定格
      this._freezeAtFrame(spineNode, targetFrameIndex, trackIndex, fps);
    };

    spineNode.setCompleteListener(onAnimComplete);
  }

  /**
 * 内部核心方法：执行真正的定格操作
 */
  public static _freezeAtFrame(
    spineNode: sp.Skeleton, 
    targetFrameIndex: number, 
    trackIndex: number, 
    fps: number
  ): void {
    const te = spineNode.getCurrent(0) as sp.spine.TrackEntry;
    if(!te) return;
    // 算出帧对应的时间
    let time;

    if (targetFrameIndex === -1) {
      // 最后一帧
      time = te.animation.duration; 
    } else if (targetFrameIndex > 1) {
      // 根据帧率算出对应时间，spine帧率是30
      time = (targetFrameIndex - 1) / fps;  
    } else {
      time = 0;
    }

    // 对time作限制
    if (time < 0) time = 0;
    // 太精确的话，动画会停在首帧，所以要减一点
    if (time >= te.animation.duration) time = te.animation.duration - 0.01; 
    // 让动画停止
    te.timeScale = 0;
    te.trackTime = time;
  }
}
