# 贡献指南

本仓库收录 Minecraft 模组开发、排查与验收的经验。内容分两层：`skills/<name>/SKILL.md` 是流程，`skills/<name>/references/lessons/*.md` 是经验条目。两者用途不同，改法也不同。

先看你要做什么，再读对应小节。

| 你要做的事 | 看哪节 |
| --- | --- |
| 修正或补充一条已有经验 | [改经验](#改经验) |
| 加一条新经验 | [加经验](#加经验) |
| 加一个新技能 | [加技能](#加技能) |

三条都对[内容红线](#内容红线)生效，提交前必须跑一遍扫描。

## 改经验

经验文件按固定五段组织，一段都不能少：

```markdown
## 一句话说清这条经验解决什么问题

- **适用条件** 什么情况下这条经验成立
- **观察到的现象** 会看到什么，包括容易误判的现象
- **判断依据** 靠什么区分原因，查哪里
- **做法** 具体怎么做
- **反例/坑** 什么做法会失败，为什么
```

改的时候：

- 只改受影响的那一段或那一节，不顺手重写同文件的其他条目。
- 「适用条件」写触发前提，不写背景故事。「反例/坑」写会造成错误结论的具体做法，不写「注意谨慎」这类空话。
- 涉及版本差异时，写判断条件而不是版本号。写「当该 setter 委托给全服对象时」，不写「在某版本某构建上」——读者要用自己的版本套。
- 用语按第二人称指导（「你要核对…」「你可以先…」），不写「我在某个项目里发现…」。

## 加经验

**不要新建文件。** 每个技能只有一个 `references/lessons/` 文件（`mc-server-state` 有两个，因为主题分得开：出生与重生、会话与施工），`SKILL.md` 末尾链向它们。加新文件会脱离这条引用链，读的人找不到。

在对应的 lessons 文件末尾追加一节，标题写清这条经验解决什么问题，然后按上面五段填。

选文件看主题而不是看项目：跨分支传播、第三方共存归 `mc-port-and-integration`；服务端权威状态归 `mc-server-state`；证据分层、替代环境归 `mc-verify-change`。不确定就按「这条经验在什么时候必须被想起来」来选，选完在 `SKILL.md` 对应小节补一句指向。

## 加技能

新技能是一个目录 `skills/<name>/`，至少要 `SKILL.md`，需要经验资料时加 `references/lessons/`。

硬性要求：

1. **目录名即技能名**，只用小写字母、数字、连字符（`^[a-z0-9]+(-[a-z0-9]+)*$`）。frontmatter 里的 `name` 必须与目录名完全一致。
2. **frontmatter 两个字段都是必填**：`name` 和 `description`。
3. **`description` 写「什么时候该读它」，一到两句话**。这句话会常驻模型上下文、每个会话都计入，所以要写触发条件，不要写功能清单，也不要写「本技能包含…」。控制在 100 字以内。
4. **正文是流程，不是案例**。判断依据、检查项、取舍原则放正文；具体数值、历史结论、某个项目的具体类名放 `references/lessons/`。
5. **在 `mc-discipline` 的路由表加一行**。`mc-discipline` 是入口技能，其他技能靠它的表被发现。不加这一行，新技能等于不存在。
6. **不要拆得过细**。每个技能对应一个独立的失败域。合并两个不同失败域会让上下文变长、选择变模糊；拆出只服务单一场景的技能则会增加常驻成本。

写完后自查：把这条技能的 `description` 单独拿出来看，能否在不读正文的情况下判断「我该不该用它」。判断不了就重写。

## 内容红线

本仓库是通用经验库，不承载任何具体项目的身份信息。原因很直接：带上项目身份，经验就只在那个项目里成立；剥掉身份，读者才能套到自己的版本上。

**不能出现**：

| 类别 | 例子 | 为什么 |
| --- | --- | --- |
| 具体项目名 | 模组名、内部项目名、组织名 | 经验要跨项目成立 |
| 私有类名与包路径 | 内部实现类、`a.b.c` 形式包路径 | 泄露结构，且无法被读者核对 |
| 仓库与 PR/Issue 链接 | `github.com/...`、`pull/`、`issues/` | 外部读者看不到或无权访问 |
| 第三方模组名 | 特定联动模组、界面框架、模型工具 | 改成能力描述（「某能量 API」「第三方界面框架」）更可迁移 |
| 固定构建号 | `21.1.234`、`2.2.41` 这类 | 版本会过期，判断条件不会 |

**可以出现**：Minecraft 与加载器自身的公开 API 名（如 `ServerLevel.setRespawnData`、`IMixinConfigPlugin`）、协议与文件格式名、通用术语。这些是知识，不是项目身份。

判断方法：换一家公司、换一个模组，这条经验还成立吗？成立就写，只在原项目成立就不写。

### 提交前跑这个扫描

在仓库根目录执行，四条都应输出 0：

```bash
grep -rnIE "Avaritia|HarvestFestival|RuneForge|SAOMenu|AIBuilder|Mekanism|Pixelmon|LDLib2|Apricity|GeckoLib|Blockbench" skills --include='*.md' | wc -l
grep -rnIE "github\.com|pull/|issues/|https?://" skills --include='*.md' | wc -l
grep -rnIE "CreatorDraft|CreatorSurface|CreatorWorkspace|FarmHudController|NpcVisitService|RtsPlacement|RtsGhostMesh|RtsOverheadCamera|BlueprintGeometry|NpcDialoguePortrait" skills --include='*.md' | wc -l
grep -rnE "\b2[0-9]\.[0-9]+\.[0-9]+|\b1\.(1[0-9]|2[0-9])\.[0-9]+" skills --include='*.md' | wc -l
```

前三条是已知的具体名字，第四条挡构建号。新增了需要屏蔽的专名时，把它加进对应模式的末尾，不要删掉已有条目。

### 结构自查

```bash
# 每个技能名与目录名一致，且 frontmatter 有 name 与 description
for d in skills/*/; do n=$(basename "$d"); head -5 "$d/SKILL.md" | grep -q "^name: $n$" || echo "name 不符: $n"; head -5 "$d/SKILL.md" | grep -q "^description: " || echo "缺 description: $n"; done

# SKILL.md 里引用的 lessons 路径都存在
for f in skills/*/SKILL.md; do d=$(dirname "$f"); grep -o 'references/lessons/[a-z0-9.-]*\.md' "$f" | while read -r l; do [ -f "$d/$l" ] || echo "断链: $f -> $l"; done; done
```

两条都应无输出。

## 提交与审核

- 一个提交做一件事：改一条经验、加一个技能、修一处断链分别提交，不要混在一起。
- 提交说明写清改了什么、为什么改。修正一条错误经验时，说明原来错在哪会造成什么误判。
- 从 fork 开分支提 PR。不接受直接推主干。
- 审核看三件事：经验是否可迁移（无项目身份）、五段结构是否齐、是否已在路由表暴露。内容正确但结构不全的会被要求补齐，不会直接合并。

## 许可

提交即表示同意以本仓库的 [MIT 许可证](LICENSE) 分发你的贡献。