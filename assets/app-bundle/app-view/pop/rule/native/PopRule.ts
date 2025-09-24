/* eslint-disable max-len */
import {
  _decorator,
  Color,
  instantiate,
  Label,
  Layout,
  Node,
  Prefab,
  Script,
  Sprite,
  SpriteAtlas,
  SpriteFrame,
  UITransform,
  Widget,
} from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { app } from 'db://assets/app/app';
import { SymbolBox } from './expansion/SymbolBox';
import { ButtonItem } from './expansion/ButtonItem';
import EventTrackManager from 'db://assets/basePlate/middleWare/serverManager/EventTrackManager';
import { RuleTitle } from './expansion/RuleTitle';
import { SymbolView } from './expansion/SymbolView';

const { ccclass, property } = _decorator;

enum RuleType {
  TEXT = 0,
  IMAGE = 1,
  PREFAB = 2,
}

interface IRuleData {
  type: RuleType;
  textOptions?: {
    content: string;
    fontSize: number;
    color: string;
    bold: boolean;
    align?: string;
    // 悬挂缩进：第一行无缩进，后续行有缩进（像素值）
    hangingIndent?: number;
    // 序号文本（如 "1.", "•", "→" 等）
    numberText?: string;
  };
  imageOptions?: {
    imgNames: SpriteFrame[];
    widths?: number[];
    heights?: number[];
  };
  prefabOptions?: {
    prefab: Prefab;
    script?: any;
    obj: any;
  };
}

@ccclass('PopRule')
export class PopRule extends BaseView {
  @property(Node)
  private contentNode: Node = null;

  @property(SpriteFrame)
  private ruleFrames: SpriteFrame[] = [];

  @property(SpriteFrame)
  private symbolFrames: SpriteFrame[] = [];

  @property(SpriteFrame)
  private homeFrames: SpriteFrame[] = [];

  @property(Prefab)
  private symbolViewPrefab: Prefab = null;

  @property(Prefab)
  private buttonItemPrefab: Prefab = null;

  @property(Prefab)
  private ruleTitlePrefab: Prefab = null;

  private ruleData: IRuleData[] = [];

  // 初始化的相关逻辑写在这
  onLoad() {
    this.initData();
    this.drawRule();
  }

  initData() {
    this.ruleData = [
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.ruleTitlePrefab,
          script: RuleTitle,
          obj: { title: 'Symbol', },
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.symbolViewPrefab,
          script: SymbolView,
          obj: {},
        },
      },
      
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.ruleTitlePrefab,
          script: RuleTitle,
          obj: { title: 'Game Rules', },
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'This is a 6-reel video slot game (reels 1 & 6 have 3 rows, reels 2 & 5 have 4 rows, and reels 3 & 4 have 5 rows).',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          // 悬挂缩进：30像素
          hangingIndent: 40,
          // 序号文本
          numberText: '1.',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Consecutive symbols from left to right starting on the first reel form a winning combination. The sequence must have no gaps and match the pay table.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          // 悬挂缩进：30像素
          hangingIndent: 40,
          // 序号文本
          numberText: '2.',
        },
      },
      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgNames: [
            this.getRuleFrame('rule_xiaochu'),
          ],
          widths: [447],
          heights: [343],
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            '3. Malfunction voids all pays and plays. If any malfunction occurs during the feature game, the system will automatically complete the game and ensure the player receives their winnings. Where an interruption occurs after the operator receives notification of the customer\'s gamble and where the customer can have no further influence on the outcome of the event or gamble the results of the gamble should stand \r\n\r\nA game round is immediately ended when the Maximum Win Odds is reached, and all winnings will be paid out.\r\n\r\nwin limit is 10000x\r\nMinimum bet: P0.3\r\nMaximum bet: P10,000',
          fontSize: 27,
          color: '#EAF2C3',
          bold: false,
          align: 'left',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Golden Symbol',
          fontSize: 40,
          color: '#ffe345',
          bold: true,
          align: 'center',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Consecutive symbols from left to right starting on the first reel form a winning combination. The sequence must have no gaps and match the pay table.',
          fontSize: 27,
          color: '#EAF2C3',
          bold: false,
          align: 'left',
          // 悬挂缩进：25像素
          hangingIndent: 25,
          // 使用项目符号
          numberText: '•',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Malfunction voids all pays and plays. If any malfunction occurs during the feature game, the system will automatically complete the game and ensure the player receives their winnings.',
          fontSize: 27,
          color: '#EAF2C3',
          bold: false,
          align: 'left',
          // 悬挂缩进：35像素
          hangingIndent: 35,
          // 使用箭头符号
          numberText: '→',
        },
      },
      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgNames: [
            this.getRuleFrame('rule11'),
            this.getRuleFrame('rule03'),
            this.getRuleFrame('rule12'),
          ],
          widths: [140, 109, 178],
          heights: [164, 79, 169],
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Wild',
          fontSize: 40,
          color: '#ffe345',
          bold: true,
          align: 'center',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            '1.The "Wild Symbol" will only appear after "Golden Symbol" has been eliminated.\r\n2.The "Joker Symbol" comes in three modes:\n "Normal Wild Symbol"',
          fontSize: 27,
          color: '#EAF2C3',
          bold: false,
          align: 'left',
        },
      },
      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgNames: [
            this.getRuleFrame('rule12'),
          ],
          widths: [178],
          heights: [169],
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            ' "Big Wild Symbol"',
          fontSize: 27,
          color: '#EAF2C3',
          bold: false,
          align: 'left',
        },
      },
      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgNames: [
            this.getRuleFrame('4006'),
          ],
          widths: [468],
          heights: [201],
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            ' "Super Wild Symbol"',
          fontSize: 27,
          color: '#EAF2C3',
          bold: false,
          align: 'left',
        },
      },
      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgNames: [
            this.getRuleFrame('4007'),
          ],
          widths: [417],
          heights: [325],
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            '3.When "Wild Symbol" appear only replace the "Golden Symbol" original position.\r\n4.When "Big Wild Symbol" appears. replace Reel 2, 3, and 4 of the row where the “Golden Symbol”.\r\n5.When “Super Wild Symbol” appears, it replaces the 2X3 position in the middle of Reel 2, 3, 4 and refreshes all Reels with a better probability',
          fontSize: 27,
          color: '#EAF2C3',
          bold: false,
          align: 'left',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Combo Multiplier',
          fontSize: 40,
          color: '#ffe345',
          bold: true,
          align: 'center',
        },
      },
      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgNames: [
            this.getRuleFrame('rule04'),
          ],
          widths: [435],
          heights: [269],
        },
      },

      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            '1."The Combo Multiplier" has 4 levels as x1, x2, x3, x5 in Main Game.\r\n2.Points won each matching will be multiplied based on the current "Combo Multiplier"\r\n\r\n"Winning for the first time with each bet" The Multiplier is X1.\r\n"Winning for the Second time with each bet" The Multiplier is X2.\r\n"Winning for the Third time with each bet" The Multiplier is X3.\r\n"Winning for the Fourth time with each bet" The Multiplier is X5.\r\n\r\n3.Win for the fifth time or more in each bet and maintain a multiple of X5\r\n4.When starting a new bet, reset the multiplier',
          fontSize: 27,
          color: '#EAF2C3',
          bold: false,
          align: 'left',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Free Game',
          fontSize: 40,
          color: '#ffe345',
          bold: true,
          align: 'center',
        },
      },
      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgNames: [
            this.getRuleFrame('rule05'),
          ],
          widths: [450],
          heights: [240],
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Scatter +1',
          fontSize: 40,
          color: '#ffe345',
          bold: true,
          align: 'center',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            '1."Scatter+1" only appears in free games.\r\n2.Each "Scatter+1" that appears will increase the remaining number of free rounds by +1.\r\n3."Scatter+1"will not participate in the winning and will not be eliminated.',
          fontSize: 27,
          color: '#EAF2C3',
          bold: false,
          align: 'left',
        },
      },
      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgNames: [
            this.getRuleFrame('rule13'),
          ],
          widths: [188],
          heights: [169],
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'JackPot',
          fontSize: 40,
          color: '#ffe345',
          bold: true,
          align: 'center',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            '0.5% of the bet amount will be contributed to the progressive jackpots.\r\n0.2% is allocated to the Grand Jackpot.\r\n0.2% is allocated to the Major Jackpot.\r\n0.05%is allocated to the Minor Jackpot.\r\n0.05%is allocated to the Mini Jackpot.',
          fontSize: 27,
          color: '#EAF2C3',
          bold: false,
          align: 'left',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            '1.The specified betting amount is calculated based on a single game spin.\r\n2.The displayed value of the jackpot might differ from the actual value due to delays in the communication with the server.\r\n3.The jackpot will never be won at the same time.\r\n4.In a single bet, you can only hit the jackpot once at most\r\n5.The cumulative prize pool has no upper limit\r\n6.When the Jackpot is hit, the prize pool will reset to the guaranteed value',
          fontSize: 27,
          color: '#EAF2C3',
          bold: false,
          align: 'left',
        },
      },

      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgNames: [this.getRuleFrame('rule10')],
          widths: [380],
          heights: [446],
        },
      },

      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            '1.Click the Spins button to start the Jackpot spinning wheel.\r\n2.After 3 seconds, the Spins button will be automatically clicked.\r\n3.When stopping the turntable, the position where the pointer stops is the prize hit by the player.\r\n4.If any malfunction occurs during the jackpot game, the system will automatically complete the game and ensure that players receive bonuses.',
          fontSize: 27,
          color: '#EAF2C3',
          bold: false,
          align: 'left',
        },
      },

      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Game Button',
          fontSize: 40,
          color: '#ffe345',
          bold: true,
          align: 'center',
        },
      },
    
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.buttonItemPrefab,
          script: ButtonItem,
          obj: {
            icon: this.getHomeFrame('home_start'),
            value: 'Spin: Tap to start spinning base on the current bet. Player can also click the reels or press the spacebar to start or stop the spin. (not available on all operators andjurisdictions)',
            height: 200,
          },
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.buttonItemPrefab,
          script: ButtonItem,
          obj: {
            icon: this.getHomeFrame('home_buybons'),
            value: 'Buy Bonus: Tap to buy bonus base on the current bet. The BONSS round can be instantly triggered from the base game by buying it for 35x current total bet.',
            height: 200,
          },
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.buttonItemPrefab,
          script: ButtonItem,
          obj: {
            icon: this.getHomeFrame('home_auto_off'),
            value: 'Auto Spin: Tap to start the auto play, and click again to stop the auto spin.',
            height: 140,
          },
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.buttonItemPrefab,
          script: ButtonItem,
          obj: {
            icon: this.getHomeFrame('home_money'),
            value: 'Bet Select: Tap to adjust the bet.',
            height: 140,
          },
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.buttonItemPrefab,
          script: ButtonItem,
          obj: {
            icon: this.getHomeFrame('home_queick_off'),
            value:
              'Turbo Spin: Tap to enable or disable the Turbo Spin to adjust the speed of reel spins.',
            height: 140,
          },
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.buttonItemPrefab,
          script: ButtonItem,
          obj: {
            icon: this.getHomeFrame('home_setting'),
            value: 'Option: Tap to show the game instruction and sound button.',
            height: 140,
          },
        },
      },
    ];
  }

  getSymbolFrame(name: string) {
    return this.symbolFrames.find((frame) => frame.name === name) || null;
  }

  getHomeFrame(name: string) {
    return this.homeFrames.find((frame) => frame.name === name) || null;
  }

  getRuleFrame(name: string) {
    return this.ruleFrames.find((frame) => frame.name === name) || null;
  }

  /**
   * 创建悬挂缩进文本
   * @param content 文本内容
   * @param fontSize 字体大小
   * @param color 颜色
   * @param bold 是否粗体
   * @param align 对齐方式
   * @param hangingIndent 悬挂缩进像素值
   * @param maxWidth 最大宽度
   * @param layer 层级
   * @param numberText 序号文本
   */
  createHangingIndentText(content: string, fontSize: number, color: string, bold: boolean, align: string, hangingIndent: number, maxWidth: number, layer: number, numberText?: string) {
    // 创建主文本节点
    const textNode = new Node('text');
    textNode.layer = layer;
    
    // 设置文本节点位置和大小
    const textTransform = textNode.addComponent(UITransform);
    textTransform.width = maxWidth;
    
    // 如果有悬挂缩进，调整文本位置和宽度
    if (hangingIndent && hangingIndent > 0) {
      textNode.setPosition(-maxWidth / 2 + hangingIndent, 0);
      textTransform.width = maxWidth - hangingIndent;
    } else {
      textNode.setPosition(-maxWidth / 2, 0);
    }
    
    // 添加主文本Label
    const mainLabel = textNode.addComponent(Label);
    mainLabel.string = content;
    mainLabel.fontSize = fontSize;
    mainLabel.color = new Color().fromHEX(color);
    mainLabel.isBold = bold;
    mainLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
    mainLabel.horizontalAlign = align === 'left' ? Label.HorizontalAlign.LEFT : Label.HorizontalAlign.CENTER;
    
    // 如果有悬挂缩进，添加序号Label
    if (hangingIndent && hangingIndent > 0) {
      const numberNode = new Node('numberLabel');
      numberNode.layer = layer;
      
      // 设置序号Label的Transform
      const numberTransform = numberNode.addComponent(UITransform);
      numberTransform.width = hangingIndent;
      numberTransform.height = fontSize * 1.2;
      
      // 添加Widget约束组件，实现贴顶效果
      const widget = numberNode.addComponent(Widget);
      // 贴顶约束
      widget.isAlignTop = true;
      // 贴左约束
      widget.isAlignLeft = true;
      // 顶部距离
      widget.top = -5;
      // 左侧距离
      widget.left = -40;
      
      const numberLabel = numberNode.addComponent(Label);
      numberLabel.string = numberText || '1.'; 
      numberLabel.fontSize = fontSize;
      numberLabel.color = new Color().fromHEX(color);
      numberLabel.isBold = bold;
      
      textNode.addChild(numberNode);
    }
    
    this.contentNode.addChild(textNode);
  }

  drawRule() {
    const layer = this.contentNode.layer;

    const maxWidth = this.contentNode.getComponent(UITransform).width;

    this.ruleData.forEach((rule) => {
      const {
        type, textOptions, imageOptions, prefabOptions 
      } = rule;

      if (type === RuleType.TEXT) {
        const {
          content, fontSize, color, bold, align, hangingIndent, numberText 
        } = textOptions ?? {};
        // 创建悬挂缩进文本
        this.createHangingIndentText(
          content ?? '', 
          fontSize ?? 26, 
          color ?? '#FFFFFF', 
          bold ?? false, 
          align ?? 'left', 
          hangingIndent ?? 0, 
          maxWidth, 
          layer,
          numberText
        );
      } else if (type === RuleType.IMAGE) {
        const {
          imgNames, widths, heights 
        } = imageOptions ?? {};
        const node = new Node('imgBox');
        node.layer = layer;
        node.addComponent(Sprite).spriteFrame = null;

        if (widths && heights) {
          node.getComponent(UITransform).setContentSize(widths[0], heights[0]);
        }

        const layout = node.addComponent(Layout);
        layout.type = Layout.Type.HORIZONTAL;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.spacingX = 30;
        imgNames.forEach((imgName: SpriteFrame, index: number) => {
          const img = new Node('img');
          img.layer = layer;
          img.addComponent(Sprite).spriteFrame = imgName;
          img.getComponent(UITransform).setContentSize(widths[index], heights[index]);
          node.addChild(img);
        });
        this.contentNode.addChild(node);
      } else if (type === RuleType.PREFAB) {
        const {
          prefab, script, obj 
        } = prefabOptions ?? {};
        const node = instantiate(prefab);

        if (script) {
          (node.getComponent(script) as any)?.init?.(obj);
        }

        this.contentNode.addChild(node);
      }
    });

    this.scheduleOnce(() => {
      this.contentNode.getComponent(Layout).updateLayout();
    }, 0.3);
  }

  /**
   * 隐藏弹窗时的回调函数
   * @param data 传入的数据，包含记录ID
   */
  onHide() {
    EventTrackManager.inst.trackExitBetRules();
  }
}
