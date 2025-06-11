import { _decorator, Component, Node } from 'cc';
import { EventTarget } from "cc";
const { ccclass, property } = _decorator;

export enum GameEventMgrEventsType {
    updateGaming = "updateGaming", //更新是否在游戏中
    updateBuyFreeCount = "updateBuyFreeCount", // 更新免费游戏次数
    updateVolume = "updateVolume", //更新音效音量
}

@ccclass('GameMrgEvent')
export class GameMrgEvent  {    
    private static _instance: GameMrgEvent;
    private _eventTarget: EventTarget = new EventTarget();
    public static get instance(): GameMrgEvent {
        if (!this._instance) {
            this._instance = new GameMrgEvent();
        }
        return this._instance;
    }
    public getEventTarget(): EventTarget {
        return this._eventTarget;
    }
    constructor() {
        this.initRegister();
    }
    
    
    private initRegister(): void {
        
    }
    public dispatchEvent(type: GameEventMgrEventsType, arg0?: any): void {
        this._eventTarget.emit(type, arg0);
    }
    public on(type: GameEventMgrEventsType, callback: any, thisArg: any, once?: boolean): void {
        this._eventTarget.on(type, callback, thisArg, once);
    }
    public off(type: GameEventMgrEventsType, callback: any, thisArg: any): void {
        this._eventTarget.off(type, callback, thisArg);
    }
    public offAll(thisArg?: any): void {
        this._eventTarget.removeAll(thisArg);
    }
}

