import { _decorator, CCFloat, Color, Component, Graphics, UITransform } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BackgroundRadius')
export class BackgroundRadius extends Component {
    @property({ type: Color, tooltip: '背景色' })
    private backgroundColor: Color = new Color().fromHEX('#FFFFFF');

    @property({ type: CCFloat, tooltip: '圆角' })
    private cornerRadius: number = 0;

    protected onLoad(): void {
      this.updateBackground();
    }

    private updateBackground(): void {
      let graphics = this.node.getComponent(Graphics);

      if (!graphics) {
        graphics = this.node.addComponent(Graphics);
      }

      graphics.clear();
      const uiTransform = this.node.getComponent(UITransform);

      if (!uiTransform) {
        console.error('UITransform component is missing on the node.');

        return;
      }

      const width = uiTransform.width;
      const height = uiTransform.height;
      graphics.roundRect(-width / 2, -height / 2, width, height, this.cornerRadius);
      graphics.fillColor = this.backgroundColor;
      graphics.fill();
    }

    public setBackgroundColor(color: Color): void {
      this.backgroundColor = color;
      this.updateBackground();
    }

    public setCornerRadius(radius: number): void {
      this.cornerRadius = radius;
      this.updateBackground();
    }
    
    start() {

    }

    update(deltaTime: number) {
        
    }
}
