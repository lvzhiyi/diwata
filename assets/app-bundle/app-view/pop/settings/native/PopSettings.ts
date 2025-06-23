import { _decorator, Color, Label, Node, Sprite, SpriteFrame } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { app } from 'db://assets/app/app';
import { PopAutosetting } from '../../autosetting/native/PopAutosetting';
import { PopBetrecord } from '../../betrecord/native/PopBetrecord';
import { PopRule } from '../../rule/native/PopRule';
import { Progress } from './expansion/Progress';

const { ccclass, property } = _decorator;
@ccclass('PopSettings')
export class PopSettings extends BaseView {
    @property(Node)
    private VoiceButton: Node;

    @property(Node)
    private VoiceProgress: Node;

    @property(Node)
    private MusicButton: Node;

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
      this.VoiceButton.children[0].getComponent(Sprite).spriteFrame = app.manager.global.voice > 0 ? this.VoiceButtonSpritOn : this.VoiceButtonSpritOff;
      this.MusicProgress.getComponent(Progress).setValue(app.manager.global.music);
      this.MusicButton.children[0].getComponent(Sprite).spriteFrame = app.manager.global.music > 0 ? this.MusicButtonSpritOn : this.MusicButtonSpritOff;
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
        console.log('1111888');
        this.AutoSettingBtn.getChildByName('Border').getComponent(Sprite).color = new Color().fromHEX('#FFFFFF');
        this.AutoSettingBtn.getChildByName('Border').getChildByName('Icon').getComponent(Sprite).color = new Color().fromHEX('#FFFFFF');
        this.AutoSettingBtn.getChildByName('Border').getChildByName('title_Icon').getComponent(Sprite).color = new Color().fromHEX('#FFFFFF');
      } else {
        console.log('2222888');
        this.AutoSettingBtn.getChildByName('Border').getComponent(Sprite).color = new Color(234, 242, 195, 100);
        this.AutoSettingBtn.getChildByName('Border').getChildByName('Icon').getComponent(Sprite).color = new Color(234, 242, 195, 100);
        this.AutoSettingBtn.getChildByName('Border').getChildByName('title_Icon').getComponent(Sprite).color = new Color(234, 242, 195, 100);
      }
    }

    // 是否可以点击自动设置
    canClickAutoSetting() {
      return !app.manager.global.isGoing && !app.manager.global.startAutoPlay && !app.manager.global.allwaysAutoPlay;
    }

    // 显示投注记录
    showPopBetRecord() {
      app.manager.ui.show<PopBetrecord>({ name: 'PopBetrecord' });
    }

    // 显示规则
    showPopRule() {
      app.manager.ui.show<PopRule>({ name: 'PopRule' });
    }

    // 显示自动设置
    showAutoSetting() {
      if (this.canClickAutoSetting()) {
        app.manager.ui.show<PopAutosetting>({ name: 'PopAutosetting' });
      }
    }
}