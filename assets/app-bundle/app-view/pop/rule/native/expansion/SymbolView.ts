import { _decorator, Component, instantiate, Node, Prefab, SpriteFrame } from 'cc';
import { SymbolBox } from './SymbolBox';

const { ccclass, property } = _decorator;

@ccclass('SymbolView')
export class SymbolView extends Component {
  @property(Prefab)
  private symbolBoxPrefab: Prefab = null;

  private symbolData: any[] = [];

  @property(SpriteFrame)
  private symbolFrames: SpriteFrame[] = [];

  onLoad() {
    this.initData();
  }

  initData() {
    this.symbolData = [
      {
        icon: this.getSymbolFrame('1001'), value1: 5, value2: 10, value3: 15, value4: 25, border: 0
      },
      
      {
        icon: this.getSymbolFrame('1002'), value1: 5, value2: 10, value3: 15, value4: 25, border: 1
      },
      {
        icon: this.getSymbolFrame('1003'), value1: 10, value2: 20, value3: 30, value4: 50, border: 1
      },
      {
        icon: this.getSymbolFrame('1004'), value1: 10, value2: 20, value3: 30, value4: 50, border: 1
      },
      {
        icon: this.getSymbolFrame('1005'), value1: 15, value2: 30, value3: 45, value4: 60, border: 1
      },
      {
        icon: this.getSymbolFrame('1006'), value1: 25, value2: 50, value3: 75, value4: 100, border: 1
      },
      {
        icon: this.getSymbolFrame('1007'), value1: 25, value2: 50, value3: 75, value4: 100, border: 1
      },
      {
        icon: this.getSymbolFrame('1008'), value1: 40, value2: 75, value3: 100, value4: 150, border: 1
      },
      {
        icon: this.getSymbolFrame('1009'), value1: 40, value2: 70, value3: 100, value4: 150, border: 1
      },
      {
        icon: this.getSymbolFrame('1010'), value1: 50, value2: 100, value3: 150, value4: 200, border: 2
      },
    ];
    this.symbolData.forEach((item) => {
      const node = instantiate(this.symbolBoxPrefab);
      node.getComponent(SymbolBox).init(item);
      this.node.addChild(node);
    });
  }

  start() {

  }

  getSymbolFrame(name: string) {
    return this.symbolFrames.find((frame) => frame.name === name) || null;
  }

  update(deltaTime: number) {
        
  }
}
