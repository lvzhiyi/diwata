import { _decorator, Component, Label, Node } from 'cc';
import { app } from 'db://assets/app/app';
import { Marquee } from './Marquee';
import { getReward } from 'db://assets/basePlate/middleWare/services/user';
import { serverHookManager } from 'db://assets/basePlate/middleWare/serverManager/ServerHookManager';
import { getIsGap, getP } from 'db://assets/common/script/extra/Utils/common';

const { ccclass, property } = _decorator;

@ccclass('HomeTopViewContrl')
export class HomeTopViewContrl extends Component {
  // 声明设置
  @property({ type: Node, tooltip: '设置' })
  public setupbtn: Node;

  @property({ type: Node, tooltip: '跑马灯' })
  public Marquee: Node;

  @property({ type: Node, tooltip: '隐藏提示' })
  public msgLabel: Node;

  /** 跑马灯消息队列 */
  private marqueeQueue: string[] = [];

  /** 跑马灯随机消息timer */
  private marqueeRandomTimer: any;

  /** 最新执行的跑马灯信息 */
  private currentMarqueeMessage: string;

  /** 请求中标记，防止重复请求 */
  private isRequesting: boolean = false;

  /** 请求任务标记，用于取消定时任务 */
  private requestTask: any = null;

  /** 连续请求失败次数 */
  private consecutiveFailures: number = 0;

  /** 当前请求间隔(毫秒) */
  private currentRequestInterval: number = 10000;

  /** 最大请求间隔(毫秒) */
  private maxRequestInterval: number = 32000;

  /** 降频重试次数 */
  private retryAttempts: number = 0;

  /** 最大降频重试次数 */
  private maxRetryAttempts: number = 3;

  private _hiddenCount: number = 0;

  // 初始化的相关逻辑写在这
  onLoad() {
    serverHookManager.addServerMaintenanceInterceptor(() => {
      this.cancelAllRequests();
    });
    serverHookManager.addServerErrorInterceptor((errorNumber: number) => {
      if (errorNumber >= 5) {
        this.cancelAllRequests();
      }
    });
  }

  start() {
    if (!app.manager.global.getToken()) {
      return;
    }

    if(getIsGap()){
      return;
    }

    // 立即执行第一次请求
    this.requestLottery();
    // 安排下一次请求
    this.scheduleNextRequest();
  }

  /** 安排下一次请求 */
  private scheduleNextRequest() {
    // 清除可能存在的旧定时任务
    if (this.requestTask) {
      clearTimeout(this.requestTask);
      this.requestTask = null;
    }

    // 如果达到最大重试次数或服务器处于维护状态，停止定时器
    if (this.retryAttempts >= this.maxRetryAttempts || serverHookManager.isServerMaintenance) {
      // console.log('达到最大重试次数或服务器维护中，停止请求');

      return;
    }

    // 创建新的定时任务
    this.requestTask = setTimeout(() => {
      this.requestLottery();
    }, this.currentRequestInterval);
  }

  /** 取消所有请求和定时器 */
  private cancelAllRequests() {
    if (this.requestTask) {
      clearTimeout(this.requestTask);
      this.requestTask = null;
    }

    if (this.marqueeRandomTimer) {
      clearTimeout(this.marqueeRandomTimer);
      this.marqueeRandomTimer = null;
    }
  }

  /** 请求中奖信息 */
  private async requestLottery() {
    // 如果已经在请求中或服务器处于维护状态，不再发起新请求
    if (this.isRequesting || serverHookManager.isServerMaintenance) {
      return;
    }

    this.isRequesting = true;

    try {
      const res = await getReward();

      if (res.data && res.data.rewardMessageList && res.data.rewardMessageList.length > 0) {
        this.marqueeQueue = Array.from(
          new Set([...this.marqueeQueue, ...res.data.rewardMessageList])
        );
        // 开始移动跑马灯
        this.marqueeStartMove();
      }

      // 请求成功，重置失败计数
      this.consecutiveFailures = 0;
      this.currentRequestInterval = 4000;
      this.retryAttempts = 0;
    } catch (error) {
      console.error('获取奖励信息失败:', error);
      this.consecutiveFailures++;

      // 连续失败3次，增加请求间隔
      if (this.consecutiveFailures >= 3) {
        this.retryAttempts++;
        this.currentRequestInterval = Math.min(
          this.currentRequestInterval * 2,
          this.maxRequestInterval
        );
        this.consecutiveFailures = 0;
        // console.log('连续失败3次，增加请求间隔至:', this.currentRequestInterval);
      }
    } finally {
      this.isRequesting = false;
      // 请求完成后，安排下一次请求
      this.scheduleNextRequest();
    }
  }

  /// 跑马灯开始移动
  marqueeStartMove() {
    const MarqueeScript = this.Marquee.getComponent(Marquee);

    // 判断当前节点是否存在
    if (!MarqueeScript) {
      return;
    }

    // 确保节点可见
    if (!this.Marquee.active) {
      this.Marquee.active = true;
    }

    if (this.marqueeQueue.length > 0 && !MarqueeScript.isGoing) {
      let message;

      if (this.marqueeQueue[this.marqueeQueue.length - 1] !== this.currentMarqueeMessage) {
        // 清除可能存在的随机消息定时器
        if (this.marqueeRandomTimer) {
          clearTimeout(this.marqueeRandomTimer);
          this.marqueeRandomTimer = null;
        }

        if (!this.currentMarqueeMessage) {
          // 首次进入，播放最后一条信息
          message = this.marqueeQueue[this.marqueeQueue.length - 1];
          this.currentMarqueeMessage = message;
        } else {
          let index = this.marqueeQueue.indexOf(this.currentMarqueeMessage);

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
          // 跑马灯完成后可以考虑隐藏节点以减少drawcall
          this.hideMarqueeIfNeeded();
          this.marqueeStartMove();
        });
      } else {
        if (this.marqueeRandomTimer) {
          return;
        }

        // 隐藏跑马灯节点，直到需要显示
        this.hideMarqueeIfNeeded();

        // 之前已经播放完毕，间隔30-60秒随机播放一条
        this.marqueeRandomTimer = setTimeout(() => {
          // 显示节点以准备播放
          if (!this.Marquee.active) {
            this.Marquee.active = true;
          }

          message = this.marqueeQueue[Math.floor(Math.random() * this.marqueeQueue.length)];
          MarqueeScript.startMove(message, () => {
            this.hideMarqueeIfNeeded();
            this.marqueeStartMove();

            if (this.marqueeRandomTimer) {
              clearTimeout(this.marqueeRandomTimer);
              this.marqueeRandomTimer = null;
            }
          });
        }, (Math.floor(Math.random() * 11) + 20) * 1000);
      }
    } else {
      // 如果没有消息或者正在移动，可以考虑隐藏节点
      this.hideMarqueeIfNeeded();
    }
  }

  /** 如果需要，隐藏跑马灯节点以减少drawcall */
  private hideMarqueeIfNeeded() {
    const MarqueeScript = this.Marquee.getComponent(Marquee);

    // 如果跑马灯不在移动状态，且没有即将执行的随机消息，则隐藏节点
    if (MarqueeScript && !MarqueeScript.isGoing && !this.marqueeRandomTimer) {
      this.Marquee.active = false;
    }
  }

  clickHiddenButton() {
    this._hiddenCount++;
    this.msgLabel.active = false;
    console.log('clickHiddenButton', this._hiddenCount);

    if (this._hiddenCount >= 5) {
      this._hiddenCount = 0;
      this.msgLabel.active = true;
      const label = this.msgLabel.getComponent(Label);

      if (label) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const minSide = Math.min(width, height);
        const maxSide = Math.max(width, height);
        const aspectRatio = maxSide / minSide;
        label.string = `当前屏幕为${minSide}x${maxSide}，宽高比为${aspectRatio}`;
      }
    }
  }

  protected onDestroy(): void {
    this.cancelAllRequests();
  }
}
