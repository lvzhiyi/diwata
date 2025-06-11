import { _decorator, Component, screen, Sprite, Vec3, view } from 'cc';

// import { AdaptUtils } from '../scripts/AdaptUtils';
const { ccclass } = _decorator;

@ccclass('BackgroundMask')
export class BackgroundMask extends Component {
  protected onLoad(): void {
    this.onWindowResize();
  }

  start() {
    screen.on('window-resize', this.onWindowResize, this);
    // this.adjustBlurSize();
  }

  onWindowResize() {
    // AdaptUtils.adjustCanvasResolution();
    this.adaptMaskSize();
  }

  private adaptMaskSize(): void {
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;

    const screenSize = { width: innerWidth, height: innerHeight };
    const designSize = view.getDesignResolutionSize();

    const scaleX = screenSize.width / designSize.width;
    const scaleY = screenSize.height / designSize.height;

    const finalScale = Math.min(scaleX, scaleY);

    // 当前canvas节点被缩放后的真实宽度
    const nodeRealWidth = (innerWidth / scaleX) * finalScale;
    // 整体缩放大小
    const wholeScale = innerWidth / nodeRealWidth;

    if (wholeScale > 1) {
      this.node.scale = new Vec3(wholeScale, wholeScale, 1);
    }
  }

  private adjustBlurSize(): void {
    // 获取 Sprite 组件
    const sprite = this.node.getComponent(Sprite);

    // 获取材质实例
    const material = sprite.customMaterial;

    if (!material) {
      return;
    }

    // 调整模糊程度 (0-1)
    material.setProperty('blurriness', 0.5);
    console.log('blurriness', material.getProperty('blurriness'));
    // 调整模糊等级 (1-3)
    material.setProperty('blurLevel', 2);
    console.log('blurLevel', material.getProperty('blurLevel'));

    // 调整模糊区域大小
    material.setProperty('blurSize', [100, 100]);
    console.log('blurSize', material.getProperty('blurSize'));
  }
}
