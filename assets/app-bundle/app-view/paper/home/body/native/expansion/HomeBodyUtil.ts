import { _decorator, Component, Node, view, Widget } from 'cc';
import { getViewportSize } from 'db://assets/common/script/extra/Utils/common';

const { ccclass, property } = _decorator;

@ccclass('HomeBodyUtil')
export class HomeBodyUtil {
  constructor() {

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
}
