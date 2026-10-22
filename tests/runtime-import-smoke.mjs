import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const url = new URL(process.env.DSH_TEST_URL);
assert.equal(url.hostname, '127.0.0.1');
const exchange = await fetch(url, { redirect: 'manual' });
const cookie = exchange.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
assert.ok(cookie);
const headers = { Cookie: cookie, Origin: url.origin, 'Content-Type': 'application/json', 'X-DSH-Context-Manager': '1', 'X-Context-Fixture': '1' };
async function api(body, path = '/api/context-manager') {
  const response = await fetch(new URL(path, url), { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify(result));
  return result;
}
const sessionId = 'context-manager-smoke', sourceSessionId = 'context-manager-import-source';
const list = await api({ action: 'import-list', sessionId });
assert.ok(list.items.some(item => item.sessionId === sourceSessionId));
const source = await api({ action: 'import-source', sessionId, sourceSessionId });
assert.ok(source.rows.some(row => row.preview.includes('导入来源第 1 轮')));
let state = await api(null, '/api/context-fixture');
if (state.persistedImports < 2) {
  const req = { sessionId, sourceSessionId, sourceRevision: source.revision, instructions: '' };
  const raw = await api({ ...req, action: 'import-preview', scope: 'all', mode: 'original' });
  assert.equal(raw.modelCalls, 0);
  assert.equal((await api(null, '/api/context-fixture')).persistedImports, state.persistedImports);
  await api({ sessionId, action: 'apply', draftId: raw.draftId });
  const partial = await api({ ...req, action: 'import-preview', scope: 'range', mode: 'summarize', startSeq: source.rows[0].seq, endSeq: source.rows[1].seq });
  assert.equal(partial.summarized, true); assert.ok(partial.modelCalls > 0);
  await api({ sessionId, action: 'apply', draftId: partial.draftId, summary: partial.summary });
}
assert.equal((await api({ action: 'import-source', sessionId, sourceSessionId })).revision, source.revision);
state = await api({ continue: true }, '/api/context-fixture');
assert.ok(state.persistedImports >= 2);
assert.ok(state.rows.filter(row => row.source === 'session-reference').length >= 2);
assert.equal(state.lastRequestContainsImported, true);
const report = { verifiedAt: new Date().toISOString(), nativePersistedImports: state.persistedImports,
  sourceUnchanged: true, actualNextRequestContainsImportedSnapshot: true, originalAndCompressedImports: true };
await writeFile(new URL('../docs/runtime-import-result.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
