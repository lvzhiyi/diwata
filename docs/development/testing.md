# 验证规范

默认验证平台为 `web-mobile`，对应 [Cocos 构建配置](../../buildConfig_web-mobile.json)。

| 范围 | 入口 |
| --- | --- |
| 文档 | `python3 "${CLAUDE_PLUGIN_ROOT}/scripts/check_docs.py" --root . --check-config` |
| 轻量 | `pnpm run lint:check`、`pnpm run check:cocos`，另按改动选受影响用例 |
| 标准与完整 | 运行两项静态检查及 `node --test scripts/tests/*.test.cjs` |
| Web 构建 | `pnpm run build:web`，构建环境与参数待确认 |

静态检查范围见[代码规范](../../RULES.md)。回归覆盖首页、弹窗和记录详情。仓库未发现 CI 配置。

Web 构建脚本依赖本机 Cocos Creator 3.8.5，调用 `sudo`，并在构建前写入环境源码。默认完整检查使用静态检查与回归用例。

在 Codex 中，执行文档检查时将 `CLAUDE_PLUGIN_ROOT` 设为本机安装的 workflow-core 目录。
