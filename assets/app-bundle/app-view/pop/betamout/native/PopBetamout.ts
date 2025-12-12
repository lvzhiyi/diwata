import { _decorator, Node } from 'cc';
import BaseView from 'db://app/base/BaseView';
import { app } from 'db://assets/app/app';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import EventTrackManager from 'db://assets/basePlate/middleWare/serverManager/EventTrackManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass, property } = _decorator;

@ccclass('PopBetamout')
export class PopBetamout extends BaseView {
  private _betAmount: number;

  start() {
    this._betAmount = app.manager.global.betCount;
  }

  update(deltaTime: number) {
        
  }

  // 关闭视图
  closeView() {
    EffectManager.inst.playEffect(AudioPath.UI.CLOSE, false, null, true);
    EventTrackManager.inst.trackChangeAmountCancel({
      current_bet: this._betAmount,
      selected_bet_before: this._betAmount,
      selected_bet_after: app.manager.global.betCount,
      changed: app.manager.global.betCount !== this._betAmount,
    });
    app.manager.ui.hide({ name: 'PopBetamout' });
  }
}
