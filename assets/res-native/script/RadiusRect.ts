import { _decorator, CCFloat, Color, Component, Graphics, Node, Sprite, UITransform } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('RadiusRect')
export class RadiusRect extends Component {
    @property(CCFloat)
    private width = 200;

    @property(CCFloat)
    private height = 200;

    @property({ type: Color, tooltip: '背景色' })
    private color = new Color().fromHEX('#00000000');

    @property(CCFloat)
    private radius = 0;

    protected onLoad(): void {
      this.initColor(this.color);
    }

    private initColor(color: Color) {
      let graphics = this.node.getComponent(Graphics);

      if (!graphics) {
        graphics = this.node.addComponent(Graphics);
      }

      graphics.clear();
      graphics.roundRect(- this.width / 2, - this.height / 2, this.width, this.height, this.radius);
      graphics.fillColor = color;
      graphics.fill();
    }

    setColor(color: Color) {
      setTimeout(() => {
        this.initColor(color);
      }, 0);
    }

    setWidth(width: number) {
      this.node.getComponent(UITransform).setContentSize(width, this.node.getComponent(UITransform).height);
      this.width = width;
      this.initColor(this.color);
    }

    setHeight(height: number) {
      this.node.getComponent(UITransform).setContentSize(this.node.getComponent(UITransform).width, height);
      this.height = height;
      this.initColor(this.color);
    }
    
    draw(width?: number, height?: number, radius?: number, color?: Color) {
      if (width) {
        this.node.getComponent(UITransform).setContentSize(width, this.node.getComponent(UITransform).height);
      }
      if (height) {
        this.node.getComponent(UITransform).setContentSize(this.node.getComponent(UITransform).width, height);
      }

      this.width = width || this.width; 
      this.height = height || this.height;
      this.radius = radius || this.radius;
      this.color = color || this.color;
      this.initColor(color);
    }
}
