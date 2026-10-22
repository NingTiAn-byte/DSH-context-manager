import { Context } from '@deepseek-ai/cordis';
import SessionStore, { Session, SessionId } from '@deepseek-ai/dsh-session';
import LlmRuntime, { createUserMessage, createAssistantMessage, createSystemMessage, LlmAdapter } from '@deepseek-ai/dsh-llm';
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection';
import TokenMeter from '@deepseek-ai/dsh-token-meter';
import { ContextManager } from '../context.js';

export const text = message => message.content.filter(block => block.type === 'text').map(block => block.text).join('');
export const user = value => createUserMessage({ content: [{ type: 'text', text: value }], source: { kind: 'user' } });
export function conversation(id = 'fixture') {
  const session = Session.create(SessionId(id));
  for (let turn = 1; turn <= 4; turn++) {
    session.append('turn/start', { turn });
    session.append('step/start', { turn, step: 1 });
    if (turn === 1) session.append('system/message', { turn: 1, step: 1, message: createSystemMessage('Follow the user requirements.') }, { surfaceOp: 'append' });
    session.append('user/message', user(`TURN_${turn} ` + 'confirmed requirement '.repeat(120)), { surfaceOp: 'append' });
    if (turn === 1) session.append('request/header', { header: { config: { provider: 'mock', model: 'mock' } }, reason: 'initial' });
    session.append('assistant/message', { turn, step: 1, stream: [], message: createAssistantMessage({ content: [{ type: 'text', text: `ANSWER_${turn} ` + 'confirmed result '.repeat(30) }], source: { provider: 'mock', model: 'mock' } }) }, { surfaceOp: 'append' });
    session.append('step/end', { turn, step: 1 });
    session.append('turn/end', { turn, reason: { kind: 'completed' } });
  }
  return session;
}

export function fixture(config = {}) {
  const ctx = new Context();
  new LlmRuntime(ctx); new SessionStore(ctx); new SessionProjectionRegistry(ctx); new TokenMeter(ctx);
  const session = conversation();
  let locked = false;
  const source = conversation('source');
  const state = { calls: [], flushes: [], contextWindow: 100000, summary: 'Preserve confirmed requirements and continue pending work.', finish: 'stop', error: null, gate: null };
  const agent = {
    session, options: { provider: 'mock', model: 'mock' }, status: 'idle',
    runMaintenance(operation) {
      if (locked || this.status !== 'idle') throw new Error('Agent is busy');
      locked = true;
      return Promise.resolve().then(() => operation(new AbortController().signal)).finally(() => { locked = false; });
    },
  };
  class Adapter extends LlmAdapter {
    async resolveModel(provider, model) { return { provider, id: model, name: model, ...(state.contextWindow ? { context: { contextWindow: state.contextWindow } } : {}) }; }
    async *stream(options) {
      state.calls.push(options);
      if (state.gate) await Promise.race([state.gate, new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }))]);
      options.signal?.throwIfAborted();
      if (state.error) throw state.error;
      yield { type: 'block-end', index: 0, block: { type: 'text', text: state.summary } };
      yield { type: 'finish', reason: { kind: state.finish } };
    }
  }
  ctx.llm.registerAdapter(['mock'], new Adapter());
  ctx.sessions.flush = async value => { state.flushes.push(JSON.parse(JSON.stringify(value.snapshotEvents()))); return true; };
  const host = {
    llm: ctx.llm, tokenMeter: ctx.tokenMeter, sessions: ctx.sessions,
    sessionController: {
      async resolveAgent(id) { return id === session.id ? { agent } : { error: new Error('not found') }; },
      async list() { return { items: [session, source].map(value => ({ sessionId: value.id, blank: false, projections: { values: { title: value.id === source.id ? '来源测试对话' : '当前对话' } } })) }; },
    },
    sessionQuery: { async readSurface(id) {
      if (id !== source.id) throw new Error('Missing source');
      const events = source.snapshotEvents();
      return structuredClone({ session: source.header, capturedThroughSeq: source.seq, events: source.surface.nodes.map(seq => events[seq]) });
    } },
  };
  const manager = new ContextManager(host, config);
  return { ctx, host, session, source, agent, state, manager,
    request: { sessionId: session.id, mode: 'summarize', startSeq: session.surface.nodes[3], endSeq: session.surface.nodes[4], instructions: '' },
    async close() { await manager.dispose(); await ctx.fiber.dispose(); },
  };
}
