import { _decorator, Node, director, find, sys, UITransform } from 'cc';
import BaseManager from '../../../../extensions/app/assets/base/BaseManager';
import { app } from 'db://assets/app/app';

const { ccclass } = _decorator;

export enum IGameType {
  NORMAL = 'NORMAL',
  FREE_SPIN = 'FREE_SPIN',
}

@ccclass('GlobalManager')
export class GlobalManager extends BaseManager {
  // [无序] 自身初始化完成, init执行完毕后被调用
  protected onInited() {
    // 获取存储的投注计数
    const betCountKey = 'betCount_' + this.playerId;
    const storedBetCount = sys.localStorage.getItem(betCountKey);

    if (storedBetCount) {
      const betCountValue = parseFloat(storedBetCount || '2');
      this.setBetCount(betCountValue);
    }
  }

  // [无序] 所有manager初始化完成
  protected onFinished() {}

  // [无序] 初始化manager，在初始化完成后，调用finish方法
  protected init(finish: Function) {
    super.init(finish);
  }

  private token: string | null = null;

  public userId: string = '';

  public playerId: string = '';

  public playerName: string = '';

  public vipLevel: number = 1;

  public multiBetAmount: number = 1000;

  // 游戏id
  private _gameId: string = '';

  // 用户余额
  private _creditCount: number = 0;

  // 投注金额
  private _betCount: number = 2;

  // 临时记录的bet
  private _tempBetCount: number = 0;

  // 购买次数
  private _quantity: number = 0;

  // 免费轮游戏记录id
  private _gameRecordIds: string[] = [];

  // 免费轮游戏记录索引
  private _gameRecordIndex: number = 0;

  // 购买的免费轮次数
  private _freeBonusTimes: number = 0;

  // 购买的免费轮总金额
  private _freeBonusTotalAmount: number = 0;

  // 是否开始自动游戏
  private _startAutoplay = false;

  // 当前自动开始游戏次数
  private _currentAutoPlayTimes = 0;

   /** 下次打开是否不需要显示引导页 */
   private _isDontShowNextTime: boolean = false;

  // 自动游戏配置
  private _autoSetting = {
    // 执行制定轮后停止
    totalSpins: {
      selected: false,
      value: 0,
    },
    // 单次赢取金额达到多少停止
    singleWin: {
      selected: false,
      value: 0,
    },
    // 金额少于停止
    balanceLess: {
      selected: false,
      value: 0,
    },
    // 金额多余停止
    balanceMore: {
      selected: false,
      value: 0,
    },
    // 是否免费轮后停止
    isFree: { selected: false, },
  };

  // 音效
  private _voice: number = 100;

  // 声音
  private _music: number = 100;

  // 快速模式
  private _quikeMode: boolean = false;

  // 无限自动轮
  private _allwaysAutoPlay: boolean = false;

  // 是否正在进行中
  private _isGoing: boolean = false;

  // 倍率索引
  private _multipleIndex: number = 0;

  // 游戏类型
  private _gameType: IGameType = IGameType.NORMAL;

  // 网络质量
  private _networkQuality: 'slow' | 'fast' = 'fast';

  /** 资源质量, 暂时不用high，只用low和medium，默认是medium */
  public get assetQuality(): 'low' | 'medium' {
    return this._networkQuality === 'slow' ? 'low' : 'medium';
  }

  public get gameId() {
    return this._gameId;
  }

  public setGameId(id: string) {
    this._gameId = id;
  }

  public get creditCount() {
    return this._creditCount;
  }

  public setCreditCount(val: number) {
    this._creditCount = val;
    app.manager.event.emit('creditCountChange', val);
  }

  /** 是否赠送的免费游玩模式 */
  private _isFreespinMode: boolean = false;

  /** 赠送的免费游玩模式投注金额 */
  private _freespinBetAmount: number = 0;

  /** 是否星卡模式 */
  private _isStartCardMode: boolean = false;

  /** 星卡模式投注金额 */
  private _startCardBetAmount: number = 0;

  /** 是否赠送的免费游玩模式 */
  public get isFreespinMode(): boolean {
    return this._isFreespinMode;
  }
  /** 设置是否赠送的免费游玩模式 */
  
  public setIsFreespinMode(bool: boolean): void {
    app.manager.event.emit('freespin:state', bool);
    this._isFreespinMode = bool;
  }

  /** 设置freespin投注金额 */
  public setFreespinBetAmount(val: number): void {
    this._freespinBetAmount = val;
  }

  /** 获取星卡模式状态 */
  public get isStartCardMode(): boolean {
    return this._isStartCardMode;
  }

  public setIsStartCardMode(bool: boolean): void {
    this._isStartCardMode = bool;
  }

  /** 设置星卡模式投注金额 */
  public setStartCardBetAmount(val: number): void {
    this._startCardBetAmount = val;
  }

  /** 下次打开是否不需要显示引导页 */
  public get isDontShowNextTime() {
    const isDontShowNextTime = sys.localStorage.getItem('isDontShowNextTime');

    if (isDontShowNextTime) {
      this._isDontShowNextTime = isDontShowNextTime === 'true';
    }

    return this._isDontShowNextTime;
  }

  public setIsDontShowNextTime(bool: boolean) {
    sys.localStorage.setItem('isDontShowNextTime', bool.toString());
    this._isDontShowNextTime = bool;
  }
  
  public get betCount() {
    let betCount = sys.localStorage.getItem('betCount_' + this.playerId);
    
    if (betCount) {
      betCount = parseFloat(betCount);
    }

    return this._isFreespinMode ? this._freespinBetAmount : betCount;
  }

  public setBetCount(val: number) {
    sys.localStorage.setItem('betCount_' + this.playerId, val.toString());
    this._betCount = val;
    app.manager.event.emit('betCountChange', val);
  }

  public get tempBetCount() {
    return this._tempBetCount;
  }

  public setTempBetCount(val: number) {
    this._tempBetCount = val;
  }

  public get quantity() {
    return this._quantity;
  }

  public setQuantity(val: number) {
    this._quantity = val;
  }

  public get gameRecordIds() {
    return this._gameRecordIds;
  }

  public setGameRecordIds(ids: string[]) {
    this._gameRecordIds = ids;
  }

  public get gameRecordIndex() {
    return this._gameRecordIndex;
  }

  public setGameRecordIndex(index: number) {
    this._gameRecordIndex = index;
  }
  
  public get freeBonusTimes() {
    return this._freeBonusTimes;
  }

  public setFreeBonusTimes(times: number) {
    this._freeBonusTimes = times;
  }

  public get freeBonusTotalAmount() {
    return this._freeBonusTotalAmount;
  }

  public setFreeBonusTotalAmount(val: number) {
    this._freeBonusTotalAmount = val;
  }

  public get startAutoPlay() {
    return this._startAutoplay;
  }

  public setStartAutoPlay(bool: boolean) {
    this._startAutoplay = bool;
    app.manager.event.emit('startAutoPlayChange', bool);
  }

  public get currentAutoPlayTimes() {
    return this._currentAutoPlayTimes;
  }

  public setCurrentAutoPlayTimes(times: number) {
    this._currentAutoPlayTimes = times;
  }

  public get multipleIndex() {
    return this._multipleIndex;
  }

  public setMultipleIndex(index: number) {
    this._multipleIndex = index;
    app.manager.event.emit('multipleIndexChange', index);
  }

  public get voice() {
    if (sys.localStorage.getItem('voice')) {
      this._voice = parseInt(sys.localStorage.getItem('voice') || '100');
    }else{
      this._voice = 100;
    }

    return this._voice;
  }

  public setVoice(val: number) {
    if (val > 100 || val < 0) return;
    console.log('setVoice', val); 
    this._voice = val;
    sys.localStorage.setItem('voice', val.toString());
    app.manager.event.emit('voiceChange', val);
  }

  public get music() {
    if (sys.localStorage.getItem('music')) {
      this._music = parseInt(sys.localStorage.getItem('music') || '100');
    }else{
      this._music = 100;
    }

    return this._music;
  }

  public setMusic(val: number) {
    if (val > 100 || val < 0) return;
    this._music = val;
    sys.localStorage.setItem('music', val.toString());
    app.manager.event.emit('musicChange', val);
  }

  /** 点击屏幕 */
  private _isClickScreen: boolean = false;

  public get isClickScreen() {
    return this._isClickScreen;
  }

  public setClickScreen(bool: boolean) {
    this._isClickScreen = bool;
  }

  public get quikeMode() {
    return this._quikeMode || this._isClickScreen;
  }

  public setQuikeMode(bool: boolean) {
    this._quikeMode = bool;
    app.manager.event.emit('quikeModeChange', bool);
  }

  public get allwaysAutoPlay() {
    return this._allwaysAutoPlay;
  }

  public setAllwaysAutoPlay(bool: boolean) {
    this._allwaysAutoPlay = bool;
    app.manager.event.emit('allwaysAutoPlayChange', bool);
  }

  public get isGoing() {
    return this._isGoing;
  }

  public setIsGoing(bool: boolean) {
    this._isGoing = bool;
    app.manager.event.emit('isGoingChange', bool);
  }

  public get gameType() {
    return this._gameType;
  }
  
  public setGameType(val: IGameType) {
    this._gameType = val;
    app.manager.event.emit('gameTypeChange', val);
  }

  public get autoSetting() {
    return this._autoSetting;
  }

  public setAutoSetting(setting: any) {
    this._autoSetting = setting;
  }

  private static instance: GlobalManager;

  protected onLoad(): void {
    // 确保只有一个 GlobalManager 实例, 如果已经存在则销毁当前节点
    // 保证在切换场景时不会重复创建 GlobalManager
    // 因为在编辑器里面，每次保存代码，重新编译后，代码热重载后，代码会重新执行，所以需要判断是否已经存在 GlobalManager 实例
    // 正常在游戏中，不会出现这种情况
    if (GlobalManager.instance && GlobalManager.instance !== this) {
      this.node.destroy();

      return;
    }

    GlobalManager.instance = this;

    // 设置为持久化节点，确保在切换场景时不被销毁
    director.addPersistRootNode(this.node);
    // 初始化缓存的一些值
    this.initCacheValues();
  }

  /**
   * 获取 GlobalManager 的单例实例。
   * 如果实例不存在，则创建一个新的节点并挂载 GlobalManager 组件。
   * @returns {GlobalManager} GlobalManager 实例。
   */
  public static getInstance(): GlobalManager {
    if (!GlobalManager.instance) {
      const existingNode = find('GlobalManager');

      if (existingNode) {
        GlobalManager.instance = existingNode.getComponent(GlobalManager);
      } else {
        // 创建一个新的节点
        const node = new Node('GlobalManager');
        node.setPosition(0, 0, 0);
        node.addComponent(UITransform);
        node.getComponent(UITransform).setAnchorPoint(0.5, 0.5);
        node.getComponent(UITransform).setContentSize(0, 0);
        // 添加 GlobalManager 组件
        GlobalManager.instance = node.addComponent(GlobalManager);
        // 设置为持久化节点，确保在切换场景时不被销毁
        director.addPersistRootNode(node);
      }
    }

    return GlobalManager.instance;
  }

  initCacheValues() {
    this.token = sys.localStorage.getItem('game_token');
    this.userId = sys.localStorage.getItem('user_id');
    this.playerId = sys.localStorage.getItem('player_id');
    this.playerName = sys.localStorage.getItem('player_name') || '';
    this.vipLevel = parseInt(sys.localStorage.getItem('user_level') || '1');
    // this.token = sessionStorage.getItem('game_token');
    // this.playerId = sessionStorage.getItem('player_id');
    // this.playerName = sessionStorage.getItem('player_name') || '';
  }

  public setToken(token: string) {
    this.token = token;
    sys.localStorage.setItem('game_token', token);
    // sessionStorage.setItem('game_token', token);
  }

  public getToken(): string | null {
    return this.token;
  }

  public setUserInfo(id: string, playerId: string, name: string, userLevel: string) {
    this.userId = id;
    this.playerId = playerId;
    this.playerName = name;
    this.vipLevel = parseInt(userLevel);
    sys.localStorage.setItem('user_id', id.toString());
    sys.localStorage.setItem('player_id', playerId.toString());
    sys.localStorage.setItem('player_name', name);
    sys.localStorage.setItem('user_level', userLevel);
    // sessionStorage.setItem('player_id', id.toString());
    // sessionStorage.setItem('player_name', name);
  }

  public getUserInfo(): { id: string; playerId: string; name: string; vipLevel: number } {
    return {
      id: this.userId,
      playerId: this.playerId,
      name: this.playerName,
      vipLevel: this.vipLevel,
    };
  }

  /** 网络质量 */
  public get networkQuality() {
    return this._networkQuality;
  }

  /** 修改网络质量全局变量 */
  public setNetworkQuality(quality: 'slow' | 'fast') {
    this._networkQuality = quality;
  }
}
