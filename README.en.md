# DSH Context Manager

**Find, select, summarize, and import conversation context in DeepSeek Harness.**

[简体中文](README.md) · English

[Download v0.1.2](https://github.com/NingTiAn-byte/DSH-context-manager/releases/tag/v0.1.2) · [Changelog](CHANGELOG.md) · [Report an issue](https://github.com/NingTiAn-byte/DSH-context-manager/issues) · [MIT license](LICENSE)

Long conversations accumulate useful decisions, repeated explanations, and outdated details. This plugin adds a **Context** tab to DSH so you can inspect the records the model uses, summarize or exclude a chosen range, and bring useful material from another conversation into the current one.

**Preview first, apply when ready.** Summarizing and excluding change what future model requests contain; original event records remain in the session log.

![Actual DSH interface: keyword search and continuous range highlighting; Chinese locale shown](docs/find-context.png)

## Features

| Feature | What it does |
|---|---|
| Full-text find | Search with `Ctrl+F`, including text beyond previews and earlier records outside the visible window. |
| Continuous selection | Set a start and end; the entire interval stays highlighted. Tool calls and results remain paired. |
| Manual summarization | Generate a preview, edit the summary, and apply it. Optional focus instructions guide what to preserve. |
| Context exclusion | Replace an outdated range with a short marker without calling a model. |
| Cross-conversation import | Import all active conversation text or a continuous range as a fixed source snapshot. |
| Capacity checks | Estimate the import budget, compress when needed, and summarize long sources in chunks before merging. |
| Durable changes | Save through native DSH events, with verified restart recovery and subsequent model requests. |

## Installation

Verified host: **DeepSeek Harness `0.2.1-rc.2`**. Plugin version: **`0.1.2`**. Other host versions require separate validation.

### Install a release package

1. Download `ningtian-byte-dsh-context-manager-0.1.2.tgz` from the [release page](https://github.com/NingTiAn-byte/DSH-context-manager/releases/tag/v0.1.2).
2. Use the built-in plugin manager in DSH Desktop. For a standalone CLI / Web setup, run this from the download directory:

   ```powershell
   dsh plugin --profile web add ".\ningtian-byte-dsh-context-manager-0.1.2.tgz"
   ```

3. Restart or reload DSH, open an existing conversation, and select **Context**.

The release includes `SHA256SUMS.txt`. On Windows, compare it with `Get-FileHash -Algorithm SHA256 <package-path>`. Let DSH Desktop manage its reserved `desktop` profile; the command above targets a standalone `web` profile. The plugin is not currently published to the npm registry.

### Install from source

```powershell
git clone https://github.com/NingTiAn-byte/DSH-context-manager.git
cd DSH-context-manager
npm ci
dsh plugin --profile web add "."
```

Source development requires **Node.js 24+**. This is a standalone plugin; no changes to DSH core or its installation are required.

## Workflows

### Find → select → summarize

1. Wait for the current turn to finish, open **Context**, and press **Ctrl+F**; use **Cmd+F** on macOS. A find button is also available.
2. Enter a keyword. Matching is literal and case-insensitive; results count matching records. Use the navigation buttons, or `Enter` / `Shift+Enter` while the find field is focused.
3. Choose **Use match as start**, locate another record, and choose **Use match as end**. Each record also has start/end buttons. Changing the keyword or closing find preserves the selection.
4. Check the highlighted interval, optionally enter what the summary should preserve, and choose **Preview summary**.
5. Edit the draft and choose **Apply summary**. Only this final step replaces active context. Press `Esc` to close find.

Search does not filter unmatched records out of the interval. Selection follows **active context order**, not numeric log sequence order. Start, end, and intermediate records stay marked. System prompts, developer messages, and runtime snapshots are protected.

### Exclude a range

Select a range, preview exclusion, and apply it. The plugin replaces the range with a short marker without calling a model. This does not delete chat history or guarantee permanent forgetting: the same information may still exist in other messages, files, or history search results.

### Import another conversation

1. Select **Import from another conversation**, then search by title, session ID, or working directory.
2. Choose all active text or a continuous range. Long source lists support pagination.
3. Review available capacity and choose automatic, original, or compressed import preview.
4. Check the source and content, edit a compressed summary if needed, and confirm import. Capacity is checked again when applying.

![Actual DSH source selection and capacity check; Chinese locale shown](docs/cross-session-import.png)

An import is a **fixed snapshot**. It does not modify the source and does not change when the source is later edited or deleted. Imported content records its source, capture position, selected range, and compression status.

“All” means active direct user text, assistant text, and existing checkpoints. It excludes system prompts, tool results, reasoning, excluded ranges, images, and nested conversation references. Imported history is background material and does not inherit old tasks or execution permissions. Raw-log import and automatic synchronization are not available in this version.

## Capacity, model usage, and limits

**Import budget = context window − estimated current request size − output reserve − safety margin.**

- Estimation includes tool schemas and can use existing provider usage for calibration. Imports are refused when model capacity is unknown.
- The default output reserve is at least **4,096 tokens**. Safety reserves at least **2,048 tokens** and at least **2%** of the window. If space runs out, compact the current conversation or select less source content.
- A summary preview for the current conversation makes one model request. Chunked import compression may make several requests. Find, original import, and exclusion previews do not call a model. Cancelling an already submitted request may still incur usage.
- Drafts expire after **15 minutes** by default and live in plugin process memory. Reloading the view or restarting the plugin requires a new preview; applied edits persist through native events.
- The source snapshot limit is **8 MiB** by default. Import compression allows up to **64 model calls** within a shared **120-second** deadline. Oversized originals are not silently truncated and presented as complete imports.
- A window shows up to **2,000 nodes**, and find returns up to **1,000 matching records** by default. Search still scans complete active text and counts all matching records.
- Persistence can fail after active context has changed. The draft is then locked; refresh and inspect the result. The plugin does not automatically repeat the edit.

Token counts are estimates; provider usage is authoritative. Full undo, arbitrary character deletion, and automatic importance ranking are not supported. The [implementation and configuration guide](docs/implementation.md), currently in Chinese, lists all configurable limits and detailed behavior.

## Development and verification

```powershell
npm ci
npm run check
npm test
npm pack --pack-destination artifacts
```

The current suite has **35 passing tests**, covering real React DOM interaction, delayed selection responses, full-text find, earlier windows, summaries, exclusion, imports, chunk budgets, cancellation, concurrency, persistence failures, and native V4 log relationships.

Release-package loading, restart recovery, and actual model requests were also checked in isolated DSH `0.2.1-rc.2` profiles. Tests use a local model adapter, not paid providers; they do not establish real-model summary quality. See the [verification log](docs/verification.md), currently in Chinese.

<details>
<summary>Run isolated integration checks</summary>

From the repository root, using the verified DSH CLI version:

```powershell
$env:DSH_HOME = Join-Path (Get-Location) "artifacts/manual-test-home"
dsh plugin --profile web add "."
node tests/prepare-runtime.mjs
dsh --patch "./artifacts/runtime.patch.yml" --profile web --no-open --port 64289
```

The generator writes a machine-specific fixture path to the ignored `artifacts/runtime.patch.yml`. In another terminal, set `DSH_TEST_URL` to the complete local URL printed by this launch, then run:

```powershell
node tests/runtime-smoke.mjs
node tests/runtime-import-smoke.mjs
node tests/runtime-find-smoke.mjs
```

Stop and restart with the same profile, then repeat the scripts to check recovery. Test profiles, model fixtures, and runtime dependencies are excluded from the release package. Do not use the test patch in a daily-use profile.

</details>

## Implementation and compatibility

| Module | Responsibility |
|---|---|
| `client.js` | Conversation tab, shortcuts, range highlighting, find and preview UI, Chinese and English strings |
| `context.js` | Active nodes, full-text find, tool pairing, drafts, and native summary/exclusion commits |
| `imports.js` | Read-only sources, pagination and ranges, capacity budgets, chunk summaries, and snapshot appends |
| `index.js` | Authenticated Host Fetch API, request limits, and same-origin write checks |

Active context uses native compaction, prune, surface replacement, and `session-reference` / `recall` messages. Ignorable audit records retain auxiliary summary output and usage; restoring active context does not depend on them. Replay without loading the plugin has been verified for the current host version.

The host must provide `connection`, `sessionController`, `sessionQuery`, `sessions`, `tokenMeter`, and `llm`, plus client conversation-view and locale slots. Other DSH versions and custom headless / SDK compositions require separate validation.

## Feedback and contributions

Use [Issues](https://github.com/NingTiAn-byte/DSH-context-manager/issues) or Pull Requests for bugs and suggestions. Include plugin and DSH versions, reproduction steps, and sanitized screenshots or logs. Do not attach model credentials or private conversations.

Licensed under [MIT](LICENSE).
