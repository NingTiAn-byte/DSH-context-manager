window.__ModuleLoader__.load({
  id: '@ningtian-byte/dsh-context-manager',
  factory(require) {
    const React = require('react'), h = React.createElement;
    const NS = 'local.context-manager';
    const zh = {
      title: '上下文', heading: '管理当前会话上下文', subtitle: '选择连续记录，压缩为摘要或从后续上下文排除。原始聊天记录保留。',
      refresh: '刷新', loading: '正在读取上下文…', empty: '当前没有可处理的上下文。',
      usage: '约 {tokens} tokens · {count} 个有效节点', hidden: '仅显示最近 {count} 个节点，较早 {hidden} 个节点未显示。',
      running: '会话正在运行，请在本轮结束后操作。',
      range: '处理范围', rangeHint: '先选起点，再选终点。再次选择起点会重置范围。工具调用与结果会自动保持完整。',
      start: '设为起点', end: '设为终点', selected: '已选择', protected: '系统或运行环境上下文 · 受保护',
      node: '节点 #{seq}', tokens: '约 {tokens} tokens', summaryTag: '已压缩', excludedTag: '已排除',
      user: '用户', assistant: '助手', tool: '工具结果', system: '系统', developer: '开发者',
      noText: '此节点没有文本内容。', truncated: '显示 {shown} / {total} 字符；操作会使用完整内容。',
      selection: '选中 {count} 个节点 · 约 {tokens} tokens', expanded: '已自动扩展范围，保留完整的工具调用和结果。',
      focus: '压缩时重点保留', focusPlaceholder: '例如：保留已经确认的需求、接口约定和待办事项。',
      generate: '生成压缩预览', exclude: '预览排除', generating: '正在生成预览…',
      modelCost: '生成摘要会调用当前会话模型一次并产生相应用量；排除预览不调用模型。',
      draft: '压缩预览', exclusionDraft: '排除预览', editHint: '可编辑摘要。只有点击应用后，原文才会从有效上下文中被替换。',
      exclusionHint: '应用后，选区原文不再随上下文发送，只保留一条简短的排除标记。原始聊天记录仍保留。',
      estimate: '初始预览预计由约 {before} 降为 {after} tokens；编辑后以应用结果为准。',
      apply: '应用摘要', applyExclude: '应用排除', applying: '正在保存…', discard: '放弃预览', cancel: '取消',
      applied: '上下文已更新，后续请求将使用新的内容。', expired: '预览在 {time} 后失效，页面刷新后需要重新生成。',
      changed: '部分操作可能已写入。已锁定本次预览，请刷新查看状态，避免重复应用。',
      'error.busy': '当前会话正在运行或维护，请稍后刷新重试。',
      'error.stale-selection': '选区已被其他操作改写。请刷新后重新选择。',
      'error.draft-expired': '预览已失效，请重新生成。',
      'error.protected-context': '范围包含受保护的系统上下文，请重新选择。',
      'error.not-smaller': '摘要或标记没有减少上下文占用。请进一步缩短摘要或扩大选区。',
      'error.selection-too-large': '选区超过本插件的处理上限，请分段操作。',
      'error.model-unavailable': '当前会话没有可用模型，请先配置并使用模型。',
      'error.session-unavailable': '无法打开当前会话。请确认会话仍然存在且可访问。',
      'error.summary-incomplete': '模型未完整返回摘要，本次预览未应用。请重试或缩小选区。',
      'error.summary-unsupported-output': '摘要包含无法保留的非文本内容，本次预览未应用。',
      'error.invalid-summary': '摘要不能为空或超过允许长度。',
      'error.unbalanced-selection': '选区存在未完成的工具调用，请等待本轮结束后再试。',
      'error.cancelled': '操作已取消或超时，未应用此预览。',
      'error.too-many-drafts': '预览数量已达上限，请放弃不再需要的预览或稍后重试。',
      'error.persistence-failed': '保存未完成，请刷新核对当前状态。',
      'error.commit-failed': '操作未完整结束，请刷新核对当前状态。',
      'error.operation-failed': '操作失败，请刷新后重试。',
    };
    const en = {
      title: 'Context', heading: 'Manage conversation context', subtitle: 'Select consecutive records to summarize or exclude from future requests. Original conversation records are retained.',
      refresh: 'Refresh', loading: 'Reading context…', empty: 'No context is available yet.',
      usage: 'About {tokens} tokens · {count} active nodes', hidden: 'Showing the latest {count} nodes; {hidden} earlier nodes are not displayed.',
      running: 'The conversation is running. Wait for this turn to finish.', range: 'Selection',
      rangeHint: 'Choose a start, then an end. Choosing a new start resets the selection. Tool calls and results are kept together.',
      start: 'Set start', end: 'Set end', selected: 'Selected', protected: 'Protected system context',
      node: 'Node #{seq}', tokens: 'About {tokens} tokens', summaryTag: 'Compacted', excludedTag: 'Excluded',
      user: 'User', assistant: 'Assistant', tool: 'Tool result', system: 'System', developer: 'Developer',
      noText: 'This node has no text.', truncated: 'Showing {shown} / {total} characters; operations use the complete content.',
      selection: '{count} nodes selected · about {tokens} tokens', expanded: 'The selection was expanded to keep tool calls and results together.',
      focus: 'What the summary should preserve', focusPlaceholder: 'For example: confirmed requirements, interface agreements, and pending work.',
      generate: 'Preview summary', exclude: 'Preview exclusion', generating: 'Preparing preview…',
      modelCost: 'A summary preview makes one request to the conversation model and incurs usage. Exclusion previews do not call a model.',
      draft: 'Summary preview', exclusionDraft: 'Exclusion preview', editHint: 'Edit the summary before applying. Original content is replaced in active context only after you apply.',
      exclusionHint: 'The selected original content will be replaced by a short exclusion marker. Original conversation records remain available.',
      estimate: 'Initial preview estimate: about {before} → {after} tokens. Edited text is measured again when applied.',
      apply: 'Apply summary', applyExclude: 'Apply exclusion', applying: 'Saving…', discard: 'Discard preview', cancel: 'Cancel',
      applied: 'Context updated. Future requests will use the new content.', expired: 'Preview expires at {time}. Reloading the page requires a new preview.',
      changed: 'Some changes may have been recorded. This preview is locked. Refresh to inspect the current state before retrying.',
      'error.busy': 'The conversation is running or under maintenance. Refresh and retry later.',
      'error.stale-selection': 'Another operation changed this selection. Refresh and select again.',
      'error.draft-expired': 'This preview expired. Generate another preview.',
      'error.protected-context': 'The range contains protected system context. Select another range.',
      'error.not-smaller': 'The replacement does not reduce context size. Shorten the summary or select a larger range.',
      'error.selection-too-large': 'The selection exceeds the processing limit. Split it into smaller ranges.',
      'error.model-unavailable': 'No model is available for this conversation. Configure and use a model first.',
      'error.session-unavailable': 'This conversation could not be opened. Check that it exists and is accessible.',
      'error.summary-incomplete': 'The model did not complete the summary. This preview was not applied.',
      'error.summary-unsupported-output': 'The summary contains unsupported non-text output. It was not applied.',
      'error.invalid-summary': 'The summary is empty or exceeds its length limit.',
      'error.unbalanced-selection': 'The selection contains an unfinished tool call. Wait for the turn to finish.',
      'error.cancelled': 'The operation was cancelled or timed out. This preview was not applied.',
      'error.too-many-drafts': 'The preview limit was reached. Discard unused previews or retry later.',
      'error.persistence-failed': 'Saving did not complete. Refresh to inspect the current state.',
      'error.commit-failed': 'The operation did not finish cleanly. Refresh to inspect the current state.',
      'error.operation-failed': 'The operation failed. Refresh and retry.',
    };
    Object.assign(zh, {
      rangeStart: '起点', rangeEnd: '终点', findOpen: '查找上下文 · Ctrl+F', findTitle: '查找当前有效上下文', findPlaceholder: '输入关键词查找完整上下文',
      findHint: '查找不会隐藏其他记录。定位匹配项后设置起点、终点，再手动生成压缩预览。',
      findCount: '{current} / {shown} 条匹配记录', findLimit: '共 {total} 条匹配，仅显示前 {shown} 条，请细化关键词。',
      findEmpty: '未找到匹配记录。', findPrevious: '上一个匹配', findNext: '下一个匹配', findClose: '关闭查找',
      findStart: '匹配项设为起点', findEnd: '匹配项设为终点', findSearching: '正在查找…',
      windowHint: '显示 {count} 个节点，前方 {before} 个、后方 {after} 个未显示；Ctrl+F 可查找全部有效上下文。',
      'error.invalid-query': '请输入不超过 256 字符的关键词。',
      importOpen: '从其他对话导入', importClose: '关闭导入', importSearch: '搜索对话', importSearchHint: '按标题、会话 ID 或工作目录搜索',
      importIntro: '导入固定快照，不修改源对话。默认只读取有效用户消息、助手文本和已有摘要，不递归携带其他引用、工具或推理内容。',
      importResults: '找到 {count} 个对话，最多显示 100 个。', importNoSources: '没有找到可导入的其他对话。',
      importSource: '来源：{label}', importAll: '全部有效对话文本', importRange: '指定连续范围', importStart: '导入起点', importEnd: '导入终点',
      importRangeValue: '范围：#{start} → #{end}', importPrevious: '上一页', importNext: '下一页', importPage: '显示 {start}–{end} / {count} 条',
      importBudget: '当前约占 {occupied} / {window} tokens，预留回复 {reserve}、安全余量 {safety}，可导入约 {available} tokens。',
      importSelection: '选中 {count} 条，原文含来源包装约 {tokens} tokens。', importOverBudget: '原文超出容量，自动预览将生成压缩摘要。',
      importAuto: '自动生成导入预览', importOriginal: '预览原文导入', importSummarize: '预览压缩导入',
      importCost: '原文预览不调用模型。压缩可能分块并多次调用当前模型，产生相应用量。',
      importPreview: '导入预览', importPreviewInfo: '来源 {label} · {count} 条 · 捕获位置 #{seq} · 约 {tokens} tokens · 模型调用 {calls} 次',
      importPreviewHint: '确认后才加入当前对话。压缩摘要可以编辑；原文快照保持完整。提交时会重新检查容量。',
      importApply: '确认加入当前对话', importApplied: '来源快照已加入当前上下文。',
      importedTag: '来自：{label}',
      'error.invalid-source': '请选择有效的来源对话。', 'error.self-import': '不能导入当前对话自身。',
      'error.source-unavailable': '来源对话已不存在或无法读取，请重新选择。',
      'error.stale-source': '来源内容已变化，请重新打开来源并选择范围。',
      'error.empty-selection': '来源范围没有可导入的文本。', 'error.invalid-selection': '请选择正确的连续范围。',
      'error.capacity-unknown': '当前模型未提供上下文容量，无法安全计算导入预算。',
      'error.import-too-large': '来源超过导入处理上限，当前默认上限为 8 MiB。',
      'error.import-budget-insufficient': '当前剩余容量不足，请先压缩当前对话或减少导入范围。',
      'error.import-budget-exceeded': '导入内容超过当前剩余容量，请缩短摘要、选择压缩导入或先压缩当前对话。',
      'error.import-call-limit': '分块压缩超过调用上限，请缩小导入范围。',
      'error.summary-not-reduced': '分块摘要未有效缩短内容，请缩小范围后重试。',
    });
    Object.assign(en, {
      rangeStart: 'Start', rangeEnd: 'End', findOpen: 'Find context · Ctrl+F', findTitle: 'Find in active context', findPlaceholder: 'Search the complete context',
      findHint: 'Search keeps other records visible. Set a start and end from matching records, then preview a summary manually.',
      findCount: '{current} / {shown} matching records', findLimit: '{total} records match; showing the first {shown}. Refine your query.',
      findEmpty: 'No matching records.', findPrevious: 'Previous match', findNext: 'Next match', findClose: 'Close find',
      findStart: 'Use match as start', findEnd: 'Use match as end', findSearching: 'Searching…',
      windowHint: 'Showing {count} nodes; {before} earlier and {after} later nodes are outside this view. Ctrl+F searches all active context.',
      'error.invalid-query': 'Enter a keyword of at most 256 characters.',
      importOpen: 'Import from another conversation', importClose: 'Close import', importSearch: 'Search conversations', importSearchHint: 'Search title, session ID or working directory',
      importIntro: 'Import a fixed snapshot without changing the source. Reads active user text, assistant text and checkpoints; excludes nested references, tools and reasoning.',
      importResults: '{count} conversations found; showing up to 100.', importNoSources: 'No other conversations found.', importSource: 'Source: {label}',
      importAll: 'All active conversation text', importRange: 'Consecutive range', importStart: 'Import start', importEnd: 'Import end',
      importRangeValue: 'Range: #{start} → #{end}', importPrevious: 'Previous page', importNext: 'Next page', importPage: 'Showing {start}–{end} / {count}',
      importBudget: 'About {occupied} / {window} tokens used; {reserve} reserved for output and {safety} for safety. About {available} tokens available for import.',
      importSelection: '{count} messages selected; about {tokens} tokens including source framing.', importOverBudget: 'The original exceeds capacity. Automatic preview will summarize it.',
      importAuto: 'Prepare import preview', importOriginal: 'Preview original import', importSummarize: 'Preview compressed import',
      importCost: 'Original previews do not call a model. Compression may make multiple model requests and incur usage.',
      importPreview: 'Import preview', importPreviewInfo: 'Source {label} · {count} messages · captured through #{seq} · about {tokens} tokens · {calls} model calls',
      importPreviewHint: 'Nothing is imported until confirmed. You can edit compressed summaries. Capacity is checked again when applying.',
      importApply: 'Confirm import', importApplied: 'The source snapshot was added to this conversation.',
      importedTag: 'From: {label}',
      'error.invalid-source': 'Select a valid source conversation.', 'error.self-import': 'A conversation cannot import itself.',
      'error.source-unavailable': 'The source is unavailable. Choose another conversation.', 'error.stale-source': 'The source changed. Reopen it and select again.',
      'error.empty-selection': 'The selection has no importable text.', 'error.invalid-selection': 'Choose a valid consecutive range.',
      'error.capacity-unknown': 'The model does not report context capacity. An import budget cannot be calculated.',
      'error.import-too-large': 'The source exceeds the import processing limit (8 MiB by default).',
      'error.import-budget-insufficient': 'There is insufficient capacity. Compact the current context or select less source content.',
      'error.import-budget-exceeded': 'The import exceeds remaining capacity. Shorten the summary, choose compression or compact this conversation.',
      'error.import-call-limit': 'Chunked compression exceeded the model call limit. Select less content.',
      'error.summary-not-reduced': 'Partial summaries did not reduce the content. Select less content and retry.',
    });
    const css = `
      .dsh-cm{height:100%;min-height:0;width:100%;overflow:auto;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);padding:24px clamp(14px,3vw,36px);padding-bottom:calc(var(--dsh-composer-height,152px) + 24px);box-sizing:border-box;font:inherit;font-size:13px;line-height:1.6}
      .dsh-cm *{box-sizing:border-box}.dsh-cm .cm-wrap{max-width:1080px;margin:0 auto}.dsh-cm h2{font-size:20px;margin:0 0 4px}.dsh-cm h3{font-size:15px;margin:0 0 8px}
      .dsh-cm p{margin:5px 0}.dsh-cm .cm-muted{color:var(--dsw-alias-label-tertiary)}.dsh-cm .cm-head,.dsh-cm .cm-actions,.dsh-cm .cm-row-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:space-between}
      .dsh-cm .cm-head{margin-bottom:20px}.dsh-cm .cm-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:20px;align-items:start}.dsh-cm .cm-side{position:sticky;top:var(--cm-find-height,0px)}
      .dsh-cm .cm-box{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:16px;margin-bottom:14px}.dsh-cm .cm-list{display:grid;gap:8px}
      .dsh-cm .cm-node{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:12px}.dsh-cm .cm-node[data-selected=true]{border-color:var(--dsw-alias-state-business-primary,#4f70e7);border-inline-start-width:4px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#4f70e7) 12%,var(--dsw-alias-bg-base,#fff))}
      .dsh-cm .cm-node[data-find-current=true]{outline:2px solid #c98a13;outline-offset:2px}.dsh-cm mark{background:#ffe18a;color:#362800;border-radius:2px;padding:0 1px}.dsh-cm .cm-find{position:sticky;top:0;z-index:2;background:var(--dsw-alias-bg-base,#fff);box-shadow:0 4px 12px #0001}.dsh-cm .cm-find input{flex:1;min-width:160px}.dsh-cm .cm-search-excerpt{white-space:pre-wrap;overflow-wrap:anywhere;border-inline-start:2px solid #c98a13;padding-inline-start:8px;max-height:140px;overflow:auto}
      .dsh-cm .cm-node[data-protected=true]{opacity:.7}.dsh-cm pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0;max-height:200px;overflow:auto}
      .dsh-cm button{font:inherit;color:inherit;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:7px 12px;cursor:pointer;min-height:34px}
      .dsh-cm button:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsh-cm button:disabled{opacity:.45;cursor:default}.dsh-cm button.cm-primary{color:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary);font-weight:600}
      .dsh-cm button:focus-visible,.dsh-cm textarea:focus-visible,.dsh-cm input:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
      .dsh-cm input[type=search]{font:inherit;color:inherit;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);padding:8px;border-radius:8px;width:min(100%,480px)}.dsh-cm .cm-sources{max-height:240px;overflow:auto;display:grid;gap:6px;margin:12px 0}.dsh-cm .cm-import-list{max-height:400px;overflow:auto;display:grid;gap:8px;margin:14px 0}.dsh-cm .cm-import-list pre{max-height:100px}.dsh-cm .cm-import label{margin-right:16px}
      .dsh-cm textarea{font:inherit;color:inherit;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:10px;width:100%;resize:vertical;margin:8px 0;min-height:90px}.dsh-cm .cm-summary{min-height:280px}
      .dsh-cm .cm-notice{padding:12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);margin-bottom:14px;white-space:pre-wrap}.dsh-cm .cm-badge{font-size:11px;color:var(--dsw-alias-state-business-primary)}.dsh-cm .cm-role{font-weight:600}
      .dsh-cm .cm-actions{justify-content:flex-start;margin-top:10px}.dsh-cm details>summary{cursor:pointer}.dsh-cm .cm-full{grid-column:1/-1}
      @media(max-width:850px){.dsh-cm .cm-grid{grid-template-columns:1fr}.dsh-cm .cm-side{position:static;grid-row:1}}
    `;

    /** Literal highlights are React text nodes, so source content never becomes markup. */
    function highlighted(value, query) {
      if (!query) return value;
      const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu');
      const parts = []; let from = 0;
      for (const match of value.matchAll(pattern)) {
        parts.push(value.slice(from, match.index), h('mark', { key: match.index }, match[0]));
        from = match.index + match[0].length;
      }
      parts.push(value.slice(from)); return parts;
    }

    /** A source picker and independent snapshot preview bound to this target conversation. */
    function ImportPanel({ t, api, disabled: outerDisabled, onBusy, onApplied }) {
      const [query, setQuery] = React.useState(''), [items, setItems] = React.useState(null), [total, setTotal] = React.useState(0);
      const [source, setSource] = React.useState(null), [scope, setScope] = React.useState('all');
      const [start, setStart] = React.useState(null), [end, setEnd] = React.useState(null), [selection, setSelection] = React.useState(null);
      const [startOrder, setStartOrder] = React.useState(null), [endOrder, setEndOrder] = React.useState(null);
      const [draft, setDraft] = React.useState(null), [summary, setSummary] = React.useState(''), [focus, setFocus] = React.useState('');
      const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(null), [applied, setApplied] = React.useState(false);
      const alive = React.useRef(true), controller = React.useRef(null), draftRef = React.useRef(null);
      draftRef.current = draft;
      const disabled = outerDisabled || busy;
      React.useEffect(() => { onBusy(busy); return () => onBusy(false); }, [busy, onBusy]);
      const failure = value => {
        if (!alive.current) return;
        const code = value.name === 'AbortError' ? 'cancelled' : value.code;
        setError({ code: Object.hasOwn(zh, 'error.' + code) ? code : 'operation-failed', changed: !!value.changed });
        if (value.changed || code === 'draft-expired') setDraft(null);
      };
      const run = async operation => {
        const abort = new AbortController(); controller.current = abort;
        setBusy(true); setError(null); setApplied(false);
        try { await operation(abort.signal); } catch (error) { failure(error); }
        finally { if (alive.current) setBusy(false); if (controller.current === abort) controller.current = null; }
      };
      const discard = async () => {
        const old = draftRef.current; setDraft(null); setSummary(''); draftRef.current = null;
        if (old) await api({ action: 'discard', draftId: old.draftId });
      };
      const search = signal => api({ action: 'import-list', query }, signal).then(result => {
        if (alive.current) { setItems(result.items); setTotal(result.total); }
      });
      React.useEffect(() => {
        alive.current = true;
        const abort = new AbortController(); search(abort.signal).catch(value => { if (!abort.signal.aborted) failure(value); });
        return () => {
          alive.current = false; abort.abort(); controller.current?.abort();
          if (draftRef.current) api({ action: 'discard', draftId: draftRef.current.draftId }).catch(() => {});
        };
      }, [api]);
      const rangeRequest = { sourceSessionId: source?.sessionId, sourceRevision: source?.revision, scope, startSeq: start, endSeq: end };
      React.useEffect(() => {
        setSelection(null);
        if (!source || (scope === 'range' && (start === null || end === null))) return;
        const abort = new AbortController();
        api({ action: 'import-selection', ...rangeRequest }, abort.signal).then(value => {
          if (!abort.signal.aborted && alive.current) setSelection(value);
        }).catch(value => { if (!abort.signal.aborted) failure(value); });
        return () => abort.abort();
      }, [source?.revision, scope, start, end, api]);
      const openSource = (id, offset = 0) => run(async signal => {
        await discard();
        const value = await api({ action: 'import-source', sourceSessionId: id, offset }, signal);
        if (!alive.current) return;
        if (value.revision !== source?.revision) { setScope('all'); setStart(null); setEnd(null); setStartOrder(null); setEndOrder(null); }
        setSource(value);
      });
      const choose = (row, edge) => run(async () => {
        await discard(); setScope('range');
        if (edge === 'start') { setStart(row.seq); setEnd(row.seq); setStartOrder(row.position); setEndOrder(row.position); }
        else { setEnd(row.seq); setEndOrder(row.position); }
      });
      const preview = mode => run(async signal => {
        await discard();
        const value = await api({ action: 'import-preview', ...rangeRequest, mode, instructions: focus }, signal);
        if (alive.current) { setDraft(value); setSummary(value.summary); }
      });
      const applyImport = () => run(async signal => {
        await api({ action: 'apply', draftId: draft.draftId, ...(draft.summarized ? { summary } : {}) }, signal);
        if (alive.current) { setDraft(null); setApplied(true); }
        await onApplied(signal);
        const value = await api({ action: 'import-selection', ...rangeRequest }, signal);
        if (alive.current) setSelection(value);
      });
      return h('section', { className: 'cm-box cm-import', 'aria-label': t('importOpen') },
        h('h3', null, t('importOpen')), h('p', { className: 'cm-muted' }, t('importIntro')),
        error && h('div', { className: 'cm-notice', role: 'alert' }, t('error.' + error.code), error.changed && h('p', null, t('changed'))),
        applied && h('p', { role: 'status' }, t('importApplied')),
        h('div', { className: 'cm-actions' }, h('input', { type: 'search', 'aria-label': t('importSearch'), placeholder: t('importSearchHint'), value: query, disabled, maxLength: 256, onChange: event => setQuery(event.target.value) }),
          h('button', { disabled, onClick: () => run(search) }, t('importSearch'))),
        items && h('p', { className: 'cm-muted' }, t('importResults', { count: total })),
        items?.length === 0 && h('p', null, t('importNoSources')),
        h('div', { className: 'cm-sources' }, items?.map(item => h('button', { key: item.sessionId, disabled, onClick: () => openSource(item.sessionId), 'aria-pressed': source?.sessionId === item.sessionId }, item.label, item.cwd ? ' · ' + item.cwd : ''))),
        source && h(React.Fragment, null,
          h('h3', null, t('importSource', { label: source.label })),
          h('div', { className: 'cm-actions' },
            ['all', 'range'].map(value => h('label', { key: value }, h('input', { type: 'radio', name: 'cm-import-scope', checked: scope === value, disabled, onChange: () => run(async () => { await discard(); setScope(value); }) }), t(value === 'all' ? 'importAll' : 'importRange')))),
          scope === 'range' && h('p', null, t('importRangeValue', { start: start ?? '…', end: end ?? '…' })),
          h('div', { className: 'cm-import-list' }, source.rows.map(row => h('article', { key: row.seq, className: 'cm-node', 'data-seq': row.seq,
            'data-selected': scope === 'all' || (startOrder !== null && row.position >= startOrder && row.position <= endOrder) },
            h('strong', null, t(row.role), ' · ', t('node', { seq: row.seq })), h('pre', null, row.preview),
            row.chars > row.preview.length && h('p', { className: 'cm-muted' }, t('truncated', { shown: row.preview.length, total: row.chars })),
            h('div', { className: 'cm-actions' },
              h('button', { disabled, 'aria-pressed': scope === 'range' && row.seq === start, 'aria-label': t('importStart') + ' #' + row.seq, onClick: () => choose(row, 'start') }, t('importStart')),
              h('button', { disabled: disabled || startOrder === null || row.position < startOrder, 'aria-pressed': scope === 'range' && row.seq === end, 'aria-label': t('importEnd') + ' #' + row.seq, onClick: () => choose(row, 'end') }, t('importEnd')))))),
          h('p', { className: 'cm-muted' }, t('importPage', { start: source.rows.length ? source.offset + 1 : 0, end: source.offset + source.rows.length, count: source.totalNodes })),
          h('div', { className: 'cm-actions' },
            h('button', { disabled: disabled || source.offset === 0, onClick: () => openSource(source.sessionId, Math.max(0, source.offset - source.pageSize)) }, t('importPrevious')),
            h('button', { disabled: disabled || source.offset + source.rows.length >= source.totalNodes, onClick: () => openSource(source.sessionId, source.offset + source.pageSize) }, t('importNext'))),
          selection && h('div', { role: 'status' }, h('p', null, t('importSelection', { count: selection.count, tokens: selection.tokens })),
            h('p', { className: 'cm-muted' }, t('importBudget', { occupied: selection.budget.occupied, window: selection.budget.contextWindow, reserve: selection.budget.outputReserve, safety: selection.budget.safety, available: selection.budget.available })),
            selection.needsCompression && h('p', { className: 'cm-badge' }, t('importOverBudget'))),
          h('label', null, t('focus'), h('textarea', { value: focus, maxLength: 4000, disabled, onChange: event => setFocus(event.target.value) })),
          h('div', { className: 'cm-actions' }, h('button', { disabled: disabled || !selection, className: 'cm-primary', onClick: () => preview('auto') }, t('importAuto')),
            h('button', { disabled: disabled || !selection || selection.needsCompression, onClick: () => preview('original') }, t('importOriginal')),
            h('button', { disabled: disabled || !selection, onClick: () => preview('summarize') }, t('importSummarize'))),
          h('p', { className: 'cm-muted' }, t('importCost'))),
        busy && h('div', { role: 'status', className: 'cm-actions' }, t('generating'), h('button', { onClick: () => controller.current?.abort() }, t('cancel'))),
        draft && h('div', { className: 'cm-box' }, h('h3', null, t('importPreview')),
          h('p', { className: 'cm-muted' }, t('importPreviewInfo', { label: draft.label, count: draft.count, seq: draft.capturedThroughSeq, tokens: draft.tokens, calls: draft.modelCalls })),
          h('p', null, t('importPreviewHint')),
          draft.summarized ? h('textarea', { className: 'cm-summary', 'aria-label': t('importPreview'), value: summary, maxLength: draft.maxSummaryChars, disabled, onChange: event => setSummary(event.target.value) }) : h('pre', null, draft.originalText),
          h('p', { className: 'cm-muted' }, t('expired', { time: new Date(draft.expiresAt).toLocaleTimeString() })),
          h('div', { className: 'cm-actions' }, h('button', { className: 'cm-primary', disabled: disabled || (draft.summarized && !summary.trim()), onClick: applyImport }, t('importApply')),
            h('button', { disabled, onClick: () => run(discard) }, t('discard')))));
    }

    /** A session-scoped view; requests and drafts never cross session bindings. */
    function ContextView(props) {
      const { t, sessionId } = props;
      const [data, setData] = React.useState(null), [error, setError] = React.useState(null);
      const [start, setStart] = React.useState(null), [end, setEnd] = React.useState(null);
      const [startOrder, setStartOrder] = React.useState(null), [endOrder, setEndOrder] = React.useState(null);
      const [selection, setSelection] = React.useState(null), [focus, setFocus] = React.useState('');
      const [draft, setDraft] = React.useState(null), [summary, setSummary] = React.useState('');
      const [busy, setBusy] = React.useState(null), [notice, setNotice] = React.useState(null);
      const [importOpen, setImportOpen] = React.useState(false), [importBusy, setImportBusy] = React.useState(false);
      const [findOpen, setFindOpen] = React.useState(false), [findQuery, setFindQuery] = React.useState(''), [findTick, setFindTick] = React.useState(0);
      const [findResult, setFindResult] = React.useState(null), [findIndex, setFindIndex] = React.useState(0), [finding, setFinding] = React.useState(false);
      const [pendingJump, setPendingJump] = React.useState(null);
      const rootRef = React.useRef(null), findInput = React.useRef(null), findBox = React.useRef(null);
      const controller = React.useRef(null), alive = React.useRef(true), generation = React.useRef(0);
      const externallyRunning = props.useSession(snapshot => snapshot.running);
      const disabled = !!busy || !!externallyRunning || importBusy;
      const api = React.useCallback(async (body, signal) => {
        const response = await fetch(body ? '/api/context-manager' : '/api/context-manager?sessionId=' + encodeURIComponent(sessionId), {
          method: body ? 'POST' : 'GET', credentials: 'same-origin', signal,
          ...(body ? { headers: { 'Content-Type': 'application/json', 'X-DSH-Context-Manager': '1' }, body: JSON.stringify({ ...body, sessionId }) } : {}),
        });
        const result = await response.json();
        if (!response.ok) throw Object.assign(new Error(result.error?.code), result.error);
        return result;
      }, [sessionId]);
      const showError = error => {
        if (!alive.current) return;
        const code = error.name === 'AbortError' ? 'cancelled' : error.code;
        setError({ code: Object.hasOwn(zh, 'error.' + code) ? code : 'operation-failed', changed: !!error.changed });
        if (error.changed || ['draft-expired', 'stale-selection'].includes(code)) setDraft(null);
      };
      const refresh = React.useCallback(async signal => {
        const result = await api(null, signal);
        if (alive.current) setData(result);
        return result;
      }, [api]);
      React.useEffect(() => {
        alive.current = true;
        const abort = new AbortController();
        setData(null); setStart(null); setEnd(null); setStartOrder(null); setEndOrder(null); setDraft(null); setError(null); setSelection(null); setNotice(null);
        setFindQuery(''); setFindResult(null); setFindOpen(false);
        refresh(abort.signal).catch(error => { if (!abort.signal.aborted) showError(error); });
        return () => { alive.current = false; abort.abort(); controller.current?.abort(); generation.current++; };
      }, [refresh]);
      React.useEffect(() => {
        const version = ++generation.current;
        setSelection(null);
        if (start === null || end === null) return;
        const abort = new AbortController();
        api({ action: 'selection', startSeq: start, endSeq: end }, abort.signal)
          .then(value => { if (alive.current && version === generation.current) setSelection(value); })
          .catch(error => { if (!abort.signal.aborted) showError(error); });
        return () => abort.abort();
      }, [start, end, api]);
      const openFind = () => { setFindOpen(true); setFindTick(value => value + 1); };
      React.useEffect(() => {
        const view = rootRef.current.ownerDocument.defaultView;
        const keydown = event => {
          // Conversation tabs can remain mounted while hidden. Leave native find alone there.
          if (!rootRef.current?.getClientRects().length) return;
          if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'f') {
            event.preventDefault(); event.stopPropagation(); openFind();
          } else if (findOpen && event.key === 'Escape') {
            event.preventDefault(); event.stopPropagation(); setFindOpen(false);
          }
        };
        view.addEventListener('keydown', keydown, true);
        return () => view.removeEventListener('keydown', keydown, true);
      }, [findOpen]);
      React.useEffect(() => { if (findOpen) { findInput.current?.focus(); findInput.current?.select(); } }, [findOpen, findTick]);
      React.useEffect(() => {
        const root = rootRef.current, bar = findBox.current;
        if (!findOpen || !bar) { root.style.removeProperty('--cm-find-height'); return; }
        const measure = () => root.style.setProperty('--cm-find-height', (bar.getBoundingClientRect().height + 14) + 'px');
        measure();
        const Observer = root.ownerDocument.defaultView.ResizeObserver;
        const observer = Observer ? new Observer(measure) : null;
        observer?.observe(bar);
        return () => { observer?.disconnect(); root.style.removeProperty('--cm-find-height'); };
      }, [findOpen]);
      React.useEffect(() => {
        setFindResult(null); setFinding(false); setFindIndex(0);
        if (!findOpen || !findQuery) return;
        const abort = new AbortController(), view = rootRef.current.ownerDocument.defaultView;
        setFinding(true);
        const timer = view.setTimeout(async () => {
          try {
            const result = await api({ action: 'find', query: findQuery }, abort.signal);
            if (!abort.signal.aborted && alive.current) setFindResult(result);
          } catch (error) { if (!abort.signal.aborted) showError(error); }
          finally { if (!abort.signal.aborted && alive.current) setFinding(false); }
        }, 150);
        return () => { view.clearTimeout(timer); abort.abort(); };
      }, [findOpen, findQuery, api, data?.revision]);
      const matches = findOpen && findResult?.query === findQuery ? findResult.hits : [];
      const currentHit = matches[findIndex];
      React.useEffect(() => {
        const hit = findOpen ? findResult?.hits[findIndex] : undefined;
        if (!hit || findResult.query !== findQuery) return;
        const abort = new AbortController();
        (async () => {
          if (!rootRef.current.querySelector('.cm-list article[data-seq="' + hit.seq + '"]')) {
            const result = await api({ action: 'inspect', anchorSeq: hit.seq }, abort.signal);
            if (abort.signal.aborted || !alive.current) return;
            setData(result);
          }
          if (!abort.signal.aborted && alive.current) setPendingJump(hit.seq);
        })().catch(error => { if (!abort.signal.aborted) showError(error); });
        return () => abort.abort();
      }, [findOpen, findResult, findIndex, findQuery, api]);
      React.useEffect(() => {
        if (pendingJump === null) return;
        rootRef.current?.querySelector('.cm-list article[data-seq="' + pendingJump + '"]')?.scrollIntoView?.({ block: 'center' });
        setPendingJump(null);
      }, [pendingJump, data]);
      const execute = async (kind, action) => {
        const abort = new AbortController(); controller.current = abort;
        setBusy(kind); setError(null); setNotice(null);
        try { await action(abort.signal); }
        catch (error) { showError(error); }
        finally { if (alive.current) setBusy(null); if (controller.current === abort) controller.current = null; }
      };
      const discard = async () => {
        const old = draft;
        setDraft(null); setSummary('');
        if (old) await api({ action: 'discard', draftId: old.draftId });
      };
      const preview = mode => execute('preview', async signal => {
        if (!selection) return;
        await discard();
        const result = await api({ action: 'preview', mode, instructions: focus, startSeq: selection.startSeq, endSeq: selection.endSeq }, signal);
        if (alive.current) { setDraft(result); setSummary(result.summary); }
      });
      const apply = () => execute('apply', async signal => {
        if (!draft) return;
        await api({ action: 'apply', draftId: draft.draftId, summary }, signal);
        if (alive.current) { setDraft(null); setSelection(null); setStart(null); setEnd(null); setStartOrder(null); setEndOrder(null); setNotice('applied'); }
        await refresh(signal);
      });
      const pick = (row, edge) => {
        setError(null); setNotice(null); setDraft(null);
        if (draft) api({ action: 'discard', draftId: draft.draftId }).catch(showError);
        if (edge === 'start') { setStart(row.seq); setEnd(row.seq); setStartOrder(row.position); setEndOrder(row.position); }
        else { setEnd(row.seq); setEndOrder(row.position); }
      };
      const rows = data?.rows ?? [];
      // Render the requested interval immediately; validation may additionally expand tool groups.
      const confirmed = selection?.requested.startSeq === start && selection?.requested.endSeq === end;
      const selected = new Set(confirmed ? selection.seqs : rows.filter(row => start !== null && end !== null && startOrder !== null && row.position >= startOrder && row.position <= endOrder).map(row => row.seq));
      const searchHits = new Map(matches.map(hit => [hit.seq, hit]));
      const moveMatch = delta => setFindIndex(index => (index + delta + matches.length) % matches.length);
      const roleLabel = role => ['user', 'assistant', 'tool', 'system', 'developer'].includes(role) ? t(role) : t('noText');
      return h('section', { ref: rootRef, tabIndex: -1, className: 'dsh-cm', 'data-conversation-composer-overlay': '', 'aria-label': t('title') },
        h('style', null, css),
        h('div', { className: 'cm-wrap' },
          h('header', { className: 'cm-head' }, h('div', null, h('h2', null, t('heading')), h('p', { className: 'cm-muted' }, t('subtitle'))),
            h('div', { className: 'cm-actions' },
              h('button', { onClick: openFind }, t('findOpen')),
              h('button', { disabled: !!busy || importBusy, onClick: () => setImportOpen(value => !value) }, t(importOpen ? 'importClose' : 'importOpen')),
              h('button', { disabled: !!busy || importBusy, onClick: () => execute('refresh', async signal => { await discard(); setStart(null); setEnd(null); setStartOrder(null); setEndOrder(null); setSelection(null); await refresh(signal); }) }, t('refresh')))),
          error && h('div', { className: 'cm-notice', role: 'alert' }, t('error.' + error.code), error.changed && h('p', null, t('changed'))),
          notice && h('div', { className: 'cm-notice', role: 'status' }, t(notice)),
          externallyRunning && h('p', { className: 'cm-notice', role: 'status' }, t('running')),
          findOpen && h('section', { ref: findBox, className: 'cm-box cm-find', 'aria-label': t('findTitle') },
            h('div', { className: 'cm-actions' }, h('input', { ref: findInput, type: 'search', 'aria-label': t('findTitle'), value: findQuery, maxLength: 256, placeholder: t('findPlaceholder'),
              onChange: event => { setFindQuery(event.target.value); setError(null); },
              onKeyDown: event => { if (event.key === 'Enter') { event.preventDefault(); if (matches.length) moveMatch(event.shiftKey ? -1 : 1); } } }),
              h('button', { disabled: !matches.length, onClick: () => moveMatch(-1) }, t('findPrevious')),
              h('button', { disabled: !matches.length, onClick: () => moveMatch(1) }, t('findNext')),
              h('button', { onClick: () => setFindOpen(false) }, t('findClose'))),
            h('p', { role: 'status' }, finding ? t('findSearching') : findQuery && findResult ? (matches.length ? t('findCount', { current: findIndex + 1, shown: matches.length }) : t('findEmpty')) : t('findHint')),
            findResult?.truncated && h('p', { className: 'cm-muted' }, t('findLimit', { total: findResult.total, shown: matches.length })),
            h('div', { className: 'cm-actions' },
              h('button', { disabled: disabled || !currentHit || currentHit.protected, onClick: () => pick(currentHit, 'start') }, t('findStart')),
              h('button', { disabled: disabled || !currentHit || currentHit.protected || startOrder === null || currentHit.position < startOrder, onClick: () => pick(currentHit, 'end') }, t('findEnd')))),
          importOpen && h(ImportPanel, { key: sessionId, t, api, disabled: !!busy || !!externallyRunning, onBusy: setImportBusy, onApplied: refresh }),
          !data ? h('p', { role: 'status' }, t('loading')) : h(React.Fragment, null,
            h('p', { className: 'cm-muted' }, t('usage', { tokens: Math.ceil(data.estimatedTokens).toLocaleString(), count: data.totalNodes })),
            data.hiddenNodes > 0 && h('p', { className: 'cm-muted' }, t('windowHint', { count: rows.length, before: data.hiddenBefore, after: data.hiddenAfter })),
            h('div', { className: 'cm-grid' },
              h('div', { className: 'cm-list' }, !rows.length && h('p', null, t('empty')),
                rows.map(row => h('article', { key: row.seq, className: 'cm-node', 'data-seq': row.seq, 'data-selected': selected.has(row.seq), 'data-protected': row.protected, 'data-find-current': row.seq === currentHit?.seq },
                  h('div', { className: 'cm-row-head' },
                    h('span', { className: 'cm-role' }, roleLabel(row.role), ' · ', t('node', { seq: row.seq })),
                    h('span', { className: 'cm-muted' }, t('tokens', { tokens: Math.ceil(row.tokens) }))),
                  row.protected && h('span', { className: 'cm-badge' }, t('protected')),
                  row.summary && h('span', { className: 'cm-badge' }, t('summaryTag')),
                  row.excluded && h('span', { className: 'cm-badge' }, t('excludedTag')),
                  row.importedLabel && h('span', { className: 'cm-badge' }, t('importedTag', { label: row.importedLabel })),
                  selected.has(row.seq) && h('span', { className: 'cm-badge' }, [t('selected'), row.seq === start ? t('rangeStart') : '', row.seq === end ? t('rangeEnd') : ''].filter(Boolean).join(' · ')),
                  searchHits.has(row.seq) && h('p', { className: 'cm-search-excerpt' }, highlighted(searchHits.get(row.seq).snippet, findQuery)),
                  h('details', null, h('summary', null, highlighted((row.preview || t('noText')).slice(0, 100), findOpen ? findQuery : '')), h('pre', null, highlighted(row.preview || t('noText'), findOpen ? findQuery : '')),
                    row.chars > row.preview.length && h('p', { className: 'cm-muted' }, t('truncated', { shown: row.preview.length, total: row.chars }))),
                  !row.protected && h('div', { className: 'cm-actions' },
                    h('button', { disabled, 'aria-label': t('start') + ' ' + t('node', { seq: row.seq }), 'aria-pressed': row.seq === start, onClick: () => pick(row, 'start') }, t('start')),
                    h('button', { disabled: disabled || startOrder === null || row.position < startOrder, 'aria-label': t('end') + ' ' + t('node', { seq: row.seq }), 'aria-pressed': row.seq === end, onClick: () => pick(row, 'end') }, t('end')))))),
              h('aside', { className: 'cm-side' },
                h('div', { className: 'cm-box' }, h('h3', null, t('range')), h('p', { className: 'cm-muted' }, t('rangeHint')),
                  selection && h('p', null, t('selection', { count: selection.seqs.length, tokens: Math.ceil(selection.tokens) })),
                  selection?.expanded && h('p', { className: 'cm-badge', role: 'status' }, t('expanded')),
                  h('label', null, t('focus'), h('textarea', { value: focus, maxLength: 4000, disabled, placeholder: t('focusPlaceholder'), onChange: event => setFocus(event.target.value) })),
                  h('div', { className: 'cm-actions' },
                    h('button', { className: 'cm-primary', disabled: disabled || !selection, onClick: () => preview('summarize') }, t('generate')),
                    h('button', { disabled: disabled || !selection, onClick: () => preview('exclude') }, t('exclude'))),
                  h('p', { className: 'cm-muted' }, t('modelCost'))),
                busy && h('div', { className: 'cm-box', role: 'status' }, t(busy === 'preview' ? 'generating' : busy === 'apply' ? 'applying' : 'loading'),
                  busy === 'preview' && h('div', { className: 'cm-actions' }, h('button', { onClick: () => controller.current?.abort() }, t('cancel')))),
                draft && h('div', { className: 'cm-box' }, h('h3', null, t(draft.mode === 'exclude' ? 'exclusionDraft' : 'draft')),
                  h('p', { className: 'cm-muted' }, t(draft.mode === 'exclude' ? 'exclusionHint' : 'editHint')),
                  draft.mode === 'summarize' && h('textarea', { className: 'cm-summary', 'aria-label': t('draft'), value: summary, maxLength: draft.maxSummaryChars, disabled: !!busy, onChange: event => setSummary(event.target.value) }),
                  h('p', { className: 'cm-muted' }, t('estimate', { before: Math.ceil(draft.selection.tokens), after: Math.ceil(draft.estimatedAfterTokens) })),
                  h('p', { className: 'cm-muted' }, t('expired', { time: new Date(draft.expiresAt).toLocaleTimeString() })),
                  h('div', { className: 'cm-actions' },
                    h('button', { className: 'cm-primary', disabled: disabled || !summary.trim(), onClick: apply }, t(draft.mode === 'exclude' ? 'applyExclude' : 'apply')),
                    h('button', { disabled: !!busy, onClick: () => execute('discard', discard) }, t('discard')))))))));
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }));
        const t = ctx.locale.bind(NS);
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view', id: 'context-manager', order: 30,
          locale: NS, label: () => t('title'),
        }, ContextView));
      },
    };
  },
});
