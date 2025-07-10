import { _decorator, Color, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
import dayjs from 'dayjs';
import { app } from 'db://assets/app/app';
import { ToastView } from 'db://assets/basePlate/middleWare/commonUI/ToastView';
import EventTrackManager from 'db://assets/basePlate/middleWare/serverManager/EventTrackManager';
import { BetRecordListModel } from 'db://assets/basePlate/middleWare/services/user';
import {
  numberToMoney,
  copyText,
  calculateWithBase,
  loadRemoteImage,
} from 'db://assets/common/script/extra/Utils/common';
import { CopyUtils } from 'db://assets/common/script/extra/Utils/CopyUtils';
import { PackageFacade } from 'db://assets/common/script/PackageFacade';

const { ccclass, property } = _decorator;

@ccclass('RecordCard')
export class RecordCard extends Component {
  @property(Node)
  private NetSpecialValue: Node;

  @property(Node)
  private starNode: Node;

  @property(Node)
  private BetWinValue: Node;

  @property(Node)
  private RoundNumberValue: Node;

  @property(Node)
  private TimeValue: Node;

  @property(Node)
  private CopyIconNode: Node;

  @property(Node)
  private AccumulateReachMaxMultipleNode: Node;

  private RoundNumber: string;

  protected onLoad(): void {
    // // 注册点击复制时间
    // this.CopyIconNode.on(Node.EventType.TOUCH_END, this.copy, this);
  }

  public initValue(dataInfo: BetRecordListModel) {
    this.RoundNumber = dataInfo.id;

    const NetSpecialValueLabel = this.NetSpecialValue.getComponent(Label);

    if (dataInfo.payAmount > dataInfo.payOutAmount) {
      // 输钱
      NetSpecialValueLabel.color = new Color().fromHEX('#ff0000');
    } else{
      // 赢钱
      NetSpecialValueLabel.color = new Color().fromHEX('#00b862');
    }

    const multiBetAmount = app.manager.global.multiBetAmount;
    let netSpecialValue = `₱ ${numberToMoney((dataInfo.payOutAmount - dataInfo.payAmount) / multiBetAmount)}`;

    if((dataInfo.extendInfo?.rewardUrl ?? '').length > 0){
      netSpecialValue = `${netSpecialValue} /`;
      loadRemoteImage(
        dataInfo.extendInfo?.rewardUrl,
        (spriteFrame: SpriteFrame) => {
          this.starNode.getComponent(Sprite).spriteFrame = spriteFrame;
        },
        (error: Error) => {
               
        }
      );
    }else{
      this.starNode.getComponent(Sprite).spriteFrame = null;
    }

    NetSpecialValueLabel.string = netSpecialValue;
    this.BetWinValue.getComponent(Label).string = `₱ ${numberToMoney(dataInfo.payAmount / multiBetAmount)}/₱ ${numberToMoney(dataInfo.payOutAmount / multiBetAmount)}`;
    this.RoundNumberValue.getComponent(Label).string = dataInfo.id;
    this.TimeValue.getComponent(Label).string = dayjs(dataInfo.createTime).format('YYYY-MM-DD HH:mm:ss');

    if (dataInfo.reachMaxMultiple) {
      this.AccumulateReachMaxMultipleNode.active = true;
    }else{
      this.AccumulateReachMaxMultipleNode.active = false;
    }
  }

  private copy() {
    console.log('copy');
    const text = this.RoundNumber.toString();
    CopyUtils.copyText(text).then((bool) => {
      if(bool){
        ToastView.showCommonToast('Copy success');
      }else{
        ToastView.showCommonToast('Copy Failed');
      }

      EventTrackManager.inst.trackCopyRoundNumber(this.RoundNumber, bool, 'betting_record');
    });
  }

  protected onDisable(): void {
    this.CopyIconNode.off(Node.EventType.TOUCH_END, this.copy, this);
  }
}
