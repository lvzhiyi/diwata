import { _decorator, Button, Component, isValid, Label, Node, ProgressBar, Sprite, SpriteFrame, UITransform } from 'cc';
import { DailyMission } from 'db://assets/common/script/network/http/HttpDataModels/ResDailyMission';
import { DailyMissionStatus } from './DailyMissionView';
import { ActivityUtils } from 'db://assets/common/script/tools/ActivityUtils';
const { ccclass, property } = _decorator;

class T {
    constructor(public url: string, public type: string) {}
}

@ccclass('DailyMissionItem')
export class DailyMissionItem extends Component {


    @property(Label)
    totalBetLabel:Label = null;

    @property(Label)
    gameNameLabel:Label = null;

    @property(Label)
    missionProgressLabel:Label = null;

    @property(ProgressBar)
    missionProgressBar:ProgressBar = null;

    @property(Node)
    maskNode:Node = null;

    @property(Node)
    lockNode:Node = null;

    @property(Node)
    completeNode:Node = null;


    @property(Node)
    richCardHelpButton:Node = null;

    @property(Node)
    dailyMissionHelpButton:Node = null;

    private helpCollback:Function = null;

    @property(Sprite)
    iconSprite:Sprite = null;


    protected onLoad(): void {
        this.richCardHelpButton.on(Button.EventType.CLICK, this.onRichCardHelpClick, this);
        this.dailyMissionHelpButton.on(Button.EventType.CLICK, this.onRichCardHelpClick, this);
    }

    /**
     * 设置数据
     * @param data 
     * @param helpCollback 
     */
    setItemData(data: DailyMission, helpCollback: Function) {
        this.helpCollback = helpCollback;
        this.totalBetLabel.string = data.description;
        this.gameNameLabel.string = "Play SM Slot Games";
        this.missionProgressLabel.string = data.experience + "/" + data.target;
        this.missionProgressBar.progress = parseInt((data.experience / data.target * 100).toString()) / 100;
        this.maskNode.active = data.status != DailyMissionStatus.inProgress;
        this.lockNode.active = data.status == DailyMissionStatus.locked;
        this.completeNode.active = data.status == DailyMissionStatus.completed;
    
        ActivityUtils.loadServerImage(data.iconUrl,
            (spriteFrame: SpriteFrame) => {
                 this.iconSprite && isValid(this.iconSprite) && (this.iconSprite.spriteFrame = spriteFrame);
            },
            (error: Error) => {
                this.iconSprite && isValid(this.iconSprite) && (this.iconSprite.node.getChildByName("LoadFailed").active = true);
            }
        );
    
        this.totalBetLabel.updateRenderData();
        if (this.totalBetLabel.node.getComponent(UITransform).height > 31) {
            this.missionProgressBar.node.parent.setPosition(this.missionProgressBar.node.parent.position.x, -8);
        }
    }

    private onRichCardHelpClick(){
        this.helpCollback();
    }


  

}


