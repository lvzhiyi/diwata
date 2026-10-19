# 快速换肤扩展 (skin-switch)

Cocos Creator 3.8.5 编辑器扩展，用于 Slots 项目的 UI 换肤工作流。

## 功能

### 导出资源

- 扫描 `assets/` 下 UI 图片、Spine 动效、字体/艺术字
- 默认排除 `activity/`、`common/` 子模块
- 生成 **两套目录**：`export-ui/`（给 UI 团队）+ `default/`（程序映射）

### 导出目录结构

```text
skin-export/
├── export-ui/              # ★ UI 团队在此换图（仅 3 个大类，层级浅）
│   ├── image/
│   │   ├── pop-settings/
│   │   │   └── setting.png
│   │   └── resources-symbols/
│   │       └── 1001.png
│   ├── spine/
│   │   └── resources-animations/
│   │       └── symbol_Rsd.skel
│   └── font/
│       └── resources-prize/
│           ├── prize-number.fnt
│           └── prize-number.png
├── default/                # 与 assets 一致的完整路径（程序内部）
│   ├── images/
│   ├── spine/
│   └── fonts/
├── export-ui-map.json      # export-ui ↔ default 路径映射
├── manifest.json           # 写回项目用的资源清单
└── README.md
```

### UI 换图（外部）

在 **`export-ui/`** 的 `image`、`spine`、`font` 三类目录中换图，保持 **模块文件夹名** 与 **文件名** 不变。

### 替换写回项目

1. 将换好后的资源放在 `skin-export/export-ui/`
2. 点击 **替换资源**
3. 插件自动：`export-ui` → `default` → 写回 `assets/` → `reimport`

## 安装与使用

```bash
cd extensions/skin-switch && npm install && npm run build
```

在 Cocos Creator 中启用并重载扩展 **skin-switch**，使用换肤面板或菜单操作。

## 开发

```bash
npm run watch
```
