/* eslint-disable @typescript-eslint/no-unused-vars */
import { _decorator, Component, Node } from 'cc';
import { app } from 'db://assets/app/app';
import { Marquee } from './Marquee';
import { PopSettings } from 'db://assets/app-bundle/app-view/pop/settings/native/PopSettings';
import { getReward } from 'db://assets/basePlate/middleWare/services/user';

const { ccclass, property } = _decorator;

@ccclass('HomeTopViewContrl')
export class HomeTopViewContrl extends Component {
  // 声明设置
  @property({ type: Node, tooltip: '设置' })
  public setupbtn: Node;

  // 声明首页
  @property({ type: Node, tooltip: '首页' })
  public homebtn: Node;

  @property({ type: Node, tooltip: '跑马灯' })
  public Marquee: Node;

  /** 跑马灯消息队列 */
  private marqueeQueue: string[] = [];

  /** 跑马灯随机消息timer */
  private marqueeRandomTimer: any;

  /** 最新执行的跑马灯信息 */
  private currentMarqueeMessage: string;

  /// 定时器
  private timer: any;

  // 初始化的相关逻辑写在这
  onLoad() {}

  start() { 
    this.requestLottery();
  }

  update(deltaTime: number) {}

  /// 循环5秒去请求中大奖的接口
  private requestLottery() {
    this.timer =  setInterval(() => {
      try {
        getReward().then((res) => {
          if (res.data && res.data.rewardMessageList && res.data.rewardMessageList.length) {
            this.marqueeQueue = Array.from(
              new Set([...this.marqueeQueue, ...res.data.rewardMessageList])
            );
          }

          this.marqueeStartMove();
        });
      } catch(error){
        console.log('请求中大奖的接口失败', error);
      }
    }, 12000);
  }

  /// mock跑马灯
  private mockMarquee() {
    // 每隔5秒钟，更新跑马灯消息队列，并开始移动跑马灯

    this.timer = setInterval(() => {
      // 更新跑马灯消息队列
      this.marqueeQueue = ['恭喜发财', '大吉大利', '好运连连', '恭喜发财', '大吉大利', '好运连连'];
      // 开始移动跑马灯
      this.marqueeStartMove();
      console.log('更新跑马灯消息队列');
    }, 5000);
  }

  /// 跑马灯开始移动
  marqueeStartMove() {
    const MarqueeScript = this.Marquee.getComponent(Marquee);

    // 判断当前节点是否存在
    if (!MarqueeScript) {
      return;
    }
    if (this.marqueeQueue.length > 0 && !MarqueeScript.isGoing) {
      let message;

      if (this.marqueeQueue[this.marqueeQueue.length - 1] !== this.currentMarqueeMessage) {
        if (this.marqueeRandomTimer) {
          clearTimeout(this.marqueeRandomTimer);
          this.marqueeRandomTimer = null;
        }
        if (!this.currentMarqueeMessage) {
          // 首次进入，播放最后一条信息
          message = this.marqueeQueue[this.marqueeQueue.length - 1];
          this.currentMarqueeMessage = message;
        } else {
          let index = this.marqueeQueue.findIndex((m) => m === this.currentMarqueeMessage);

          if (index === -1) {
            this.currentMarqueeMessage = this.marqueeQueue[0];
          } else {
            index = index + 1;
          }
          if (index <= this.marqueeQueue.length - 1) {
            message = this.marqueeQueue[index];
            this.currentMarqueeMessage = message;
          }
        }

        MarqueeScript.startMove(message, () => {
          this.marqueeStartMove();
        });
      } else {
        // if (this.marqueeRandomTimer) {
        //   return;
        // }
        // // 之前已经播放完毕，间隔30-60秒随机播放一条
        // this.marqueeRandomTimer = setTimeout(() => {
        //   message = this.marqueeQueue[Math.floor(Math.random() * this.marqueeQueue.length)];
        //   MarqueeScript.startMove(message, () => {
        //     this.marqueeStartMove();
        //     if (this.marqueeRandomTimer) {
        //       clearTimeout(this.marqueeRandomTimer);
        //       this.marqueeRandomTimer = null;
        //     }
        //   });
        // }, (Math.floor(Math.random() * 11) + 20) * 1000);
      }
    }
  }

  // 点击设置按钮
  clickSettingBtn() {
    app.manager.ui.show<PopSettings>({ name: 'PopSettings', onShow: () => {} });
  }

  protected onDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
