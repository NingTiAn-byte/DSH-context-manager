import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const url = new URL(process.env.DSH_TEST_URL);
assert.equal(url.hostname, '127.0.0.1');
const exchange = await fetch(url, { redirect: 'manual' });
const cookie = exchange.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
const headers = { Cookie: cookie, Origin: url.origin, 'Content-Type': 'application/json', 'X-DSH-Context-Manager': '1', 'X-Context-Fixture': '1' };
async function api(body, path = '/api/context-manager') {
  const response = await fetch(new URL(path, url), { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify(result));
  return result;
}
const sessionId = 'context-manager-smoke', query = '第 1 轮测试需求';
const before = await api(null, '/api/context-fixture');
const found = await api({ action: 'find', sessionId, query });
assert.deepEqual((await api(null, '/api/context-fixture')).rows, before.rows);
if (found.hits.length) {
  assert.equal(found.total, 1);
  const hit = found.hits[0]; assert.equal(hit.protected, false);
  const window = await api({ action: 'inspect', sessionId, anchorSeq: hit.seq });
  assert.ok(window.rows.some(row => row.seq === hit.seq));
  const preview = await api({ action: 'preview', sessionId, startSeq: hit.seq, endSeq: hit.seq, mode: 'summarize', instructions: '' });
  assert.deepEqual((await api(null, '/api/context-fixture')).rows, before.rows);
  await api({ action: 'apply', sessionId, draftId: preview.draftId, summary: preview.summary });
}
assert.equal((await api({ action: 'find', sessionId, query })).total, 0);
const state = await api({ continue: true }, '/api/context-fixture');
assert.equal(state.rawUser1Retained, true); assert.equal(state.persistedSummary, true);
assert.equal(state.lastRequestContainsUser1, false);
const report = { verifiedAt: new Date().toISOString(), fullTextFindWithoutMutation: true, manualSummaryApplied: true,
  rawHistoryRetained: true, nextModelRequestExcludesCompactedOriginal: true };
await writeFile(new URL('../docs/runtime-find-result.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
