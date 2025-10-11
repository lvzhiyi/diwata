import {
  _decorator,
  Color,
  Component,
  Director,
  director,
  instantiate,
  Label,
  Node,
  Prefab,
  resources,
  RichText,
  tween,
  UITransform,
  Vec3,
} from 'cc';
import { BackgroundRadius } from 'db://assets/basePlate/middleWare/commonUI/BackgroundRadius';

const { ccclass, property } = _decorator;

/**
 * 跑马灯组件
 */
@ccclass('Marquee')
export class Marquee extends Component {
  /** 跑马灯背景节点 */
  @property({ type: Node, tooltip: '跑马灯节点' })
  private bgNode: Node | null = null;

  /** 跑马灯是否正在滚动 */
  public isGoing = false;

  /** 父节点宽度 */
  private parentWidth: number;

  /** 跑马灯移动距离 */
  private moveDistance: number;

  /** 透明背景色 */
  private static readonly TRANSPARENT_COLOR = new Color(0, 0, 0, 0);

  /** 跑马灯背景色 */
  private static readonly BACKGROUND_COLOR = new Color(33, 4, 4, 140);

  /** 跑马灯字体颜色 */
  private static readonly TEXT_COLOR = new Color(255, 255, 255, 255);

  /** 跑马灯字体大小 */
  private static readonly FONT_SIZE = 28;

  /** 跑马灯初始X坐标 */
  private static readonly INIT_POSITION_X = 2000;

  /** 跑马灯移动速度系数 */
  private static readonly MOVE_SPEED_FACTOR = 4;

  /** 跑马灯label预制体缓存 */
  private labelPrefab: Prefab | null = null;

  protected onLoad(): void {
    var uiTrans = this.node.getComponent(UITransform);
    this.parentWidth = uiTrans ? uiTrans.width : 0;
    this.resetBackgroundColor();
  }

  /**
   * 重置背景为透明
   */
  private resetBackgroundColor(): void {
    if (!this.bgNode) {
      return;
    }

    var bgRect = this.bgNode.getComponent(BackgroundRadius);

    if (bgRect) {
      bgRect.setBackgroundColor(Marquee.TRANSPARENT_COLOR);
    }
  }

  /**
   * 开始移动跑马灯文字
   * @param text 要显示的文本内容
   * @param cb 动画完成后的回调函数
   */
  async startMove(text: string, cb?: () => void) {
    if (this.isGoing) {
      return;
    }

    this.isGoing = true;
    let labelNode: Node | null = null;

    try {
      labelNode = await this.initLabel(text);

      await new Promise<void>(function (resolve) {
        director.once(Director.EVENT_AFTER_DRAW, function () {
          resolve();
        });
      });

      var uiTrans = labelNode.getComponent(UITransform);
      var width = uiTrans ? uiTrans.width : 0;
      var startWidth = this.calculateStartPosition(width);
      this.moveDistance = this.parentWidth + width;

      labelNode.setPosition(startWidth, labelNode.position.y);

      if (this.bgNode) {
        var bgRect = this.bgNode.getComponent(BackgroundRadius);

        if (bgRect) {
          bgRect.setBackgroundColor(Marquee.BACKGROUND_COLOR);
        }
      }

      await this.move(labelNode);

      if (this.bgNode) {
        var bgRect2 = this.bgNode.getComponent(BackgroundRadius);

        if (bgRect2) {
          bgRect2.setBackgroundColor(Marquee.TRANSPARENT_COLOR);
        }
      }

      labelNode.destroy();
    } catch (err) {
      // 跑马灯动画失败时输出错误
      console.error('跑马灯动画失败:', err);

      if (labelNode) {
        labelNode.destroy();
      }
    } finally {
      this.isGoing = false;

      if (cb) {
        cb();
      }
    }
  }

  /**
   * 计算文本起始位置
   * 目的是让文本从右侧边界外开始，或居中起始
   * @param textWidth 文本宽度
   * @returns 起始X坐标
   */
  private calculateStartPosition(textWidth: number): number {
    if (this.parentWidth > textWidth) {
      return (this.parentWidth + textWidth) / 2;
    }

    return (textWidth + this.parentWidth) / 2;
  }

  /**
   * 加载并缓存跑马灯label预制体
   */
  private async loadLabelPrefab(): Promise<Prefab> {
    if (this.labelPrefab) {
      return this.labelPrefab;
    }

    return new Promise<Prefab>((resolve, reject) => {
      resources.load('Prefab/marqueeLabel', Prefab, function (err, prefab) {
        if (err) {
          reject(err);

          return;
        }

        resolve(prefab as Prefab);
      });
    }).then((prefab: Prefab) => {
      this.labelPrefab = prefab;

      return prefab;
    });
  }

  /**
   * 初始化文本标签
   * @param text 要显示的文本
   * @returns Promise<Node> 创建的标签节点
   */
  private async initLabel(text: string): Promise<Node> {
    var prefab = await this.loadLabelPrefab();
    var labelNode = instantiate(prefab);
    var label = labelNode.getComponent(RichText);

    if (label) {
      label.string = this.highlightCurrency(text);
      label.fontSize = Marquee.FONT_SIZE;
    }

    labelNode.setPosition(Marquee.INIT_POSITION_X, labelNode.position.y);
    this.node.addChild(labelNode);

    return labelNode;
  }

  /**
     * 金额高亮处理
     * @param text 原始文本
     * @param color 颜色值（默认#fff600）
     * @returns 处理后的富文本
     */
  highlightCurrency(text: string, color: string = '#fff600'): string {
    // 匹配通用货币格式（支持₱$€¥等符号 + 数字 + 可选小数）
    const currencyRegex = /([₱$€¥])(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g;
    console.log('highlighted-text', text);
    const highlighted = text.replace(currencyRegex, (match, symbol, amount) => {
      return `<color=${color}>${symbol}${amount}</color>`;
    });
    console.log('highlighted', highlighted);

    return `<color=#FFFFFF><b><size=28>${highlighted}</size></b></color>`;
  }

  /**
   * 计算跑马灯动画时长
   * @returns 动画时长（秒）
   */
  private getMoveDuration(): number {
    return (this.moveDistance / this.parentWidth) * Marquee.MOVE_SPEED_FACTOR;
  }

  /**
   * 执行移动动画
   * @param labelNode 要移动的标签节点
   * @returns Promise 动画完成后resolve的Promise
   */
  private move(labelNode: Node): Promise<void> {
    var duration = this.getMoveDuration();

    return new Promise(function (resolve) {
      var parent = labelNode.parent;
      var parentWidth = 0;

      if (parent) {
        var uiTrans = parent.getComponent(UITransform);
        parentWidth = uiTrans ? uiTrans.width : 0;
      }

      tween(labelNode)
        .by(duration, { position: new Vec3(-labelNode.position.x - parentWidth, 0, 0) })
        .call(function () {
          resolve();
        })
        .start();
    });
  }
}
