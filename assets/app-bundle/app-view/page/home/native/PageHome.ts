/* eslint-disable @typescript-eslint/no-unused-vars */
import { _decorator, sp, Sprite, SpriteFrame, Node, sys, Material, RenderTexture, UITransform, Camera, Color, director, Canvas, Vec2 } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { IMiniViewNames } from '../../../../../app-builtin/app-admin/executor';
import { HomeController } from '../../../../../app-builtin/app-controller/HomeController';
import { app } from '../../../../../app/app';
import UIManager from 'db://app/manager/ui/UIManager';
import { PopBetamout } from '../../../pop/betamout/native/PopBetamout';
import { SlotsController } from 'db://assets/app-builtin/app-controller/SlotsController';
import { showErrorPop } from 'db://assets/basePlate/core/baseUtil/BaseCommonUtil';
import { ErrorType } from 'db://assets/common/script/extra/https/Constant';
import { GameResourceManager, SPINE_RESOURCE_NAMES } from 'db://assets/basePlate/middleWare/serverManager/GameResourceManager';
import { HomeRollTool } from '../../../paper/home/roll/native/expansion/HomeRollTool';
import { IQuickMode } from 'db://assets/app-builtin/app-manager/global/GlobalManager';

const { ccclass, property } = _decorator;
@ccclass('PageHome')
export class PageHome extends BaseView.BindController(SlotsController) {
  // 子界面列表，数组顺序为子界面排列顺序
  protected miniViews: IMiniViewNames = ['PaperHomeRoll', 'PaperHomeBody', 'PaperHomeActivity'];

  @property(SpriteFrame)
  private normalBg: SpriteFrame | null = null;

   @property(Node)
  private cloudupNode: Node | null = null;

  @property(SpriteFrame)
  private bgImageSpriteFrame: SpriteFrame | null = null;

  @property(SpriteFrame)
  private freeBgImageSpriteFrame: SpriteFrame | null = null;
  
  private homeBgNode: Node | null = null;

  private blurBgNode: Node | null = null;

  private freeSpineNode: Node | null = null;

  /**
     * 正在使用的 RenderTexture
     */
  protected renderTexture: RenderTexture = null;

  // 初始化的相关逻辑写在这
  onLoad() {
    this.homeBgNode = this.node.getChildByName('homeImageBg');
    this.blurBgNode = this.node.getChildByName('blurBg');
    this.freeSpineNode = this.node.getChildByName('FreeSpine');

    // 监听点击屏幕
    this.node.on(
      Node.EventType.TOUCH_END,
      () => {
        this.clickScreen();
      },
      this
    );
    this.controller.on(SlotsController.Event.FreeBonusSpinChange, this.showFreeBonusSpinmation, this);
  }

  protected start(): void {

  }

  showFreeBonusSpinmation(isFreeBonusSpin: boolean) {
    if (isFreeBonusSpin) {
      this.homeBgNode.getComponent(Sprite).spriteFrame = this.freeBgImageSpriteFrame;
      this.blurBgNode.getComponent(Sprite).spriteFrame = this.freeBgImageSpriteFrame;
      this.cloudupNode.active = false;
      if (this.freeSpineNode) {
        this.freeSpineNode.active = true;
        this.freeSpineNode.getComponent(sp.Skeleton)?.setAnimation(0, 'freebg', true);
      }
    } else {
      this.homeBgNode.getComponent(Sprite).spriteFrame = this.bgImageSpriteFrame;
      this.blurBgNode.getComponent(Sprite).spriteFrame = this.bgImageSpriteFrame;
      this.cloudupNode.active = true; 
      if (this.freeSpineNode) this.freeSpineNode.active = false;
    }
  }

  /**
   * 点击屏幕超过2次，提示是否开启快速模式
   * */ 
  clickScreen() {
    const showScreenTips = `${app.manager.global.gameId}_${app.manager.global.playerId}_showScreenTips`;
    const storageKey = `${app.manager.global.gameId}_${app.manager.global.playerId}_ClickScreenCount`;
    const currentCount = parseInt(sys.localStorage.getItem(storageKey) || '0');
    console.log('clickScreen1', app.manager.global.isGoing);

    if (app.manager.global.isGoing && app.manager.global.quikeMode === IQuickMode.nomal) {
      app.manager.global.setClickScreen(true);
      console.log('clickScreen', currentCount);

      if (sys.localStorage.getItem(showScreenTips) !== 'false' && currentCount >= 2) {
        showErrorPop({
          type: ErrorType.SlowNetTips,
          msg: 'Whether to enable the fast mode?',
          confirmCallback: () => {
            app.manager.global.setQuikeMode(IQuickMode.quick);
            sys.localStorage.setItem(showScreenTips, false);
          },
          cancelCallback: () => {
            app.manager.global.setQuikeMode(IQuickMode.nomal);
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

  /**
     * 生命周期：销毁
     */
  protected onDestroy(): void {
    // 销毁不用的 RenderTexture
    this.renderTexture && this.renderTexture.destroy();
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
