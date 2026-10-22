import test from 'node:test';
import assert from 'node:assert/strict';
import { apply } from '../index.js';
import { fixture } from './fixture.js';

test('host route supports preview/apply, rejects cross-origin writes and malformed bodies, and unregisters', async t => {
  const f = fixture(); t.after(() => f.close());
  let route; const disposers = [];
  const ctx = { ...f.host, logger: { warn() {} },
    effect(callback) { disposers.push(callback()); },
    connection: { fetch: { register(value) { route = value; return () => { route = undefined; }; } } },
  };
  apply(ctx);
  const send = (body, extra = {}) => route.fetch(new Request('http://localhost/api/context-manager', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-DSH-Context-Manager': '1', ...extra }, body: JSON.stringify(body),
  }));
  assert.equal((await route.fetch(new Request('http://localhost/api/context-manager?sessionId=fixture'))).status, 200);
  assert.equal((await send({ action: 'preview', ...f.request }, { Origin: 'http://attacker.invalid' })).status, 403);
  assert.equal((await send({ action: 'preview', ...f.request }, { 'X-DSH-Context-Manager': '' })).status, 403);
  assert.equal((await send(null)).status, 400);
  assert.equal((await send({ action: 'unknown' })).status, 400);
  const find = await send({ action: 'find', sessionId: f.session.id, query: 'TURN_1' });
  assert.equal(find.status, 200);
  const found = await find.json(); assert.equal(found.total, 1);
  const anchored = await send({ action: 'inspect', sessionId: f.session.id, anchorSeq: found.hits[0].seq });
  assert.equal(anchored.status, 200); assert.ok((await anchored.json()).rows.some(row => row.seq === found.hits[0].seq));
  const bridgeResponse = await route.fetch(new Request('http://dsh.internal/api/context-manager', {
    method: 'POST', headers: { Host: 'localhost:1234', Origin: 'http://localhost:1234', 'Content-Type': 'application/json', 'X-DSH-Context-Manager': '1' },
    body: JSON.stringify({ action: 'selection', sessionId: f.session.id, startSeq: f.request.startSeq, endSeq: f.request.endSeq }),
  }));
  assert.equal(bridgeResponse.status, 200);
  const response = await send({ action: 'preview', ...f.request, mode: 'exclude' });
  assert.equal(response.status, 200);
  const draft = await response.json();
  assert.equal((await send({ action: 'apply', sessionId: f.session.id, draftId: draft.draftId })).status, 200);
  assert.equal((await send({ action: 'apply', sessionId: f.session.id, draftId: draft.draftId })).status, 409);
  for (const dispose of disposers.reverse()) await dispose();
  assert.equal(route, undefined);
});
