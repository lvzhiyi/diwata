import { _decorator, Component, AudioClip, AudioSource, Node, resources, assetManager } from 'cc';
import { app } from 'db://assets/app/app';

const { ccclass } = _decorator;

/**
 * BGM播放实例接口
 */
interface IBGMInstance {
  /** BGM ID */
  id: number;
  /** 音频源组件 */
  audioSource: AudioSource;
  /** 音频剪辑 */
  clip: AudioClip;
  /** BGM名称 */
  name: string;
}

@ccclass('BGMManager')
export class BGMManager extends Component {
  /** 单例实例 */
  private static _instance: BGMManager = null;

  /** 音效bundle名称 */
  private static readonly SOUND_BUNDLE_NAME = 'resources';

  /** 全局音频剪辑缓存 */
  private static _globalAudioClipCache: Map<string, AudioClip> = new Map();

  /** 是否正在播放BGM */
  private isPlaying = false;

  /** BGM音量 */
  private _bgmVolume = 1;

  /** 是否静音 */
  private _isMuted = false;

  /** 音频剪辑缓存 */
  private _audioClipCache: Map<string, AudioClip> = new Map();

  /** 当前BGM实例 */
  private _currentBGMInstance: IBGMInstance | null = null;

  /** BGM音频源 */
  private _bgmAudioSource: AudioSource | null = null;

  /** BGM ID计数器 */
  private _bgmIdCounter = 0;

  /** 是否已初始化音量 */
  private isVolumeInitialized = false;

  public static bgmList: string[] = [
    'BGM/bg_audio',
  ];

  public get isMute() {
    return this._isMuted;
  }

  public set isMute(value: boolean) {
    this._isMuted = value;
    
    if (this._currentBGMInstance) {
      this._currentBGMInstance.audioSource.volume = value ? 0 : this._bgmVolume;
    }

    // 同步到xforge框架（保持兼容性）
    app.manager.sound.setMusicMute(value, true);
  }

  public get volume() {
    return this._bgmVolume;
  }

  public set volume(value: number) {
    this._bgmVolume = Math.max(0, Math.min(1, value));
    this._isMuted = this._bgmVolume === 0;
    
    if (this._currentBGMInstance) {
      this._currentBGMInstance.audioSource.volume = this._isMuted ? 0 : this._bgmVolume;
    }

    // 同步到xforge框架（保持兼容性）
    app.manager.sound.setMusicVolumeScale(this._bgmVolume, true);
    app.manager.sound.setMusicMute(this._isMuted, true);
  }

  public static get inst(): BGMManager {
    return BGMManager._instance;
  }

  /**
   * 预加载指定的BGM资源
   * @param musicNames 要预加载的BGM资源名称数组
   * @param callback 每个资源加载完成后的回调
   * @returns Promise<void>
   */
  public static async preloadBGMs(musicNames: string[], callback?: () => void): Promise<void> {
    if (!musicNames || musicNames.length === 0) {
      // console.warn('BGMManager.preloadBGMs: BGM资源列表为空');

      return;
    }

    try {
      // 获取音效bundle
      const soundBundle = assetManager.getBundle(BGMManager.SOUND_BUNDLE_NAME);
      
      if (!soundBundle) {
        // console.error(`BGMManager.preloadBGMs: 未找到音效bundle: ${BGMManager.SOUND_BUNDLE_NAME}`);

        return;
      }

      // 批量加载BGM资源
      const loadPromises = musicNames.map(musicName => {
        return new Promise<void>((resolve) => {
          // 检查是否已经缓存
          if (BGMManager._globalAudioClipCache.has(musicName)) {
            resolve();

            return;
          }

          soundBundle.load(`Audio/${musicName}`, AudioClip, (err, audioClip) => {
            if (err) {
              console.error(`BGMManager.preloadBGMs: 加载BGM失败 ${musicName}`, err);
            } else if (audioClip) {
              // 存储到全局缓存
              BGMManager._globalAudioClipCache.set(musicName, audioClip);
              console.log(`BGMManager.preloadBGMs: 预加载BGM成功 ${musicName}`);
            }

            callback?.();
            resolve();
          });
        });
      });

      await Promise.all(loadPromises);
      // console.log(`BGMManager.preloadBGMs: 完成预加载 ${musicNames.length} 个BGM资源`);
    } catch (error) {
      console.error('BGMManager.preloadBGMs: 预加载BGM资源时发生错误', error);
    }
  }

  /**
   * 预加载常用BGM资源
   * @param callback 每个资源加载完成后的回调
   * @returns Promise<void>
   */
  public static async preloadCommonBGMs(callback?: () => void): Promise<void> {
    await BGMManager.preloadBGMs(BGMManager.bgmList, callback);
  }

  /**
   * 释放预加载的BGM资源
   * @param musicNames 要释放的BGM资源名称数组，如果不传则释放所有预加载的资源
   */
  public static releasePreloadedBGMs(musicNames?: string[]): void {
    if (musicNames && musicNames.length > 0) {
      // 释放指定的BGM资源
      musicNames.forEach(musicName => {
        const audioClip = BGMManager._globalAudioClipCache.get(musicName);

        if (audioClip) {
          audioClip.destroy();
          BGMManager._globalAudioClipCache.delete(musicName);
          // console.log(`BGMManager.releasePreloadedBGMs: 释放预加载BGM ${musicName}`);
        }
      });
    } else {
      // 释放所有预加载的BGM资源
      BGMManager._globalAudioClipCache.forEach((audioClip, musicName) => {
        audioClip.destroy();
        // console.log(`BGMManager.releasePreloadedBGMs: 释放预加载BGM ${musicName}`);
      });

      BGMManager._globalAudioClipCache.clear();
    }
  }

  /**
   * 获取预加载缓存中的BGM数量
   * @returns 预加载缓存中的BGM数量
   */
  public static getPreloadedBGMCount(): number {
    return BGMManager.bgmList.length;
  }

  /**
   * 检查BGM是否已预加载
   * @param musicName BGM名称
   * @returns 是否已预加载
   */
  public static isBGMPreloaded(musicName: string): boolean {
    return BGMManager._globalAudioClipCache.has(musicName);
  }

  protected onLoad(): void {
    if (BGMManager._instance === null) {
      BGMManager._instance = this;
      this.initBGMAudioSource();
    }
  }

  protected onDestroy(): void {
    if (BGMManager._instance === this) {
      BGMManager._instance = null;
    }

    this.stopBGMMusic();
    this.clearBGMAudioSource();
    this._audioClipCache.clear();
  }

  /**
   * 初始化BGM音频源
   */
  private initBGMAudioSource(): void {
    const audioNode = new Node('BGMAudioSource');
    this._bgmAudioSource = audioNode.addComponent(AudioSource);
    audioNode.setParent(this.node);
  }

  /**
   * 清理BGM音频源
   */
  private clearBGMAudioSource(): void {
    if (this._bgmAudioSource && this._bgmAudioSource.node) {
      this._bgmAudioSource.node.destroy();
      this._bgmAudioSource = null;
    }
  }

  /**
   * 加载音频剪辑
   */
  private async loadAudioClip(name: string): Promise<AudioClip | null> {
    // 先检查全局缓存
    if (BGMManager._globalAudioClipCache.has(name)) {
      const audioClip = BGMManager._globalAudioClipCache.get(name);
      // 同时存储到实例缓存中
      this._audioClipCache.set(name, audioClip);

      return audioClip;
    }

    // 再检查实例缓存
    if (this._audioClipCache.has(name)) {
      return this._audioClipCache.get(name);
    }

    // 尝试从bundle加载
    const soundBundle = assetManager.getBundle(BGMManager.SOUND_BUNDLE_NAME);

    if (soundBundle) {
      return new Promise((resolve) => {
        soundBundle.load(`Audio/${name}`, AudioClip, (err, clip) => {
          if (err) {
            // console.error(`Failed to load BGM clip from bundle: ${name}`, err);
            resolve(null);

            return;
          }

          // 缓存音频剪辑
          this._audioClipCache.set(name, clip);
          resolve(clip);
        });
      });
    }

    // 降级到resources加载
    return new Promise((resolve) => {
      resources.load(`Audio/${name}`, AudioClip, (err, clip) => {
        if (err) {
          // console.error(`Failed to load BGM clip from resources: ${name}`, err);
          resolve(null);

          return;
        }

        // 缓存音频剪辑
        this._audioClipCache.set(name, clip);
        resolve(clip);
      });
    });
  }

  /**
   * 生成BGM ID
   */
  private generateBGMId(): number {
    return ++this._bgmIdCounter;
  }

  /**
   * 初始化BGM音量
   */
  public initializeBGMVolume(): void {
    if (this.isVolumeInitialized) {
      return;
    }

    this.isVolumeInitialized = true;
    
    // 从xforge框架获取保存的音量值
    const savedVolume = app.manager.global.music / 100;
    const isMute = app.manager.global.music === 0;
    
    this._bgmVolume = savedVolume;
    this._isMuted = isMute;

    // 如果当前有播放中的BGM，更新其音量
    if (this._currentBGMInstance) {
      this._currentBGMInstance.audioSource.volume = this._isMuted ? 0 : this._bgmVolume;
    }
  }

  /**
   * 播放背景音乐
   * @param name 音乐资源名称
   * @param volume 音量
   */
  private async playBGM(name: string, volume?: number): Promise<void> {
    if (!this._bgmAudioSource) {
      console.error('BGMManager: BGM audio source not initialized');

      return;
    }

    // 确保音量已初始化
    if (!this.isVolumeInitialized) {
      this.initializeBGMVolume();
    }

    // 停止当前播放的BGM
    this.stopBGMMusic();

    // 加载音频剪辑
    const audioClip = await this.loadAudioClip(name);

    if (!audioClip) {
      console.error(`Failed to load BGM clip: ${name}`);

      return;
    }

    // 设置音量 - 如果传入了volume参数则使用，否则使用当前保存的音量
    if (volume !== undefined) {
      this._bgmVolume = Math.max(0, Math.min(1, volume));
    }

    // 配置音频源
    this._bgmAudioSource.clip = audioClip;
    this._bgmAudioSource.loop = true;
    this._bgmAudioSource.volume = this._isMuted ? 0 : this._bgmVolume;

    // 创建BGM实例
    const bgmInstance: IBGMInstance = {
      id: this.generateBGMId(),
      audioSource: this._bgmAudioSource,
      clip: audioClip,
      name,
    };

    this._currentBGMInstance = bgmInstance;

    // 播放BGM
    this._bgmAudioSource.play();
    this.isPlaying = true;
  }

  /**
   * 初始化背景音乐
   */
  public async initBGM() {
    // 确保音量已初始化
    if (!this.isVolumeInitialized) {
      this.initializeBGMVolume();
    }
    
    await this.playBGM('BGM/bg_audio');
  }

  /**
   * 播放普通模式背景音乐
   */
  public async playNormalModeBGM(): Promise<void> {
    await this.playBGM('BGM/bg_audio');
  }

  /**
   * 播放免费模式背景音乐
   */
  public async playFreeModeBGM(): Promise<void> {
    await this.playBGM('BGM/bg_audio');
  }
   
  /** 播放大奖弹框的背景音乐 */
  public async playBigPrizeBGM(prizeBgName:string): Promise<void> {
    await this.playBGM(prizeBgName);
  }

  /**
   * 停止背景音乐
   */
  private stopBGMMusic(): void {
    if (!this.isPlaying || !this._bgmAudioSource) {
      return;
    }

    this._bgmAudioSource.stop();
    this.isPlaying = false;
    this._currentBGMInstance = null;

    // console.log('BGMManager: 停止播放BGM');
  }

  /**
   * 暂停背景音乐
   */
  public pauseBGM(): void {
    if (this.isPlaying && this._bgmAudioSource) {
      this._bgmAudioSource.pause();
      this.isPlaying = false;
      // console.log('BGMManager: 暂停播放BGM');
    }
  }

  /**
   * 恢复背景音乐
   */
  public resumeBGM(): void {
    if (!this.isPlaying && this._bgmAudioSource && this._bgmAudioSource.clip) {
      this._bgmAudioSource.play();
      this.isPlaying = true;
      // console.log('BGMManager: 恢复播放BGM');
    }
  }

  /**
   * 获取当前播放的BGM名称
   */
  public getCurrentBGMName(): string | null {
    return this._currentBGMInstance ? this._currentBGMInstance.name : null;
  }

  /**
   * 检查是否正在播放指定的BGM
   * @param musicName BGM名称
   */
  public isPlayingBGM(musicName?: string): boolean {
    if (!musicName) {
      return this.isPlaying;
    }

    return this.isPlaying && this._currentBGMInstance?.name === musicName;
  }

  /**
   * 淡入播放BGM
   * @param name BGM名称
   * @param duration 淡入时间（秒）
   * @param targetVolume 目标音量
   */
  public async fadeInBGM(name: string, duration: number = 1, targetVolume?: number): Promise<void> {
    const originalVolume = this._bgmVolume;
    const target = targetVolume ?? originalVolume;

    // 先设置为0音量播放
    this._bgmVolume = 0;
    await this.playBGM(name, 0);

    // 淡入效果
    const steps = 30;
    const stepTime = duration / steps;
    const volumeStep = target / steps;

    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => {
        this.scheduleOnce(() => {
          this.volume = volumeStep * i;
          resolve(null);
        }, stepTime * i);
      });
    }
  }

  /**
   * 淡出停止BGM
   * @param duration 淡出时间（秒）
   */
  public async fadeOutBGM(duration: number = 1): Promise<void> {
    if (!this.isPlaying) {
      return;
    }

    const originalVolume = this._bgmVolume;
    const steps = 30;
    const stepTime = duration / steps;
    const volumeStep = originalVolume / steps;

    for (let i = steps - 1; i >= 0; i--) {
      await new Promise(resolve => {
        this.scheduleOnce(() => {
          this.volume = volumeStep * i;

          if (i === 0) {
            this.stopBGMMusic();
            // 恢复原始音量
            this._bgmVolume = originalVolume;
          }

          resolve(null);
        }, stepTime * (steps - i));
      });
    }
  }

  /**
   * 释放BGM资源
   * @param musicName BGM名称
   */
  public releaseBGM(musicName: string): void {
    // 如果是当前播放的BGM，先停止
    if (this._currentBGMInstance?.name === musicName) {
      this.stopBGMMusic();
    }
    
    // 释放缓存的音频剪辑
    const audioClip = this._audioClipCache.get(musicName);

    if (audioClip) {
      audioClip.destroy();
      this._audioClipCache.delete(musicName);
      // console.log(`BGMManager: 释放BGM资源 ${musicName}`);
    }
  }

  /**
   * 释放所有BGM资源
   */
  public releaseAllBGMs(): void {
    this.stopBGMMusic();
    
    // 释放所有缓存的音频剪辑
    this._audioClipCache.forEach((audioClip) => {
      audioClip.destroy();
      // console.log(`BGMManager: 释放BGM资源 ${musicName}`);
    });
    this._audioClipCache.clear();
  }
}
