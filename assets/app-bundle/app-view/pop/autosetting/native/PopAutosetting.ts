import { _decorator, Component, Node, Sprite, SpriteFrame, EventTarget, Color } from 'cc';
import { AddOrSub } from './expansion/AddOrSub';
import { app } from 'db://assets/app/app';
import BaseView from 'db://app/base/BaseView';
import EventTrackManager from 'db://assets/basePlate/middleWare/serverManager/EventTrackManager';

const { ccclass, property } = _decorator;

export const autoSettingModalEventTarget = new EventTarget();

@ccclass('PopAutosetting')
export class PopAutosetting extends BaseView {
    @property(Node)
    SelectTotalSpins: Node;

    @property(Node)
    SelectSingleWin: Node;

    @property(Node)
    SelectBalanceLess: Node;

    @property(Node)
    SelectBalanceMore: Node;

    @property(Node)
    SelectFreeGame: Node;

    @property(SpriteFrame)
    AmountButtonOn: SpriteFrame;

    @property(SpriteFrame)
    AmountButtonOff: SpriteFrame;

    @property({ type: Node, tooltip: '金额按钮的父节点，用于获取其下的所有金额按钮' })
    BottomNode: Node;

    @property(Node)
    TotalSpinsAddOrSub: Node;

    // 当前点击的金额按钮
    private amountButton: Node;

    protected onLoad(): void {
      this.SelectTotalSpins.on(Node.EventType.TOUCH_END, () => this.clickSelectNode('totalSpins', this.SelectTotalSpins), this);
      this.SelectSingleWin.on(Node.EventType.TOUCH_END, () => this.clickSelectNode('singleWin', this.SelectSingleWin), this);
      this.SelectBalanceLess.on(Node.EventType.TOUCH_END, () => this.clickSelectNode('balanceLess', this.SelectBalanceLess), this);
      this.SelectBalanceMore.on(Node.EventType.TOUCH_END, () => this.clickSelectNode('balanceMore', this.SelectBalanceMore), this);
      this.SelectFreeGame.on(Node.EventType.TOUCH_END, () => this.clickSelectNode('isFree', this.SelectFreeGame), this);

      autoSettingModalEventTarget.on('addOrSubValue', this.addOrSubValue, this);

      this.BottomNode.children.forEach(spin => {
        spin.on(Node.EventType.TOUCH_END, () => {
          this.cancelSelectedButton();

          spin.getComponent(Sprite).spriteFrame = this.AmountButtonOn;
          this.amountButton = spin;

          // 保存点击按钮后的totalspins数据
          // 并且修改选择的值
          this.addOrSubValue(this.SelectTotalSpins.getParent().getChildByName('NameContent').children[0].name, parseInt(spin.children[0].name));
          this.TotalSpinsAddOrSub.getComponent(AddOrSub).initValue(parseInt(spin.children[0].name));
        }, this);
      });
    }

    protected onDisable(): void {
      // this.SelectTotalSpins.off(Node.EventType.TOUCH_END, () => this.clickSelectNode('totalSpins', this.SelectTotalSpins), this);
      // this.SelectSingleWin.off(Node.EventType.TOUCH_END, () => this.clickSelectNode('singleWin', this.SelectSingleWin), this);
      // this.SelectBalanceLess.off(Node.EventType.TOUCH_END, () => this.clickSelectNode('balanceLess', this.SelectBalanceLess), this);
      // this.SelectBalanceMore.off(Node.EventType.TOUCH_END, () => this.clickSelectNode('balanceMore', this.SelectBalanceMore), this);
      // this.SelectFreeGame.off(Node.EventType.TOUCH_END, () => this.clickSelectNode('isFree', this.SelectFreeGame), this);
      // autoSettingModalEventTarget.off('addOrSubValue', this.addOrSubValue, this);
    }

    clickSelectNode(key: string, SelectNode: Node) {
      const setting: any = { ...app.manager.global.autoSetting };
      setting[key].selected = !setting[key].selected;
      app.manager.global.setAutoSetting(setting);
      this.changeSelectNodeUI(key, SelectNode);
    }

    addOrSubValue(key: string, value: number) {
      const setting: any = { ...app.manager.global.autoSetting };
      setting[key].value = value;
      setting[key].selected = value === 0 ? false : true;
      app.manager.global.setAutoSetting(setting);
      console.log('key', key, value);

      if (key === 'totalSpins') {
        this.BottomNode.children.forEach(spin => {
          spin.getComponent(Sprite).spriteFrame = spin.children[0].name === value.toString() ? this.AmountButtonOn : this.AmountButtonOff;
        });
        this.changeSelectNodeUI(key, this.SelectTotalSpins);
      } else if (key === 'singleWin') {
        this.changeSelectNodeUI(key, this.SelectSingleWin);
      } else if (key === 'balanceLess') {
        this.changeSelectNodeUI(key, this.SelectBalanceLess);
      } else if (key === 'balanceMore') {
        this.changeSelectNodeUI(key, this.SelectBalanceMore);
      } else if (key === 'freeGame') {
        this.changeSelectNodeUI(key, this.SelectFreeGame);
      }
    }

    changeSelectNodeUI(key: string, SelectNode: Node) {
      const setting: any = { ...app.manager.global.autoSetting };

      if (setting[key].selected) {
        SelectNode.getChildByName('SelectedIcon').active = true;
      } else {
        SelectNode.getChildByName('SelectedIcon').active = false;
      }
    }

    // 取消选中的Button
    cancelSelectedButton() {
      if (this.amountButton) {
        this.amountButton.getComponent(Sprite).spriteFrame = this.AmountButtonOff;
      }
    }

    // 设置自动开始游戏
    startAutoPlay() {
      app.manager.global.setStartAutoPlay(true);
      // 记录自动开始游戏
      EventTrackManager.inst.trackAutoBetSettingStart({
        spin_count: app.manager.global.autoSetting.totalSpins.value,
        enabled_spin_count: app.manager.global.autoSetting.totalSpins.selected,
        single_win_limit: app.manager.global.autoSetting.singleWin.value,
        enabled_win_limit: app.manager.global.autoSetting.singleWin.selected,
        stop_if_balance_le: app.manager.global.autoSetting.balanceLess.value,
        enabled_stop_if_balance_le: app.manager.global.autoSetting.balanceLess.selected,
        stop_if_balance_ge: app.manager.global.autoSetting.balanceMore.value,
        enabled_stop_if_balance_ge: app.manager.global.autoSetting.balanceMore.selected,
        enabled_stop_on_free_game: app.manager.global.autoSetting.isFree.selected,
      });
      // 隐藏自动设置弹窗
      app.manager.ui.hide({
        name: 'PopAutosetting',
        onHide: () => {
        // 判断PopSettings是否显示，如果显示则隐藏
          if (app.manager.ui.isShow('PopSettings')) {
            app.manager.ui.hide({
              name: 'PopSettings',
              onHide: () => {},
            });
          }
        },
      });
    }

    protected closebtnClick() {
      app.manager.ui.hide({ name: 'PopAutosetting' });
      EventTrackManager.inst.trackAutoBetSettingCancel();
    }
}
