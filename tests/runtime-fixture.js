// Test-only plugin: a local model and a persisted conversation, never included in the npm package.
import { LlmAdapter, createUserMessage } from '@deepseek-ai/dsh-llm';

export const name = 'context-manager-runtime-fixture';
export const inject = ['llm', 'agents', 'sessions', 'sessionPersistence', 'connection'];

let lastRequest = [];

class FixtureAdapter extends LlmAdapter {
  async resolveModel(provider, model) {
    return { provider, id: model, name: 'Context manager test model', context: { contextWindow: 128000 } };
  }
  async *stream(options) {
    const instruction = options.messages.at(-1)?.content?.filter(block => block.type === 'text').map(block => block.text).join('') ?? '';
    const summary = options.purpose === 'compaction';
    if (!summary) lastRequest = options.messages.map(message => message.content.filter(block => block.type === 'text').map(block => block.text).join(''));
    const answer = summary ? '已确认：只处理选定上下文，保留原始记录；下一步验证保存与重启恢复。' : '测试模型回复：已经确认当前要求。' + '保留接口约定、用户约束和未完成事项。'.repeat(40);
    yield { type: 'block-start', index: 0, blockType: 'text' };
    yield { type: 'block-end', index: 0, block: { type: 'text', text: answer } };
    yield { type: 'finish', reason: { kind: 'stop' } };
  }
}

export async function apply(ctx) {
  ctx.llm.registerAdapter(['context-fixture'], new FixtureAdapter());
  const sessionId = 'context-manager-smoke';
  const agentOptions = { provider: 'context-fixture', model: 'fixture' };
  const stored = await ctx.sessionPersistence.stat(sessionId);
  const handle = stored
    ? await ctx.agents.resume({ resumeSessionId: sessionId, agentOptions })
    : await ctx.agents.create({ sessionId, agentOptions, meta: { cwd: import.meta.dirname } });
  if (!stored) {
    for (let turn = 1; turn <= 3; turn++) {
      handle.agent.followup(createUserMessage({ source: { kind: 'user' }, content: [{ type: 'text', text: `第 ${turn} 轮测试需求：` + '在当前会话选择指定记录，压缩或排除，保留原文。'.repeat(50) }] }));
      await handle.agent.whenIdle();
    }
    await ctx.sessions.flush(handle.agent.session);
  }
  ctx.effect(() => () => handle.dispose());
  const sourceId = 'context-manager-import-source';
  const sourceStored = await ctx.sessionPersistence.stat(sourceId);
  const sourceHandle = sourceStored
    ? await ctx.agents.resume({ resumeSessionId: sourceId, agentOptions })
    : await ctx.agents.create({ sessionId: sourceId, agentOptions, meta: { cwd: import.meta.dirname } });
  if (!sourceStored) {
    for (let turn = 1; turn <= 2; turn++) {
      sourceHandle.agent.followup(createUserMessage({ source: { kind: 'user' }, content: [{ type: 'text', text: `导入来源第 ${turn} 轮：来源快照必须独立保存。` }] }));
      await sourceHandle.agent.whenIdle();
    }
    await ctx.sessions.flush(sourceHandle.agent.session);
  }
  ctx.effect(() => () => sourceHandle.dispose());
  ctx.effect(() => ctx.connection.fetch.register({
    path: '/api/context-fixture', methods: ['GET', 'POST'], requestBody: 'buffered',
    async fetch(request) {
      if (request.method === 'POST') {
        if (request.headers.get('X-Context-Fixture') !== '1') return new Response(null, { status: 403 });
        handle.agent.followup(createUserMessage({ source: { kind: 'user' }, content: [{ type: 'text', text: '验证修改后的实际请求，只需确认。' }] }));
        await handle.agent.whenIdle();
        await ctx.sessions.flush(handle.agent.session);
      }
      const session = handle.agent.session;
      const events = session.snapshotEvents();
      const persisted = await ctx.sessionPersistence.open(sessionId, 'read');
      let persistedEvents;
      try { persistedEvents = (await persisted.read()).events; } finally { await persisted.close(); }
      return Response.json({
        rows: session.surface.nodes.map(seq => {
          const message = session.deriveEventMessage(events[seq]);
          return { seq, source: message?.source.kind, text: message?.content.filter(block => block.type === 'text').map(block => block.text).join('') ?? '' };
        }),
        rawUser2Retained: events.some(event => event.type === 'user/message' && event.data.content.some(block => block.type === 'text' && block.text.startsWith('第 2 轮测试需求'))),
        rawUser1Retained: events.some(event => event.type === 'user/message' && event.data.content.some(block => block.type === 'text' && block.text.startsWith('第 1 轮测试需求'))),
        rawUser3Retained: events.some(event => event.type === 'user/message' && event.data.content.some(block => block.type === 'text' && block.text.startsWith('第 3 轮测试需求'))),
        lastRequestObserved: lastRequest.length > 0,
        lastRequestContainsUser2: lastRequest.some(value => value.includes('第 2 轮测试需求')),
        lastRequestContainsUser1: lastRequest.some(value => value.includes('第 1 轮测试需求')),
        lastRequestContainsUser3: lastRequest.some(value => value.includes('第 3 轮测试需求')),
        lastRequestContainsImported: lastRequest.some(value => value.includes('导入来源第 1 轮')),
        persistedImports: persistedEvents.filter(event => event.type === 'user/message' && event.data.source.kind === 'session-reference').length,
        persistedSummary: persistedEvents.some(event => event.type === 'compaction/summary'),
        persistedExclusion: persistedEvents.some(event => event.type === 'compaction/prune'),
      });
    },
  }));
}
