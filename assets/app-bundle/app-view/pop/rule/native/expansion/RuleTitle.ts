import { _decorator, Component, Label, Node, UITransform, Widget } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('RuleTitle')
export class RuleTitle extends Component {
    @property(Label)
    private titleNode: Label = null;

    @property(Node)
    private titleBgNode: Node = null;

    start() {

    }

    init(obj: { title: string }) {
      this.titleNode.string = obj.title;
      // 动态计算文本宽度并调整父视图
      this.updateTitleWidth();
    }

    /**
     * 计算文本的实际宽度并动态调整父视图宽度
     */
    private updateTitleWidth() {
      // 等待一帧确保文本渲染完成
      this.scheduleOnce(() => {
        this.calculateAndUpdateWidth();
      }, 0);
    }

    /**
     * 计算并更新宽度
     */
    private calculateAndUpdateWidth() {
      const titleTransform = this.titleNode.getComponent(UITransform);
      const bgTransform = this.titleBgNode.getComponent(UITransform);
      
      // 使用简单算法计算英文文本宽度
      const calculatedWidth = this.calculateEnglishTextWidth();
      console.log('calculatedWidth', calculatedWidth);
      
      // 获取实际渲染宽度作为备选
      let actualWidth = titleTransform.width;
      
      if (this.titleNode.overflow === Label.Overflow.RESIZE_HEIGHT) {
        actualWidth = this.titleNode.node.getComponent(UITransform).width;
      }
      
      // 使用算法计算结果，如果算法结果合理则优先使用
      const titleWidth = calculatedWidth > 0 ? calculatedWidth : actualWidth;
      
      // 确保最小宽度
      const minWidth = 200;
      const finalWidth = Math.max(titleWidth, minWidth);
      
      // 设置背景宽度，添加左右边距
      // 左右各50的边距
      const padding = 100;
      bgTransform.setContentSize(finalWidth + padding, bgTransform.height);
      console.log('calculatedWidth1', bgTransform.width);
      
      // 更新widget
      const widget = this.titleBgNode.getComponent(Widget);
      
      if (widget) {
        widget.updateAlignment();
      }
    }

    /**
     * 简单的英文文本宽度计算算法
     * @returns 计算出的文本宽度
     */
    private calculateEnglishTextWidth(): number {
      const text = this.titleNode.string;
      const fontSize = this.titleNode.fontSize;
      
      if (!text || fontSize <= 0) {
        return 0;
      }

      // 简单算法：每个字符平均宽度约为字体大小的0.6倍
      // 大写字母稍宽，小写字母稍窄，但平均下来0.6比较准确
      const averageCharWidth = fontSize * 0.6;
      const textWidth = text.length * averageCharWidth;
      
      return Math.ceil(textWidth);
    }

    /**
     * 更新标题文本并重新计算宽度
     */
    public updateTitle(newTitle: string) {
      this.titleNode.string = newTitle;
      this.updateTitleWidth();
    }

    /**
     * 获取计算出的文本宽度
     * @returns 文本宽度
     */
    public getCalculatedTextWidth(): number {
      return this.calculateEnglishTextWidth();
    }

    update() {
        
    }
}
