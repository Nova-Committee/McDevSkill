# McTestHarness

本目录提供可选的 Calcite CLI 入口和 MCP stdio 过滤器。先准备隔离的测试专服、可用的图形环境及目标游戏所需的 JDK。请用受信的本地模组 JAR 与离线测试身份。若当前 Calcite 把离线账号的渲染限制在 Linux 虚拟显示上，请用具备 Xvfb 和上游所需图形库的 Linux 环境取证。实际截图用来确认渲染可用。

## 安装依赖

1. 在技能目录外安装符合 `@bkm016/calcite` 要求的 Node.js 和 npm。用 `npm i -g @bkm016/calcite`，或将包安装到技能路径的、可由 Node 解析的上级依赖目录。
2. 全局安装时，把 `CALCITE_CLI` 设为包内实际 CLI 文件。POSIX shell 可执行 `export CALCITE_CLI="$(npm root -g)/@bkm016/calcite/dist/cli.js"`。PowerShell 可执行 `$env:CALCITE_CLI = Join-Path (npm root -g) '@bkm016/calcite/dist/cli.js'`。如果安装到独立目录，也可以用该目录内的实际 CLI 文件。技能更新会替换技能目录，请把 npm 依赖和运行数据保存到外部。
3. 在本目录运行 `node entry.mjs doctor` 检查依赖和环境。`node entry.mjs version` 显示上游 CLI 版本。

## 准备目标版本

运行 `node entry.mjs install <游戏版本> -l <加载器>@<加载器版本>`。也可用 `CALCITE_MC_VERSION` 和 `CALCITE_LOADER` 设默认值，显式参数优先。预下载时 Java 按 `CALCITE_JAVA_21`、`JAVA_HOME`、`PATH` 查找，前两个变量填写 JDK 根目录。按目标版本设置兼容的 JDK。MCP 启动客户端时由上游按相应游戏版本选择 Java。

`CALCITE_HOME` 可指定外部运行目录，适合隔离实例。只有在安装固定版本的 Forge 或 NeoForge，并且找到匹配的本地官方安装器时，封装才会先运行该安装器。安装器从 `CALCITE_INSTALLERS` 指定的目录，或运行目录下的 `cache/installers` 读取，文件名为 `<加载器>-<加载器版本>-installer.jar`。使用这条可选路径时，按官方安装器要求准备运行目录下的 `minecraft`。代理继承宿主的 `HTTP_PROXY`、`HTTPS_PROXY` 和 `NO_PROXY`。安装器的 Java 代理属性来自同一上游包，接口不可用时会提示并继续。

## 连接 MCP

在 MCP 客户端选择 **stdio**，把命令设为 `node`，参数依次填本目录 `entry.mjs` 的实际绝对路径和 `mcp`。将 `CALCITE_CLI`、`CALCITE_HOME` 及所需的 JDK 环境变量配置到这个 MCP 进程。可按需配置 `CALCITE_MC_VERSION`、`CALCITE_LOADER`、`CALCITE_SERVER`（`host:port`）、`CALCITE_USERNAME` 和 `CALCITE_MODS`（绝对 JAR 路径，以 Unix `:` 或 Windows `;` 分隔）。也可以在启动工具中为每个客户端传版本、加载器、身份和服务端。

连接后从工具列表确认 `launch_client`、`screenshot` 和 `stop_client` 可用。`on-demand` 允许按需截图，`always` 开启连续渲染。固定白名单允许测试操作，微软登录、单机世界、外部探针扩展和禁用渲染不开放。这一层过滤 MCP 请求，运行账户的文件权限和测试服的权限仍由操作者设置。

上游依赖为 `@bkm016/calcite`，作者为 bkm016，采用 MIT 许可证。依赖及其许可文件由 npm 单独安装。
