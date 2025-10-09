import {
  _decorator,
  Color,
  Component,
  Director,
  director,
  Label,
  Node,
  RichText,
  tween,
  UITransform,
  Vec3,
} from 'cc';
import { RadiusRect } from 'db://assets/res-native/script/RadiusRect';

const { ccclass } = _decorator;

/// 跑马灯
@ccclass('Marquee')
export class Marquee extends Component {
    public isGoing = false;

    private parentWidth: number;

    private moveDistance: number;

    private bgScript: RadiusRect;

    protected onLoad(): void {
      this.parentWidth = this.node.getComponent(UITransform).width;

      this.node.getComponent(UITransform).setContentSize(this.parentWidth, this.node.getComponent(UITransform).height);
        
      this.bgScript = this.node.getChildByName('Bg').getComponent(RadiusRect);
      this.bgScript.setColor(new Color().fromHEX('#00000000'));
      this.bgScript.setWidth(this.parentWidth);
    }

    startMove(text: string, cb: { (): void; (): void; (): void; }) {
      this.isGoing = true;

      const labelNode = this.initLabel(text);

      director.once(Director.EVENT_AFTER_DRAW, () => {
        const { width } = labelNode.getComponent(UITransform);

        const startWidth = this.parentWidth > width ? (this.parentWidth - width) / 2 + width : (width - this.parentWidth) / 2 + this.parentWidth;

        this.moveDistance = this.parentWidth + width;

        // 内容设置到起始点
        labelNode.setPosition(startWidth, labelNode.position.y - 5);

        this.bgScript.setColor(new Color().fromHEX('#04211B66'));

        this.move(labelNode, () => {
          this.bgScript.setColor(new Color().fromHEX('#00000000'));
          cb?.();
          this.node.removeChild(labelNode);
        });
      });
    }

    initLabel(text: string) {
      const labelNode = new Node();
      labelNode.layer = this.node.layer;
      labelNode.addComponent(UITransform);
      labelNode.getComponent(UITransform).setContentSize(this.parentWidth, this.node.getComponent(UITransform).height);
      const label = labelNode.addComponent(RichText);
      label.string = this.highlightCurrency(text);
      // 先移出屏幕外，等计算完宽度后再设置到起始点
      labelNode.setPosition(2000, labelNode.position.y - 5);
      this.node.addChild(labelNode);

      return labelNode;
    }

    /**
     * 金额高亮处理
     * @param text 原始文本
     * @param color 颜色值（默认#fff600）
     * @returns 处理后的富文本
     */
    highlightCurrency(text: string, color: string = '#fff600'): string {
      // 匹配通用货币格式（支持₱$€¥等符号 + 数字 + 可选小数）
      const currencyRegex = /([₱$€¥])(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g;
      console.log('highlighted-text', text);
      const highlighted = text.replace(currencyRegex, (match, symbol, amount) => {
        return `<color=${color}>${symbol}${amount}</color>`;
      });
      console.log('highlighted', highlighted);

      return `<color=#FFFFFF><b><size=28>${highlighted}</size></b></color>`;
    }

    move(labelNode: Node, cb: { (): void; (): void; }) {
      tween(labelNode).by(this.moveDistance / this.parentWidth * 4, { position: new Vec3(-this.moveDistance, 0, 0) }).call(() => {
        this.isGoing = false;
        cb?.(); 
      }).start();
    }
}
