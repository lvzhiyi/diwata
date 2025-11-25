import { _decorator, Component, Label, Node } from 'cc';
import { getP } from 'db://assets/common/script/extra/Utils/common';

const { ccclass, property } = _decorator;

@ccclass('AddOrSubNode')
export class AddOrSubNode extends Component {
    @property({ type: Label, tooltip: '' })
    private moneyText: Label = null;

    start() {
      if (getP() === '') {
        this.moneyText.string = '';
      }else{
        this.moneyText.string = '₱';
      }
    }

    update(deltaTime: number) {
        
    }
}
