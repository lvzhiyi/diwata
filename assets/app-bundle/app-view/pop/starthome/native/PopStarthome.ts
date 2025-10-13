import { _decorator, Node, sp } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { app } from 'db://assets/app/app';
import { GlobalActivity } from 'db://assets/common/script/extra/GlobalMgr';
import { freeSpinManager } from 'db://assets/res-native/script/FreeSpinManager';
import { SpineTool } from 'db://assets/res-native/script/SpineTool';

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
  onLoad() {
    this.playStartHomeSpine();
  }

  // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
  onShow(params: any) {}

  /**
   * 点击跳过开屏动画
  */
  clickSkipStartAnimation() {
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

    // 播放背景音乐
    this.hide();
  }

  // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
  onHide(result: undefined) {
    // app.manager.ui.show<PopStarthome>({name: 'PopStarthome', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
    return result;
  }
}