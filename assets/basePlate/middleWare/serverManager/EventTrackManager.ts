import eventTrack from 'db://assets/common/script/extra/eventTrack';
import { Component, _decorator } from 'cc';

const { ccclass } = _decorator;

@ccclass('EventTrackManager')
class EventTrackManager extends Component {
  private static _inst: EventTrackManager;

  public static get inst(): EventTrackManager {
    if (!EventTrackManager._inst) {
      EventTrackManager._inst = new EventTrackManager();
    }

    return EventTrackManager._inst;
  };

  private $track: typeof eventTrack;

  constructor() {
    super();
    this.$track = eventTrack;
  }

  public init(hostUrl: string, params: { playerId: string, playerName: string, providerId: string, gameId: string, gameVer: string }) {
    this.initEventTrack(hostUrl, params);
  }

  /**
   * 初始化事件跟踪
   * @param env 环境
   * @param params 参数
   */
  private initEventTrack(env: string, params: { playerId: string, playerName: string, providerId: string, gameId: string, gameVer: string }) {
    // console.log('initEventTrack', env, params);
    // 初始化事件跟踪
    this.$track.init(env, {
      player_id: params.playerId,
      player_name: params.playerName,
      provider_id: params.providerId,
      game_id: params.gameId,
      game_ver: params.gameVer,
    });
  }
 
  // 用户点击‘Play’按钮
  public trackClickPlay(balance: number) {
    eventTrack.track('click_play', { balance });
  }

  /**
   * 发送引导页用户点击切换事件
   * @param direction 点击切换按钮的方向
   */
  public trackTutorialSwitch(direction: 'left' | 'right') {
    this.$track.track('click_feature_slide', { direction, feature_name: '', });
  }

  /**
   * 发送点击Play按钮进入游戏的事件
   * @param creditCount 当前余额
   */
  public trackGameStart(creditCount: number) {
    this.$track.track('click_play', { balance: creditCount, });
  }

  /**
   * 发送跳过教程复选框勾选的事件
   * @param isChecked 是否勾选
   */
  public trackDontShowNextTimeChange(isChecked: boolean) {
    this.$track.track('toggle_no_show', { is_checked: isChecked ? 'checked' : 'unchecked' });
  }

  /**
   * 发送点击返回首页按钮的事件
   */
  public trackBackToHome() {
    this.$track.track('click_home');
  }

  /**
   * 发送点击侧边菜单按钮的事件
   */
  public trackSideMenu(isOpen: boolean) {
    this.$track.track('toggle_side_menu', { status: isOpen ? 'open' : 'close' });
  }

  /**
   * 发送点击设置按钮的事件
   */
  public trackClickSetting(isOpen: boolean) {
    this.$track.track('toggle_settings', { status: isOpen ? 'open' : 'close' });
  }

  /**
   * 发送投注金额设置弹窗
   * @param betAmount 投注金额
   */
  public trackBetAmountSetting(isOpen: boolean) {
    this.$track.track('toggle_betamt', { status: isOpen ? 'open' : 'close' });
  }

  /**
   * 发送点击投注按钮的事件
   * @param data 投注数据
   */
  public trackSpinStart(data: {
    /** 投注前的余额 */
    old_balance: number,
    /** 投注后的余额 */
    new_balance: number,
    /** 当前轮次 */
    round_number: string,
    /** 投注金额 */
    bet_amount: number,
    /** 是否自动投注 */
    auto_spin: boolean,
    /** 当前启动的奖励局类型（normal, free_spin） */
    bonus_type: 'normal' | 'free_spin',
    /** 投注是否成功 */
    bet_success: boolean,
  }) {
    this.$track.track('click_spin', {
      old_balance: data.old_balance,
      new_balance: data.new_balance,
      round_number: data.round_number,
      bet_amount: data.bet_amount,
      auto_spin: data.auto_spin,
      bonus_type: data.bonus_type,
      bet_success: data.bet_success,
    });
  }

  /**
   * 发送自动投注事件
   * @param isAuto 是否自动投注
   * @param bonus_type 当前启动自动投注的奖励局类型（normal, free_spin）
   */
  public trackAutoSpin(isAuto: boolean, bonus_type: 'normal' | 'free_spin') {
    this.$track.track('click_auto_spin', {
      status: isAuto ? 'on' : 'off',
      bonus_type,
    });
  }

  /**
   * 发送点击快速投注按钮的事件
   * @param isTurbo 是否快速投注
   */
  public trackTurboSpin(isTurbo: boolean) {
    this.$track.track('click_turbo_spin', { status: isTurbo ? 'on' : 'off' });
  }

  /**
   * 发送打开购买免费轮弹窗事件
   * @param balance 当前用户余额
   */
  public trackBuyBonusOpen(balance: number) {
    this.$track.track('click_buybonus', { balance });
  }

  /**
   * 发送购买免费轮事件
   * @param data 购买奖励局数据
   */
  public trackBuyBonus(data: {
    /** 当前用户余额 */
    bonus_bet: number,
    /** Bonus数量 */
    bonus_quantity: number,
    /** 单次Bonus 价值 */
    bonus_price: number,
    /** 总Bonus 价值 */
    bonus_total_price: number,
    /** 用户购买Buy Bonus前的账户金额 */
    old_balance: number,
    /** 用户购买Buy Bonus后的账户金额 */
    new_balance: number,
  }) {
    this.$track.track('confirm_buybonus', {
      bonus_bet: data.bonus_bet,
      bonus_quantity: data.bonus_quantity,
      bonus_price: data.bonus_price,
      bonus_total_price: data.bonus_total_price,
      old_balance: data.old_balance,
      new_balance: data.new_balance,
    });
  }

  /**
   * 关闭购买免费轮弹窗
   * @param data 
   */
  public trackBuyBonusCancel(data: {
    /** 当前用户余额 */
    balance: number,
    /** Bonus数量 */
    bonus_quantity: number,
    /** 单次Bonus 价值 */
    bonus_price: number,
    /** 总Bonus 价值 */
    bonus_total_price: number,
    /** 是否能购买 */
    can_afford: boolean,
  }) {
    this.$track.track('close_buybonus', {
      balance: data.balance,
      bonus_quantity: data.bonus_quantity,
      bonus_price: data.bonus_price,
      bonus_total_price: data.bonus_total_price,
      can_afford: data.can_afford,
    });
  }

  /**
   * 发送投注金额变化事件
   * @param oldBet 投注前的金额
   * @param newBet 投注后的金额
   */
  public trackChangeAmount(oldBet: number, newBet: number) {
    this.$track.track('change_bet', {
      old_bet: oldBet,
      new_bet: newBet,
    });
  };

  /**
   * 用户点击右上角 ❌ 关闭 Bet Amount 弹窗时
   */
  public trackChangeAmountCancel(data: {
    /** 当前投注金额 */
    current_bet: number,
    /** 原来的档位（通常 = current_bet） */
    selected_bet_before: number,
    /** 面板关闭后的档位，若未改则同上 */
    selected_bet_after: number,
    /** 是否改变投注金额 */
    changed: boolean,
  }) {
    this.$track.track('close_bet', {
      current_bet: data.current_bet,
      selected_bet_before: data.selected_bet_before,
      selected_bet_after: data.selected_bet_after,
      changed: data.changed,
    });
  };

  /**
   * 发送点击投注记录按钮的事件
   */
  public trackOpenBetRecord() {
    this.$track.track('click_settings_bet_record', { entry_point: 'setting_menu', });
  }

  /**
   * 发送点击投注规则按钮的事件
   */
  public trackOpenBetRules() {
    this.$track.track('click_settings_rules', { rules: 'rule_malakas', });
  }

  /**
   * 发送点击打开自动投注设置弹窗事件
   */
  public trackOpenAutoBetSetting() {
    this.$track.track('click_settings_auto_set');
  }

  /**
   * 用户点击右上角 ❌ 关闭 弹窗时
   * @param subMenu 当前打开过的子菜单
   */
  public trackSettingCancel(subMenus: string[]) {
    this.$track.track('click_settings_close', { opened_submenu: subMenus });
  }

  /**
   * 发送投注记录查询时间范围选择事件
   * @param timeRange 查询时间范围选项（如 15mins, 30mins, 1hour）
   */
  public trackBetRecordTimeRange(timeRange: string) {
    this.$track.track('select_bet_record_time_range', { search_time_range: timeRange });
  }

  /**
   * 发送投注记录查询结果事件
   * @param data 查询结果数据
   */
  public trackBetRecordSearch(data: {
    /** 查询时间范围 */
    search_time_range: string,
    /** 日期选择框的值，若无则为空字符串 */
    selected_date: string,
    /** 查询的投注局号，若无则为空字符串 */
    round_number: string,
  }) {
    this.$track.track('search_bet_record', {
      search_time_range: data.search_time_range,
      selected_date: data.selected_date,
      round_number: data.round_number,
    });
  }

  /**
   * 发送投注记录查询页面过滤字段清空事件
   * @param data 过滤字段数据
   */
  public trackBetRecordFilterFieldClear(data: {
    /** 被清除的字段 （如 date / round_number） */
    cleared_field: string,
    /** 被清除的值 */
    cleared_value: string,
  }) {
    this.$track.track('clear_bet_record_field', {
      cleared_field: data.cleared_field,
      cleared_value: data.cleared_value,
    });
  }
  
  /**
   * 发送投注记录详情点击事件
   * @param data 投注记录详情数据
   */
  public trackBetRecordItemClick(data: {
    /** 查询时间范围选项 */
    search_time_range: string,
    /** 局号 */
    round_number: number,
    /** 净收益 = win - bet_amount （可为负） */
    net: number,
    /** 投注金额 */
    bet_amount: number,
    /** 赢得的金额 （0 表示未赢得金额） */
    win: number,
    /** 时间 */
    time: string,
  }) {
    this.$track.track('view_bet_record_detail', {
      entry_point: 'setting_menu',
      search_time_range: data.search_time_range,
      round_number: data.round_number,
      net: data.net,
      bet_amount: data.bet_amount,
      win: data.win,
      time: data.time,
    });
  }

  /**
   * 发送退出投注记录查询页面事件
   * @param data 退出的一些状态数据
   */
  public trackExitBetRecord(data: {
    /** 返回时所选的时间范围（如有） */
    search_time_range: string,
    /** 返回时日期字段的值（如有） */
    selected_date: string,
    /** 返回时局号字段的值（如有） */
    round_number: string,
    /** 是否使用搜索功能 */
    search_used: boolean,
    /** 是否点击查看过某一笔投注记录详情 */
    clicked_record_detail: boolean,
  }) {
    this.$track.track('exit_bet_record', {
      entry_point: 'setting_menu',
      search_time_range: data.search_time_range,
      selected_date: data.selected_date,
      round_number: data.round_number,
      search_used: data.search_used,
      clicked_record_detail: data.clicked_record_detail,
    });
  }

  /**
   * 发送复制投注记录局号事件
   * @param roundNumber 被复制的投注局号
   * @param isSuccess 是否复制成功
   * @param entryPoint 复制来源（投注记录页面 / 游戏详情页面）
   */
  public trackCopyRoundNumber(roundNumber: string, isSuccess: boolean, entryPoint: 'betting_record' | 'game_detail') {
    this.$track.track('copy_bet_record_round_number', {
      round_number: roundNumber,
      copy_success: isSuccess,
      entry_point: entryPoint,
    });
  }
  
  /**
   * 发送退出投注记录详情页面事件
   * @param roundNumber 当前查看的是哪一局
   */
  public trackExitBetRecordDetail(roundNumber: string) {
    this.$track.track('exit_bet_record_detail', { round_number: roundNumber, });
  }

  /**
   * 发送退出投注规则页面事件
   */
  public trackExitBetRules() {
    this.$track.track('exit_game_rules');
  }

  // ******************* 自动投注设置 *******************
  /**
   * 用户点击‘CANCEL’按钮时
   */
  public trackAutoBetSettingCancel() {
    this.$track.track('cancel_auto_spin_setting');
  }

  /**
   * 用户点击‘START’按钮时
   * @param data 自动投注设置数据
   */
  public trackAutoBetSettingStart(data: {
    /** 自动旋转次数 */
    spin_count: number,
    /** 是否启用“自动旋转次数”规则 */
    enabled_spin_count: boolean,
    /** 单次中奖大于金额自动停止 */
    single_win_limit: number,
    /** 是否启用“单次中奖限制”开关 */
    enabled_win_limit: boolean,
    /** 余额小于等于金额自动停止 */
    stop_if_balance_le: number,
    /** 是否启用“余额小于等于”开关 */
    enabled_stop_if_balance_le: boolean,
    /** 余额大于等于金额自动停止 */
    stop_if_balance_ge: number,
    /** 是否启用“余额大于等于”开关 */
    enabled_stop_if_balance_ge: boolean,
    /** 是否启用“触发免费游戏后停止”规则 */
    enabled_stop_on_free_game: boolean,
  }) {
    this.$track.track('confirm_auto_spin_setting', {
      spin_count: data.spin_count,
      enabled_spin_count: data.enabled_spin_count,
      single_win_limit: data.single_win_limit,
      enabled_win_limit: data.enabled_win_limit,
      stop_if_balance_le: data.stop_if_balance_le,
      enabled_stop_if_balance_le: data.enabled_stop_if_balance_le,
      stop_if_balance_ge: data.stop_if_balance_ge,
      enabled_stop_if_balance_ge: data.enabled_stop_if_balance_ge,
      enabled_stop_on_free_game: data.enabled_stop_on_free_game,
    });
  }
  
  /**
   * 用户点击右上角 ❌ 关闭 Auto Setting 弹窗时
   * @param data 自动投注设置数据
   */
  public trackAutoBetSettingClose(data: {
    /** 自动旋转次数 */
    spin_count: number,
    /** 是否启用“自动旋转次数”规则 */
    enabled_spin_count: boolean,
    /** 单次中奖大于金额自动停止 */
    single_win_limit: number,
    /** 是否启用“单次中奖限制”开关 */
    enabled_win_limit: boolean,
    /** 余额小于等于金额自动停止 */
    stop_if_balance_le: number,
    /** 是否启用“余额小于等于”开关 */
    enabled_stop_if_balance_le: boolean,
    /** 余额大于等于金额自动停止 */
    stop_if_balance_ge: number,
    /** 是否启用“余额大于等于”开关 */
    enabled_stop_if_balance_ge: boolean,
    /** 是否启用“触发免费游戏后停止”规则 */
    enabled_stop_on_free_game: boolean,
  }) {
    this.$track.track('exit_auto_spin_setting', {
      spin_count: data.spin_count,
      enabled_spin_count: data.enabled_spin_count,
      single_win_limit: data.single_win_limit,
      enabled_win_limit: data.enabled_win_limit,
      stop_if_balance_le: data.stop_if_balance_le,
      enabled_stop_if_balance_le: data.enabled_stop_if_balance_le,
      stop_if_balance_ge: data.stop_if_balance_ge,
      enabled_stop_if_balance_ge: data.enabled_stop_if_balance_ge,
      enabled_stop_on_free_game: data.enabled_stop_on_free_game,
    });
  }

  // ********** 游戏初始化 **********
  /**
   * 发送游戏加载开始事件
   */
  public trackGameLoadStart() {
    this.$track.track('sys_load_init');
  }

  /**
   * 发送游戏加载结束事件
   */
  public trackGameLoadEnd() {
    this.$track.track('sys_load_done');
  }

  /**
   * 发送用户登录事件
   */
  public trackUserLogin() {
    this.$track.track('sys_login');
  }
}
export default EventTrackManager;
