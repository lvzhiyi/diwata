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
} from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { app } from 'db://assets/app/app';
import { SymbolBox } from './expansion/SymbolBox';
import { ButtonItem } from './expansion/ButtonItem';
import EventTrackManager from 'db://assets/basePlate/middleWare/serverManager/EventTrackManager';

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
  private symbolBoxPrefab: Prefab = null;

  @property(Prefab)
  private splitSymbolPrefab: Prefab = null;

  @property(Prefab)
  private buttonItemPrefab: Prefab = null;

  @property(Prefab)
  private jackpotPrefab: Prefab = null;

  private ruleData: IRuleData[] = [];

  // 初始化的相关逻辑写在这
  onLoad() {
    // this.initData();
    // this.drawRule();
  }

  initData() {
    this.ruleData = [
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Symbol',
          fontSize: 40,
          color: '#ffe345',
          bold: true,
          align: 'center',
        },
      },

      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.symbolBoxPrefab,
          script: SymbolBox,
          obj: {
            icon: this.getSymbolFrame('1008'), value1: 0.5, value2: 1.5, value3: 2.5 
          },
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.symbolBoxPrefab,
          script: SymbolBox,
          obj: {
            icon: this.getSymbolFrame('1007'), value1: 0.4, value2: 1.2, value3: 2
          },
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.symbolBoxPrefab,
          script: SymbolBox,
          obj: {
            icon: this.getSymbolFrame('1006'), value1: 0.3, value2: 0.9, value3: 1.5 
          },
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.symbolBoxPrefab,
          script: SymbolBox,
          obj: {
            icon: this.getSymbolFrame('1005'), value1: 0.2, value2: 0.6, value3: 1 
          },
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.symbolBoxPrefab,
          script: SymbolBox,
          obj: {
            icon: this.getSymbolFrame('1004'), value1: 0.1, value2: 0.3, value3: 0.5
          },
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.symbolBoxPrefab,
          script: SymbolBox,
          obj: {
            icon: this.getSymbolFrame('1003'), value1: 0.1, value2: 0.3, value3: 0.5 
          },
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.symbolBoxPrefab,
          script: SymbolBox,
          obj: {
            icon: this.getSymbolFrame('1002'), value1: 0.05, value2: 0.15, value3: 0.25 
          },
        },
      },
      {
        type: RuleType.PREFAB,
        prefabOptions: {
          prefab: this.symbolBoxPrefab,
          script: SymbolBox,
          obj: {
            icon: this.getSymbolFrame('1001'), value1: 0.05, value2: 0.15, value3: 0.25 
          },
        },
      },
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            'Game Rules',
          fontSize: 40,
          color: '#ffe345',
          bold: true,
          align: 'center',
        },
      },,
      {
        type: RuleType.TEXT,
        textOptions: {
          content:
            '1. This is a 4x5 slot machine with an additional special reel, and there are 1024 paylines.\r\n2. Consecutive symbols, positioned left to right starting on the first reel, will form a winning combination. if in sequence from leftmost to right with no gaps and in combinations according to the pay table.',
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
            this.getRuleFrame('rule01'),
            this.getRuleFrame('rule02'),
          ],
          widths: [265, 265],
          heights: [185, 185],
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
            '1."Golden Symbol" will appear on reels 2, 3, and 4 only.\r\n2."Golden Symbol" and "Normal Symbol" as seen as the same symbol to eliminated and win the payouts.\r\n3.When "Golden Symbol" is eliminated that will flip in its original position and become "Wild Symbol".',
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
      { type: RuleType.PREFAB, prefabOptions: { prefab: this.jackpotPrefab, obj: {} } },
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

      { type: RuleType.PREFAB, prefabOptions: { prefab: this.splitSymbolPrefab, obj: {} } },

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

  drawRule() {
    const layer = this.contentNode.layer;

    const maxWidth = this.contentNode.getComponent(UITransform).width;

    this.ruleData.forEach((rule) => {
      const {
        type, textOptions, imageOptions, prefabOptions 
      } = rule;

      if (type === RuleType.TEXT) {
        const {
          content, fontSize, color, bold, align 
        } = textOptions ?? {};
        const node = new Node('text');
        node.layer = layer;
        node.addComponent(UITransform).width = maxWidth;
        const label = node.addComponent(Label);
        label.string = content ?? '';
        label.fontSize = fontSize ?? 26;
        label.color = new Color().fromHEX(color ?? '#EAF2C3');
        label.isBold = bold ?? false;
        label.overflow = Label.Overflow.RESIZE_HEIGHT;
        label.horizontalAlign =
          align === 'left' ? Label.HorizontalAlign.LEFT : Label.HorizontalAlign.CENTER;
        this.contentNode.addChild(node);
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
