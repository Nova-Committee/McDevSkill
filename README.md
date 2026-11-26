# McDevSkill

一套面向 Minecraft 模组开发、排查和验收的 Agent Skills。每个技能用 `SKILL.md` 说明如何判断和行动，相关 `references/lessons/` 提供按需阅读的经验条目。

## 安装

1. 克隆或解压本仓库，找到 `skills/` 中的七个 `mc-*` 目录。
2. 复制整个 `mc-*` 目录，保留 `SKILL.md` 与 `references/` 的相对位置。在 DeepSeek Harness 中，用户级可放到 `$DSH_HOME/skills/`，默认是 `~/.dsh/skills/`。限定在某个项目时，可放到项目根目录的 `.dsh/skills/` 或 `.agents/skills/`。例如，项目级入口应位于 `.agents/skills/mc-discipline/SKILL.md`。安装前检查目标中是否已有同名技能。
3. 在目标项目的会话中确认技能目录能找到 `mc-discipline`，然后让代理加载它，例如「用 `mc-discipline` 排查这个模组在跨版本后打开界面的问题」。其他 Agent Skills 加载器使用它自己的技能目录。

## 技能

| 技能 | 用途 |
| --- | --- |
| [`mc-discipline`](skills/mc-discipline/SKILL.md) | 确认工作边界、项目基线和适用技能。 |
| [`mc-assets`](skills/mc-assets/SKILL.md) | 追踪图标、贴图、模型、动画与实际绘制。 |
| [`mc-data-evolution`](skills/mc-data-evolution/SKILL.md) | 处理数据定义、重载、协议与存档迁移。 |
| [`mc-port-and-integration`](skills/mc-port-and-integration/SKILL.md) | 排查维护分支差异、加载器迁移与联动共存。 |
| [`mc-server-state`](skills/mc-server-state/SKILL.md) | 核对服务端权威状态、会话、交易和维度。 |
| [`mc-ui-runtime`](skills/mc-ui-runtime/SKILL.md) | 排查 GUI、HUD、输入焦点、布局和槽位。 |
| [`mc-verify-change`](skills/mc-verify-change/SKILL.md) | 选择验证方式、标注替代环境并记录证据。 |

项目采用 [MIT 许可证](LICENSE)。变更记录见 [CHANGELOG.md](CHANGELOG.md)。
