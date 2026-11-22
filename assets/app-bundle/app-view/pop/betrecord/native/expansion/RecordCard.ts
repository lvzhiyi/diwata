import { _decorator, Color, Component, Label, Layout, Node, Sprite, SpriteFrame, UITransform } from 'cc';
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
  getP,
} from 'db://assets/common/script/extra/Utils/common';
import { CopyUtils } from 'db://assets/common/script/extra/Utils/CopyUtils';
import { BET_RECORD_CARD } from './styleBetRecordCalendar';

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

  /**
   * freespin 模式投注的图标
   */
  @property(SpriteFrame)
  private FreespinIcon: SpriteFrame;

  private RoundNumber: string;

  protected onLoad(): void {
    const { width, height } = BET_RECORD_CARD;
    this.node.getComponent(UITransform).setContentSize(width, height);
    const content = this.node.getChildByName('Content');
    content.getComponent(UITransform).setContentSize(width + 28, height + 28);
    content.getComponent(Layout).enabled = false;
    this.node.getChildByName('GridImageView').active = false;
    for (const [i, row] of content.children.entries()) {
      row.getComponent(Layout).enabled = false;
      row.setPosition(0, 111 - 74 * i);
      const [caption, values] = row.children;
      caption.setPosition(-218, 0);
      const label = caption.children[0].getComponent(Label);
      label.node.setPosition(-95, 0);
      label.fontSize = 26;
      label.lineHeight = 31;
      label.color = new Color().fromHEX('#69809E');
      values.setPosition(121, 0);
      const value = values.children[0].getComponent(Label);
      value.fontSize = i < 2 ? 34 : 30;
      value.lineHeight = i < 2 ? 41 : 36;
      // initValue sets the Net/Special color before the card enters the scene.
      if (i !== 0) value.color = new Color().fromHEX('#13295E');
      if (i === 2) {
        values.getComponent(Layout).enabled = false;
        this.CopyIconNode.setPosition(175, 0);
      }
    }
  }

  public initValue(dataInfo: BetRecordListModel) {
    this.RoundNumber = dataInfo.id;

    const NetSpecialValueLabel = this.NetSpecialValue.getComponent(Label);

    if (dataInfo.payAmount > dataInfo.payOutAmount) {
      // 输钱
      NetSpecialValueLabel.color = new Color().fromHEX('#ff0000');
    } else{
      // 赢钱
      NetSpecialValueLabel.color = new Color().fromHEX('#10A66C');
    }

    const multiBetAmount = app.manager.global.multiBetAmount;
    let netSpecialValue = `${getP()} ${numberToMoney((dataInfo.payOutAmount - dataInfo.payAmount) / multiBetAmount)}`;

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

    // 初始化 freespin 模式投注的图标
    if (dataInfo.betPromotionType === 3) {
      this.initFreespinIcon(this.starNode);
    }

    NetSpecialValueLabel.string = netSpecialValue;
    // eslint-disable-next-line max-len
    this.BetWinValue.getComponent(Label).string = `${getP()} ${numberToMoney(dataInfo.payAmount / multiBetAmount)} / ${getP()} ${numberToMoney(dataInfo.payOutAmount / multiBetAmount)}`;
    this.RoundNumberValue.getComponent(Label).string = dataInfo.id;
    this.TimeValue.getComponent(Label).string = dayjs(dataInfo.createTime).format('YYYY-MM-DD HH:mm:ss');

    if (dataInfo.reachMaxMultiple) {
      this.AccumulateReachMaxMultipleNode.active = true;
    }else{
      this.AccumulateReachMaxMultipleNode.active = false;
    }
  }

  /**
   * 初始化 freespin 模式投注的图标
   */
  private  async initFreespinIcon(iconNode: Node) {
    iconNode.getComponent(UITransform).setContentSize(56, 56);
    iconNode.getComponent(Sprite).spriteFrame = this.FreespinIcon;
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
