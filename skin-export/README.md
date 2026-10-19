# 换肤资源导出包

导出时间：2026-10-13T14:51:01.449Z

## 目录结构

### 给 UI 团队换图（推荐）

- `export-ui/image/`：静态 UI 图片（扁平层级：模块/文件名）
- `export-ui/spine/`：Spine 动效
- `export-ui/font/`：字体与艺术字

### 程序内部映射

- `default/images/`、`default/spine/`、`default/fonts/`：与 assets 一致的完整路径
- `export-ui-map.json`：export-ui 与 default 路径映射
- `manifest.json`：写回项目用的资源清单

## 统计

- 图片：187
- Spine 组：7
- Spine 文件：150
- 字体组：7
- 字体文件：24

## 使用说明

1. 将 `export-ui/` 中 image、spine、font 三类资源交给 UI 换图
2. 换图后保持 export-ui 内文件名与模块文件夹不变
3. 使用插件「替换资源」：自动将 export-ui 同步到 default 再写回项目
