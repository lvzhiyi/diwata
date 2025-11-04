/**
 * 音频类型枚举
 */
export enum AudioType {
  // 背景音乐
  BGM = 'BGM',
  // UI音效
  UI = 'UI',
  // 弹窗音效
  POPUP = 'POPUP',
  // 游戏音效
  GAME = 'GAME',
}

// export enum AudioBaseUrl {
//   // 资源CDN基础路径
//   URL = 'https://resource.makillingslot.info/Audio/',
// }

/**
 * 音频资源路径配置
 */
export const AudioPath = {
  // 背景音乐
  BGM: {
    // 主界面背景音乐
    MAIN: 'BGM/bg_audio',
    // 免费轮背景音乐
    FREE: 'BGM/free_audio',
    // 结算弹窗打开（无金币）
    SETTLE_BG_NO_COIN: 'BGM/Settle_Bg_No_Coin',
    // Mega弹窗打开
    MEGA_OPEN: 'BGM/Mega_Bg',
    // Nice弹窗打开
    NICE_OPEN: 'BGM/Nice_Bg',
    // 结算弹窗打开
    SETTLE_OPEN: 'BGM/Settle_Bg',
    // Super弹窗打开
    SUPER_OPEN: 'BGM/Super_Bg',
  },

  // UI音效
  UI: {
   
    // 购买免费轮
    BETFREESPIN: 'UI/BetFreeSpin',
    // 打开免费轮
    OPENBETFREE: 'UI/OpenBetFree',
    // 打开界面
    OPEN: 'UI/Open',
    // 关闭界面
    CLOSE: 'UI/Close',
    // 无声
    WUSHENG: 'UI/Wusheng',
    // 金币增加的音效
    COIN_ADD: 'UI/NumberRoll',
  },

  // 弹窗音效
  POPUP: {
    
    MEGA_END: 'PopAudio/Mega_end',
   
    NICE_END: 'PopAudio/Nice_end',
   
    SUPER_END: 'PopAudio/Super_end',
   
    // 开场音效
    OPEN_HOME_AUDIO: 'PopAudio/openHome',
  },

  // 游戏音效
  GAME: {
    // 倍率盘旋转
    SPINE_ROTATE: 'Game/MultipleRotate',
    // 变成WIld
    CHANGE_WILD: 'Game/ChangeWild',
    // 触发挥剑和挥棒
    SWORD_AND_STICK: 'Game/SwordAndStick',
    // 挥棒
    STICK_RETURN: 'Game/Stick',
    // 挥棒
    STICK_BEAT: 'Game/Stick_Beat',
    // 挥棒
    STICK_START: 'Game/Stick_Start',
    // 挥剑
    SWORD_RETURN: 'Game/Sword',
    // 按钮开始旋转
    SPIN_ROTATE: 'Game/SpinStartRoll',
    // 滚轴停止旋转
    ROLL_STOP_ROTATE: 'Game/RollStop',
    // 滚轴停止旋转3
    ROLL_STOP_3: 'Game/RollStop3',
    // 滚轴停止旋转4
    ROLL_STOP_4: 'Game/RollStop4',
    // 滚轴停止旋转5
    ROLL_STOP_5: 'Game/RollStop5',
    // 数字翻倍
    DOUBLE_NUMBER: 'Game/DoubleNumber',
    // 免费轮转场
    FREE_BONUS_TRANSITION: 'Game/FreeBonusShow',
    // scatter 出现
    SCATTER_SHOW: 'Game/ScatterShow',
    // scatter 中奖
    SCATTER_WIN: 'Game/ScatterWin',
    // scatter 期待
    SCATTER_EXPECT: 'Game/ScatterExpect',
    // 元素消除 音效
    SYMBOL_CLEAR: 'Game/SymbolRemove',
    // 元素中奖
    SYMBOL_WIN: 'Game/SymbolWin',
    // settle
    SETTLE: 'Game/Settle',
    SETTLE_OPEN: 'Game/SettleOpen',
    // Mega双倍幸运音效
    MEGA_DUB: 'Game/MegaDUB',
    // Nice双倍幸运音效
    NICE_DUB: 'Game/NiceDUB',
    // Super双倍幸运音效
    SUPER_DUB: 'Game/SuperDUB',
    // 女神欢呼1
    GODDESS_CHEER1: 'Game/Goddess1',
    // 女神欢呼2
    GODDESS_CHEER2: 'Game/Goddess2',
    // 女神欢呼3
    GODDESS_CHEER3: 'Game/Goddess3',
    // 女神欢呼4
    GODDESS_CHEER4: 'Game/Goddess4',
    // 女神欢呼
    GODDESS_CHEER5: 'Game/Goddess5',
  
  },
};
