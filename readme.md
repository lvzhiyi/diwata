# 目录结构规范

```bash
assets/
├─ basePlate/            # 基础框架
│  ├─ core/              # 基础层代码
│  │  ├─ sentry/          # sentry
│  │  ├─ baseUtil/       # 基础通用工具类只在Xforge中使用
│  │  
│  └─ middleWare/        # 中间层
│     ├─ events/         # 事件系统
│     └─ commonUI/        # UI组件库:数字滚动，背景圆角，进度条，导航栏
│     └─ enums/          # 公共枚举
│     └─ gamemodels/     # 游戏数据模型
│     └─ services/       # 游戏基础接口服务
│
├─ app-appinit/          # 游戏初始化
│  ├─ login/            # 登录模块
│  └─ resource-loader/  # 资源预加载

├─ app-builtin/          # 游戏内置模块
│  ├─ app-admin/        # Xforge配置信息
│  ├─ app-manager/      # 游戏管理器,储存全局的用户变量和数据
│  └─ app-model/        # 游戏数据公共模型
│
├─ app-bundle/           # 可复用业务组件
│  ├─ app-view/         
│  │  ├─ settings/       # 设置模块
│  │  ├─ bet-record/     # 投注记录
│  │  └─ bet-amount/     # 金额选择
│  └─ shared-models/     # 公共数据模型
│
├─ activity/             # 活动系统UI组件
│  
│
└─ common/               # 成就系统的公共类
   ├─ extra/            # 通用工具类包含http 和socket,utils/# 工具类库
       ├─ utils/         # 工具类库,方法如下
       ├─ http/          # http请求
       ├─ socket/
       ├─ tmBrige/       # 跨域通信

```

## 基础层

- **网络通信**
  - HTTP请求模块
  - Socket长连接模块

- **Utils工具类：**

```typescript

  完全业务隔离的通用方~~~~法，以下是项目中可用的方法及其描述：
 ```

  1. **`getGameEnv`**: 
     - 获取游戏的环境类型，根据当前的主机名和构建环境返回相应的环境类型。

  2. **`getApiHost`**: 
     - 获取接口请求的基础 URL，根据传入的环境类型返回相应的基础 URL。

  3. **`getWsHost`**: 
     - 获取 WebSocket 接口请求的基础 URL，根据传入的环境类型返回相应的基础 URL。

  4. **`getUrlParameters`**: 
     - 解析当前 URL 的查询参数，并返回一个键值对对象。

  5. **`copyText`**: 
     - 复制文本到剪贴板，支持现代浏览器的 Clipboard API 和旧浏览器的 `document.execCommand` 方法。

  6. **`delay`**: 
     - 等待指定的毫秒数后 resolve，返回一个 Promise。

  7. **`getRuntimeEnv`**: 
     - 判断当前原型环境是本地开发环境还是线上生产环境，基于 URL 的查询参数和主机名。

  8. **`replaceImageUrlDomain`**: 
     - 将 URL 的 domain 部分替换成指定的 domain URL。

  9. **`getViewportSize`**: 
     - 获取视口的宽高，返回调整后的宽高以适应当前窗口比例。

  10. **`adjustImageUrlFiltersParams`**: 
      - 调整图片 URL 的参数，添加图片处理服务的参数。

  11. **`numberToMoney`**: 
      - 将数字转换为货币格式，支持保留小数点后几位和去掉多余的零。

  12. **`calculateWithBase`**: 
      - 将数字除以或乘以指定基数，默认为 1000。

  13. **`getTimestampsNowAgoMinutes`**: 
      - 获取当前时间以前多少分钟的时间戳。

  14. **`isLargeScreenPhone`**: 
      - 判断当前屏幕是否为大屏手机，基于屏幕的物理尺寸和宽高比。

  15. **`loadResource`**: 
      - 通用的资源加载方法，支持缓存，支持加载单个资源、资源文件夹和预加载资源。

  16. **`checkNetworkQuality`**: 
      - 检查网络质量，返回网络质量为 'slow'（慢）或 'fast'（快）。

  17. **`getNetworkSpeed`**: 
      - 获取网络速度，返回包含速度和加载时间的 Promise 对象。

  18. **`loadBundle`**: 
      - 预加载 bundle，返回一个 Promise。

  19. **`showErrorPop`**: 
      - 显示错误弹窗，支持错误类型、错误信息、服务 URL 以及确认和取消回调。

  20. **`loadRemoteImage`**: 
      - 加载服务器图片，支持成功和失败的回调函数。

## 中间层

- **UI组件库**
  - Toast提示组件
  - 数字滚动组件
  - 加载Loading组件
  - 可复用滚动列表
  - 自定义导航栏
  - 日历选择弹框
  - 性能优化组件（可视区域渲染）

- **事件系统**
  - 全局事件通知管理器

    ```typescript
    GameGlobalEvent.instance.on('AWARD', callback)  // 事件订阅
    GameGlobalEvent.instance.dispatchEvent('AWARD')  // 事件发布
    ```

- **数据管理**
  - 全局用户信息存储
  ```typescript
    app.manager.global.setToken(res.data.token);
  ```
   
  - 游戏基础配置

    ```typescript
    app.manager.global
    ```

- **主站交互**
  - _CpPostMessage管理器
    - 返回首页
     ```typescript
    _CpPostMessage.instance.goHome()
    ```
    - 发送消息
     ```typescript
    _CpPostMessage.instance.sendMessage('')
    ```
## 业务层

- **通用业务组件**
  - 引导页模块
  - 设置页模块
  - 自动投注组件
  - 大奖轮播跑马灯
  - 中奖线切换组件

- **接口实现**

  ```typescript
  // 投注相关接口
  class BetService {
    placeBet(amount: number): Promise<BetResult>
    buyFreeRounds(params: BuyParams): Promise<FreeRound>
    getJackpotInfo(): Promise<JackpotData>
  }
  ```