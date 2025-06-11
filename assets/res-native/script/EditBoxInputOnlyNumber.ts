import { _decorator, Component, EditBox, Node } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('EditBoxInputOnlyNumber')
export class EditBoxInputOnlyNumber extends Component {
  protected onLoad(): void {
    this.node.on(EditBox.EventType.TEXT_CHANGED, this.onTextChanged, this);
  }

  protected onTextChanged(): void {
    let editBox = this.node.getComponent(EditBox);

    if (!editBox) { 
      editBox = this.node.addComponent(EditBox);
    }

    const text = editBox.string;
    let newText = text?.replace(/\D/g, '');

    if (newText !== text) {
      editBox.string = newText;
    }
  }

  protected onDestroy(): void {
    if (this.node.hasEventListener(EditBox.EventType.TEXT_CHANGED)) {
      this.node.off(EditBox.EventType.TEXT_CHANGED, this.onTextChanged, this);
    }
  }
}
