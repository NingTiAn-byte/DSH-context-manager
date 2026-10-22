import test from 'node:test';
import assert from 'node:assert/strict';
import { Session, SessionId } from '@deepseek-ai/dsh-session';
import { createAssistantMessage, createToolResultMessage, ToolCallId } from '@deepseek-ai/dsh-llm';
import { assertReleasedV4Relationships } from '@deepseek-ai/dsh-session-format-v3-to-v4';
import { ContextError, EXCLUSION_TEXT, selectRange, resolveConfig } from '../context.js';
import { fixture, user, text } from './fixture.js';

const signal = () => new AbortController().signal;
const fails = code => error => error instanceof ContextError && error.code === code;

test('shows effective context, protected prompts, and token estimates', async t => {
  const f = fixture(); t.after(() => f.close());
  const result = await f.manager.inspect(f.session.id);
  assert.equal(result.rows.length, 9);
  assert.equal(result.rows[0].protected, true);
  assert.ok(result.estimatedTokens > 0);
  assert.equal(result.rows[3].role, 'user');
});

test('preview does not replace history; edited apply changes only the selection and replays without the plugin', async t => {
  const f = fixture(); t.after(() => f.close());
  const before = f.session.deriveMessages().map(text);
  const draft = await f.manager.preview(f.request, signal());
  assert.deepEqual(f.session.deriveMessages().map(text), before);
  assert.equal(f.state.calls.length, 1);
  const input = f.state.calls[0].messages.map(text).join('\n');
  assert.ok(input.includes('TURN_2')); assert.ok(!input.includes('TURN_1'));
  const result = await f.manager.apply({ sessionId: f.session.id, draftId: draft.draftId, summary: 'Edited: keep the confirmed API.' }, signal());
  assert.equal(result.applied, true);
  const after = f.session.deriveMessages().map(text);
  assert.equal(after.length, before.length - 1);
  assert.ok(after[3].includes('Edited: keep the confirmed API.'));
  assert.equal(after[1], before[1]); assert.equal(after[4], before[5]);
  assert.ok(f.session.snapshotEvents().some(event => event.type === 'user/message' && text(event.data).startsWith('TURN_2')));
  const restored = Session.create(SessionId('restored'), f.state.flushes.at(-1));
  assert.deepEqual(restored.deriveMessages().map(text), after);
  const events = f.session.snapshotEvents();
  const index = events.findIndex(event => event.type === 'compaction/summary');
  assert.equal(events[index + 1].type, 'user/message');
  assert.equal(events.at(-1).type, 'compaction/end');
  await assert.rejects(f.manager.apply({ sessionId: f.session.id, draftId: draft.draftId, summary: 'duplicate' }, signal()), fails('draft-expired'));
});

test('exclusion uses no model call and has a durable model-free prune replacement', async t => {
  const f = fixture(); t.after(() => f.close());
  const draft = await f.manager.preview({ ...f.request, mode: 'exclude' }, signal());
  assert.equal(f.state.calls.length, 0);
  await f.manager.apply({ sessionId: f.session.id, draftId: draft.draftId }, signal());
  assert.equal(f.session.deriveMessages().map(text)[3], EXCLUSION_TEXT);
  const events = f.session.snapshotEvents(), index = events.findIndex(event => event.type === 'compaction/prune');
  assert.equal(events[index + 1].surfaceOp.op, 'replace');
  assert.ok(!events.some(event => event.type === 'compaction/summary'));
  assert.equal((await f.manager.inspect(f.session.id)).rows[3].excluded, true);
  const restored = Session.create(SessionId('excluded-replay'), f.state.flushes.at(-1));
  assert.deepEqual(restored.deriveMessages().map(text), f.session.deriveMessages().map(text));
});

test('rejects a stale draft after any selected node changes, while permitting outside append-only growth', async t => {
  const f = fixture(); t.after(() => f.close());
  const draft = await f.manager.preview(f.request, signal());
  f.session.append('user/message', user('outside the chosen span'), { surfaceOp: 'append' });
  await f.manager.apply({ sessionId: f.session.id, draftId: draft.draftId, summary: draft.summary }, signal());
  assert.equal(text(f.session.deriveMessages().at(-1)), 'outside the chosen span');
  const next = await f.manager.preview({ ...f.request, startSeq: f.session.surface.nodes[1], endSeq: f.session.surface.nodes[2] }, signal());
  f.session.append('user/message', user('changed selected message'), { surfaceOp: { op: 'replace', startSeq: next.selection.startSeq, endSeq: next.selection.startSeq }, sourceEventSeqs: [next.selection.startSeq] });
  const length = f.session.snapshotEvents().length;
  await assert.rejects(f.manager.apply({ sessionId: f.session.id, draftId: next.draftId, summary: next.summary }, signal()), fails('stale-selection'));
  assert.equal(f.session.snapshotEvents().length, length);
});

test('protects prompt nodes, rejects reversed selection, and bounds input size', async t => {
  const f = fixture({ maxSelectionBytes: 200 }); t.after(() => f.close());
  const nodes = f.session.surface.nodes;
  assert.throws(() => selectRange(f.session, f.host.tokenMeter, f.manager.config, nodes[0], nodes[1]), fails('protected-context'));
  assert.throws(() => selectRange(f.session, f.host.tokenMeter, f.manager.config, nodes[4], nodes[3]), fails('stale-selection'));
  await assert.rejects(f.manager.preview(f.request, signal()), fails('selection-too-large'));
  assert.equal(f.state.calls.length, 0);
});

test('expands partial tool selection into one complete call/result group', async t => {
  const f = fixture(); t.after(() => f.close());
  const session = f.session, callId = ToolCallId('read-file');
  session.append('turn/start', { turn: 5 });
  session.append('step/start', { turn: 5, step: 1 });
  const call = session.append('assistant/message', { turn: 5, step: 1, stream: [], message: createAssistantMessage({ content: [{ type: 'tool-call', id: callId, name: 'read', arguments: '{}' }], source: { provider: 'mock', model: 'mock' } }) }, { surfaceOp: 'append' });
  session.append('tool/call', { turn: 5, step: 1, callId, name: 'read', arguments: '{}' });
  const result = session.append('tool/result', { turn: 5, step: 1, message: createToolResultMessage({ callId, isError: false, content: [{ type: 'text', text: 'large result '.repeat(100) }] }) }, { surfaceOp: 'append' });
  session.append('step/end', { turn: 5, step: 1 }); session.append('turn/end', { turn: 5, reason: { kind: 'completed' } });
  const selected = await f.manager.selection(session.id, result.seq, result.seq);
  assert.equal(selected.expanded, true); assert.deepEqual(selected.seqs, [call.seq, result.seq]);
});

test('busy or open-turn state prevents edits; concurrent previews share idle admission', async t => {
  const f = fixture(); t.after(() => f.close());
  f.agent.status = 'running';
  await assert.rejects(f.manager.preview(f.request, signal()), fails('busy'));
  f.agent.status = 'idle';
  const gate = Promise.withResolvers(); f.state.gate = gate.promise;
  const pending = f.manager.preview(f.request, signal());
  await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(f.manager.preview(f.request, signal()), fails('busy'));
  gate.resolve(); await pending;
  f.session.append('turn/start', { turn: 5 });
  await assert.rejects(f.manager.preview(f.request, signal()), fails('busy'));
});

test('cancellation, provider failure, and incomplete output never replace context', async t => {
  const f = fixture(); t.after(() => f.close());
  const before = f.session.deriveMessages().map(text);
  const abort = new AbortController(); abort.abort(new Error('cancelled'));
  await assert.rejects(f.manager.preview(f.request, abort.signal));
  f.state.error = new Error('provider unavailable');
  await assert.rejects(f.manager.preview(f.request, signal()), fails('summary-incomplete'));
  f.state.error = null; f.state.finish = 'max-tokens';
  await assert.rejects(f.manager.preview(f.request, signal()), fails('summary-incomplete'));
  assert.deepEqual(f.session.deriveMessages().map(text), before);
  assert.equal(f.manager.drafts.size, 0);
});

test('expiry, wrong session, empty summary, and nonshrinking edits are refused', async t => {
  const f = fixture(); t.after(() => f.close());
  const draft = await f.manager.preview(f.request, signal());
  await assert.rejects(f.manager.apply({ sessionId: 'another', draftId: draft.draftId, summary: draft.summary }, signal()), fails('draft-expired'));
  await assert.rejects(f.manager.apply({ sessionId: f.session.id, draftId: draft.draftId, summary: '' }, signal()), fails('invalid-summary'));
  await assert.rejects(f.manager.apply({ sessionId: f.session.id, draftId: draft.draftId, summary: 'long '.repeat(1500) }, signal()), fails('not-smaller'));
  f.manager.drafts.get(draft.draftId).expiresAt = 0;
  await assert.rejects(f.manager.apply({ sessionId: f.session.id, draftId: draft.draftId, summary: draft.summary }, signal()), fails('draft-expired'));
});

test('flush failure is reported as changed and consumes the draft, preventing unsafe retry', async t => {
  const f = fixture(); t.after(() => f.close());
  const draft = await f.manager.preview({ ...f.request, mode: 'exclude' }, signal());
  f.host.sessions.flush = async () => { throw new Error('disk full'); };
  await assert.rejects(f.manager.apply({ sessionId: f.session.id, draftId: draft.draftId }, signal()), error => error.code === 'persistence-failed' && error.changed);
  assert.ok(f.session.deriveMessages().map(text).includes(EXCLUSION_TEXT));
  assert.equal(f.manager.drafts.size, 0);
});

test('unload aborts an in-flight preview and rejects future operations', async t => {
  const f = fixture(); t.after(() => f.ctx.fiber.dispose());
  f.state.gate = new Promise(() => {});
  const pending = f.manager.preview(f.request, signal());
  f.manager.pending.add(pending);
  await new Promise(resolve => setImmediate(resolve));
  const rejected = assert.rejects(pending);
  await f.manager.dispose(); await rejected;
  assert.equal(f.manager.drafts.size, 0);
  await assert.rejects(f.manager.inspect(f.session.id), fails('unloaded'));
});

test('invalid configuration fails at activation', () => {
  assert.throws(() => resolveConfig({ maxDrafts: 0 }), /Invalid/);
  assert.throws(() => resolveConfig({ unrecognized: true }), /Unknown/);
});

test('protects regenerated runtime context from misleading exclusion', async t => {
  const f = fixture(); t.after(() => f.close());
  const event = f.session.append('user/message', { ...user('runtime snapshot'), source: { kind: 'runtime-context' } }, { surfaceOp: 'append' });
  const view = await f.manager.inspect(f.session.id);
  assert.equal(view.rows.at(-1).protected, true);
  await assert.rejects(f.manager.selection(f.session.id, event.seq, event.seq), fails('protected-context'));
});

for (const mode of ['summarize', 'exclude']) test(`${mode} passes the native V4 persistence relationship validator`, async t => {
  const f = fixture(); t.after(() => f.close());
  const draft = await f.manager.preview({ ...f.request, mode }, signal());
  await f.manager.apply({ sessionId: f.session.id, draftId: draft.draftId, summary: draft.summary }, signal());
  const events = f.session.snapshotEvents();
  const known = new Set(events.filter(event => !event.ignorable).map(event => event.type));
  assert.doesNotThrow(() => assertReleasedV4Relationships({ header: f.session.header, events, inheritedEventCount: f.session.inheritedEventCount }, known));
});
