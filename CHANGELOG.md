# Changelog / 更新记录

## 0.1.2 — 2026-10-22

首次公开发布，包含先前本地版本的全部功能。

- 修复连续范围高亮，覆盖异步校验、非单调序号和导入来源分页。
- 新增 Ctrl+F / Cmd+F 全文查找、匹配导航与关键词高亮，支持通过匹配项选择范围后手动压缩。
- 全文查找覆盖预览之外和未显示的有效记录，不重新纳入已排除的原始历史。
- 改进滚动区域、查找栏、侧栏和底部输入框的布局。
- 提供中文和英文 README、版本安装包和 SHA-256 校验文件。
- 35 项自动测试及真实 DSH 0.2.1-rc.2 安装包、持久化、重启与实际请求检查通过。

First public release, including all features from earlier local versions.

- Fixed continuous range highlighting during validation, after compaction, and across import pages.
- Added Ctrl+F / Cmd+F full-text find, match navigation, keyword highlights, and manual summary selection from matches.
- Search covers full active text beyond previews and visible windows; excluded raw history stays excluded.
- Improved scrolling, find-bar and sidebar placement, and composer clearance.
- Added Chinese and English READMEs, a release package, and SHA-256 checksums.
- Passed 35 automated tests and real DSH 0.2.1-rc.2 package, persistence, restart, and actual-request checks.

## 0.1.1 — Local version / 本地版本

- 跨对话全部有效文本或连续范围导入，来源搜索、分页和固定快照。
- 原文、压缩及自动导入预览；容量预算、分块摘要与合并。
- Added source search, paginated ranges, and fixed cross-conversation snapshots.
- Added original, compressed, and automatic import previews, capacity checks, and chunk/merge summaries.

## 0.1.0 — Local version / 本地版本

- 当前有效上下文查看、连续选区、可编辑摘要预览和无需模型的范围排除。
- 空闲维护提交、原始日志保留与原生持久化。
- Added active-context inspection, range selection, editable summary previews, and model-free exclusion.
- Added idle maintenance commits, original-log retention, and native persistence.
