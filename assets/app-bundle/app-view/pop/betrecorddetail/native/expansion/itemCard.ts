import { _decorator, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('RecordItemCard')
export class RecordItemCard extends Component {
  @property(Node)
  private goldNode: Node = null;
  
  start() {

  }

  update(deltaTime: number) {
        
  }

  public initValue(data: SymbolItem) {
    if (!data) {
      return;
    }
    if (data.symbolGoldBorder) {
      this.goldNode.active = true;
    }
  }
}
