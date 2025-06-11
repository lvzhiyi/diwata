import { _decorator, Component, Node, Sprite, SpriteFrame, Label } from 'cc';
import { app } from 'db://assets/app/app';
import { JackpotRecordModel } from 'db://assets/basePlate/middleWare/services/user';

const { ccclass, property } = _decorator;

export const formatTimestampToMonthday = (dateString: number|string): string => {
  // 将输入的日期字符串转换为 Date 对象
  const date = new Date(dateString);
  // 格式化日期和时间
  const month = addZero(date.getMonth() + 1);
  const day = addZero(date.getDate());

  // 组合成最终的日期时间字符串
  return `${day}/${month}`;
};

export const addZero = (num: number): string => {
  return num < 10 ? `0${num}` : `${num}`;
};

@ccclass('JackpotRecordItem')
export class JackpotRecordItem extends Component {
    @property({ type: Node, tooltip: '图片' })
    private typeIconNode: Node = null;

    @property({ type: Node, tooltip: '时间' })
    private dateNode: Node = null;

    @property({ type: Node, tooltip: '获奖者' })
    private winnerNode: Node = null;

    @property({ type: Node, tooltip: '金额' })
    private amountNode: Node = null;

    @property({ type: [SpriteFrame], tooltip: '图片集合' })
    private typeIconList: SpriteFrame[] = [];

    start() {

    }

    update(deltaTime: number) {
        
    }

    public initValue(dataInfo: JackpotRecordModel) {
      if ( !dataInfo) {
        return;
      }

      // 图标
      const type = dataInfo.rewardPoolType;

      if (type) {
        this.typeIconNode.getComponent(Sprite).spriteFrame = this.typeIconList[type - 1];
      }

      // 时间
      const date = dataInfo.createTime;

      if (date) {
        const dateStr = this.formatTimestampToDate(date);

        if (dateStr) {
          this.dateNode.getComponent(Label).string = dateStr;
        }
      }

      // 获奖者
      const winner = dataInfo.playerName;

      if (winner) {
        this.winnerNode.getComponent(Label).string = winner;
      }

      // 金额
      const amount = dataInfo.rewardAmount / app.manager.global.multiBetAmount;
    
      if (amount) {
        this.amountNode.getComponent(Label).string = `₱${amount}`;
      }
    }

    /**
     * 将日期字符串转换为指定格式
     * @param dateString 日期字符串
     * @returns 格式化后的日期时间字符串
     */
    private  formatTimestampToDate(dateString: number|string): string {
      // 将输入的日期字符串转换为 Date 对象
      const date = new Date(dateString);
      // 格式化日期和时间
      const month = this.addZero(date.getMonth() + 1);
      const day = this.addZero(date.getDate());

      // 组合成最终的日期时间字符串
      return `${day}/${month}`;
    }

    /**
     * 给个位数添加前导零
     * @param num 需要格式化的数字
     * @returns 格式化后的字符串
     */
    private  addZero(num: number): string {
      return num < 10 ? `0${num}` : `${num}`;
    }
}
