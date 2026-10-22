import { ContextError, ContextManager } from './context.js';

export const name = 'context-manager';
export const inject = ['connection', 'sessionController', 'sessionQuery', 'sessions', 'tokenMeter', 'llm'];
const PATH = '/api/context-manager';

/** The DSH bridge uses an internal Request URL and retains the real Host header. */
function sameOrigin(req, url) {
  const origin = req.headers.get('Origin');
  if (!origin) return true;
  try {
    const source = new URL(origin);
    const destination = new URL(source.protocol + '//' + (req.headers.get('Host') ?? url.host));
    return ['http:', 'https:'].includes(source.protocol) && source.origin === destination.origin;
  } catch (error) {
    return false;
  }
}

/** Authenticated host fetch route; JSON writes require a same-origin custom header. */
export function apply(ctx, config = {}) {
  const manager = new ContextManager(ctx, config);
  ctx.effect(() => () => manager.dispose());
  ctx.effect(() => ctx.connection.fetch.register({
    path: PATH, methods: ['GET', 'POST'], requestBody: 'buffered',
    async fetch(req) {
      const send = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
      const url = new URL(req.url);
      if (req.method !== 'GET' && req.method !== 'POST') return send(405, { error: { code: 'method-not-allowed' } });
      if (req.method === 'POST' && (req.headers.get('X-DSH-Context-Manager') !== '1' || !req.headers.get('Content-Type')?.toLowerCase().startsWith('application/json') || !sameOrigin(req, url))) return send(403, { error: { code: 'invalid-origin' } });
      const task = (async () => {
        if (req.method === 'GET') return manager.inspect(url.searchParams.get('sessionId'));
        const raw = await req.text();
        if (Buffer.byteLength(raw) > manager.config.maxSummaryChars * 4 + 20000) throw new ContextError('request-too-large');
        let body;
        try { body = JSON.parse(raw); } catch (error) { throw new ContextError('invalid-request', error.message); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ContextError('invalid-request');
        if (body.action === 'selection') return manager.selection(body.sessionId, body.startSeq, body.endSeq);
        if (body.action === 'inspect') return manager.inspect(body.sessionId, body.anchorSeq);
        if (body.action === 'find') return manager.find(body.sessionId, body.query, req.signal);
        if (body.action === 'preview') return manager.preview(body, req.signal);
        if (body.action === 'apply') return manager.apply(body, req.signal);
        if (body.action === 'discard') return manager.discard(body.sessionId, body.draftId);
        if (body.action === 'import-list') return manager.imports.list(body, req.signal);
        if (body.action === 'import-source') return manager.imports.source(body, req.signal);
        if (body.action === 'import-selection') return manager.imports.selection(body, req.signal);
        if (body.action === 'import-preview') return manager.imports.preview(body, req.signal);
        throw new ContextError('invalid-action');
      })();
      manager.pending.add(task);
      try { return send(200, await task); }
      catch (error) {
        const expected = error instanceof ContextError;
        if (!expected) ctx.logger.warn('context-manager request failed', error);
        const code = expected ? error.code : error.name === 'AbortError' || error.name === 'TimeoutError' ? 'cancelled' : 'operation-failed';
        return send(['busy', 'stale-selection', 'draft-expired'].includes(code) ? 409 : 400, { error: { code, changed: expected && error.changed } });
      } finally { manager.pending.delete(task); }
    },
  }));
}
