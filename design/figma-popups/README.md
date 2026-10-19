# 通用弹窗换肤

设计来源：[Figma / 11](https://www.figma.com/design/veKhCFadXm5yGRmi19d00S/11?node-id=0-1)。

已将蓝色标题栏、白色面板、浅蓝输入框、按钮和图标接入以下弹窗及其嵌套 prefab：

- Tips：`error-pop/PopErrorPop`。
- Settings：`settings/PopSettings`，包含菜单、SFX/BGM 和音量控件。
- AutoSpin Setting：`autosetting/PopAutosetting`，包含选中态和关闭按钮。
- Buy Bonus：`buybonus/PopBuybonus` / `FreeModal`，保留原购买回调与金额计算。
- Bet Amount：`betamout/PopBetamout`，保留原 18 档金额及选中逻辑。
- Bet Record：`betrecord/PopBetrecord`，标题修正为 Bet Record。
- Bet Record Detail：`betrecorddetail/PopBetrecorddetail`。

实际 prefab 位于 `assets/app-bundle/app-view/pop/`。皮肤资源独立放在 `assets/resources/skins/tropical-popups/`，没有覆盖其他界面的共享图片。记录和详情页使用专用导航栏 prefab，避免修改其他页面的通用 NavBar。

`original/` 保留 Figma 原始 PNG；`manifest.json` 记录原始资源尺寸及校验值；`skin-map.json` 记录切图与 Cocos 资源的对应关系。整屏参考图包含游戏背景，仅作对照，不作为弹窗贴图。

## 适配边界

- Figma 的 Game Details 画板只有游戏画面，没有记录详情弹窗，因此详情页保留原数据布局，应用已确认的蓝白配色、卡片和导航样式。
- 项目没有震动设置和震动业务实现，Settings 未增加不可用的震动开关；相应收紧了面板高度。
- 记录页保留原有全屏高度适配、分页、日期查询、记录跳转与复制入口。
- 原金色文字渐变组件在本次弹窗中已停用，避免覆盖新文字颜色或访问未生成的渲染数据。

## 验证

```sh
node --test scripts/tests/popup-skin.test.cjs
npm run check:cocos
```

7 项回归检查通过，覆盖 Auto Set 禁用状态、日期筛选文字、投注金额选中态、自动旋转选中态、动态富文本对比度、维护公告内联文字颜色及长文本自适应布局。Cocos 规范检查通过。修改的 TypeScript 文件 ESLint 无错误，存在 9 个原有未使用变量/参数警告。

已在 Cocos Creator 3.8.5 中逐个打开七类弹窗检查实际渲染。结构校验覆盖 24 个 prefab、40 张已导入纹理和 16 个原有按钮回调，未发现无效本地引用或业务绑定改动。金额列表、历史记录及详情数据仍由原运行逻辑生成。

编辑器原生启动的 Chrome 预览已加载到开屏页；工具自动导航或刷新本地预览仍返回 `ERR_BLOCKED_BY_CLIENT`，完整交互联调尚未完成。编辑器启动还会报告原 Spine 缓存 `library/e8` 的权限错误。未执行真实下注、购买或自动旋转。

代码复核发现的 Tips 长文本布局和维护时间文字对比度问题已修复；复核未发现剩余可确认的 P1/P2 问题。

## 编辑器场景备份

验证时编辑器已有未保存的主场景，为保护其内容，先另存副本，现保留在 `editor-backup/main-before-popup-verification.scene`，原始 `assets/app-scene/main.scene` 未修改。备份放在 `assets` 外，不参与游戏打包；需要恢复时可将备份场景及其 `.meta` 复制到项目资源目录后打开。
