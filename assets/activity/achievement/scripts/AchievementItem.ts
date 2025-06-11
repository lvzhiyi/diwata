import { _decorator, Button, color, Component, isValid, Label, labelAssembler, LabelShadow, Node, ProgressBar, Sprite, SpriteFrame } from 'cc';
import { ActivityDialogViewID } from 'db://assets/common/script/DialogView/ActivityDialogViewID';
import { ActivityDialogViewMgr } from 'db://assets/common/script/DialogView/ActivityDialogViewMgr';
import { AchievementItemInfo } from 'db://assets/common/script/network/http/HttpDataModels/ResAchievement';
import { AchievementStatus } from './AchievementView';
import { ActivityUtils } from 'db://assets/common/script/tools/ActivityUtils';
import { DataReportMgr } from 'db://assets/common/script/managers/DataReportMgr';
import { DataReporEvents } from 'db://assets/common/script/data/dataModels/DataReporEvents';
const { ccclass, property } = _decorator;

@ccclass('AchievementItem')
export class AchievementItem extends Component {

    @property(Node)
    private achievementIcon: Node | null = null;

    @property(Node)
    private logo: Node | null = null;

    @property(Node)
    private privilegeIocn: Node | null = null;

    @property(Label)
    private nameLabel: Label | null = null;

    @property(Label)
    private descriptionLabel: Label | null = null;

    @property(ProgressBar)
    private progressBar: ProgressBar | null = null;

    @property(Label)
    private progressLabel: Label | null = null;

    @property(Button)
    private receiveButton: Button | null = null;

    @property(Button)
    private richCardButton: Button | null = null;

    @property(Button)
    private rebateButton: Button | null = null;
    @property(Button)
    private achievementButton: Button | null = null;

    @property(Label)
    private starsCardAmountLabel: Label | null = null;

    private receiveCollBack: Function = null;
    public itemData: AchievementItemInfo = null;

    protected onLoad(): void {
        this.rebateButton.node.active = false;
        this.richCardButton.node.active = false;
        this.receiveButton.node.on(Button.EventType.CLICK, this.onReceiveButton, this);
        this.richCardButton.node.on(Button.EventType.CLICK, this.onRichCardButton, this);
        this.achievementButton.node.on(Button.EventType.CLICK, this.onAchievementButton, this);
        this.rebateButton.node.on(Button.EventType.CLICK, this.onRebateButton, this);
    }

    /**
     * 设置成就数据
     * @param data 
     * @param receiveCollBack 
     */
    public setItemData(data: AchievementItemInfo,receiveCollBack: Function,){
        this.itemData = data;
        this.nameLabel.string = data.name;
        this.descriptionLabel.string = data.description;
        this.progressBar.progress =  parseInt((data.progressList.current / data.progressList.target * 100).toString()) / 100;
        this.progressLabel.string = `${data.progressList.current}/${data.progressList.target}`;
        this.receiveCollBack = receiveCollBack;
        this.setRewardRichCard(data);

        // 加载成就图标
        ActivityUtils.loadServerImage(data.iconUrl,
            (spriteFrame: SpriteFrame) => {
                this.achievementIcon && isValid(this.achievementIcon) && (this.achievementIcon.getComponent(Sprite).spriteFrame = spriteFrame);
            },
            (error: Error) => {
                this.achievementIcon && isValid(this.achievementIcon) && (this.achievementIcon.getChildByName("LoadFailed").active = true);
            }
        );
    }

    /**
     * 设置奖励图标
     * @param data 
     */
    public setRewardRichCard(data: AchievementItemInfo){
        this.richCardButton.node.active = true;
        // 设置奖励图标
        if (data.status == AchievementStatus.completed) {
            if(data.rewards.length > 0){
                ActivityUtils.loadServerImage(data.rewards[0].imgUrl,
                    (spriteFrame: SpriteFrame) => {
                        this.richCardButton && isValid(this.richCardButton) && (this.richCardButton.getComponent(Sprite).spriteFrame = spriteFrame);
                    },
                    (error: Error) => {
                        if (isValid(this.richCardButton)) {
                            this.richCardButton.getComponent(Sprite).spriteFrame = null;
                            this.richCardButton.node.getChildByName("LoadFailed").active = true;
                        }
                    }
                );
                this.starsCardAmountLabel.string = `X${data.rewards[0].count}`;
            }
        }
        this.updateReceiveButton(data);
    }

    private updateReceiveButton(data: AchievementItemInfo){
        if(data.status == AchievementStatus.inProgress){
            this.receiveButton.interactable = false;
            this.receiveButton.node.getComponent(Sprite).grayscale = true;
            let textNode = this.receiveButton.node.getChildByName("Label");
            textNode.getComponent(Label).string = "Unfinished";
            textNode.getComponent(Label).enableOutline = false;
            
        }else if (data.status == AchievementStatus.canReceive) {
            this.receiveButton.interactable = true;
            this.receiveButton.node.getComponent(Sprite).grayscale = false;
            let textNode = this.receiveButton.node.getChildByName("Label");
            textNode.getComponent(Label).string = "Receive";
            textNode.getComponent(Label).enableOutline = true;
            
        }else if (data.status == AchievementStatus.completed) {
            this.receiveButton.interactable = false;
            this.receiveButton.node.getComponent(Sprite).grayscale = true;
            let textNode = this.receiveButton.node.getChildByName("Label");
            textNode.getComponent(Label).string = "Received";
            textNode.getComponent(Label).enableOutline = false;
      
        }
    }

    private onReceiveButton(){
        this.receiveCollBack(this.node);
    }

    private onRichCardButton(){
        if(this.itemData.status == AchievementStatus.completed){
            ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.achievementRichCard,this.itemData.rewards)
        }else{
            ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.achievementRandomRichCard,this.itemData)
        }
    }

    private onAchievementButton(){
        ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.achievementBadgeDetails,this.itemData) 
    }

    private onRebateButton(){
        // 权益功能待定
        ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.achievementRebateDetails)     

    }
    
}


