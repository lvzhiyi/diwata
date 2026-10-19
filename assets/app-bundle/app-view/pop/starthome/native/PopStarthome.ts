import { _decorator, Node, sp } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { app } from 'db://assets/app/app';
import { GlobalActivity } from 'db://assets/common/script/extra/GlobalMgr';
import { freeSpinManager } from 'db://assets/res-native/script/FreeSpinManager';
import { SpineTool } from 'db://assets/res-native/script/SpineTool';
import { BGMManager } from 'db://assets/basePlate/middleWare/serverManager/BGMManager';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass, property } = _decorator;
@ccclass('PopStarthome')
export class PopStarthome extends BaseView {
  /// 开屏动画节点
   @property(Node)
   private startHomeSpine: Node | null = null;

   @property(Node)
  private selectedNode: Node | null = null;

  @property(Node)
  private skipView: Node | null = null;

  // 初始化的相关逻辑写在这
  @property({ tooltip: 'The new loading guide replaces the legacy opening cinematic' })
  private skipLegacyOpening = false;

  onLoad() {
    if (this.skipLegacyOpening) {
      this.playStartAnimationComplete(false);

      return;
    }

    this.playStartHomeSpine();
  }

  // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
  onShow(params: any) {}

  /**
   * 点击跳过开屏动画
  */
  clickSkipStartAnimation() {
    EffectManager.inst.stopAllEffectsByName(AudioPath.POPUP.OPEN_HOME_AUDIO);
    this.playStartAnimationComplete(false);
  }

  /**
 * 点击选择是否永远不播放开屏动画
 */
  clickSelectedBox() {
    this.selectedNode.active = !this.selectedNode.active;
    app.manager.global.setIsNeverPlayOpenHomeAnimtion(!app.manager.global.isNeverPlayOpenHomeAnimtion);
  }

  private async playStartHomeSpine() {
    if (app.manager.global.canPlayStartAnimation()) {
      if (this.startHomeSpine.isValid) {
        this.startHomeSpine.active = true;
        this.skipView.active = true;

        try {
          const skeleton = this.startHomeSpine.getComponent(sp.Skeleton);
          // 播放音效
          EffectManager.inst.playEffect(AudioPath.POPUP.OPEN_HOME_AUDIO);
          skeleton.setAnimation(0, 'show', false);
          // 监听自定义事件 "sz"
          //   skeleton.setEventListener((trackEntry: sp.spine.TrackEntry, event: sp.spine.Event) => {
          //     if (event.data.name === 'guadian') {
          //       app.manager.event.emit('startHomeRollAnimation');
          //     }
          //   });
          skeleton.setCompleteListener(() => {
            this.playStartAnimationComplete(true);
          });
        } catch (error) {
          this.playStartAnimationComplete(true);
        }
      }
    }
  }

  private playStartAnimationComplete(needAnimation: boolean = true) {
    if(this.startHomeSpine) {
      this.skipView.active = false;
      SpineTool.destoryAnimationNode(this.startHomeSpine);
    }

    BGMManager.inst.initBGM();
    // 播放背景音乐
    this.hide();
  }

  // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
  onHide(result: undefined) {
    // app.manager.ui.show<PopStarthome>({name: 'PopStarthome', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
    return result;
  }
}