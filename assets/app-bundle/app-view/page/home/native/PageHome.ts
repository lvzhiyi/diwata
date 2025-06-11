/* eslint-disable @typescript-eslint/no-unused-vars */
import { _decorator, sp, Sprite, SpriteFrame, Node, sys } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { IMiniViewNames } from '../../../../../app-builtin/app-admin/executor';
import { HomeController } from '../../../../../app-builtin/app-controller/HomeController';
import { app } from '../../../../../app/app';
import UIManager from 'db://app/manager/ui/UIManager';
import { PopBetamout } from '../../../pop/betamout/native/PopBetamout';
import { SlotsController } from 'db://assets/app-builtin/app-controller/SlotsController';
import { showErrorPop } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';
import { ErrorType } from 'db://assets/common/script/extra/https/Constant';

const { ccclass, property } = _decorator;
@ccclass('PageHome')
export class PageHome extends BaseView.BindController(SlotsController) {
  // 子界面列表，数组顺序为子界面排列顺序
  protected miniViews: IMiniViewNames = ['PaperHomeRoll', 'PaperHomeBody', 'PaperHomeActivity'];
  
  @property(SpriteFrame)
  private FreeSpinBg: SpriteFrame | null = null;

  @property(SpriteFrame)
  private normalBg: SpriteFrame | null = null;
  
  private homeBgNode: Node | null = null;

  private blurBgNode: Node | null = null;

  // 初始化的相关逻辑写在这
  onLoad() {
    this.onControllerEvent();
    this.homeBgNode = this.node.getChildByName('homeImageBg');
    this.blurBgNode = this.node.getChildByName('blurBg');

    // 监听点击屏幕
    this.node.on(
      Node.EventType.TOUCH_END,
      () => {
        app.manager.event.emit('clickScreen');
        this.clickScreen();
      },
      this
    );
  }

  // 监听所有事件
  protected onControllerEvent() {
    this.controller.on(SlotsController.Event.FreeSpinChange, (a: boolean) => {
      console.log('freeSpinChange', a);

      if (a) {
        this.blurBgNode.getComponent(Sprite).spriteFrame = this.FreeSpinBg;
        this.homeBgNode.getComponent(Sprite).spriteFrame = this.FreeSpinBg;
      } else {
        this.blurBgNode.getComponent(Sprite).spriteFrame = this.normalBg;
        this.homeBgNode.getComponent(Sprite).spriteFrame = this.normalBg;
      }

      return true;
    });
  }

  /**
   * 点击屏幕超过2次，提示是否开启快速模式
   * */ 
  clickScreen() {
    const showScreenTips = `${app.manager.global.gameId}_${app.manager.global.playerId}_showScreenTips`;
    const storageKey = `${app.manager.global.gameId}_${app.manager.global.playerId}_ClickScreenCount`;
    const currentCount = parseInt(sys.localStorage.getItem(storageKey) || '0');
    console.log('clickScreen1', app.manager.global.isGoing);

    if (app.manager.global.isGoing && !app.manager.global.quikeMode) {
      app.manager.global.setClickScreen(true);
      console.log('clickScreen', currentCount);

      if (sys.localStorage.getItem(showScreenTips) !== 'false' && currentCount >= 2) {
        showErrorPop({
          type: ErrorType.SlowNetTips,
          msg: 'Whether to enable the fast mode?',
          confirmCallback: () => {
            app.manager.global.setQuikeMode(!app.manager.global.quikeMode);
            sys.localStorage.setItem(showScreenTips, false);
          },
          cancelCallback: () => {
            app.manager.global.setQuikeMode(false);
            sys.localStorage.setItem(showScreenTips, false);
          },
        });
      }
    }
  }

  protected beforeShow(next: (error?: string) => void, data?: any) {
    this.showMiniViews({
      views: [UIManager.MiniViewName.PaperHomeRoll, UIManager.MiniViewName.PaperHomeBody, UIManager.MiniViewName.PaperHomeActivity],
      onFinish: next,
    });
  }

  showPopBetamout() {
    app.manager.ui.show<PopBetamout>({ name: 'PopBetamout' });
  }

  // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
  onShow(params: any) {
  }

  // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
  onHide(result: undefined) {
    // 移除监听事件，防止内存泄漏
    this.controller.targetOff(this);

    return result;
  }
}
