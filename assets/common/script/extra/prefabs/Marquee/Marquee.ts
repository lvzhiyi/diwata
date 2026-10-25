import {
  _decorator,
  Component,
  Node,
  NodePool,
  RichText,
  Tween,
  tween,
  UIOpacity,
  UITransform,
  Vec3,
} from 'cc';
import { getP } from 'db://assets/common/script/extra/Utils/common';
import { getNearestMarqueeBigPrize } from './MarqueeUtils';
import { getReward } from '../../https/request';

const { ccclass } = _decorator;

/// 跑马灯
@ccclass('Marquee')
export class Marquee extends Component {
  private itemHeight: number;

  /** 跑马灯消息列表 */
  private marqueeMessageList: string[] = [];

  /** 跑马灯Label节点池 */
  private labelNodePool: NodePool = new NodePool();

  /** 是否可以显示下一条消息 */
  private isCanShowNextMessage: boolean = true;

  /** 当前跑马灯消息索引 */
  private marqueeIndex: number = -1;

  private marqueeTween1: Tween | null = null;

  private marqueeTween2: Tween | null = null;

  /** 跑马灯消息停留时间 */
  private MARQUEE_MESSAGE_STAY_TIME: number = 5;

  /** 跑马灯消息滚动时间 */
  private MARQUEE_MESSAGE_SCROLL_TIME: number = 2;

  /** 跑马灯首次请求时间 */
  private MARQUEE_FIRST_REQUEST_TIME: number = 0;

  protected onLoad(): void {
    if (!!getP()) {
      this.itemHeight = this.node.getComponent(UITransform).height;

      /** 初始化节点池 */
      this.initPool();

      setTimeout(() => {
        this.requestLottery(true);
        /** 循环12秒去请求中大奖的接口 */
        setInterval(() => {
          this.requestLottery(false);
        }, 12000);
      }, 2000);
    }
  }

  /**
   * 初始化节点池
   */
  initPool() {
    for (let i = 0; i < 2; i++) {
      const labelNode = this.createLabelNode();
      this.labelNodePool.put(labelNode);
    }
  }

  /**
   * 创建节点
   */
  createLabelNode() {
    const labelNode = new Node();
    labelNode.layer = this.node.layer;
    labelNode.addComponent(RichText).string = '';
    labelNode.addComponent(UITransform).setContentSize(this.node.getComponent(UITransform).width, this.node.getComponent(UITransform).height);
    const richText = labelNode.getComponent(RichText);
    richText.verticalAlign = RichText.VerticalAlign.CENTER;
    richText.horizontalAlign = RichText.HorizontalAlign.CENTER;
    richText.fontSize = 26;
    richText.lineHeight = 28;

    return labelNode;
  }

  /**
   * 获取节点池中的节点
   */
  getLabelNode() {
    if (this.labelNodePool.size() === 0) {
      return this.createLabelNode();
    }

    return this.labelNodePool.get();
  }

  /**
   * 将节点放回节点池
   */
  putLabelNode(labelNode: Node) {
    labelNode.getComponent(RichText).string = '';
    this.labelNodePool.put(labelNode);
  }
  
  /**
   * 请求中大奖的接口
   */
  private requestLottery(isFirst: boolean = false) {
    try {
      getReward().then((res) => {
        if (isFirst) {
          /** 首次进入获取并播放获取距离当前时间最近的大奖消息 */
          const nearestMarqueeBigPrize = getNearestMarqueeBigPrize(res?.time);

          if (nearestMarqueeBigPrize) {
            this.marqueeMessageList = [nearestMarqueeBigPrize];
          }
        }
        
        if (res?.data?.rewardMessageList?.length) {
          this.marqueeMessageList = Array.from(
            new Set([...this.marqueeMessageList, ...res.data.rewardMessageList])
          );
        }

        // TODO: 过滤掉旧格式的中奖消息
        const winPattern = /^Player.*\n.*won at .*X/;
        this.marqueeMessageList = this.marqueeMessageList.filter(item => winPattern.test(item));

        if (this.marqueeMessageList?.length > 0) {
          this.showQueueMessage();
        }
      });
    } catch(error){
      console.log('请求中大奖的接口失败', error);
    }
  }

  /**
   * 显示队列消息
   */
  private async showQueueMessage() {
    // 如果不能显示下一条消息，则返回
    if (!this.isCanShowNextMessage) {
      return;
    } 

    // 如果已经显示到最后一条消息，则返回
    if (this.marqueeIndex >= this.marqueeMessageList.length - 1) {
      return;
    }

    this.isCanShowNextMessage = false;

    this.marqueeIndex += 1;

    tween(this.node.getComponent(UIOpacity)).to(0.5, { opacity: 255 }).start();

    const labelNode = this.getLabelNode();
    labelNode.getComponent(RichText).string = this.highlightCurrency(this.marqueeMessageList[this.marqueeIndex]);
    
    if (!this.marqueeTween1?.running && !this.marqueeTween2?.running) {
      // 没有tween正在播放
      labelNode.setPosition(0, 0);
      this.marqueeTween1 = tween(labelNode)
        .delay(this.MARQUEE_MESSAGE_STAY_TIME)
        .call(() => {
          this.isCanShowNextMessage = true;

          if (this.hasNextMarqueeMessage()) {
            this.showQueueMessage();
          }
        })
        .to(this.MARQUEE_MESSAGE_SCROLL_TIME, { position: new Vec3(0, this.itemHeight) })
        .call(() => {
          this.putLabelNode(labelNode);

          this.marqueeTween1?.stop();

          if (!this.hasNextMarqueeMessage() && !this.marqueeTween1?.running && !this.marqueeTween2?.running) {
            tween(this.node.getComponent(UIOpacity)).to(0.5, { opacity: 0 }).start();
            this.marqueeTween1 = null;
            this.marqueeTween2 = null;
          }
        })
        .start();
    } else {
      // 有一个tween正在播放
      labelNode.setPosition(0, -this.itemHeight);
      const t = tween(labelNode)
        .to(this.MARQUEE_MESSAGE_SCROLL_TIME, { position: new Vec3(0, 0) })
        .delay(this.MARQUEE_MESSAGE_STAY_TIME)
        .call(() => {
          this.isCanShowNextMessage = true;   

          if (this.hasNextMarqueeMessage()) {
            this.showQueueMessage();
          }
        })
        .to(this.MARQUEE_MESSAGE_SCROLL_TIME, { position: new Vec3(0, this.itemHeight) })
        .call(() => {
          this.putLabelNode(labelNode);

          t.stop();

          if (!this.hasNextMarqueeMessage() && !this.marqueeTween1?.running && !this.marqueeTween2?.running) {
            tween(this.node.getComponent(UIOpacity)).to(0.5, { opacity: 0 }).start();
            this.marqueeTween1 = null;
            this.marqueeTween2 = null;
          }
        })
        .start();

      if (!this.marqueeTween1?.running) { 
        this.marqueeTween1 = t;
      } else if (!this.marqueeTween2?.running) {
        this.marqueeTween2 = t;
      }
    }

    this.node.addChild(labelNode);
  }

  /**
   * 是否有下一个跑马灯消息
   */
  private hasNextMarqueeMessage() {
    return !!this.marqueeMessageList[this.marqueeIndex + 1];
  }

  /**
   * 金额高亮处理
   * @param text 原始文本
   * @param color 颜色值（默认#fff600）
   * @returns 处理后的富文本
   */
  highlightCurrency(text: string, color: string = '#fff600'): string {
    const regex = /(?:₱\s*\d+(?:,\d{3})*(?:\.\d+)?)|(?:\d+(?:\.\d+)?X)\b/g;

    // 金额高亮处理
    let highlighted = text.replace(regex, (match) => {
      return `<color=${color}>${match}</color>`;
    });

    // 换行处理
    highlighted = highlighted.replace(/\n/g, '<br />');

    console.log('highlighted', highlighted);

    return `<color=#FFFFFF><b>${highlighted}</b></color>`;
  }
}
