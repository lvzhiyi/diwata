import { _decorator, Component, Node } from 'cc';
import { app } from 'db://assets/app/app';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass, property } = _decorator;

@ccclass('RollAudioManager')
export class RollAudioManager extends Component {
    /** 独有的ID */
    private playedIds: Set<string> = new Set();

    protected onLoad(): void {
      this.initEvent();    
    }

    /**
   * 监听事件进行音频播放
  */
    public initEvent(){
      app.manager.event.on('Audio:changeToWild', this.symbolChangeToWild, this);
    // app.manager.event.on('roll:stop', this.onRollStop, this);
    // app.manager.event.on('roll:reward', this.onRollReward, this);
    // app.manager.event.on('button:disable', this.startButtonDisableAndRecover, this);
    // app.manager.event.on('game:isGoing', this.onGameStateChange, this);
    }

    /** 元素变wild */
    symbolChangeToWild(data:{uniqueID:string, delayTime:number}){
      // 通过唯一ID避免重复播放
      if (!this.playedIds.has(data.uniqueID)) {
        this.playedIds.add(data.uniqueID);
        EffectManager.inst.playEffect(AudioPath.GAME.CHANGE_WILD);
    
        // 延迟清理ID（避免内存泄漏）
        setTimeout(() => {
          this.playedIds.delete(data.uniqueID);
        }, data.delayTime ?? 1000);
      }
    }

    start() {

    }

    update(deltaTime: number) {
        
    }
}
