import { _decorator, Color, Component, Label, Node } from 'cc';
import dayjs from 'dayjs';
import { MoneyUtil } from 'db://assets/basePlate/core/baseUtil/MoneyUtil';
import { ToastView } from 'db://assets/basePlate/middleWare/commonUI/ToastView';
import { EffectManager } from 'db://assets/basePlate/middleWare/serverManager/EffectManager';
import EventTrackManager from 'db://assets/basePlate/middleWare/serverManager/EventTrackManager';
import { copyText, getP } from 'db://assets/common/script/extra/Utils/common';
import { CopyUtils } from 'db://assets/common/script/extra/Utils/CopyUtils';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass, property } = _decorator;

@ccclass('DetailCard')
export class DetailCard extends Component {
  @property(Label)
  account: Label = null;

  @property(Label)
  roundNumer: Label = null;

  @property(Label)
  net: Label = null;

  @property(Label)
  time: Label = null;

  @property(Label)
  betWin: Label = null;

  @property(Node)
  copyIconNode: Node = null;

  protected onLoad(): void {
    // 注册点击复制时间
    this.copyIconNode.on(Node.EventType.TOUCH_END, this.copy, this);
  }

  protected onDisable(): void {
    this.copyIconNode.off(Node.EventType.TOUCH_END, this.copy, this);
  }

  /**
   * 初始化卡片数据
   */
  initValue(item: any) {
    if(!item) {
      return;
    }

    this.account.string = item.playerName;
    this.roundNumer.string = item.id;

    if (item.payAmount > item.payOutAmount) {
      // 输钱
      this.net.color = new Color().fromHEX('#ff0000');
    } else {
      // 赢钱
      this.net.color = new Color().fromHEX('#00b862');
    }

    this.net.string = `${getP()} ${MoneyUtil.internalToDisplayAndFormat((item.payOutAmount - item.payAmount))}`;
    // eslint-disable-next-line max-len
    this.betWin.getComponent(Label).string = `${getP()} ${(MoneyUtil.internalToDisplayAndFormat(item.payAmount))}/${getP()} ${(MoneyUtil.internalToDisplayAndFormat(item.payOutAmount))}`;
    this.time.string = dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss');
  }

  private copy() {
    const text = this.roundNumer.string;
    CopyUtils.copyText(text).then((bool) => {
      if(bool){
        ToastView.showCommonToast('Copy success');
      }else{
        ToastView.showCommonToast('Copy failed');
      }

      EffectManager.inst.playEffect(AudioPath.UI.OPEN, false, null, true);
      EventTrackManager.inst.trackCopyRoundNumber(text, bool, 'game_detail');
    });
  }
}
