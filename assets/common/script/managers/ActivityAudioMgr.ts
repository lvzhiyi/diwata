import { Node, AudioSource, AudioClip, director } from "cc";
import { ActivityDataMgr } from "../data/ActivityDataMgr";
import { PackageFacade } from "../PackageFacade";
import { ActivityDialogViewMgr } from "../DialogView/ActivityDialogViewMgr";
import { ActivityDialogViewID } from "../DialogView/ActivityDialogViewID";

export class ActivityAudioMgr {
    private static _inst: ActivityAudioMgr;
    public static get instance(): ActivityAudioMgr {
        if (this._inst == null) {
            this._inst = new ActivityAudioMgr();
        }
        return this._inst;
    }

    private _audioSource: AudioSource;
    private _audioNode: Node;

    constructor() {
        this._audioNode = new Node();
        this._audioNode.name = "__audioMgr__";
        // 添加 AudioSource 组件
        this._audioSource = this._audioNode.addComponent(AudioSource);
        // 将节点添加到场景中
        PackageFacade.instance.getRootNode().addChild(this._audioNode);
    }

    /**
     * 播放音效
     * @param audioClip
     * @param loop
     * @param zoomVolume
     */
    public playEffect(audioClip: AudioClip, loop: boolean = false, zoomVolume: number = 1.0) {
        if (!audioClip) {
            return;
        }
        this._audioSource.clip = audioClip;
        this._audioSource.loop = loop;
        this._audioSource.name = audioClip.name;
        // 设置音量
        this._audioSource.volume = ActivityDataMgr.instance.getVolume() * zoomVolume;
        this._audioSource.play();
    }
    public playSoundByName(name: string) {
        let bundle = ActivityDialogViewMgr.instance.getBundle(ActivityDialogViewID.entry);
        bundle.load("skin-high/sounds/" + name, (err: Error, clip: AudioClip) => {
            if (clip) {
                this.playEffect(clip);
            }
        });
    }
    /**
     * 播放背景音乐
     * @param audioClip
     * @param loop
     * @param zoomVolume
     */
    public playBgMusic(audioClip: AudioClip, loop: boolean = true, zoomVolume: number = 1.0) {
        if (!audioClip) {
            return;
        }
        this._audioSource.clip = audioClip;
        this._audioSource.loop = loop;
        this._audioSource.name = audioClip.name;
        // 设置音量
        this._audioSource.volume = ActivityDataMgr.instance.getVolume() * zoomVolume;
        this._audioSource.play();
    }

    /**
     * 停止音效
     */
    public stopAudio() {
        this._audioSource.stop();
        this._audioSource.clip = null;
        this._audioSource.name = "";
    }
}
