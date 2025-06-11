import { _decorator, Component, Node, Label, CCInteger } from 'cc';
import { autoSettingModalEventTarget } from '../PopAutosetting';

const { ccclass, property } = _decorator;

@ccclass('AddOrSub')
export class AddOrSub extends Component {
    @property(Node)
    private SubNode: Node;

    @property(Node)
    private AddNode: Node;

    @property(CCInteger)
    private maxValue: number;

    private incrementSpeed = 1;

    private maxIncrementSpeed = 10000;

    private incrementStep = 0.5;

    private value = 0;

    private timerInterval: any;

    private timerTimeout: any;

    private isAdding = false;

    private isSubing = false;

    protected onLoad(): void {
      this.SubNode.on(Node.EventType.TOUCH_START, this.startSubing, this);
      this.SubNode.on(Node.EventType.TOUCH_END, this.endSubing, this);
      this.SubNode.on(Node.EventType.TOUCH_CANCEL, this.endSubing, this);

      this.AddNode.on(Node.EventType.TOUCH_START, this.startAdding, this);
      this.AddNode.on(Node.EventType.TOUCH_END, this.endAdding, this);
      this.AddNode.on(Node.EventType.TOUCH_CANCEL, this.endAdding, this);
    }

    initValue(num: number) {
      this.value = num;
        
      autoSettingModalEventTarget.emit('addOrSubValue', this.node.getChildByName('Number').children[0].name, num);

      this.node.getChildByName('Number').children[0].getComponent(Label).string = num.toString();
    }

    startSubing() {
      this.isSubing = true;
      this.updateValue(-1);
      this.timerTimeout = setTimeout(() => {
        if (this.isSubing) {
          this.timerInterval = setInterval(() => {
            this.updateValue(-1);
          }, 100);
        }
      }, 100);
    }

    endSubing() {
      this.isSubing = false;
      this.incrementSpeed = 1;
      this.incrementStep = 0.5;

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      if (this.timerTimeout) {
        clearTimeout(this.timerTimeout);
        this.timerTimeout = null;
      }
    }

    startAdding() {
      this.isAdding = true;
      this.updateValue(1);
      this.timerTimeout = setTimeout(() => {
        if (this.isAdding) {
          this.timerInterval = setInterval(() => {
            this.updateValue(1);
          }, 100);
        }
      }, 100);
    }

    endAdding() {
      this.isAdding = false;
      this.incrementSpeed = 1;
      this.incrementStep = 0.5;

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      if (this.timerTimeout) {
        clearTimeout(this.timerTimeout);
        this.timerTimeout = null;
      }
    }

    updateValue(num: number) {
      if (this.incrementSpeed < this.maxIncrementSpeed) {
        this.incrementSpeed += this.incrementStep;
        this.incrementStep += 0.1;
      }
      if (num > 0) {
        this.value += Math.floor(this.incrementSpeed);
      } else {
        this.value -= Math.floor(this.incrementSpeed);
      }

      if (this.value < 0) {
        this.value = 0;
      } else if (this.maxValue && this.value > this.maxValue) {
        this.value = this.maxValue;
      }

      autoSettingModalEventTarget.emit('addOrSubValue', this.node.getChildByName('Number').children[0].name, this.value);

      this.node.getChildByName('Number').children[0].getComponent(Label).string = this.value.toString();
    }

    protected onDestroy(): void {
      this.SubNode.off(Node.EventType.TOUCH_START, this.startSubing, this);
      this.SubNode.off(Node.EventType.TOUCH_END, this.endSubing, this);
      this.SubNode.off(Node.EventType.TOUCH_CANCEL, this.endSubing, this);

      this.AddNode.off(Node.EventType.TOUCH_START, this.startAdding, this);
      this.AddNode.off(Node.EventType.TOUCH_END, this.endAdding, this);
      this.AddNode.off(Node.EventType.TOUCH_CANCEL, this.endAdding, this);

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      if (this.timerTimeout) {
        clearTimeout(this.timerTimeout);
      }
    }
}
