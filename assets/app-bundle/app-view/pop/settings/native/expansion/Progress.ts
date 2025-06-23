import { _decorator, Component, Node, Widget } from 'cc';
import { app } from 'db://assets/app/app';

const { ccclass, property } = _decorator;

@ccclass('Progress')
export class Progress extends Component {
  add(event: Event, type: 'voice' | 'music') {
    console.log(type, 'add');

    if (type === 'voice') {
      app.manager.global.setVoice(app.manager.global.voice + 25);
    } else if (type === 'music') {
      app.manager.global.setMusic(app.manager.global.music + 25);
    } else {
      console.error('Progress.ts add 参数type错误 type = ' + type);
    }
  }

  sub(event: Event, type: 'voice' | 'music') {
    console.log(type, 'sub', app.manager.global.music);

    if (type === 'voice') {
      app.manager.global.setVoice(app.manager.global.voice - 25);
    } else if (type === 'music') {
      app.manager.global.setMusic(app.manager.global.music - 25);
    } else {
      console.error('Progress.ts sub 参数type错误 type = ' + type);
    }
  }

  setValue(val: number) {
    const content = this.node.getChildByName('Content');

    if (content) {
      content.getChildByName('ProgressBox').getChildByName('ProgressPercent').getComponent(Widget).right = (100 - val) / 100;
    }
  }
}
