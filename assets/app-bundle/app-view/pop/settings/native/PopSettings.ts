import { _decorator, Button, Color, Label, Node, Sprite, SpriteFrame } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { app } from 'db://assets/app/app';
import { PopAutosetting } from '../../autosetting/native/PopAutosetting';
import { PopBetrecord } from '../../betrecord/native/PopBetrecord';
import { PopRule } from '../../rule/native/PopRule';
import { Progress } from './expansion/Progress';
import EventTrackManager from 'db://assets/basePlate/middleWare/serverManager/EventTrackManager';

const { ccclass, property } = _decorator;
@ccclass('PopSettings')
export class PopSettings extends BaseView {
    @property(Node)
    private VoiceIcon: Node;

    @property(Node)
    private VoiceProgress: Node;

    @property(Node)
    private MusicIcon: Node;

    @property(Node)
    private MusicProgress: Node;

    @property({ type: SpriteFrame, tooltip: 'VoiceButtonSpritOn' })
    private VoiceButtonSpritOn: SpriteFrame;

    @property({ type: SpriteFrame, tooltip: 'VoiceButtonSpritOff' })
    private VoiceButtonSpritOff: SpriteFrame;   

    @property({ type: SpriteFrame, tooltip: 'MusicButtonSpritOn' })
    private MusicButtonSpritOn: SpriteFrame;

    @property({ type: SpriteFrame, tooltip: 'MusicButtonSpritOff' })
    private MusicButtonSpritOff: SpriteFrame;

    @property(Node)
    private AutoSettingBtn: Node;

  private subMenus: Set<string> = new Set();

  protected onEnable(): void {
    this.initVoiceMusic();

    this.registerListener();
  }

  protected onShow(data?: any) {
    this.changeAutoSettingBtnColor();
  }

  protected onDisable(): void {
    app.manager.event.off('voiceChange');
    app.manager.event.off('musicChange');
    app.manager.event.off('isGoingChange');
  }

  // 初始化声音和音乐按钮
  initVoiceMusic() {
    this.VoiceProgress.getComponent(Progress).setValue(app.manager.global.voice);
    this.VoiceIcon.getComponent(Sprite).spriteFrame = app.manager.global.voice > 0 ? this.VoiceButtonSpritOn : this.VoiceButtonSpritOff;
    this.MusicProgress.getComponent(Progress).setValue(app.manager.global.music);
    this.MusicIcon.getComponent(Sprite).spriteFrame = app.manager.global.music > 0 ? this.MusicButtonSpritOn : this.MusicButtonSpritOff;
  }

  // 注册监听
  registerListener() {
    app.manager.event.on('isGoingChange', () => {
      this.changeAutoSettingBtnColor();
    });
    // 监听voice
    app.manager.event.on('voiceChange', () => {
      this.initVoiceMusic();
    });
    // 监听music
    app.manager.event.on('musicChange', () => {
      this.initVoiceMusic();
    });
  }

  changeAutoSettingBtnColor() {
    if (this.canClickAutoSetting()) {
      const button = this.AutoSettingBtn.getChildByName('ButtonItem').getComponent(Button);
      const titleLabel = this.AutoSettingBtn.getChildByName('ButtonItem').getChildByName('Label').getComponent(Label);
      titleLabel.color = new Color().fromHEX('#FFFFFF');
      button.interactable = true;
    } else {
      const titleLabel = this.AutoSettingBtn.getChildByName('ButtonItem').getChildByName('Label').getComponent(Label);
      titleLabel.color = new Color().fromHEX('#7C7C7C');
      this.AutoSettingBtn.getChildByName('ButtonItem').getComponent(Button).interactable = false;
    }
  }

  // 是否可以点击自动设置
  canClickAutoSetting() {
    return !app.manager.global.isGoing && !app.manager.global.startAutoPlay && !app.manager.global.allwaysAutoPlay && !app.manager.global.isFreespinMode;
  }

  // 显示投注记录
  showPopBetRecord() {
    // 上报打开投注记录事件
    EventTrackManager.inst.trackOpenBetRecord();
    this.subMenus.add('PopBetrecord');
    app.manager.ui.show<PopBetrecord>({ name: 'PopBetrecord' });
  }

  // 显示规则
  showPopRule() {
    EventTrackManager.inst.trackOpenBetRules();
    this.subMenus.add('PopRule');
    app.manager.ui.show<PopRule>({ name: 'PopRule' });
  }

  // 显示自动设置
  showAutoSetting() {
    if (this.canClickAutoSetting()) {
      EventTrackManager.inst.trackOpenAutoBetSetting();
      this.subMenus.add('PopAutosetting');
      app.manager.ui.show<PopAutosetting>({ name: 'PopAutosetting' });
    }
  }

  /**
   * 关闭按钮
  */
  closebtnClick() {
    app.manager.ui.hide({
      name: 'PopSettings',
      onHide: () => {
        EventTrackManager.inst.trackSettingCancel(Array.from(this.subMenus));
        this.subMenus.clear();
      },
    });
  }
}