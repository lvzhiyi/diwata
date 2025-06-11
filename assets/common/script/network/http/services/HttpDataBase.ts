import { ErrorCode } from "./HttpClient";
export class HttpDataBase<T> {
    public isSuccessful: boolean; //是否成功
    public errorCode: ErrorCode; //错误码
    public code: number; //响应码
    public errorMsg: string; //错误信息
    public timestamp: number; //服务器时间戳
    public time: number; //服务器时间戳
    public data: T; //数据
}
