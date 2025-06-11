import { _decorator, CCFloat, Color, Component, Graphics } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('Circle')
export class Circle extends Component {
    @property({
      type: CCFloat,
      tooltip: '半径',
    })
    private r = 200;

    @property({ type: Color, tooltip: '背景色' })
    private color = new Color().fromHEX('#00000000');

    private graphics: Graphics;

    protected onLoad(): void {
      this.init();
    }

    private init() {
      this.graphics = this.node.getComponent(Graphics);

      if (!this.graphics) {
        this.graphics = this.node.addComponent(Graphics);
      }

      this.drawCircle();
    }

    // 画圆
    drawCircle(color: Color | null = null) {
      // 清空画布
      this.graphics.clear(); 
      // 设置线宽
      this.graphics.lineWidth = 5; 
      // 设置颜色
      this.graphics.strokeColor = color ?? new Color().fromHEX('#ffffff'); 
      // 绘制圆圈，参数为 (x, y, 半径)
      this.graphics.circle(0, 0, 40); 
      // 描边完
      this.graphics.stroke(); 
    }

    // 画边框
    drawBorder(lineWidth = 3, color: Color | null = null) {
      this.graphics.clear();
      this.graphics.circle(0, 0, this.r);
      this.graphics.strokeColor = color ?? new Color().fromHEX('#ffffff');
      this.graphics.lineWidth = lineWidth;
      this.graphics.stroke();
    }
}
