
/**
 * 与主站通信的 postMessage
 * @description 通信文档参考 https://casinoplus.sg.larksuite.com/wiki/CcR7wnD95i7nlwka0YSlc0mIgnB
 *
 *
 */
class _CpPostMessage {
    private static instance: _CpPostMessage;

		public static getInstance() {
			if(!_CpPostMessage.instance) {
				_CpPostMessage.instance = new _CpPostMessage();
			}
			return _CpPostMessage.instance;
		}

		/**
		 * 发送消息
		 * @param message 消息内容
		 */
		public sendMessage(message: string, data?: any) {
			if(window.parent) {
				window.parent.postMessage({ type: message, data }, '*');
			}
		}

		/**
		 * 跳转充值页面（余额不足时）
		 */
		public goDeposit() {
			this.sendMessage('gameDeposit');
		}

		/**
		 * 退出游戏返回主站首页
		 */
		public goHome() {
			this.sendMessage('LogoutEvent');
		}

}

const CpPostMessage = _CpPostMessage.getInstance();

export default CpPostMessage;