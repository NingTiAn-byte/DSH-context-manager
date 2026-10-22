import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { EXCLUSION_TEXT } from '../context.js';

// Run against the isolated DSH profile and test-only runtime-fixture plugin.
const url = new URL(process.env.DSH_TEST_URL);
assert.equal(url.hostname, '127.0.0.1');
const exchange = await fetch(url, { redirect: 'manual' });
const cookies = exchange.headers.getSetCookie().map(cookie => cookie.split(';')[0]).join('; ');
assert.ok(cookies);
const headers = { Cookie: cookies, Origin: url.origin, 'Content-Type': 'application/json', 'X-DSH-Context-Manager': '1' };
async function api(path, body) {
  const response = await fetch(new URL(path, url), { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify(result));
  return result;
}
const sessionId = 'context-manager-smoke';
let state = await api('/api/context-fixture');
for (const [turn, mode] of [[2, 'summarize'], [3, 'exclude']]) {
  const row = state.rows.find(row => row.text.startsWith(`第 ${turn} 轮测试需求`));
  if (!row) continue;
  const at = state.rows.indexOf(row), end = state.rows[at + 1];
  assert.equal(end.source, 'model');
  const draft = await api('/api/context-manager', { action: 'preview', sessionId, mode, instructions: '', startSeq: row.seq, endSeq: end.seq });
  await api('/api/context-manager', { action: 'apply', sessionId, draftId: draft.draftId, summary: draft.summary });
  state = await api('/api/context-fixture');
}
assert.ok(state.rows.some(row => row.source === 'compact-checkpoint'));
assert.ok(state.rows.some(row => row.text === EXCLUSION_TEXT));
assert.ok(state.rawUser2Retained && state.rawUser3Retained);
assert.ok(state.persistedSummary && state.persistedExclusion);
headers['X-Context-Fixture'] = '1';
state = await api('/api/context-fixture', { continue: true });
assert.equal(state.lastRequestObserved, true);
assert.equal(state.lastRequestContainsUser2, false);
assert.equal(state.lastRequestContainsUser3, false);
const report = { verifiedAt: new Date().toISOString(), nativePersistence: true, sourceRecordsRetained: true,
  actualNextRequestExcludesSelectedOriginals: true, effectiveNodeCount: state.rows.length };
await writeFile(new URL('../docs/runtime-smoke-result.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
