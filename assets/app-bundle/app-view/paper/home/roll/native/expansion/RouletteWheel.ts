import { _decorator, Component, Node, Label, tween, UITransform, instantiate, Vec3, Sprite, Input, EventTouch, SpriteFrame, CCFloat } from 'cc';
import { app } from 'db://assets/app/app';

const { ccclass, property } = _decorator;

@ccclass('RouletteWheel')
export class RouletteWheel extends Component {
  @property(Node)
  private wheelNode: Node = null;

  @property(Node)
  private ItemNode: Node = null;

  @property(SpriteFrame)
  private chooseSprite: SpriteFrame = null;

  @property(SpriteFrame)
  private unChooseSprite: SpriteFrame = null;

  @property({ tooltip: '可视区域宽度' })
  private viewWidth: number = 750;

  @property({ type: CCFloat, tooltip: '可视区域高度' })
  private viewHeight: number = 300;

  @property({ type: CCFloat, tooltip: '选中item缩放' })
  private selectedScale: number = 1.0;

  @property({ type: CCFloat, tooltip: '未选中item缩放' })
  private unselectedScale: number = 0.9;

  @property({ type: CCFloat, tooltip: '滑动动画时长' })
  private animationDuration: number = 0.3;

  @property({ type: CCFloat, tooltip: '滑动敏感度' })
  private swipeSensitivity: number = 2.0;
  
  protected onLoad(): void {
    app.manager.event.on('multipleIndexChange', this.multipleIndexChange, this);
  }

  private multipleIndexChange(index: number) {
    console.log('multipleIndexChange', index);
  }

  protected onDestroy(): void {
    app.manager.event.off('multipleIndexChange', this.multipleIndexChange, this);
  }
}
