import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';

const { ccclass, property } = _decorator;

export enum JackpotTabNameType {
    ALL = 'all',
    GRAND = 'grand',
    MAJOR = 'major',
}

@ccclass('JackpotRecordTab')
export class JackpotRecordTab extends Component {
    @property({ type: [SpriteFrame], tooltip: 'Jackpot Sprites' })
    private jackpotSprites: SpriteFrame[] = [];

    @property({ type: SpriteFrame, tooltip: 'Button Bg On Sprite' })
    private btnBgOnSprite: SpriteFrame;

    @property({ type: SpriteFrame, tooltip: 'Button Bg Off Sprite' })
    private btnBgOffSprite: SpriteFrame;

    private mapTabNameSprites: Map<string, SpriteFrame> = new Map();

    private mapBtnBgSprites: Map<string, SpriteFrame> = new Map();

    private tabNode: Node = null;

    private listenerFunc?: (tabName: JackpotTabNameType) => void = null;

    protected onLoad(): void {
      this.initEvent();

      this.initSprites();
      
      this.onTabChange(this.node.children[2]);
    }

    /**
     * 初始化事件
     */
    initEvent() {
      this.node.children.forEach((child) => {
        child.on(Node.EventType.TOUCH_END, () => this.onTabChange(child), this);
      });
    }

    /**
     * 初始化图片
     */
    initSprites() {
      this.jackpotSprites.forEach((spriteFrame) => {
        this.mapTabNameSprites.set(spriteFrame.name, spriteFrame);
      });

      this.mapBtnBgSprites.set(this.btnBgOnSprite.name, this.btnBgOnSprite);
      this.mapBtnBgSprites.set(this.btnBgOffSprite.name, this.btnBgOffSprite);
    }

    /**
     * 切换Tab按钮
     * @param node 
     */
    onTabChange(node: Node) {
      if (this.tabNode === node) {
        return;
      }

      // 之前选中的按钮，设置为off
      if (this.tabNode) {
        const beforeTabNode = this.tabNode;
        beforeTabNode.getComponent(Sprite).spriteFrame = this.mapBtnBgSprites.get('jackpot_tab_btn_off');
        beforeTabNode.getChildByName('name').getComponent(Sprite).spriteFrame = this.mapTabNameSprites.get(`jackpot_${beforeTabNode.name}_off`);
      }

      console.log('node', node);
      console.log('node', node, node.name);
      // 当前选中的按钮，设置为on
      node.getComponent(Sprite).spriteFrame = this.mapBtnBgSprites.get('jackpot_tab_btn_on');
      node.getChildByName('name').getComponent(Sprite).spriteFrame = this.mapTabNameSprites.get(`jackpot_${node.name}_on`);

      this.tabNode = node;

      // 触发回调
      this.listenerFunc?.(this.tabNode.name as JackpotTabNameType);
    }

    listenerTabChange(listenerFunc: (tabName: JackpotTabNameType) => void) {
      this.listenerFunc = listenerFunc;   
    }

    protected onDisable(): void {
      if(this.node.isValid ) {
        this.node.children.forEach((child) => {
          child.off(Node.EventType.TOUCH_END, () => this.onTabChange(child), this);
        });
      }
    }
}
