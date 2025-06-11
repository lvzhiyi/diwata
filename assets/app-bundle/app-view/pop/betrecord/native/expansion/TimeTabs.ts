import { _decorator, Color, Component, error, Graphics, instantiate, Label, Node, Prefab, resources } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NewComponent')
export class NewComponent extends Component {
    private nodesList = [];

    private list = [15, 30, 60];

    private selectedIndex = 0;

    protected onLoad(): void {
        resources.load('Prefabs/RecordModal/Tab', Prefab, (err, tabPrefab) => {
            this.list.forEach((item, index) => {
                const tabNode = instantiate(tabPrefab);

                tabNode.on(Node.EventType.TOUCH_END, () => {
                    const i = index;
                    this.setSelectedNode(i);
                }, this);

                const tabLabel = tabNode.getChildByName('Time').getComponent(Label);
                tabLabel.string = item + ' mins';

                this.node.addChild(tabNode);

                this.nodesList.push(tabNode);

                if (index === this.list.length - 1) {
                    this.setSelectedNode(0);
                } 
            });
        });
    };

    setSelectedNode(i) {
        this.selectedIndex = i;
        this.nodesList.forEach((node, index) => {
            let tabLabel = node.getChildByName('Time').getComponent(Label);
            let graphics = node.getComponent(Graphics);
            if (!tabLabel) {
                tabLabel = node.getChildByName('Time').addComponent(Label);
            }
            if (!graphics) {
                graphics = node.addComponent(Graphics);
            }
            graphics.clear();
            graphics.roundRect(-131, -45, 252, 90, 30);
            if (this.selectedIndex === index) {
                tabLabel.isBold = true;
                graphics.fillColor = new Color().fromHEX('#00b862');
                graphics.fill();
            } else {
                tabLabel.isBold = false;
                graphics.fillColor = new Color().fromHEX('#1c1c1c');
                graphics.fill();
            }
        })
    }
    
}

