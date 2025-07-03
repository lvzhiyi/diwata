import { _decorator, Component, Label, Node, sp, tween, UIOpacity, view, Widget } from 'cc';
import { getViewportSize } from 'db://assets/common/script/extra/Utils/common';
import { PaperHomeBody } from '../PaperHomeBody';
import { app } from 'db://assets/app/app';

const { ccclass, property } = _decorator;

@ccclass('HomeBodyUtil')
export class HomeBodyUtil {
  /** 开始按钮 */
  private startBtn: Node = null;

  /** freespin模式下免费游玩次数节点 */
  private freespinTimesNode: Node = null;

  /** freespin模式下成就系统freespin win 的弱提示节点 */
  private freespinWin: Node = null;

  constructor(homeBody: PaperHomeBody) {
    this.startBtn = homeBody.startBtn;
    this.freespinTimesNode = homeBody.freespinTimesNode;
    this.freespinWin = homeBody.freeSpinWin;
    // 成就freeSpin监听 - 开始按钮动画
    app.manager.event.on('start-button:animation', this.setStartButtonAnimation, this);
    // 成就freeSpin监听 - 显示免费剩余次数
    app.manager.event.on('freespin:timesVisible', this.setFreespinTimesVisible, this);
    // 成就freeSpin监听 - 更新免费游玩次数
    app.manager.event.on('freespin:times', this.setFreespinTimes, this);
    // 成就freeSpin监听 - 显示累计中奖金额
    app.manager.event.on('freespin:showTotalReward', this.showFreeSpinWin, this);
  }

  /**
       * 奖金栏目顶部间距适配
      */
  public adaptPrizeTopMargin(priziBox: Node) {
    if (!priziBox) return;
    const topMargin = priziBox.getComponent(Widget).top;
    const { width, height } = view.getDesignResolutionSize();
    const { width: wwidth, height: wheight } = getViewportSize();
    const scale = wheight / height;

    if(scale < 1.1){
      return;
    }

    const newTopMargin = topMargin * (scale + 0.8);
    priziBox.getComponent(Widget).top = newTopMargin;
  }

  /**
   * 底部功能按钮位置适配   
   */
  public adaptBottomButtonPosition(bottomView: Node) {
    if (!bottomView) return;
    const { width, height } = view.getDesignResolutionSize();
    const { width: wwidth, height: wheight } = getViewportSize();
    const scale = wheight / height;

    if(scale < 1.1){
      return;
    }

    const newBottomMargin = 40;
    bottomView.getComponent(Widget).bottom = newBottomMargin;
    console.log('adaptBottomButtonPosition', newBottomMargin);
  }

  /**
   * 设置开始按钮动画
   * @param animationName 动画名称
   * @param loop 是否循环播放
   * @returns Promise<void>
   */
  private async setStartButtonAnimation(
    animationName: string,
    loop: boolean = true,
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const startButtonSp = this.startBtn.getComponent(sp.Skeleton);
     
      if (!startButtonSp) {
        resolve();

        return;
      }

      console.log('StartButton', this.startBtn);

      if (!loop) {
        // 如果不循环播放，监听动画完成事件
        startButtonSp.setAnimation(0, animationName, loop);
        startButtonSp.setCompleteListener(() => {
          resolve();
          // 移除监听器，避免内存泄漏
          startButtonSp.setCompleteListener(null);
        });
      } else {
        // 循环播放的情况下直接返回
        startButtonSp.setAnimation(0, animationName, loop);
   
        resolve();
      }
    });
  }

  /**
   * 更新freespin次数显示状态
   * @param visible 是否显示
   */
  private setFreespinTimesVisible(visible: boolean) {
    this.freespinTimesNode.active = visible;
  }

  /**
   * 更新freespin次数
   * @param freespinTimes 免费游玩次数
   */
  private setFreespinTimes(freespinTimes: number) {
    this.freespinTimesNode.getComponent(Label).string = freespinTimes.toString();
  }

  // 显示成就系统freespin win 的弱提示
  private showFreeSpinWin(winTotal: number) {
    // 确保节点存在
    if (!this.freespinWin) return;

    // 获取或添加UIOpacity组件
    let uiOpacity = this.freespinWin.getComponent(UIOpacity);

    if (!uiOpacity) {
      uiOpacity = this.freespinWin.addComponent(UIOpacity);
    }

    this.freespinWin.getChildByName('Win').getComponent(Label).string = winTotal.toString();
    // 设置初始透明度为0
    uiOpacity.opacity = 0;
    this.freespinWin.active = true;

    // 创建显示动画：0.3秒内透明度从0到255
    tween(uiOpacity)
      .to(0.3, { opacity: 255 }, { easing: 'linear' })
      .delay(3) 
      .to(0.3, { opacity: 0 }, { easing: 'linear' })
      .call(() => {
        // 动画完成后隐藏节点
        this.freespinWin.active = false;
        this.freespinWin.getChildByName('Win').getComponent(Label).string = '';
      })
      .start();
  }
}