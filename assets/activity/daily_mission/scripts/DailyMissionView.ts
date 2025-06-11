import { _decorator, Button, instantiate, Label, Node, Prefab, Widget } from "cc";

import { DailyMissionItem } from "./DailyMissionItem";
import { ActivityDialogViewBase } from "../../../common/script/DialogView/ActivityDialogViewBase";
import { ActivityDialogViewID } from "db://assets/common/script/DialogView/ActivityDialogViewID";
import { ActivityServicesMgr } from "../../../common/script/network/http/services/ActivityServicesMgr";
import { Handler } from "db://assets/common/script/tools/Handler";
import { HttpDataBase } from "db://assets/common/script/network/http/services/HttpDataBase";
import {
    DailyMission,
    ResDailyMission,
} from "db://assets/common/script/network/http/HttpDataModels/ResDailyMission";
import { ActivityDialogViewMgr } from "db://assets/common/script/DialogView/ActivityDialogViewMgr";
import { PackageFacade } from "db://assets/common/script/PackageFacade";
import { DataReportMgr } from "db://assets/common/script/managers/DataReportMgr";
import { DataReporEvents } from "db://assets/common/script/data/dataModels/DataReporEvents";

const { ccclass, property } = _decorator;

export enum DailyMissionStatus {
    locked = 1, // 锁定
    inProgress = 2, // 进行中
    completed = 3, // 完成
}

@ccclass("DailyMissionDialogView")
export class DailyMissionDialogView extends ActivityDialogViewBase {
    protected _dialogViewID: ActivityDialogViewID = ActivityDialogViewID.dailyMission;

    @property(Prefab)
    dailyMissionItemPrefab: Prefab = null;

    @property(Label)
    timeLabel: Label = null;

    @property(Node)
    scrollViewContent: Node = null;

    @property(Node)
    private colseButton: Node = null;

    @property(Node)
    private DescriptionButton: Node = null;

    private dailyMissionList: DailyMission[] = [];

    protected onLoad(): void {
        this.timeLabel.node.active = false;
        this.colseButton.on(Button.EventType.CLICK, this.onCloseButton, this);
        this.DescriptionButton.on(Button.EventType.CLICK, this.onHelpButton, this);
    }

    protected start(): void {}

    public setData(data?: any): void {
        this.getDailyMission();
    }

    /**
     * 获取每日任务
     */
    getDailyMission() {
        ActivityServicesMgr.instance.getDailyMission(
            new Handler(this, (res: HttpDataBase<ResDailyMission>) => {
                if (res.isSuccessful && res.data) {
                    this.setDailyMissionData(res.data);
                }
            })
        );
    }

    /**
     * 设置每日任务数据
     * @param data
     */
    private setDailyMissionData(data: ResDailyMission) {
        this.scrollViewContent.removeAllChildren();
        this.scrollViewContent.getComponent(Widget).updateAlignment();

        if (!data.dailyMissionList) return;
        data.dailyMissionList = this.sortDailyMissionList(data.dailyMissionList);
        for (let i = 0; i < data.dailyMissionList.length; i++) {
            let item = instantiate(this.dailyMissionItemPrefab);
            this.scrollViewContent.addChild(item);
            item.getComponent(DailyMissionItem).setItemData(data.dailyMissionList[i], () => {
                this.onRichCardHelpClick(data.dailyMissionList[i]);
            });
        }
        this.dailyMissionList = data.dailyMissionList;
        PackageFacade.instance.log("当前服务器时间", new Date(data.timestamp));

        this.timeLabel.node.active = true;
        if (data.timestamp) {
            // 向上取整
            let refreshTime = Math.ceil(
                (new Date(data.refreshTime).getTime() - data.timestamp) / 1000
            );
            this.addCountDown(refreshTime);
        }

        this.addTrackClickMenuDailyMission(data);
    }

    // 添加倒计时
    private addCountDown(time: number) {
        this.timeLabel.unscheduleAllCallbacks();
        this.timeLabel.string = "Countdown --D --H --M --S";
        let day = Math.floor(time / 86400);
        let hour = Math.floor(time / 3600) % 24;
        let minute = Math.floor(time / 60) % 60;
        let second = time % 60;
        this.timeLabel.string = `Countdown ${day}D ${hour}H ${minute}M ${second}S`;
        this.timeLabel.schedule(
            () => {
                time--;
                if (time <= 0) {
                    this.timeLabel.string = `Countdown 0D 0H 0M 0S`;
                    this.getDailyMission();
                    return;
                }
                let day = Math.floor(time / 86400);
                let hour = Math.floor(time / 3600) % 24;
                let minute = Math.floor(time / 60) % 60;
                let second = time % 60;
                this.timeLabel.string = `Countdown ${day}D ${hour}H ${minute}M ${second}S`;
            },
            1,
            time - 1
        );
    }

    // 排序任务列表：进行中(status=2)在前，完成(status=3)在后，锁定(status=1)位置不变
    private sortDailyMissionList(data: DailyMission[]): DailyMission[] {
        return [...data].sort((a, b) => {
            // 定义状态优先级：进行中(2) > 锁定(1) > 完成(3)
            const getPriority = (status: number): number => {
                switch (status) {
                    case DailyMissionStatus.inProgress:
                        return 0; // 进行中优先级最高
                    case DailyMissionStatus.locked:
                        return 1; // 锁定次之
                    case DailyMissionStatus.completed:
                        return 2; // 完成优先级最低
                    default:
                        return DailyMissionStatus.completed;
                }
            };

            return getPriority(a.status) - getPriority(b.status);
        });
    }

    private onCloseButton() {
        this.addTrackExitDailyMissionn();
        this.close();
    }

    /**
     * 奖励图标点击事件
     * @param data
     */
    private onRichCardHelpClick(data: DailyMission) {
        ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.richCardDescription, data);
    }

    /**
     * 帮助按钮点击事件
     */
    private onHelpButton() {
        ActivityDialogViewMgr.instance.openDialog(ActivityDialogViewID.dailyMissionDescription);
    }

    private addTrackClickMenuDailyMission(data: ResDailyMission) {
        let missionIds = [];
        let rewardtypes = [];
        let rewardquantity = [];
        for (let i = 0; i < data.dailyMissionList.length; i++) {
            missionIds.push(data.dailyMissionList[i].dailyMissionId);
            rewardtypes.push(data.dailyMissionList[i].reward);
            rewardquantity.push(1);
        }
        let eventData = {
            mission_count: data.dailyMissionList.length,
            completed_count: data.dailyMissionList.filter(
                (item) => item.status === DailyMissionStatus.completed
            ).length,
            available_rewards: 0,
            mission_ids: missionIds,
            reward_types: rewardtypes,
            reward_quantity: rewardquantity,
        };
        DataReportMgr.instance.track(DataReporEvents.ClickMenuMission, eventData);
    }
    private addTrackExitDailyMissionn() {
        let eventData = {
            mission_count: this.dailyMissionList.length,
            task_completed_count: this.dailyMissionList.filter(
                (item) => item.status === DailyMissionStatus.completed
            ).length,
        };
        DataReportMgr.instance.track(DataReporEvents.ExitDailyMission, eventData);
    }
}
