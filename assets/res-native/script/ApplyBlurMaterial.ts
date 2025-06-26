import { _decorator, Component, Sprite, Material, resources, Vec2 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ApplyBlurMaterial')
export class ApplyBlurMaterial extends Component {
    // 模糊强度
    @property
    blurRadius: number = 5.0;

    // 模糊方向：true为水平方向，false为垂直方向
    @property
    horizontal: boolean = true;

    // 材质资源路径
    private readonly blurMaterialPath = 'materials/gaussian-blur';

    start() {
      // 加载材质
      resources.load(this.blurMaterialPath, Material, (err, mat) => {
        if (err) {
          console.error(err);

          return;
        }

        // 复制材质（避免共享）
        const material = mat as Material;
        const newMat = new Material();
        newMat.copy(material);

        // 设置初始参数
        const sprite = this.node.getComponent(Sprite);

        if (sprite) {
          const size = sprite.spriteFrame?.getRect();

          if (size) {
            newMat.setProperty('resolution', new Vec2(size.width, size.height));
          }

          newMat.setProperty('blurRadius', this.blurRadius);
          newMat.setProperty('direction', this.horizontal ? new Vec2(1, 0) : new Vec2(0, 1));

          // 应用材质
          sprite.customMaterial = newMat;
        }
      });
    }

    // 更新模糊强度（如果需要动态改变）
    setBlurRadius(radius: number) {
      this.blurRadius = radius;
      const sprite = this.node.getComponent(Sprite);

      if (sprite && sprite.customMaterial) {
        sprite.customMaterial.setProperty('blurRadius', this.blurRadius);
      }
    }

    // 设置模糊方向
    setBlurDirection(isHorizontal: boolean) {
      this.horizontal = isHorizontal;
      const sprite = this.node.getComponent(Sprite);

      if (sprite && sprite.customMaterial) {
        sprite.customMaterial.setProperty('direction', isHorizontal ? new Vec2(1, 0) : new Vec2(0, 1));
      }
    }
}