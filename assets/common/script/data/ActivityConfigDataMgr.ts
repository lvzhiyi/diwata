import { Vec2, Vec3, view } from "cc";

export class ActivityConfigDataMgr {
    private static _instance: ActivityConfigDataMgr;
    private _moveToPosData: Vec3 = null; //星卡特效飞行终点位置
    private _cardPosData: Vec3 = null; //使用星卡时卡片展示位置
    private _freeSpinFigurePosData: Vec3 = null; //freeSpin下注金额处闪光位置
    private _spinPosData: Vec3 = null; //spin按钮位置
    public static get instance(): ActivityConfigDataMgr {
        if (!this._instance) {
            this._instance = new ActivityConfigDataMgr();
        }
        return this._instance;
    }
    constructor() {
        this.initData();
    }
    private initData(): void {
        this._moveToPosData = getMoveToPos();
        this._cardPosData = getCardPos();
        this._freeSpinFigurePosData = getFreeSpinFigurePos();
        this._spinPosData = getSpinPos();
        function getMoveToPos(): Vec3 {
            let moveToPos: Vec3 = new Vec3();
            moveToPos.x = -160;
            moveToPos.y = -view.getVisibleSize().height / 2 + 113;
            return moveToPos;
        }
        function getCardPos(): Vec3 {
            let cardPos: Vec3 = new Vec3();
            cardPos.x = 310;
            cardPos.y = -view.getVisibleSize().height / 2 + 210;
            return cardPos;
        }
        function getFreeSpinFigurePos(): Vec3 {
            let freeSpinFigurePos: Vec3 = new Vec3();
            freeSpinFigurePos.x = -157;
            freeSpinFigurePos.y = -view.getVisibleSize().height / 2 + 111;
            return freeSpinFigurePos;
        }
        function getSpinPos(): Vec3 {
            let spinPos: Vec3 = new Vec3();
            spinPos.x = 0;
            spinPos.y = -view.getVisibleSize().height / 2 + 135;
            return spinPos;
        }
    }
    //初始化位置数据
    public initPosData(
        moveToPosData: Vec3,
        cardPosData: Vec3,
        freeSpinFigurePosData: Vec3,
        spinPosData: Vec3
    ): void {
        if (moveToPosData) {
            this._moveToPosData = moveToPosData;
        }
        if (cardPosData) {
            this._cardPosData = cardPosData;
        }
        if (freeSpinFigurePosData) {
            this._freeSpinFigurePosData = freeSpinFigurePosData;
        }
        if (spinPosData) {
            this._spinPosData = spinPosData;
        }
    }
    //获取星卡特效飞行终点位置
    public getMoveToPosData(): Vec3 {
        return this._moveToPosData;
    }
    //使用星卡时卡片展示位置
    public getCardPosData(): Vec3 {
        return this._cardPosData;
    }
    //freeSpin下注金额处闪光位置
    public getFreeSpinFigurePosData(): Vec3 {
        return this._freeSpinFigurePosData;
    }
    //spin按钮位置
    public getSpinPosData(): Vec3 {
        return this._spinPosData;
    }
    private readonly _languageData: Map<number, string> = new Map([
        [0, "Rich card is in use, this function is temporarily unavailable"], //充值卡使用中
        [1, "Do you want to leave this game, move to "], //确认跳转其他游戏
        [2, "Insufficient balance, unable to use Rich Card"], //余额不足，无法使用充值卡
        [3, "The Rich Card has expired and cannot be used"], //充值卡已过期，无法使用
        [4, "Game Playing "], //游戏进行中
        [5, "The purchased free game is in use, and this function is temporarily unavailable"], //购买的免费游戏使用中
        [
            6,
            "Confirm pausing Free Spins?You'll return to real money mode,and can resume from this interface later.",
        ], //是否取消freeSpin
    ]);
    public getLanguageData(id: number): string {
        return this._languageData.get(id);
    }
}
