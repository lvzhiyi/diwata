
/**
 * 游戏过程控制器
 * 负责管理游戏过程，包括游戏开始、游戏结束等
 * 包含的业务：投注记录过列表滤当前正在执行动画的投注记录，投注记录列表读取这里的 {gamePlayingId} 自行过滤列表。
 * @author baimo
 */
class GameProcessCtrl {
  private static _instance: GameProcessCtrl;

  public static getInstance(): GameProcessCtrl {
    if (!GameProcessCtrl._instance) {
      GameProcessCtrl._instance = new GameProcessCtrl();
    }
    return GameProcessCtrl._instance;
  }

  /**
   * 游戏状态
   * @type {GameState}
   */
  private _gameState: GameState = GameState.GameIdle;

  /**
   * 游戏进行中获取的 ID
   * @type {string}
   */
  public gamePlayingId: string = '';

  /**
   * 设置游戏状态，此状态为整轮游戏状态，不是 scatter 中途的小轮
   * @param {GameState} state
   */
  set gameState(state: GameState) {
    // 游戏结束时，清空游戏ID
    if (state === GameState.GameEnded) {
      this.gamePlayingId = '';
    }
    this._gameState = state;
  }

  get gameState() {
    return this._gameState;
  }
}

export enum GameState {
  // 游戏开始
  GameStarting = 'gameStarting',
  // 游戏结束
  GameEnded = 'gameEnded',
  // 游戏空闲
  GameIdle = 'gameIdle',
}

export default GameProcessCtrl.getInstance();
