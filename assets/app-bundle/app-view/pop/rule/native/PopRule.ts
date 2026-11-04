import { _decorator, ScrollView } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import EventTrackManager from 'db://assets/basePlate/middleWare/serverManager/EventTrackManager';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass, property } = _decorator;

@ccclass('PopRule')
export class PopRule extends BaseView {
  @property(ScrollView)
  private scrollView: ScrollView = null;

  onShow() {
    this.scheduleOnce(() => this.scrollView.scrollToTop());
  }

  onHide() {
    EffectManager.inst.playEffect(AudioPath.UI.CLOSE, false, null, true);
    EventTrackManager.inst.trackExitBetRules();
  }
}
