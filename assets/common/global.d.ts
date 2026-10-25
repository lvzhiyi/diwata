// 定义通用的 API 响应结构
declare interface ApiResponse<T> {
  code: string;
  msg: string;
  success: boolean;
  data: T;
  time?: number;
}
