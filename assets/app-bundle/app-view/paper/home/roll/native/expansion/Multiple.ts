import { _decorator, Node, Sprite, SpriteFrame } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { SlotsController } from 'db://assets/app-builtin/app-controller/SlotsController';
import { app } from 'db://assets/app/app';

const { ccclass, property } = _decorator;

// 普通模式倍率
const MULTIPLE_NORMAL = [1, 2, 3, 5];
// 免费轮倍率
const MULTIPLE_FREESPINS = [2, 4, 6, 10];

/**
 * 倍率组件
 */
@ccclass('Multiple')
export class Multiple extends BaseView.BindController(SlotsController) {
    @property({ type: [SpriteFrame], tooltip: 'MultipleSpriteFrame' })
    private MultipleSpriteFrames: SpriteFrame[] = [];

    @property({ type: [Node], tooltip: 'MultipleNodes' })
    private MultipleNodes: Node[] = [];

    @property({ type: SpriteFrame, tooltip: 'MultipleBgNormalSpriteFrame' })
    private MultipleBgNormalSpriteFrame: SpriteFrame;

    @property({ type: SpriteFrame, tooltip: 'MultipleBgFreespinSpriteFrame' })
    private MultipleBgFreespinSpriteFrame: SpriteFrame;

    private spriteFrameMap: Map<string, SpriteFrame> = new Map();

    private selectedMultipleIndex: number = 0;

    protected onLoad(): void {
      this.initSpriteFrameMap();

      app.manager.event.on('multipleIndexChange', this.multipleIndexChange, this);

      this.controller.on(SlotsController.Event.FreeSpinChange, this.startFreeSpinChange, this);
    }

    /**
     * 初始化倍率SpriteFrameMap
     */
    private initSpriteFrameMap() {
      this.MultipleSpriteFrames.forEach((spriteFrame) => {
        this.spriteFrameMap.set(spriteFrame.name, spriteFrame);
      });
    }

    /**
     * 获取倍率SpriteFrame
     * @param key 倍率SpriteFrame名称
     * @returns 倍率SpriteFrame
     */
    private getSpriteFrame(key: string) {
      return this.spriteFrameMap.get(key);
    }

    /**
     * 获取当前模式下的倍率数组
     * @returns 当前模式下的倍率数组
     */
    private getCurrentMultiples(): number[] {
      return app.controller.slots.isFreeSpin ? MULTIPLE_FREESPINS : MULTIPLE_NORMAL;
    }

    /**
     * 倍率索引改变
     * @param index 倍率索引
     */
    async multipleIndexChange(index: number) {
      if (index === this.selectedMultipleIndex) {
        return;
      }

      const multiples = this.getCurrentMultiples();

      // 设置当前选中倍率图片为on
      const selectedNode = this.MultipleNodes.find((node) => node.name === `multiple_${index}`);
      selectedNode.getComponent(Sprite).spriteFrame = this.getSpriteFrame(`multiple_${multiples[index]}_on`);

      // 设置之前选中倍率图片为off
      const beforeSelectedNode = this.MultipleNodes.find((node) => node.name === `multiple_${this.selectedMultipleIndex}`);
      beforeSelectedNode.getComponent(Sprite).spriteFrame = this.getSpriteFrame(`multiple_${multiples[this.selectedMultipleIndex]}_off`);

      this.selectedMultipleIndex = index;
    }

    /**
     * 免费轮状态改变
     * @param isFreeSpin 是否免费轮
     */
    private startFreeSpinChange(isFreeSpin: boolean) {
      this.selectedMultipleIndex = 0;

      // 设置背景
      this.node.getComponent(Sprite).spriteFrame = isFreeSpin ? this.MultipleBgFreespinSpriteFrame : this.MultipleBgNormalSpriteFrame;

      // 设置选中倍率
      this.MultipleNodes.forEach((node, index) => {
        const multiple = isFreeSpin ? MULTIPLE_FREESPINS[index] : MULTIPLE_NORMAL[index];
        node.getComponent(Sprite).spriteFrame = this.getSpriteFrame(`multiple_${multiple}_${index === this.selectedMultipleIndex ? 'on' : 'off'}`);
      });
    }

    protected onDestroy(): void {
      app.manager.event.off('multipleIndexChange', this.multipleIndexChange, this);

      this.controller.off(SlotsController.Event.FreeSpinChange, this.startFreeSpinChange, this);
    }
}
