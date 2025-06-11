import { _decorator, Component, Node } from 'cc';

const { ccclass, property } = _decorator;
import { EventTarget } from 'cc';

export enum GameGlobalEventType {
    // 游戏开始
    GAME_START = 'GAME_START',
    // 游戏结束
    GAME_END = 'GAME_END',
    // 游戏暂停
    GAME_PAUSE = 'GAME_PAUSE',
    // 游戏恢复
    GAME_RESUME = 'GAME_RESUME',

    // 更新jackpot奖池信息
    UPDATE_JACKPOT_INFO = 'UPDATE_JACKPOT_INFO',
}

@ccclass('GameGlobalEvent')
export class GameGlobalEvent extends Component {
    private static _instance: GameGlobalEvent;

    private _eventTarget: EventTarget = new EventTarget();

    public static get instance(): GameGlobalEvent {
      if (!this._instance) {
        this._instance = new GameGlobalEvent();
      }

      return this._instance;
    }

    public getEventTarget(): EventTarget {
      return this._eventTarget;
    }

    constructor() {
      super();
      this.initRegister();
    }
    
    private initRegister(): void {
        
    }

    public dispatchEvent(type: GameGlobalEventType, arg0?: any): void {
      this._eventTarget.emit(type, arg0);
    }

    public on(type: GameGlobalEventType, callback: any, thisArg: any, once?: boolean): void {
      this._eventTarget.on(type, callback, thisArg, once);
    }

    public off(type: GameGlobalEventType, callback: any, thisArg: any): void {
      this._eventTarget.off(type, callback, thisArg);
    }

    public offAll(thisArg?: any): void {
      this._eventTarget.removeAll(thisArg);
    }
}
