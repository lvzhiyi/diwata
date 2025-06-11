import { ResTrackEvent } from "../network/http/HttpDataModels/ResTrackEvent";
import { PackageFacade, ReportData } from "../PackageFacade";
// import { LogMgr } from "db://assets/scripts/components/LogMgr";
import { ActivityDataMgr } from "../data/ActivityDataMgr";
import pako from "pako";

/** 上报数据格式 */
export interface IReportData {
    player_id: string; //cp站的player_id，游戏拿不到，默认为""
    player_name: string; //用户名称
    game_id: string; //标识游戏id
    game_ver: string; //标识游戏版本
    event: string; //事件名称
    timestamp: number; //上报时间（毫秒级时间戳)
    abtest: Object; //ab实验信息
    data: Object; //上报数据
}

/** 埋点上报 */
export class DataReportMgr {
    private static _inst: DataReportMgr;
    public static get instance(): DataReportMgr {
        if (this._inst == null) {
            this._inst = new DataReportMgr();
        }
        return this._inst;
    }

    constructor() {}

    /**
     * 压缩字符串,需要先安装pako库
     * @param str
     * @returns
     */
    private compressString(str: string) {
        try {
            if (!pako || typeof pako.gzip !== "function") {
                PackageFacade.instance.error(
                    "Missing dependency: pako. Please install it using npm install pako"
                );
                return "";
            }
            const inputBuffer = new TextEncoder().encode(str);
            const compressedBuffer = pako.gzip(inputBuffer);
            return compressedBuffer;
        } catch (err) {
            PackageFacade.instance.error("Compression failed: ", err);
            return "";
        }
    }

    /**
     * 上报数据
     * @param event 事件名称
     * @param data 数据
     */
    public track(event: string, data?: Object) {
        if (!event) return;
        const reportBaseData: ReportData = ActivityDataMgr.instance.getReportData();
        if (reportBaseData == null) {
            PackageFacade.instance.error("DataReportMgr.track error => reportBaseData is null");
            return;
        }
        const reportData: IReportData = {
            player_id: reportBaseData.playerId ?? "",
            player_name: reportBaseData.playerName ?? "",
            game_id: reportBaseData.gameId ?? "",
            game_ver: reportBaseData.gameVer ?? "",
            event: event,
            timestamp: ActivityDataMgr.instance.getTimestamp(),
            abtest: reportBaseData.abTestData ?? {},
            data: data ?? {},
        };
        PackageFacade.instance.log("trackEvent reportData => ", reportData);
        const compressStr = this.compressString(JSON.stringify(reportData));
        if (!compressStr) {
            PackageFacade.instance.error("Error: sendTrackRequest report data is empty");
            return;
        }
        const blobData = new Blob([compressStr], { type: "text/plain" });

        //埋点系统返回数据格式不一致，不走HttpClient
        const headers = {
            "Content-Type": "text/plain",
        };
        fetch(reportBaseData.reportUrl, {
            method: "POST",
            headers: headers,
            body: blobData,
        })
            .then((response) => response.json())
            .then((data: ResTrackEvent) => {
                if (data.status == 1) {
                    PackageFacade.instance.log(
                        `trackEvent:[${event}] Success! status:`,
                        data.status
                    );
                } else {
                    PackageFacade.instance.log(`trackEvent:[${event}] error:`, data);
                }
            })
            .catch((error) => PackageFacade.instance.error("track Event Error:", error));
    }
}
