import { _decorator, Component, Node, UITransform, Widget } from 'cc';
import { app } from 'db://assets/app/app';

const { ccclass, property } = _decorator;

@ccclass('Progress')
export class Progress extends Component {
  add(event: Event, type: 'voice' | 'music') {
    if (type === 'voice') {
      app.manager.global.setVoice(app.manager.global.voice + 25);
    } else if (type === 'music') {
      app.manager.global.setMusic(app.manager.global.music + 25);
    } 
  }

  sub(event: Event, type: 'voice' | 'music') {
    console.log(type, 'sub', app.manager.global.music);

    if (type === 'voice') {
      app.manager.global.setVoice(app.manager.global.voice - 25);
    } else if (type === 'music') {
      app.manager.global.setMusic(app.manager.global.music - 25);
    } 
  }

  setValue(val: number) {
    const content = this.node.getChildByName('Content');

    if (content) {
      const progressPercent = content.getChildByName('ProgressBox').getChildByName('ProgressPercent');
      const width = content.getChildByName('ProgressBox').getComponent(UITransform).width;
      const  persent = (1 - (val / 100.0));
      progressPercent.getComponent(Widget).right = persent * width;
    }
  }
}
