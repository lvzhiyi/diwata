import { _decorator, Component, Node, UITransform, Widget } from 'cc';
import { app } from 'db://assets/app/app';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass, property } = _decorator;

@ccclass('Progress')
export class Progress extends Component {
  add(event: Event, type: 'voice' | 'music') {
    if (type === 'voice') {
      app.manager.global.setVoice(app.manager.global.voice + 25);
    } else if (type === 'music') {
      app.manager.global.setMusic(app.manager.global.music + 25);
    }
 
    EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
  }

  sub(event: Event, type: 'voice' | 'music') {
    console.log(type, 'sub', app.manager.global.music);

    if (type === 'voice') {
      app.manager.global.setVoice(app.manager.global.voice - 25);
    } else if (type === 'music') {
      app.manager.global.setMusic(app.manager.global.music - 25);
    }
 
    EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
  }

  setValue(val: number) {
    const content = this.node.getChildByName('Content');

    if (content) {
      const progressBox = content.getChildByName('ProgressBox');
      const progressPercent = progressBox.getChildByName('ProgressPercent');
      const width = progressBox.getComponent(UITransform).width;
      const fillWidget = progressPercent.getComponent(Widget);
      fillWidget.right = (1 - val / 100) * width;
      // 先刷新进度条宽度，再将圆点对齐到进度条右端。
      fillWidget.updateAlignment();
      progressPercent.getChildByName('Thumb')?.getComponent(Widget)?.updateAlignment();
    }
  }
}
