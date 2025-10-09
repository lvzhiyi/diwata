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
import { delay } from 'db://assets/common/script/extra/Utils/common';

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
    imgName: SpriteFrame;
    width: number;
    height: number;
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
          imgName: this.getRuleFrame('rule_xiaochu'),
          width: 447,
          height: 343,
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            "Malfunction voids all pays and plays. If any malfunction occurs during the feature game, the system will automatically complete the game and ensure the player receives their winnings. Where an interruption occurs after the operator receives notification of the customer's gamble and where the customer can have no further influence on the outcome of the event or gamble the results of the gamble should stand.",
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          // 悬挂缩进：30像素
          hangingIndent: 40,
          // 序号文本
          numberText: '3.',
        },
      },
      
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'A game round is immediately ended when the Maximum Win Odds is reached, and all winnings will be paid out.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'win limit is 20000x',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Minimum bet: P0.3',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
        },
      },
      
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Maximum bet: P10,000',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
        },
      },

      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.ruleTitlePrefab,
          script: RuleTitle,
          obj: { title: 'Stick Symbol', },
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'The game may feature a “Stick symbol”.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '1.',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'When the sword symbol appears, all symbols on the reel will turn into Wild.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '2.',
        },
      },
      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgName: this.getRuleFrame('rule1'),
          width: 456,
          height: 282,
        },
      },

      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.ruleTitlePrefab,
          script: RuleTitle,
          obj: { title: 'Sword Symbol', },
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'The game may feature a “Sword symbol”.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '1.',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'When the sword symbol appears, all symbols on the reel will turn into Wild.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '2.',
        },
      },
      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgName: this.getRuleFrame('rule2'),
          width: 456,
          height: 282,
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.ruleTitlePrefab,
          script: RuleTitle,
          obj: { title: 'Wild', },
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'WILD only comes from the Sword symbol or the Stick symbol.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
        },
      },
      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgName: this.getRuleFrame('5001'),
          width: 200,
          height: 200,
        },
      },

      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.ruleTitlePrefab,
          script: RuleTitle,
          obj: { title: 'Combo Multiplier', },
        },
      },
      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgName: this.getRuleFrame('rule3'),
          width: 381,
          height: 170,
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'In the normal game, the starting multiplier is X1, and it doubles with each win.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '1.',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Points won each matching will be multiplied based on the current "Combo Multiplier"\n"Winning for the first time with each bet" The Multiplier is X1.\n"Winning for the Second time with each bet" The Multiplier is X2.\n"Winning for the Third time with each bet" The Multiplier is X4.\n"Winning for the Fourth time with each bet" The Multiplier is X8.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '2.',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'The maximum multiplier is X1024. Once reached, further wins will keep the multiplier at X1024.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '3.',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'When starting a new bet, the multiplier resets.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '4.',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'In Free Games, the starting multiplier resets to X8',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '5.',
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.ruleTitlePrefab,
          script: RuleTitle,
          obj: { title: 'Scatter', },
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'The Scatter symbol appears on Reels 1 to 6 in both the main game and Free Games.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '1.',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'If 3 Scatter symbols appear in the main game, the Free Game feature is triggered, awarding 8 free spins. Each additional Scatter symbol grants 1 extra free spin.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '2.',
        },
      },

      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.ruleTitlePrefab,
          script: RuleTitle,
          obj: { title: 'Buy Bonus', },
        },
      },
      {
        type: RuleType.IMAGE,
        imageOptions: {
          imgName: this.getRuleFrame('rule4'),
          width: 169,
          height: 152,
        },
      },
      
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'You can spend 75 times the bet amount to purchase a Free Game directly. After purchasing, you will receive at least 3 Scatter symbols.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '1.',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'In free games, the initial game multiplier is x8.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '2.',
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'If you hit 3 or more Scatters in the Free Game round, you will receive free spin rewards again. The remaining Free Game spins will be stacked.',
          fontSize: 27,
          color: '#FFFFFF',
          bold: false,
          align: 'left',
          hangingIndent: 40,
          numberText: '3.',
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.ruleTitlePrefab,
          script: RuleTitle,
          obj: { title: 'Game Button', },
        },
      },

      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.buttonItemPrefab,
          script: ButtonItem,
          obj: {
            icon: this.getHomeFrame('home_start'),
            value: 'Spin: Tap to start spinning base on the current bet.',
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
            value: 'Tap to start the auto play, and click again to stop the auto spin.',
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
      widget.top = 0;
      // 左侧距离
      widget.left = -40;
      
      const numberLabel = numberNode.addComponent(Label);
      numberLabel.string = numberText || '1.'; 
      numberLabel.fontSize = fontSize;
      numberLabel.color = new Color().fromHEX(color);
      numberLabel.isBold = bold;
      
      textNode.addChild(numberNode);
      delay(100).then(() => {
        numberNode.getComponent(Widget).updateAlignment();
      });
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
          imgName, width, height 
        } = imageOptions ?? {};
        const node = new Node('imgBox');
        node.layer = layer;
        node.addComponent(Sprite).spriteFrame = imgName;

        if (width && height) {
          node.getComponent(UITransform).setContentSize(width, height);
        }

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
