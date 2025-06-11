import { _decorator, Color, Component, find, Graphics, Label, Node, tween, UIOpacity, UITransform } from 'cc';
import { GameResourceManager } from '../serverManager/GameResourceManager';
import { WeakToast } from './WeakToast';

const { ccclass, property } = _decorator;

@ccclass('ToastView')
export class ToastView extends Component {
    private static instance: ToastView | null = null;

    onLoad() {
      if (ToastView.instance === null) {
        ToastView.instance = this;
      } else {
        this.node.destroy();

        return;
      }
    }

    // 新的toast
    public static async showCommonToast(message: string) {
      const toastNode = await GameResourceManager.getInstance().getWeakToastNode();

      toastNode.getComponent(WeakToast).showToast(message, 2000);
    }

    // 旧的toast
    public static showToast(message: string) {
      const toastNode = new Node('Toast');

      const textWidth = ToastView.calculateTextWidth(message, 42);

      const uiOpacity = toastNode.addComponent(UIOpacity);
      uiOpacity.opacity = 0;
      // Set position to center
      toastNode.setPosition(0, 0, 0);

      // Add background
      const background = new Node('Background');
      const bgTransform = background.addComponent(UITransform);
      bgTransform.setContentSize(textWidth + 40, 80);
      background.setPosition(0, 0, 0);
      toastNode.setSiblingIndex(9999);

      let graphics = background.addComponent(Graphics);
      graphics.clear();
      const uiTransform = background.getComponent(UITransform);

      if (!uiTransform) {
        console.error('UITransform component is missing on the node.');

        return;
      }

      const width = uiTransform.width;
      const height = uiTransform.height;
      graphics.roundRect(-width / 2, -height / 2, width, height, 40);
      graphics.fillColor = new Color().fromHEX('#FFFFFF');
      graphics.fill();

      toastNode.addChild(background);

      // Add label after background
      const label = new Node('Label');
      const labelComponent = label.addComponent(Label);
      labelComponent.string = message;
      labelComponent.fontSize = 42;
      labelComponent.lineHeight = 52;
      labelComponent.color = new Color().fromHEX('#00b862');
      label.setPosition(0, 0, 0);
      toastNode.addChild(label);

      // Add to scene
      const canvas = find('Canvas');

      if (canvas) {
        canvas.addChild(toastNode);
      } else {
        console.error('Canvas node not found.');
      }

      console.log('showToast');
      // Show and remove
      tween(uiOpacity)
        .to(0.2, { opacity: 255 })
        .delay(2)
        .to(0.2, { opacity: 0 })
        .call(() => {
          toastNode.destroy();
        })
        .start();
    }

    private static calculateTextWidth(text: string, fontSize: number, fontFamily: string = 'Arial'): number {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (context) {
        context.font = `${fontSize}px ${fontFamily}`;
        const metrics = context.measureText(text);

        return metrics.width;
      }

      return 0;
    }
}
