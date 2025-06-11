import { _decorator, Component, find, Label, Node, Tween, tween, UIOpacity, UITransform } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('WeakToast')
export class WeakToast extends Component {
    @property(Label)
    private label: Label = null;

    private pageNode: Node = null;

    private tween: Tween<UIOpacity> = null;

    private isShow: boolean = false;

    /**
     * 显示Toast提示
     * @param text 提示文本
     * @param duration 显示时长(毫秒)
     * @param position 相对位置，可以是数值
     * @param positionType 位置类型，'top'、'bottom'或不传（居中）
     */
    showToast(text: string, duration: number = 2000, position: number = 0, positionType?: 'top' | 'bottom') {
      this.label.string = text;

      const { width, height } = this.getLabelRealSize(this.label);

      if (this.isShow) {
        this.tween?.stop();
      } else {
        this.isShow = true;
        this.pageNode = find('Canvas');
        this.pageNode.addChild(this.node);
        this.node.setSiblingIndex(9999);
      }

      this.scheduleOnce(() => {
        // this.bgNode.getComponent(UITransform).width = width + 250;
        // this.bgNode.getComponent(UITransform).height = height + 30;
            
        // 设置相对位置
        if (positionType === 'top') {
          this.node.setPosition(0, position, 0);
        } else if (positionType === 'bottom') {
          this.node.setPosition(0, -position, 0);
        } else {
          // 不传positionType时居中显示
          this.node.setPosition(0, 0, 0);
        }

        this.tween = tween(this.node.getComponent(UIOpacity))
          .to(0.2, { opacity: 255 })
          .delay(duration / 1000)
          .to(0.2, { opacity: 0 })
          .call(() => {
            this.isShow = false;
            this.tween = null;
          })
          .start();
      });
    }

    /**
     * 获取 Label 的真实宽高（自动处理换行）
     * @param label 目标 Label 组件
     * @param maxWidth 最大允许宽度（超出则换行）
     * @returns { width: number, height: number } 真实宽高
     */
    getLabelRealSize(label: Label, maxWidth: number = 800): { width: number, height: number } {
      if (!label?.node) return { width: 0, height: 0 };
    
      // 方法1：使用最可靠的尺寸获取方式
      const getActualSize = () => {
        // // 方案A：优先使用getBoundingBox
        // if (label.node.getBoundingBox) {
        //     const rect = label.node.getBoundingBox();
        //     return { width: rect.width, height: rect.height };
        // }
            
        // 方案B：使用UITransform
        const uiTransform = label.node.getComponent(UITransform);

        if (uiTransform) {
          return { width: uiTransform.width, height: uiTransform.height };
        }
            
        // 方案C：回退方案
        return { 
          width: (label.node as any)._contentSize?.width || 0,
          height: (label.node as any)._contentSize?.height || 0
        };
      };
    
      // 强制更新Label渲染
      const forceUpdate = () => {
        // 方法1：修改文本强制刷新
        const original = label.string;
        label.string = original + ' ';
        label.string = original;
            
        // 方法2：调用可能存在的更新方法
        label.updateRenderData?.(true);
        // label['_updateRenderData']?.();
            
        // 方法3：等待下一帧
        label.node.once(Node.EventType.TRANSFORM_CHANGED, () => {});
      };
    
      // 测量单行宽度
      label.overflow = Label.Overflow.NONE;
      forceUpdate();
      const { width: singleLineWidth } = getActualSize();
    
      // 处理换行情况
      if (singleLineWidth > maxWidth) {
        label.overflow = Label.Overflow.RESIZE_HEIGHT;
        const uiTransform = label.node.getComponent(UITransform);
        if (uiTransform) uiTransform.width = maxWidth;
        forceUpdate();
      }
    
      // 返回最终尺寸
      return getActualSize();
    }
    
    onDestroy() {
      this.node.destroy();
    }
}
