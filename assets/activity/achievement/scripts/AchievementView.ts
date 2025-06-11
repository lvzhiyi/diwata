import { _decorator, Button, instantiate, Label, Node, Prefab, tween, Tween, UITransform, v3 } from 'cc';

import { AchievementItem } from './AchievementItem';
import { ActivityDialogViewBase } from '../../../common/script/DialogView/ActivityDialogViewBase';
import { ActivityDataMgr } from 'db://assets/common/script/data/ActivityDataMgr';
import { ActivityDialogViewID } from 'db://assets/common/script/DialogView/ActivityDialogViewID';
import { ActivityServicesMgr } from '../../../common/script/network/http/services/ActivityServicesMgr';
import { Handler } from 'db://assets/common/script/tools/Handler';
import { HttpDataBase } from 'db://assets/common/script/network/http/services/HttpDataBase';
import { AchievementItemInfo, RedeemAchievementData, ReqRedeemAchievement, ResAchievement, RewardItemInfo } from 'db://assets/common/script/network/http/HttpDataModels/ResAchievement';
import { ActivityDialogViewMgr } from 'db://assets/common/script/DialogView/ActivityDialogViewMgr';
import { ActivityID, PackageFacade } from '../../../common/script/PackageFacade';
import { ActivityUtils } from 'db://assets/common/script/tools/ActivityUtils';
import { DataReportMgr } from 'db://assets/common/script/managers/DataReportMgr';
import { DataReporEvents } from 'db://assets/common/script/data/dataModels/DataReporEvents';


export enum AchievementStatus{
    inProgress = 1, // 进行中
    canReceive = 2,
    completed = 3
}


const { ccclass, property } = _decorator;

@ccclass('AchievementView')
export class AchievementView extends ActivityDialogViewBase {

    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.achievement;


    @property(Prefab)
    private achievementItemPrefab: Prefab | null = null;

    @property(Node)
    private scrollViewContent: Node | null = null;

    @property(Node)
    private closeButton: Node | null = null;

    @property(Node)
    private descriptionButton: Node | null = null;

    private achievementList: AchievementItemInfo[] = [];
    private starsCardUrlSet: Set<string> = new Set(); // 未领取成就奖励图标Url
    private _receiveCount: number = 0; // 领取成就个数

    onLoad(){
    
        this.closeButton?.on(Button.EventType.CLICK, this.onCloseButton, this);
        this.descriptionButton?.on(Button.EventType.CLICK, this.onDescriptionButton, this);
        
    }

    public setData(data?: any): void {
        ActivityServicesMgr.instance.getAchievement(new Handler(this,this.onGetAchievement));
    }

    /**
     * 获取成就列表
     * @param data 
     */
    private onGetAchievement(data: HttpDataBase<ResAchievement>){
        if(data?.isSuccessful && data?.data?.achievementList.length > 0){
            this.achievementList = data.data.achievementList;
            this.achievementList = this.sortAchievementList(this.achievementList);
            this.setAchievementList(this.achievementList);
            ActivityDataMgr.instance.setAchievementData(data.data);
            ActivityDataMgr.instance.removeRedData(ActivityID.achievement);
            this.addTrackClickMenuAchievement();
        }
    }
    /** 排序AchievementList：2(可领取) -> 1(进行中) -> 3(已完成) */
    private sortAchievementList(achievementList: AchievementItemInfo[]): AchievementItemInfo[] {
        achievementList.sort((a, b) => {
            // 首先按状态排序
            if (a.status !== b.status) {
                if (a.status === AchievementStatus.canReceive) return -1;
                if (b.status === AchievementStatus.canReceive) return 1;
                if (a.status === AchievementStatus.completed) return 1;
                if (b.status === AchievementStatus.completed) return -1;
            }
            // 状态相同时位置保持不变
            return 0;
        });
        return achievementList;
    }

    /**
     * 设置成就列表
     * @param achievementList 
     */
    private setAchievementList(achievementList: AchievementItemInfo[]){
        for(let i = 0; i < achievementList.length; i++){
            const achievementItem = instantiate(this.achievementItemPrefab);
            achievementItem.setParent(this.scrollViewContent);
            const achievementItemInfo: AchievementItemInfo = achievementList[i];
            achievementItem.getComponent(AchievementItem).setItemData(achievementItemInfo,(itemNode: Node)=> this.onReceive(itemNode));

            if(achievementItemInfo.status == AchievementStatus.canReceive){
                for(let j = 0; j < achievementItemInfo.rewards.length; j++){
                    this.starsCardUrlSet.add(achievementItemInfo.rewards[j].imgUrl);
                }
            }
        }

        // 预加载未领取成就奖励图标
        for(let url of this.starsCardUrlSet){
            ActivityUtils.loadServerImage(url);
        } 
    }

    /**
     * 领取成就奖励
     * @param itemNode 
     */
    private onReceive(itemNode: Node){
        let achievementItemInfo = this.achievementList.find((item, index)=> index ==itemNode.getSiblingIndex());
        let data: ReqRedeemAchievement = {
            achievementId: achievementItemInfo.id,
            redeemId: achievementItemInfo.redeemId
        }
        ActivityServicesMgr.instance.redeemAchievement(data,new Handler(this,(data: HttpDataBase<RedeemAchievementData>)=>{
            if(data.isSuccessful){
              
                achievementItemInfo.rewards = [data.data.reward];
                achievementItemInfo.status = AchievementStatus.completed;
                itemNode.getComponent(AchievementItem).setRewardRichCard(achievementItemInfo);
                ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.achievementReward,data.data.reward);

                // 是否存在可领取的成就
                let canReceiveAchievement = false;
                for(let i = 0; i < this.achievementList.length; i++){
                    if (this.achievementList[i].id == achievementItemInfo.id) {
                        this.achievementList[i] = achievementItemInfo;
                    }
                    if(this.achievementList[i].status == AchievementStatus.canReceive){
                        canReceiveAchievement = true;
                    }
                }
                !canReceiveAchievement && ActivityDataMgr.instance.removeRedData(ActivityID.achievement);
                ActivityDataMgr.instance.addRedData(ActivityID.backpack);

                let achievementData = ActivityDataMgr.instance.getAchievementData();
                achievementData.achievementList = this.achievementList;
                ActivityDataMgr.instance.setAchievementData(achievementData);

                this._receiveCount++;
                this.addTrackClickReceiveAchievementReward(achievementItemInfo,data.data.reward);
            }  
        }));
    }



    /**
     * 打开成就描述弹窗
     */
    private onDescriptionButton(){
        ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.achievementDescription);
    }

    private onCloseButton(){
        this.addTrackExitAchievementPage();
        this.close();
    }

    private addTrackExitAchievementPage(){
        let eventData = {
            unclaimed_count: this.achievementList.filter((item)=> item.status == AchievementStatus.canReceive).length,
            claimed_during_session: this._receiveCount,
        }
        DataReportMgr.instance.track(DataReporEvents.ExitAchievementPage,eventData);
    }
    
    private addTrackClickMenuAchievement(){
        let task_displayedList = []
        let task_completed_count = 0;
        let task_reward_ready_count = 0;
        for (let i = 0; i < this.achievementList.length; i++) {
            const achievementItemInfo = this.achievementList[i];
            task_displayedList.push(achievementItemInfo.id);
            if(achievementItemInfo.status == AchievementStatus.completed){
                task_completed_count++;
            }
            if(achievementItemInfo.status == AchievementStatus.canReceive){
                task_reward_ready_count++;
            }
        }
        let eventData = {
            task_count: this.achievementList.length,
            task_displayed_list: task_displayedList,
            task_completed_count: task_completed_count,
            task_reward_ready_count: task_reward_ready_count,
        }
        DataReportMgr.instance.track(DataReporEvents.ClickMenuAchievement,eventData);
    }

    private addTrackClickReceiveAchievementReward(achievementItemInfo: AchievementItemInfo,reward: RewardItemInfo){
        let eventData = {
            task_id: achievementItemInfo.id,
            task_name: achievementItemInfo.name,
            task_description: achievementItemInfo.description,
            progress: achievementItemInfo.progressList.current,
            target: achievementItemInfo.progressList.target,
            reward_type: "",
            reward_quantity: reward.count,
            card_star_level: reward.starLevel,
        }
        DataReportMgr.instance.track(DataReporEvents.ClickReceiveAchievementReward,eventData);
    }
}




