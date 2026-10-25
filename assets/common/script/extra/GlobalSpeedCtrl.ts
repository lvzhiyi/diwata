import { game, director, Game, sys } from 'cc';

class _GlobalSpeedCtrl {
  private static _instance: _GlobalSpeedCtrl;

  private constructor() {}

  public static getInstance(): _GlobalSpeedCtrl {
    if (!_GlobalSpeedCtrl._instance) {
      _GlobalSpeedCtrl._instance = new _GlobalSpeedCtrl();
    }
    return _GlobalSpeedCtrl._instance;
  }

  // 核心变量
  private _customFrameLoop: number | null = null; // 保存 rAF 循环 id
  private _isAccelerating = false;
  private _nativeLoopPaused = false;
  private _hasAppStateListener = false;

  // 时间控制变量
  private _lastTime = 0;
  private _accumulator = 0;
  private _targetSpeed = 1.0;

  // 定义标准帧长 (Cocos 默认逻辑通常是 60FPS，即约 16.66ms 一帧)
  private readonly FIXED_STEP = 1000 / 60;
  private readonly FIXED_DT = this.FIXED_STEP / 1000;

  private readonly onAppResume = () => {
    if (!this._isAccelerating) {
      return;
    }
    // 回前台后重置时间基线，避免大跨度时间差影响加速循环
    this._lastTime = performance.now();
    this._accumulator = 0;
  };

  private bindAppStateListener() {
    if (this._hasAppStateListener) {
      return;
    }
    this._hasAppStateListener = true;
    if (sys.isBrowser) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      return;
    }
    game.on(Game.EVENT_SHOW, this.onAppResume, this);
  }

  private unbindAppStateListener() {
    if (!this._hasAppStateListener) {
      return;
    }
    this._hasAppStateListener = false;
    if (sys.isBrowser) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      return;
    }
    game.off(Game.EVENT_SHOW, this.onAppResume, this);
  }

  private readonly handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.onAppResume();
    }
  };

  /**
   * 启动加速模式
   * @param speed 加速倍数 (支持小数，例如 1.5, 2.0)
   * @param options 配置项：是否暂停原生帧循环
   */
  public startAcceleratedMode = (speed: number = 1.0, options?: { pauseNativeLoop?: boolean }) => {
    // 如果已经处于加速模式，仅更新速度参数，不重复启动循环
    if (this._isAccelerating) {
      this._targetSpeed = Math.max(0, speed);
      return;
    }

    const { pauseNativeLoop = false } = options || {};
    this._targetSpeed = Math.max(0, speed);
    this._isAccelerating = true;
    this._nativeLoopPaused = pauseNativeLoop;

    // 按需暂停原生帧循环
    if (pauseNativeLoop) {
      game.pause();
    } else {
      // 如果不暂停系统的帧循环，则需要减去1倍，因为系统帧循环也会执行一步逻辑
      this._targetSpeed -= 1;
    }

    // 初始化时间状态
    this._lastTime = performance.now();
    this._accumulator = 0;
    this.bindAppStateListener();

    const loop = () => {
      // 安全检查：如果停止了加速，不再执行后续逻辑
      if (!this._isAccelerating) return;

      const currentTime = performance.now();
      // 计算距离上一帧经过的真实物理时间 (ms)
      const deltaTime = currentTime - this._lastTime;
      this._lastTime = currentTime;

      // 核心逻辑：真实时间 * 倍速 = 逻辑时间
      // 例如：真实过了16ms，2倍速下，逻辑上相当于过了32ms
      this._accumulator += deltaTime * this._targetSpeed;

      // 防止“死亡螺旋”：如果设备卡顿导致 deltaTime 极大（如切后台回来），
      // 可能会死循环执行几千次 step。这里做一个封顶限制，比如最大只追赶 5 帧。
      // (可视情况调整，如果不介意追帧，可以去掉这个 if)
      if (this._accumulator > this.FIXED_STEP * 5) {
        this._accumulator = this.FIXED_STEP * 5;
      }

      // 消耗累加器中的时间，执行对应的逻辑帧
      while (this._accumulator >= this.FIXED_STEP) {
        // 以固定 dt 额外推进一帧，确保包含 Spine 在内的 dt 驱动动画稳定加速
        director.tick(this.FIXED_DT);
        this._accumulator -= this.FIXED_STEP;
      }

      // 继续下一帧渲染循环
      this._customFrameLoop = requestAnimationFrame(loop);
    };

    // 启动循环
    this._customFrameLoop = requestAnimationFrame(loop);
  };

  /**
   * 停止加速模式
   */
  public stopAcceleratedMode = () => {
    if (!this._isAccelerating) return;

    if (this._customFrameLoop !== null) {
      cancelAnimationFrame(this._customFrameLoop);
    }
    this._customFrameLoop = null;
    this.unbindAppStateListener();

    if (this._nativeLoopPaused) {
      game.resume(); // 恢复引擎原生帧驱动
    }

    // 重置状态
    this._nativeLoopPaused = false;
    this._isAccelerating = false;
    this._accumulator = 0;
    this._lastTime = 0;
  };
}

const globalSpeedCtrl = _GlobalSpeedCtrl.getInstance();

export default globalSpeedCtrl;
