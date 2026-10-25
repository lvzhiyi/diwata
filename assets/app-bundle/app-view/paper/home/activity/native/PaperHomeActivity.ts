import { _decorator, Label, Node, sp } from 'cc';
import BaseView from '../../../../../../../extensions/app/assets/base/BaseView';
import { app } from 'db://assets/app/app';
import { SlotsController } from 'db://assets/app-builtin/app-controller/SlotsController';
import { GameResourceManager, SPINE_RESOURCE_NAMES } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';
import { SpineTool } from 'db://assets/res-native/script/SpineTool';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass, property } = _decorator;
@ccclass('PaperHomeActivity')
export class PaperHomeActivity extends BaseView.BindController(SlotsController) {
    @property({ type: Node, tooltip: 'BousSpineView 节点' })
    private BousSpineView: Node = null;

    /// 开屏动画节点
   @property(Node)
   private startHomeSpine: Node | null = null;

    @property({ type: Node, tooltip: 'numberLable 节点' })
    private NumberLable: Node = null;

    // 初始化的相关逻辑写在这
    onLoad() {
      // 播放开屏动画
      this.playStartHomeSpine();
    }

    private async playStartHomeSpine() {
      if (this.startHomeSpine && this.startHomeSpine.isValid) {
        this.startHomeSpine.active = true;

        try {
          const skeleton = this.startHomeSpine.getComponent(sp.Skeleton);
          skeleton.setAnimation(0, 'show2_qipan', false);
          app.manager.event.emit('startHomeRollAnimation');
          skeleton.setCompleteListener(() => {
            this.playStartAnimationComplete(true);
          });
        } catch (error) {
          app.manager.event.emit('startHomeAnimationComplete');
          this.playStartAnimationComplete(true);
        }
      }else{
        app.manager.event.emit('startHomeAnimationComplete');
        this.playStartAnimationComplete(true);
      }
    }
  
    private playStartAnimationComplete(needAnimation: boolean = true) {
      SpineTool.destoryAnimationNode(this.startHomeSpine);
      this.startHomeSpine = null;
      console.log('playStartAnimationComplete');

      app.manager.event.emit('startHomeAnimationComplete');

      // 播放背景音乐
    }

    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
    onShow(params: any) {
      app.manager.event.on('begainfreeBonusAnimation', this.showFreeBonusSpineAnimation, this);
      // 调整免费轮动画节点的层级
      this.scheduleOnce(() => {
        this.BousSpineView.setSiblingIndex(
          this.BousSpineView.parent.children.length - 1
        );
      });
    }

    protected beforeShow(next: (error?: string) => void, data?: any) {
      next();
    }

    /**
     * 展示免费轮中奖动画
     */
    private async showFreeBonusSpineAnimation(callback: () => void) {
      this.BousSpineView.active = true;
      this.NumberLable.getComponent(Label).string = app.manager.global.freeBonusTimes.toString();
      // 开始播放动画
      const Skeleton = this.BousSpineView.getComponent(sp.Skeleton);
      const spineData = await GameResourceManager.instance.getSpineAnimationDataByName(SPINE_RESOURCE_NAMES.FREE_BONUS_TRANSITION);

      if(Skeleton && spineData) {
        Skeleton.skeletonData = spineData;
        Skeleton.setAnimation(0, 'show', false);
        EffectManager.inst.playEffect(AudioPath.GAME.FREE_BONUS_TRANSITION);
        // 监听自定义事件 "sz"
        Skeleton.setEventListener((trackEntry: sp.spine.TrackEntry, event: sp.spine.Event) => {
          if (event.data.name === 'sz') {
            console.log('监听到 sz 事件:', event);
            this.NumberLable.active = true;
          }
        });
      }

      // 设置一个超时定时器，4秒后执行callback
      const timeoutId = setTimeout(() => {
        console.log('动画播放超时');
        this.BousSpineView.active = false;
        this.NumberLable.active = false;
        Skeleton.clearAnimations();
        Skeleton.skeletonData = null;
        Skeleton.setEventListener(null);
        callback();
      }, 4400);

      Skeleton.setCompleteListener((track: sp.spine.TrackEntry) => {
        clearTimeout(timeoutId);
        Skeleton.setCompleteListener(null);
        clearTimeout(timeoutId);
        this.BousSpineView.active = false;
        this.NumberLable.active = false;
        Skeleton.clearAnimations();
        Skeleton.skeletonData = null;
        Skeleton.setEventListener(null);
        callback();
      });
    }

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    onHide(result: undefined) {
      // app.manager.ui.show<PaperHomeActivity>({name: 'PaperHomeActivity', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
      return result;
    }
}