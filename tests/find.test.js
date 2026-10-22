import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, user } from './fixture.js';

const signal = () => new AbortController().signal;

test('find scans full effective text beyond previews and the visible window without model calls or writes', async t => {
  const f = fixture({ previewChars: 10, maxVisibleNodes: 2 }); t.after(() => f.close());
  const revision = f.session.seq, before = f.session.snapshotEvents().length;
  const latest = await f.manager.inspect(f.session.id);
  const result = await f.manager.find(f.session.id, 'confirmed REQUIREMENT', signal());
  assert.equal(result.total, 4); assert.equal(result.revision, revision);
  const first = result.hits[0];
  assert.equal(latest.rows.some(row => row.seq === first.seq), false);
  assert.ok(first.snippet.toLowerCase().includes('confirmed requirement'));
  const earlier = await f.manager.inspect(f.session.id, first.seq);
  assert.ok(earlier.rows.some(row => row.seq === first.seq));
  assert.equal(earlier.rows.length, 2); assert.equal(earlier.hiddenBefore, 0); assert.equal(earlier.hiddenAfter, 7);
  assert.equal(f.session.snapshotEvents().length, before); assert.equal(f.state.calls.length, 0);
});

test('find treats metacharacters and markup as literal text, and returns protected matches without enabling edits', async t => {
  const f = fixture(); t.after(() => f.close());
  f.session.append('user/message', user('needle [a+b].*? <img src=x> NEEDLE [A+B].*?'), { surfaceOp: 'append' });
  for (const query of ['[a+b].*?', '<img src=x>', 'NEEDLE']) {
    const result = await f.manager.find(f.session.id, query, signal());
    assert.equal(result.total, 1); assert.equal(result.hits[0].seq, f.session.surface.nodes.at(-1));
  }
  const system = await f.manager.find(f.session.id, 'Follow the user requirements.', signal());
  assert.equal(system.total, 1); assert.equal(system.hits[0].protected, true);
});

test('find never resurrects discarded raw history and bounds result payloads', async t => {
  const f = fixture({ maxSearchResults: 2 }); t.after(() => f.close());
  const result = await f.manager.find(f.session.id, 'confirmed', signal());
  assert.equal(result.total, 8); assert.equal(result.hits.length, 2); assert.equal(result.truncated, true);
  const draft = await f.manager.preview({ ...f.request, mode: 'exclude' }, signal());
  await f.manager.apply({ sessionId: f.session.id, draftId: draft.draftId }, signal());
  assert.equal((await f.manager.find(f.session.id, 'TURN_2', signal())).total, 0);
  assert.ok(f.session.snapshotEvents().some(event => event.type === 'user/message' && event.data.content.some(block => block.text?.includes('TURN_2'))));
});

test('find validates query and anchors, honors cancellation, and preserves surface order after compaction', async t => {
  const f = fixture(); t.after(() => f.close());
  for (const query of ['', null, 'x'.repeat(257)]) await assert.rejects(f.manager.find(f.session.id, query, signal()), error => error.code === 'invalid-query');
  await assert.rejects(f.manager.inspect(f.session.id, -1), error => error.code === 'stale-selection');
  await assert.rejects(f.manager.inspect(f.session.id, '1'), error => error.code === 'invalid-selection');
  const abort = new AbortController(); abort.abort();
  await assert.rejects(f.manager.find(f.session.id, 'confirmed', abort.signal));
  const draft = await f.manager.preview(f.request, signal());
  await f.manager.apply({ sessionId: f.session.id, draftId: draft.draftId, summary: 'confirmed checkpoint' }, signal());
  const hits = (await f.manager.find(f.session.id, 'confirmed', signal())).hits;
  assert.deepEqual(hits.map(hit => hit.seq), [...f.session.surface.nodes].filter(seq => seq !== f.session.surface.nodes[0]));
  assert.ok(hits[2].seq > hits[3].seq);
});
