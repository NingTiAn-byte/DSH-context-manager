# DSH Context Manager

**查找、选择、压缩和导入对话上下文，让长对话保留真正需要的内容。**

简体中文 · [English](README.en.md)

[下载 v0.1.2](https://github.com/NingTiAn-byte/DSH-context-manager/releases/tag/v0.1.2) · [更新记录](CHANGELOG.md) · [反馈问题](https://github.com/NingTiAn-byte/DSH-context-manager/issues) · [MIT 协议](LICENSE)

这是一个 DeepSeek Harness 插件。在会话的「上下文」标签页中，你可以检查模型正在使用的记录，压缩重复内容，排除过时信息，也能把其他对话中的有用内容加入当前会话。

**先预览，再确认。** 压缩与排除会改变后续模型请求使用的上下文，原始事件日志仍然保留。

![真实 DSH 界面：关键词查找与连续范围高亮](docs/find-context.png)

## 主要功能

| 功能 | 说明 |
|---|---|
| 全文查找 | `Ctrl+F` 搜索当前有效上下文的完整文本，包含预览之外和较早未显示的记录。 |
| 连续范围选择 | 设置起点和终点，整个区间持续高亮；工具调用与结果自动保持配对。 |
| 手动压缩 | 生成摘要预览，编辑后确认应用，可指定需要重点保留的内容。 |
| 排除过时内容 | 用短标记替换指定范围，使原文不再随有效上下文发送，无需调用模型。 |
| 跨对话导入 | 导入其他对话的全部有效文本或连续范围，保留固定来源快照。 |
| 超限压缩 | 导入前检查容量，超限时生成摘要；超长来源支持分块摘要后合并。 |
| 持久化与恢复 | 使用 DSH 原生事件保存，已验证重启恢复和后续实际模型请求。 |

## 安装

已验证 **DeepSeek Harness `0.2.1-rc.2`**；当前插件版本为 **`0.1.2`**。其他宿主版本需要单独验证。

### 安装 Release 包

1. 从 [Release 页面](https://github.com/NingTiAn-byte/DSH-context-manager/releases/tag/v0.1.2) 下载 `ningtian-byte-dsh-context-manager-0.1.2.tgz`。
2. 桌面版使用 DSH 内置插件管理器；独立 CLI / Web 环境可在下载目录执行：

   ```powershell
   dsh plugin --profile web add ".\ningtian-byte-dsh-context-manager-0.1.2.tgz"
   ```

3. 重启或重新加载 DSH，打开已有会话，进入「上下文」。

Release 附带 `SHA256SUMS.txt`。Windows 可用 `Get-FileHash -Algorithm SHA256 <安装包路径>` 核对校验值。桌面版的 `desktop` profile 应由桌面应用管理；上述命令针对独立 `web` profile。插件暂未发布到 npm registry。

### 从源码安装

```powershell
git clone https://github.com/NingTiAn-byte/DSH-context-manager.git
cd DSH-context-manager
npm ci
dsh plugin --profile web add "."
```

源码开发需要 **Node.js 24+**。这是独立插件，无需修改 DSH 核心源码或安装包。

## 使用流程

### 查找 → 选择 → 压缩

1. 等待当前会话结束运行，打开「上下文」，按 **Ctrl+F**；macOS 使用 **Cmd+F**。也可点击页面上的查找按钮。
2. 输入关键词。按字面、不区分大小写匹配，结果以匹配记录计数。使用上下一个按钮，或在查找框内按 `Enter` / `Shift+Enter` 切换记录。
3. 点击「匹配项设为起点」，定位另一条记录后点击「匹配项设为终点」。也可直接使用记录上的起点、终点按钮；更换关键词或关闭查找不会清掉选区。
4. 核对高亮区间，填写「压缩时重点保留」，点击「生成压缩预览」。
5. 编辑摘要，点击「应用摘要」。只有这一步会替换有效上下文。`Esc` 关闭查找。

查找不会过滤掉区间中未命中的记录。选择依据**当前上下文位置**，而非日志编号大小。起点、终点及中间记录都会保持标记；系统提示、开发者消息和运行环境快照受到保护。

### 排除指定范围

选择范围，点击「预览排除」并确认。选区会被一条简短标记替换，不调用模型。它不删除聊天历史，也不等于永久遗忘：相同信息仍可能存在于其他消息、文件或历史搜索结果中。

### 从其他对话导入

1. 点击「从其他对话导入」，按标题、会话 ID 或工作目录搜索来源。
2. 选择全部有效文本，或设置一个连续范围；长列表支持翻页。
3. 查看剩余容量，选择自动、原文或压缩导入预览。
4. 核对来源与内容，必要时编辑摘要，点击「确认加入当前对话」。提交时会重新检查容量。

![真实 DSH 界面：跨对话来源选择与容量检查](docs/cross-session-import.png)

导入的是**固定快照**：源对话不变，后续源对话的编辑或删除也不会改变快照。正文记录来源、捕获位置、选区及是否压缩。

“全部”指有效的直接用户文本、助手文本和已有摘要，不包含系统提示、工具结果、推理内容、已排除范围、图片或其他会话引用。导入内容作为背景资料，不继承来源的旧任务或执行许可；当前版本不提供原始完整日志导入或自动同步。

## 容量、费用与边界

**可用导入预算 = 模型上下文窗口 − 当前请求估算占用 − 回复预留 − 安全余量。**

- 估算包含工具 schema，并可使用已有提供方用量校准。模型未提供窗口容量时拒绝导入。
- 默认回复预留至少 **4096 tokens**；安全余量至少 **2048 tokens**，且不少于窗口的 **2%**。空间不足时，需要先压缩当前对话或缩小范围。
- 当前会话的摘要预览调用一次模型；分块导入压缩可能调用多次。查找、原文导入和排除预览不调用模型。已提交的请求即使取消，也可能产生提供方用量。
- 草稿默认 **15 分钟**有效，仅保存在插件进程内。刷新界面或重启插件后需重新预览；已应用的结果通过原生事件保存。
- 默认来源快照上限 **8 MiB**、单次导入压缩最多 **64 次调用**，共享 **120 秒**时限。超限会明确提示，不静默裁剪原文冒充完整导入。
- 默认最多显示 **2000 个节点**、返回 **1000 条匹配记录**。全文查找仍覆盖全部有效文本，并统计全部匹配记录总数。
- 保存失败可能发生在有效上下文已经改变之后，此时草稿会被锁定，请刷新核对；插件不会自动重复应用。

Token 数字为估算，实际用量以提供方为准。暂不支持完整撤销、任意字符删除或自动重要性判断。可配置字段与更详细的行为说明见 [实现、配置与验证](docs/implementation.md)。

## 开发与验证

```powershell
npm ci
npm run check
npm test
npm pack --pack-destination artifacts
```

当前 **35 项自动测试通过**，覆盖真实 React DOM 操作、异步范围高亮、全文查找、较早窗口定位、压缩/排除、跨对话导入、分块预算、取消、并发、持久化失败及 V4 原生日志关系。

另在真实 DSH `0.2.1-rc.2` 隔离 profile 中验证了正式安装包、重启恢复和实际模型请求。测试使用本地模型适配器，没有使用付费模型，不代表真实模型的摘要质量已经验证。详见 [验证记录](docs/verification.md)。

<details>
<summary>运行隔离环境集成验证</summary>

在仓库根目录，使用对应版本的 DSH CLI 执行：

```powershell
$env:DSH_HOME = Join-Path (Get-Location) "artifacts/manual-test-home"
dsh plugin --profile web add "."
node tests/prepare-runtime.mjs
dsh --patch "./artifacts/runtime.patch.yml" --profile web --no-open --port 64289
```

生成器把本机测试模型路径写入被 Git 忽略的 `artifacts/runtime.patch.yml`。在另一终端将本次启动打印的完整 URL 设为 `DSH_TEST_URL`，再依次执行：

```powershell
node tests/runtime-smoke.mjs
node tests/runtime-import-smoke.mjs
node tests/runtime-find-smoke.mjs
```

停止并以相同 profile 重启后，再次运行脚本验证恢复。测试 profile、模型及运行时依赖不包含在发布安装包中；不要将测试 patch 用于日常 profile。

</details>

## 实现与兼容性

| 模块 | 职责 |
|---|---|
| `client.js` | 会话标签页、快捷键、范围高亮、查找与预览界面，中英文文案 |
| `context.js` | 有效节点与全文查找、工具配对、草稿、原生压缩/排除提交 |
| `imports.js` | 来源只读查询、分页与选区、容量预算、分块摘要和快照追加 |
| `index.js` | 已认证的 Host Fetch 接口、请求限制及同源写入检查 |

有效上下文使用原生压缩、prune、范围替换及 `session-reference` / `recall` 消息保存。可忽略的插件审计记录保留辅助摘要输出和用量，不承担上下文恢复逻辑；当前宿主版本已验证不加载插件也能回放处理后的记录。

宿主需要 `connection`、`sessionController`、`sessionQuery`、`sessions`、`tokenMeter`、`llm` 服务，以及客户端会话视图和语言插槽。其他 DSH 版本及自定义 headless / SDK composition 尚需单独验证。

## 反馈与贡献

欢迎提交 [Issues](https://github.com/NingTiAn-byte/DSH-context-manager/issues) 或 Pull Requests。反馈请注明插件版本、DSH 版本、复现步骤，并提供经过脱敏的截图或日志；不要附带模型密钥或私人聊天内容。

本项目采用 [MIT 协议](LICENSE)。
