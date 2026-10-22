# 0.1.0 验证记录

## 0.1.2 连续高亮与 Ctrl+F（2026-10-22）

- 起点/终点和区间中的全部记录立即高亮；异步校验等待期间保留所选范围，工具组扩展后采用服务端确认的完整 seqs。导入面板按位置持续标记区间，跨页保留边界。
- `Ctrl+F` / `Cmd+F` 打开当前有效上下文全文查找，支持字面、不区分大小写、匹配记录导航、关键词高亮、通过匹配项设定边界。查找不调用模型，也不写入会话。
- 查找扫描预览之外的完整文本和未展示的较早记录，定位时读取该节点附近的上下文窗口；不搜索已经替换的原始历史。
- `npm run check` 与 `npm test` 通过，**35 项测试通过**。新增回归覆盖延迟响应时持续标记、区间中间节点、压缩后 seq 非单调、关键词切换保留选区、早期窗口定位、快捷键仅在视图可见时生效、字面特殊符号和搜索结果上限。
- 真实 DSH 隔离 profile `artifacts/test-home-find`：Ctrl+F 查找第 2 轮作为起点，查找助手回复并定位第 3 条作为终点；四条记录持续显示「已选择」，起点和终点标记同时保留。手动生成摘要并应用，选区约 980 → 27 tokens，当前请求约 2445 → 1492 tokens。
- 接入宿主的 composer overlay 布局约定，使查找栏在插件自己的滚动区域内固定显示，侧栏避开查找栏，底部预留输入框高度。截图为 `find-context.png` 与 `find-context-applied.png`。
- `artifacts/ningtian-byte-dsh-context-manager-0.1.2.tgz` 已通过独立 `artifacts/package-home-find` profile 正式安装与加载。实际请求检查覆盖原有压缩、排除、跨会话导入，以及全文查找 → 手动压缩 → 下一次模型请求不携带被压缩原文。
- 停止并重启安装包 profile 后再次通过查找/导入检查：原文日志保留，已压缩原文不重新成为有效匹配，导入快照恢复正常。机器结果为 `runtime-find-result.json` 和 `runtime-import-result.json`。

以下保留较早版本的验证记录。

## 0.1.1 跨会话导入更新（2026-10-22）

在原插件中增加来源列表与搜索、只读有效文本投影、分页浏览、全部/连续范围、预算计算、自动/原文/压缩三种预览、分块摘要和合并以及确认写入。

- `npm run check` 通过；`npm test` **29 项通过**。真实 React DOM 测试同时执行原有压缩/排除、其他会话部分原文导入、部分摘要导入。
- 分块测试逐次核对请求输入、输出预留和安全余量，并拼回首轮全部输入，确认没有截掉来源尾部。
- 原生 V4 关系验证和无插件 Session 回放覆盖原文、摘要导入。快照在来源变化/不可读取后仍能应用；目标增长后超出容量会拒绝提交。
- 独立 `artifacts/test-home-import` web profile 通过正式 CLI 安装本地插件，运行实际会话与本地测试模型，成功执行全部原文导入和部分压缩导入。
- 使用真实 `SessionPersistence` 读取日志，重启 DSH 后重新打开会话，再发出测试请求；模型适配器实际收到持久化的引用快照，源会话修订保持不变。
- 真实界面完成来源选择、压缩预览与确认导入，截图为 `cross-session-import.png`。机器结果为 `runtime-import-result.json`。
- 构建 `artifacts/ningtian-byte-dsh-context-manager-0.1.1.tgz`，包含 15 个发布文件；没有打入测试 profile、测试模型或依赖目录。
- 在独立 `artifacts/package-home-import` profile 安装该 tgz，正式 Loader 加载成功；同样通过原有压缩/排除及原文/压缩导入的实际请求、落盘检查。

以下保留 0.1.0 的原始验证记录。

环境：Windows，DeepSeek Harness 0.2.1-rc.2，本地 Node 25.2.1。

## 自动测试

执行 `npm run check` 与 `npm test`。测试覆盖独立业务模块、Host Fetch 路由、真实 React DOM 的选区/预览/应用/排除流程。使用 DSH 0.2.1-rc.2 公开的 V4 原生日志关系校验器分别验证摘要和排除事件。

## 真实 DSH profile

在本项目 `artifacts/test-home-v2` 中创建独立 web profile，通过正常 `dsh plugin --profile web add` 安装插件，再通过 `dsh --patch ... --profile web --no-open` 启动。测试使用本地 mock 模型，未配置或调用真实模型 API Key。

验证过程：

1. 正常 Loader 装配 Host 插件和客户端模块，会话中出现「上下文」标签。
2. 页面中选择第二轮的两条记录，生成摘要预览，再应用。
3. 选择第三轮两条记录，预览排除并应用。
4. 确认原始会话事件保留，当前有效上下文使用摘要和排除标记。
5. 使用实际 SessionPersistence 读取已写入的原生日志。
6. 停止并重新启动 DSH 进程，重新打开同一持久化会话。
7. 再发送一条测试输入，在模型适配器处检查实际请求：不包含第二、第三轮的原始选区文本；它们仍存在于原始事件日志中。

相应断言通过，最近一次机器结果保存在 `runtime-smoke-result.json`。`context-manager.png` 为真实 DSH 页面截图，使用隔离测试数据。

## 范围

没有修改 DeepSeek Harness 源码、安装包或日常 profile。测试 profile、生成数据和模型插件位于本项目的测试目录。测试不能证明真实模型的摘要质量或提供方计费准确性；其他 DSH 版本仍需兼容性验证。
