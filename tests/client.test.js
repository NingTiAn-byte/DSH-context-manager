import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { apply as applyHost } from '../index.js';
import { fixture, text } from './fixture.js';
import { EXCLUSION_TEXT } from '../context.js';

async function mountView(t, config = {}) {
  const f = fixture(config);
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
  const previous = { window: globalThis.window, document: globalThis.document, act: globalThis.IS_REACT_ACT_ENVIRONMENT };
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.HTMLElement.prototype.getClientRects = function () { return this.closest('[hidden]') ? [] : [{}]; };
  const { createRoot } = await import('react-dom/client');
  let route; const disposers = [];
  applyHost({ ...f.host, logger: { warn() {} }, effect(callback) { disposers.push(callback()); }, connection: { fetch: { register(value) { route = value; return () => { route = undefined; }; } } } }, config);
  let plugin, View, dictionary;
  let selectionGate;
  const sandbox = {
    window: { __ModuleLoader__: { load(definition) { plugin = definition.factory(name => { assert.equal(name, 'react'); return React; }); } } },
    AbortController, Date, Set, Object, encodeURIComponent,
    fetch: async (url, options) => {
      if (options.body && JSON.parse(options.body).action === 'selection') await selectionGate;
      return route.fetch(new Request('http://localhost' + url, options));
    },
  };
  vm.runInNewContext(await readFile(new URL('../client.js', import.meta.url), 'utf8'), sandbox);
  const translate = (key, values = {}) => {
    assert.ok(Object.hasOwn(dictionary, key), `Missing translation ${key}`);
    return dictionary[key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
  };
  plugin.apply({ effect(callback) { disposers.push(callback()); }, locale: { register(_ns, values) { dictionary = values.zh; return () => {}; }, bind() { return translate; } }, slots: {
    inject(name, callback) { assert.equal(name, 'conversation.view'); callback(); },
    register(options, component) { assert.equal(options.id, 'context-manager'); View = component; return () => {}; },
  } });
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(async () => root.unmount());
    for (const dispose of disposers.reverse()) await dispose?.();
    await f.close(); dom.window.close();
    globalThis.window = previous.window; globalThis.document = previous.document; globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act;
  });
  const settle = async () => act(async () => { await new Promise(resolve => setTimeout(resolve, 15)); });
  const click = async label => {
    const button = [...document.querySelectorAll('button')].find(node => node.getAttribute('aria-label') === label || node.textContent === label);
    assert.ok(button, `Missing button ${label}`); assert.equal(button.disabled, false);
    await act(async () => button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })));
    await settle();
  };
  await act(async () => root.render(React.createElement(View, { t: translate, sessionId: f.session.id, useSession: select => select({ running: false }) })));
  await settle();
  const type = async (input, value) => {
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, value);
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 190)); });
  };
  const key = async (key, options = {}) => {
    const event = new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
    await act(async () => (document.activeElement ?? dom.window).dispatchEvent(event));
    await settle(); return event;
  };
  return { f, dom, click, settle, type, key, gate(value) { selectionGate = value; } };
}

const selectedSeqs = selector => [...document.querySelectorAll(selector + ' article[data-selected="true"]')].map(node => Number(node.dataset.seq));

test('conversation tab keeps whole ranges highlighted during delayed validation, then compresses, excludes and imports', async t => {
  const { f, click, settle, gate } = await mountView(t);
  assert.ok(document.body.textContent.includes('管理当前会话上下文'));
  assert.equal(document.querySelectorAll('article').length, 9);
  const nodes = [...f.session.surface.nodes];
  const wait = Promise.withResolvers(); gate(wait.promise);
  await click('设为起点 节点 #' + nodes[3]);
  assert.deepEqual(selectedSeqs('.cm-list'), [nodes[3]]);
  await click('设为终点 节点 #' + nodes[6]);
  assert.deepEqual(selectedSeqs('.cm-list'), nodes.slice(3, 7));
  assert.equal(document.querySelector(`[aria-label="设为起点 节点 #${nodes[3]}"]`).getAttribute('aria-pressed'), 'true');
  wait.resolve(); gate(undefined); await settle();
  assert.deepEqual(selectedSeqs('.cm-list'), nodes.slice(3, 7));
  await click('设为终点 节点 #' + nodes[4]);
  assert.deepEqual(selectedSeqs('.cm-list'), nodes.slice(3, 5));
  assert.ok(document.body.textContent.includes('选中 2 个节点'));
  const before = f.session.deriveMessages().map(text);
  await click('生成压缩预览');
  assert.deepEqual(f.session.deriveMessages().map(text), before);
  const editor = document.querySelector('textarea.cm-summary');
  assert.ok(editor); assert.equal(editor.disabled, false); assert.equal(editor.value, f.state.summary);
  await click('应用摘要');
  assert.ok(document.body.textContent.includes('上下文已更新'));
  assert.equal(f.session.deriveMessages().length, before.length - 1);
  const checkpoint = f.session.surface.nodes[3];
  assert.ok(checkpoint > nodes[6]);
  await click('设为起点 节点 #' + checkpoint);
  await click('设为终点 节点 #' + nodes[6]);
  assert.deepEqual(selectedSeqs('.cm-list'), [checkpoint, nodes[5], nodes[6]]);
  await click('设为起点 节点 #' + nodes[1]);
  await click('设为终点 节点 #' + nodes[2]);
  await click('预览排除');
  assert.ok(document.body.textContent.includes('应用后，选区原文不再随上下文发送'));
  await click('应用排除');
  assert.ok(f.session.deriveMessages().map(text).includes(EXCLUSION_TEXT));
  assert.equal(f.state.calls.length, 1);
  assert.ok(!document.querySelector('[role="alert"]'));
  await click('从其他对话导入');
  await click('来源测试对话');
  const sourceNodes = f.source.surface.nodes.slice(1);
  await click('导入起点 #' + sourceNodes[2]);
  await click('导入终点 #' + sourceNodes[5]);
  assert.deepEqual(selectedSeqs('.cm-import-list'), sourceNodes.slice(2, 6));
  assert.equal(document.querySelector(`[aria-label="导入起点 #${sourceNodes[2]}"]`).getAttribute('aria-pressed'), 'true');
  await click('导入终点 #' + sourceNodes[3]);
  assert.deepEqual(selectedSeqs('.cm-import-list'), sourceNodes.slice(2, 4));
  assert.ok(document.body.textContent.includes('选中 2 条'));
  const beforeImport = f.session.deriveMessages().map(text);
  await click('预览原文导入');
  assert.deepEqual(f.session.deriveMessages().map(text), beforeImport);
  assert.ok(document.body.textContent.includes('来源 来源测试对话 · 2 条'));
  await click('确认加入当前对话');
  assert.equal(f.session.deriveMessages().at(-1).source.kind, 'session-reference');
  assert.ok(text(f.session.deriveMessages().at(-1)).includes('TURN_2'));
  assert.ok(!text(f.session.deriveMessages().at(-1)).includes('TURN_1'));
  assert.ok(document.body.textContent.includes('来源快照已加入当前上下文'));
  await click('预览压缩导入');
  assert.equal(document.querySelector('textarea[aria-label="导入预览"]').value, f.state.summary);
  await click('确认加入当前对话');
  assert.ok(text(f.session.deriveMessages().at(-1)).includes(f.state.summary));
  assert.ok(!document.querySelector('[role="alert"]'));
});

test('Ctrl+F searches full text, navigates matches and preserves manual range selection through compression', async t => {
  const { f, dom, click, type, key } = await mountView(t, { previewChars: 12 });
  const before = f.session.deriveMessages().map(text);
  const event = await key('f', { ctrlKey: true });
  assert.equal(event.defaultPrevented, true);
  const input = document.querySelector('input[aria-label="查找当前有效上下文"]');
  assert.equal(document.activeElement, input);
  await type(input, 'CONFIRMED requirement');
  assert.ok(document.body.textContent.includes('1 / 4 条匹配记录'));
  assert.equal(document.querySelector('.cm-search-excerpt mark').textContent.toLowerCase(), 'confirmed requirement');
  const nodes = [...f.session.surface.nodes];
  await click('匹配项设为起点');
  await key('Enter');
  assert.ok(document.body.textContent.includes('2 / 4 条匹配记录'));
  await click('匹配项设为终点');
  assert.deepEqual(selectedSeqs('.cm-list'), nodes.slice(1, 4));
  await key('Enter', { shiftKey: true });
  assert.ok(document.body.textContent.includes('1 / 4 条匹配记录'));
  await key('Escape');
  assert.equal(document.querySelector('input[aria-label="查找当前有效上下文"]'), null);
  assert.deepEqual(selectedSeqs('.cm-list'), nodes.slice(1, 4));
  assert.deepEqual(f.session.deriveMessages().map(text), before); assert.equal(f.state.calls.length, 0);
  await click('生成压缩预览'); await click('应用摘要');
  assert.equal(f.state.calls.length, 1);
  // Hidden tabs must leave the browser shortcut untouched.
  document.querySelector('.dsh-cm').hidden = true;
  assert.equal((await key('f', { ctrlKey: true })).defaultPrevented, false);
  document.querySelector('.dsh-cm').hidden = false;
  assert.equal((await key('f', { metaKey: true })).defaultPrevented, true);
  await type(document.querySelector('input[aria-label="查找当前有效上下文"]'), 'nothing_matches_123');
  assert.ok(document.body.textContent.includes('未找到匹配记录'));
  assert.ok(!document.querySelector('[role="alert"]'));
});

test('find loads an earlier context window and keeps a range selected across distant search hits', async t => {
  const { f, click, type, key } = await mountView(t, { maxVisibleNodes: 2, previewChars: 10 });
  const nodes = [...f.session.surface.nodes];
  assert.ok(!document.querySelector('.cm-list article[data-seq="' + nodes[1] + '"]'));
  await key('f', { ctrlKey: true });
  await type(document.querySelector('input[aria-label="查找当前有效上下文"]'), 'TURN_1');
  assert.ok(document.querySelector('.cm-list article[data-seq="' + nodes[1] + '"]'));
  await click('匹配项设为起点');
  await type(document.querySelector('input[aria-label="查找当前有效上下文"]'), 'TURN_4');
  await click('匹配项设为终点');
  assert.ok(document.body.textContent.includes('选中 7 个节点'));
  assert.deepEqual(selectedSeqs('.cm-list'), [nodes[6], nodes[7]]);
  await type(document.querySelector('input[aria-label="查找当前有效上下文"]'), 'TURN_1');
  assert.deepEqual(selectedSeqs('.cm-list'), [nodes[1]]);
});
