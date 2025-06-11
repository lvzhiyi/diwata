export interface ResDailyMission {
    playerName: string;
    refId: string;
    pId: string;
    channelId: string;
    tierName: string;
    tierId: string;
    tierValue: number;
    refreshTime: string;
    dailyMissionList: Array<DailyMission>
    timestamp: number; // 当前服务器时间戳
}

export interface DailyMission {
    dailyMissionId: string;
    target: number;
    reward: string;
    status: number;
    iconUrl: string;
    description: string;
    experience: number;
    starLevel: number;
    rewardConfigId: string;
}