import { _decorator, Component, AudioClip, AudioSource, Node, resources, assetManager } from 'cc';
import { IQuickMode } from 'db://assets/app-builtin/app-manager/global/GlobalManager';
import { app } from 'db://assets/app/app';
import { GameDataMgrEventsType } from 'db://assets/common/script/data/ActivityDataMgr';
import { GlobalActivity } from 'db://assets/common/script/extra/GlobalMgr';
import { AudioPath } from 'db://assets/res-native/script/AudioConfig';

const { ccclass } = _decorator;

/**
 * 音效播放实例接口
 */
interface IEffectInstance {
  /** 音效ID */
  id: number;
  /** 音频源组件 */
  audioSource: AudioSource;
  /** 音频剪辑 */
  clip: AudioClip;
  /** 是否循环播放 */
  isLoop: boolean;
  /** 播放完成回调 */
  onEnded?: () => void;
  /** 音效名称 */
  name: string;
}

@ccclass('EffectManager')
export class EffectManager extends Component {
  /** 单例实例 */
  private static _instance: EffectManager = null;

  /** 音效bundle名称 */
  private static readonly SOUND_BUNDLE_NAME = 'resources';

  /** 全局音频剪辑缓存 */
  private static _globalAudioClipCache: Map<string, AudioClip> = new Map();

  /** 是否已初始化音效音量 */
  private isInitialized = false;

  /** 音效实例映射表 */
  private _effectInstances: Map<string, IEffectInstance> = new Map();

  /** 所有音效实例列表 */
  private _allEffectInstances: Map<number, IEffectInstance> = new Map();

  /** 音效ID计数器 */
  private _effectIdCounter = 0;

  /** 音效音量 */
  private _effectVolume = 1;

  /** 是否静音 */
  private _isMuted = false;

  /** 是否超快模式 */
  private _isTurboMode = false;

  /** 音频剪辑缓存 */
  private _audioClipCache: Map<string, AudioClip> = new Map();

  /** 音频源节点池 */
  private _audioSourcePool: AudioSource[] = [];

  /** 音频源ID计数器，用于创建唯一的音频源名称 */
  private _audioSourceIdCounter = 0;

  /** 
   * 最大音频源数量 - 移除限制，改为动态扩展
   */
  private readonly MAX_AUDIO_SOURCES = 200;

  /** 初始音频源数量 */
  private readonly INITIAL_AUDIO_SOURCES = 10;

  /** 最小保留音频源数量 */
  private readonly MIN_AUDIO_SOURCES = 5;

  /** 当前正在播放的音乐 */
  private playingMusic = { uuid: -1, name: '' };

  public static get inst(): EffectManager {
    return EffectManager._instance;
  }

  /**
   * 预加载的音效列表
   */
  public static effectList: string[] = [
    AudioPath.POPUP.OPEN_HOME_AUDIO,

    AudioPath.GAME.SPINE_ROTATE,
    AudioPath.GAME.CHANGE_WILD,
    AudioPath.GAME.SWORD_AND_STICK,
    AudioPath.GAME.STICK_RETURN,
    AudioPath.GAME.SWORD_RETURN,
    AudioPath.GAME.SPIN_ROTATE,
    AudioPath.GAME.ROLL_STOP_ROTATE,
    AudioPath.GAME.DOUBLE_NUMBER,
    AudioPath.GAME.FREE_BONUS_TRANSITION,
    AudioPath.GAME.SCATTER_SHOW,
    AudioPath.GAME.SCATTER_EXPECT,
    AudioPath.GAME.SCATTER_WIN,
    AudioPath.GAME.SYMBOL_CLEAR,
    AudioPath.GAME.SYMBOL_WIN,
    AudioPath.GAME.MEGA_DUB,
    AudioPath.GAME.NICE_DUB,
    AudioPath.GAME.SUPER_DUB,
    AudioPath.UI.BETFREESPIN,
    // 购买免费轮
    AudioPath.UI.OPENBETFREE,
    // 打开界面
    AudioPath.UI.OPEN,
    // 关闭界面
    AudioPath.UI.CLOSE,
    // 结算弹窗打开（无金币）
    AudioPath.POPUP.SETTLE_BG_NO_COIN,
    AudioPath.POPUP.SETTLE_OPEN,
    
    AudioPath.POPUP.MEGA_OPEN,
    AudioPath.POPUP.NICE_OPEN,
    AudioPath.POPUP.SUPER_OPEN,
    AudioPath.POPUP.WIN_END,

    AudioPath.GAME.GODDESS_CHEER1,
    // 女神欢呼2
    AudioPath.GAME.GODDESS_CHEER2,
    // 女神欢呼3
    AudioPath.GAME.GODDESS_CHEER3,
    // 女神欢呼4
    AudioPath.GAME.GODDESS_CHEER4,
    // 女神欢呼
    AudioPath.GAME.GODDESS_CHEER5,
  ];

  /**
   * scatter元素播放索引，从1开始依次递增，每调用依次播放scatter元素音效，则索引+1，播放下一个
   */
  private scatterPlayIndex = 1;

  /**
   * 预加载指定的音效资源
   * @param effectNames 要预加载的音效资源名称数组
   * @returns Promise<void>
   */
  public static async preloadEffects(effectNames: string[], callback?: () => void): Promise<void> {
    if (!effectNames || effectNames.length === 0) {
      console.warn('EffectManager.preloadEffects: 音效资源列表为空');

      return;
    }

    try {
      // 获取音效bundle
      const soundBundle = assetManager.getBundle(EffectManager.SOUND_BUNDLE_NAME);
      
      if (!soundBundle) {
        console.error(`EffectManager.preloadEffects: 未找到音效bundle: ${EffectManager.SOUND_BUNDLE_NAME}`);

        return;
      }

      // 批量加载音效资源
      const loadPromises = effectNames.map(effectName => {
        return new Promise<void>((resolve) => {
          // 检查是否已经缓存
          if (EffectManager._globalAudioClipCache.has(effectName)) {
            // callback?.();
            resolve();

            return;
          }

          soundBundle.load(`Audio/${effectName}`, AudioClip, (err, audioClip) => {
            if (err) {
              // console.error(`EffectManager.preloadEffects: 加载音效失败 ${effectName}`, err);
            } else if (audioClip) {
              // 存储到全局缓存
              EffectManager._globalAudioClipCache.set(effectName, audioClip);
              console.log(`EffectManager.preloadEffects: 预加载音效成功 ${effectName}`);
            }

            callback?.();
            resolve();
          });
        });
      });

      await Promise.all(loadPromises);
      // console.log(`EffectManager.preloadEffects: 完成预加载 ${effectNames.length} 个音效资源`);
    } catch (error) {
      // console.error('EffectManager.preloadEffects: 预加载音效资源时发生错误', error);
    }
  }

  /**
   * 预加载常用音效资源
   * @returns Promise<void>
   */
  public static async preloadCommonEffects(callback?: () => void): Promise<void> {
    await EffectManager.preloadEffects(EffectManager.effectList, callback);
  }

  /**
   * 释放预加载的音效资源
   * @param effectNames 要释放的音效资源名称数组，如果不传则释放所有预加载的资源
   */
  public static releasePreloadedEffects(effectNames?: string[]): void {
    if (effectNames && effectNames.length > 0) {
      // 释放指定的音效资源
      effectNames.forEach(effectName => {
        const audioClip = EffectManager._globalAudioClipCache.get(effectName);

        if (audioClip) {
          audioClip.destroy();
          EffectManager._globalAudioClipCache.delete(effectName);
          // console.log(`EffectManager.releasePreloadedEffects: 释放预加载音效 ${effectName}`);
        }
      });
    } else {
      // 释放所有预加载的音效资源
      EffectManager._globalAudioClipCache.forEach((audioClip) => {
        audioClip.destroy();
        // console.log(`EffectManager.releasePreloadedEffects: 释放预加载音效 ${effectName}`);
      });

      EffectManager._globalAudioClipCache.clear();
    }
  }

  /**
   * 获取预加载缓存中的音效数量
   * @returns 预加载缓存中的音效数量
   */
  public static getPreloadedEffectCount(): number {
    return EffectManager.effectList.length;
  }

  /**
   * 检查音效是否已预加载
   * @param effectName 音效名称
   * @returns 是否已预加载
   */
  public static isEffectPreloaded(effectName: string): boolean {
    return EffectManager._globalAudioClipCache.has(effectName);
  }

  protected onLoad(): void {
    if (EffectManager._instance === null) {
      EffectManager._instance = this;
      this.initAudioSourcePool();
    }
  }

  protected onDestroy(): void {
    if (EffectManager._instance === this) {
      EffectManager._instance = null;
    }

    this.stopAllEffects();
    this.clearAudioSourcePool();
    this._audioClipCache.clear();
  }

  /**
   * 初始化音频源对象池
   */
  private initAudioSourcePool(): void {
    for (let i = 0; i < this.INITIAL_AUDIO_SOURCES; i++) {
      this.createAudioSource(i);
    }
  }

  /**
   * 创建新的音频源
   */
  private createAudioSource(index: number): AudioSource {
    const audioSourceId = ++this._audioSourceIdCounter;
    const audioNode = new Node(`AudioSource_${audioSourceId}`);
    const audioSource = audioNode.addComponent(AudioSource);
    audioNode.setParent(this.node);
    this._audioSourcePool.push(audioSource);

    return audioSource;
  }

  /**
   * 清理音频源对象池
   */
  private clearAudioSourcePool(): void {
    this._audioSourcePool.forEach(audioSource => {
      if (audioSource && audioSource.node) {
        audioSource.node.destroy();
      }
    });
    this._audioSourcePool.length = 0;
  }

  /**
   * 获取可用的音频源 - 优化为不会停止已播放音效
   */
  private getAvailableAudioSource(): AudioSource | null {
    // 优先使用真正空闲的音频源（不在播放且不在实例映射中）
    for (let i = 0; i < this._audioSourcePool.length; i++) {
      const audioSource = this._audioSourcePool[i];

      // 更严格的检查：既不在播放，也不在使用中
      if (!audioSource.playing && !this.isAudioSourceInUse(audioSource)) {
        // 重置音频源状态
        this.resetAudioSource(audioSource);

        return audioSource;
      }
    }

    // 如果没有空闲的音频源，直接创建新的音频源
    const newAudioSource = this.createAudioSource(this._audioSourcePool.length);
    this.resetAudioSource(newAudioSource);

    return newAudioSource;
  }

  /**
   * 重置音频源状态
   */
  private resetAudioSource(audioSource: AudioSource): void {
    // 双重检查：确保音频源真正空闲
    if (this.isAudioSourceInUse(audioSource)) {
      console.error('EffectManager: 尝试重置正在使用的音频源，跳过重置');

      return;
    }

    // 停止播放（如果正在播放）
    if (audioSource.playing) {
      audioSource.stop();
    }

    // 移除所有事件监听器
    audioSource.node.off('audio-ended');

    if (AudioSource.EventType && AudioSource.EventType.ENDED) {
      audioSource.node.off(AudioSource.EventType.ENDED);
    }

    // 重置所有状态 - 确保完全重置
    audioSource.clip = null;
    audioSource.loop = false;
    audioSource.volume = this._effectVolume;
    audioSource.playOnAwake = false;
    
    // 确保节点处于激活状态
    if (!audioSource.node.active) {
      audioSource.node.active = true;
    }
    
    // 确保组件处于启用状态
    if (!audioSource.enabled) {
      audioSource.enabled = true;
    }
  }

  /**
   * 加载音频剪辑
   */
  private async loadAudioClip(name: string): Promise<AudioClip | null> {
    // 先检查全局缓存
    if (EffectManager._globalAudioClipCache.has(name)) {
      const audioClip = EffectManager._globalAudioClipCache.get(name);
      // 同时存储到实例缓存中
      this._audioClipCache.set(name, audioClip);

      return audioClip;
    }

    // 再检查实例缓存
    if (this._audioClipCache.has(name)) {
      return this._audioClipCache.get(name);
    }

    // 尝试从bundle加载
    const soundBundle = assetManager.getBundle(EffectManager.SOUND_BUNDLE_NAME);

    if (soundBundle) {
      return new Promise((resolve) => {
        soundBundle.load(`Audio/${name}`, AudioClip, (err, clip) => {
          if (err) {
            console.error(`EffectManager: 从bundle加载音频失败 sound/${name}`, err);
            resolve(null);

            return;
          }

          if (clip) {
            // 缓存音频剪辑
            this._audioClipCache.set(name, clip);
            resolve(clip);
          } else {
            console.error(`EffectManager: bundle返回的音频剪辑为空 ${name}`);
            resolve(null);
          }
        });
      });
    }

    // 降级到resources加载
    return new Promise((resolve) => {
      resources.load(`Audio/${name}`, AudioClip, (err, clip) => {
        if (err) {
          console.error(`EffectManager: 从resources加载音频失败 sound/${name}`, err);
          resolve(null);

          return;
        }

        if (clip) {
          // 缓存音频剪辑
          this._audioClipCache.set(name, clip);
          resolve(clip);
        } else {
          console.error(`EffectManager: resources返回的音频剪辑为空 ${name}`);
          resolve(null);
        }
      });
    });
  }

  /**
   * 生成音效ID（使用时间戳确保唯一性）
   */
  private generateEffectId(): number {
    return Date.now() + (++this._effectIdCounter);
  }

  public initializeEffectVolume(): void {
    this.isInitialized = true;
    const volume = app.manager.global.voice / 100;
    const isMute = volume === 0;
    
    this._effectVolume = volume;
    this._isMuted = isMute;

    this.syncSubPackageEffectVolume();
  }
  
  /**
   * 同步侧边栏展开页面的音量设置
   */
  public syncSubPackageEffectVolume(): void {
    if (!this._isMuted) {
      this.updateSubPackageVolume(this._effectVolume);

      return;
    }

    // 如果音量值为0，需要先初始化成非0，在同步真实的音量值。
    this.updateSubPackageVolume(1);
    this.scheduleOnce(() => {
      this.updateSubPackageVolume(0);
    }, 0.1);
  }

  /**
   * 更新侧边栏展开页面的音量设置
   * @param volume 音量值
   */
  private updateSubPackageVolume(volume: number): void {
    if (app.store.user.isInitActivityModule && GlobalActivity.getEventTarget()) {
      GlobalActivity.getEventTarget().emit(
        GameDataMgrEventsType.updateVolume,
        volume,
      );
    }
  }

  /**
   * 播放音效
   * @param name 音效资源名称
   * @param isLoop 是否循环播放
   * @param onEnded 播放完成回调
   * @returns 音效ID
   */
  public async playEffect(
    name: string,
    isLoop: boolean = false,
    onEnded?: () => void,
    isForcePlay: boolean = false,
  ): Promise<number> {
    if (!this.isInitialized) {
      this.initializeEffectVolume();
    }

    // 如果静音，直接返回一个无效ID
    if ((this._isMuted ) && !isForcePlay) {
      onEnded?.();
      
      return -1;
    }
    // 如果的超快模式，则不播放pop,和game音效
    
    if (this._isTurboMode && (name.indexOf('PopAudio') || name.indexOf('Game'))) {
      onEnded?.();

      return -1;
    }

    // 该音乐正在播放中则返回
    if (!isForcePlay && this.playingMusic.uuid !== -1 && this.playingMusic.name === name) {
      console.log('该音乐正在播放');

      return ;
    }

    // 加载音频剪辑
    const audioClip = await this.loadAudioClip(name);

    if (!audioClip) {
      // console.error(`EffectManager: 无法加载音频剪辑，播放失败 ${name}`);

      return -1;
    }

    // 检查音频剪辑是否为空文件
    // const hasGetDuration = typeof (audioClip as any).getDuration === 'function';
    // const hasDuration = (audioClip as any).duration !== undefined;
    
    // if (hasGetDuration && (audioClip as any).getDuration() === 0) {
    //   console.error(`EffectManager: 警告 - 音频剪辑时长为0，可能是空文件: ${name}`);
    // } else if (hasDuration && (audioClip as any).duration === 0) {
    //   console.error(`EffectManager: 警告 - 音频剪辑时长为0，可能是空文件: ${name}`);
    // }

    // 获取可用的音频源（保证每个音效都有独立的音频源）
    const audioSource = this.getAvailableAudioSource();

    if (!audioSource) {
      console.error(`EffectManager: 无法获取可用音频源，播放失败 ${name}`);

      return -1;
    }

    // 生成音效ID
    const effectId = this.generateEffectId();

    // 再次确保音频源状态正确（防御性编程）
    if (audioSource.playing) {
      audioSource.stop();
    }
    
    // 配置音频源
    audioSource.clip = audioClip;
    audioSource.loop = isLoop;
    audioSource.volume = this._effectVolume;
    audioSource.playOnAwake = false;

    // 创建音效实例
    const effectInstance: IEffectInstance = {
      id: effectId,
      audioSource,
      clip: audioClip,
      isLoop,
      onEnded,
      name,
    };
   
    // 记录要播放音乐的名字
    this.playingMusic.name = name;

    // 设置播放完成回调
    if (!isLoop && onEnded) {
      // 使用正确的 AudioSource 播放完成事件
      const onAudioEnded = () => {
        // 移除事件监听器，避免重复调用
        audioSource.node.off('audio-ended', onAudioEnded);
        // 播放完成状态重置
        this.playingMusic.name = '';
        this.playingMusic.uuid = -1;

        if (AudioSource.EventType && AudioSource.EventType.ENDED) {
          audioSource.node.off(AudioSource.EventType.ENDED, onAudioEnded);
        }
        
        this.onEffectFinished(effectInstance);
      };

      // 尝试多种事件监听方式，确保兼容性
      audioSource.node.once('audio-ended', onAudioEnded);
      
      // 如果 AudioSource.EventType.ENDED 存在，也监听这个事件
      if (AudioSource.EventType && AudioSource.EventType.ENDED) {
        audioSource.node.once(AudioSource.EventType.ENDED, onAudioEnded);
      }

      // 备用方案：使用定时器检查播放状态
      const checkPlayingState = () => {
        if (!audioSource.playing && this._allEffectInstances.has(effectId)) {
          // 音频已停止播放，手动触发回调
          audioSource.node.off('audio-ended', onAudioEnded);

          if (AudioSource.EventType && AudioSource.EventType.ENDED) {
            audioSource.node.off(AudioSource.EventType.ENDED, onAudioEnded);
          }

          this.onEffectFinished(effectInstance);
        } else if (audioSource.playing) {
          // 如果还在播放，继续检查
          this.scheduleOnce(checkPlayingState, 0.1);
        }
      };

      // 延迟开始状态检查，给事件监听器一些时间
      this.scheduleOnce(checkPlayingState, 0.5);
    }

    // 存储音效实例到所有实例映射中
    this._allEffectInstances.set(effectId, effectInstance);
    
    // 使用带ID的唯一映射，确保每个音效实例都独立存储
    this._effectInstances.set(`${name}_${effectId}`, effectInstance);
    
    // 对于需要通过名称控制的特殊音效（如BGM），也保存名称映射
    // 但只有循环播放的音效才需要名称映射，避免冲突
    if (isLoop) {
      this._effectInstances.set(name, effectInstance);
    }

    // 播放音效
    try {
      // 确保在下一帧播放，给引擎足够的时间处理状态变更
      this.scheduleOnce(() => {
        try {
          audioSource.play();
          this.playingMusic.uuid = effectId;
          
          // 稍微延迟检查播放状态，因为play()可能是异步的
          this.scheduleOnce(() => {
            if (!audioSource.playing) {
              // console.error(
              //   `EffectManager: 警告 - 音效未能开始播放 ${name}, 可能的原因: 音频剪辑问题或音频源状态异常`,
              // );
            }
          }, 0.1);
        } catch (playError) {
          console.error(`EffectManager: 播放音效时发生异常 ${name}`, playError);
        }
      }, 0);
    } catch (error) {
      console.error(`EffectManager: 播放音效时发生错误 ${name}`, error);

      return -1;
    }

    return effectId;
  }

  /**
   * 音效播放完成回调
   */
  private onEffectFinished(effectInstance: IEffectInstance): void {
    // 执行用户回调
    if (effectInstance.onEnded) {
      effectInstance.onEnded();
    }

    // 清理音效实例
    this._allEffectInstances.delete(effectInstance.id);
    
    // 清理带ID的唯一映射
    this._effectInstances.delete(`${effectInstance.name}_${effectInstance.id}`);
    
    // 如果是循环音效且映射匹配，清理名称映射
    if (effectInstance.isLoop && this._effectInstances.get(effectInstance.name) === effectInstance) {
      this._effectInstances.delete(effectInstance.name);
    }

    // 检查是否需要销毁多余的音频源
    this.cleanupUnusedAudioSources();
  }

  /**
   * 清理未使用的音频源，保持合理数量
   */
  private cleanupUnusedAudioSources(): void {
    const currentPoolSize = this._audioSourcePool.length;
    const playingCount = this._allEffectInstances.size;
    const unusedCount = currentPoolSize - playingCount;

    // 只有在空闲音源数量过多时才进行清理，避免频繁创建销毁
    const maxUnusedSources = Math.max(this.MIN_AUDIO_SOURCES, Math.ceil(this.MAX_AUDIO_SOURCES * 0.3));
    
    if (unusedCount > maxUnusedSources) {
      const toDestroy = unusedCount - maxUnusedSources;
      let destroyedCount = 0;

      // 从后往前遍历，销毁空闲的音频源
      for (let i = this._audioSourcePool.length - 1; i >= 0 && destroyedCount < toDestroy; i--) {
        const audioSource = this._audioSourcePool[i];

        // 只销毁空闲的音频源
        if (!audioSource.playing && !this.isAudioSourceInUse(audioSource)) {
          // 从池中移除
          this._audioSourcePool.splice(i, 1);
          
          // 销毁节点
          if (audioSource.node) {
            audioSource.node.destroy();
          }
          
          destroyedCount++;
        }
      }
    }
  }

  /**
   * 检查音频源是否正在被使用
   */
  private isAudioSourceInUse(audioSource: AudioSource): boolean {
    for (const [, effectInstance] of this._allEffectInstances) {
      if (effectInstance.audioSource === audioSource) {
        return true;
      }
    }

    return false;
  }

  /**
   * 停止音效
   * @param name 音效资源名称
   */
  public stopEffect(name: string): void {
    const effectInstance = this._effectInstances.get(name);

    if (effectInstance) {
      effectInstance.audioSource.stop();
      this._effectInstances.delete(name);
      this._effectInstances.delete(`${name}_${effectInstance.id}`);
      this._allEffectInstances.delete(effectInstance.id);
      
      // 清理多余的音频源
      this.cleanupUnusedAudioSources();
    }
  }

  /**
   * 停止所有同名音效
   * @param name 音效资源名称
   */
  public stopAllEffectsByName(name: string): void {
    // 查找所有同名音效并停止
    const toStop: IEffectInstance[] = [];
    
    for (const [_, effectInstance] of this._effectInstances) {
      if (effectInstance.name === name) {
        toStop.push(effectInstance);
      }
    }
    
    toStop.forEach(effectInstance => {
      effectInstance.audioSource.stop();
      this._effectInstances.delete(effectInstance.name);
      this._effectInstances.delete(`${effectInstance.name}_${effectInstance.id}`);
      this._allEffectInstances.delete(effectInstance.id);
    });
    
    // 清理多余的音频源
    this.cleanupUnusedAudioSources();
  }

  /**
   * 根据ID停止音效
   * @param effectId 音效ID
   */
  public stopEffectById(effectId: number): void {
    const effectInstance = this._allEffectInstances.get(effectId);

    if (effectInstance) {
      effectInstance.audioSource.stop();
      this._allEffectInstances.delete(effectId);
      
      // 清理带ID的唯一映射
      this._effectInstances.delete(`${effectInstance.name}_${effectInstance.id}`);
      
      // 如果是循环音效且映射匹配，清理名称映射
      if (effectInstance.isLoop && this._effectInstances.get(effectInstance.name) === effectInstance) {
        this._effectInstances.delete(effectInstance.name);
      }
      
      // 清理多余的音频源
      this.cleanupUnusedAudioSources();
    }
  }

  /**
   * 停止所有音效
   */
  public stopAllEffects(): void {
    this._audioSourcePool.forEach(audioSource => {
      if (audioSource.playing) {
        audioSource.stop();
      }
    });

    this._effectInstances.clear();
    this._allEffectInstances.clear();
    
    // 清理多余的音频源
    this.cleanupUnusedAudioSources();
  }

  /**
   * 设置音效音量
   * @param volume 音量值 0-1
   */
  public setEffectVolume(volume: number): void {
    this._effectVolume = Math.max(0, Math.min(1, volume));
    this._isMuted = this._effectVolume === 0;

    // 更新所有正在播放的音效音量
    this._allEffectInstances.forEach(effectInstance => {
      effectInstance.audioSource.volume = this._effectVolume;
    });

    // 同步到xforge框架（保持兼容性）
    app.manager.sound.setEffectMute(this._isMuted);
    app.manager.sound.setEffectVolumeScale(this._effectVolume, true);
    
    this.updateSubPackageVolume(this._effectVolume);
  }

  /**
   * 设置超快模式
   * @param isTurboMode 是否超快模式
   */
  public setTurboMode(isTurboMode: boolean): void {
    this._isTurboMode = isTurboMode;
  }

  /**
   * 获取音效音量
   * @returns 当前音量值
   */
  public getEffectVolume(): number {
    return this._effectVolume;
  }

  /**
   * 设置静音状态
   * @param muted 是否静音
   */
  public setMuted(muted: boolean): void {
    this._isMuted = muted;
    
    // 更新所有正在播放的音效音量
    this._allEffectInstances.forEach(effectInstance => {
      effectInstance.audioSource.volume = muted ? 0 : this._effectVolume;
    });
  }

  /**
   * 获取静音状态
   * @returns 是否静音
   */
  public getMuted(): boolean {
    return this._isMuted;
  }

  /**
   * 暂停所有音效
   */
  public pauseAllEffects(): void {
    this._audioSourcePool.forEach(audioSource => {
      if (audioSource.playing) {
        audioSource.pause();
      }
    });
  }

  /**
   * 恢复所有音效
   */
  public resumeAllEffects(): void {
    this._audioSourcePool.forEach(audioSource => {
      if (audioSource.clip && !audioSource.playing) {
        audioSource.play();
      }
    });
  }

  /**
   * 释放音效资源
   * @param name 音效资源名称
   */
  public releaseEffect(name: string): void {
    // 先停止相关音效
    this.stopEffect(name);
    
    // 释放缓存的音频剪辑
    const audioClip = this._audioClipCache.get(name);

    if (audioClip) {
      audioClip.destroy();
      this._audioClipCache.delete(name);
    }
  }

  /**
   * 释放所有音效资源
   */
  public releaseAllEffects(): void {
    this.stopAllEffects();
    
    // 释放所有缓存的音频剪辑
    this._audioClipCache.forEach(audioClip => {
      audioClip.destroy();
    });
    this._audioClipCache.clear();
  }

  /**
   * 获取当前播放的音效数量
   */
  public getPlayingEffectCount(): number {
    return this._allEffectInstances.size;
  }

  /**
   * 检查音效是否正在播放
   * @param name 音效名称
   */
  public isEffectPlaying(name: string): boolean {
    const effectInstance = this._effectInstances.get(name);

    return effectInstance ? effectInstance.audioSource.playing : false;
  }

  /**
   * 根据ID检查音效是否正在播放
   * @param effectId 音效ID
   */
  public isEffectPlayingById(effectId: number): boolean {
    const effectInstance = this._allEffectInstances.get(effectId);

    return effectInstance ? effectInstance.audioSource.playing : false;
  }
}

// export const AudioMgr: EffectManager = EffectManager.inst;
