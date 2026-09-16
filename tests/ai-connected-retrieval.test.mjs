import test from 'node:test';
import assert from 'node:assert/strict';

// Parent can move this file into tests/ and set ROOT to new URL('../', import.meta.url).
const ROOT = new URL('../', import.meta.url);
const { retrieveUnifiedKnowledge } = await import(new URL('shift-brain-v1.js', ROOT));
const { askTimberRoutes } = await import(new URL('ask-timber-v1.js', ROOT));
const STALE = 'STALE_STATUS_SENTINEL Foundayo is awaiting UK approval; this archived side effects account must not override current evidence.';
const OLD_URL = 'https://example.org/archived-medicine-status';

function graphRow(id, content, extra = {}) {
  return { id, label: 'Foundayo context', domain: 'health', data_json: JSON.stringify({ summary: content }),
    updated_at: '2025-01-01T00:00:00Z', source_type: 'primary', source_ref: OLD_URL,
    authority: 100, verified_at: '2025-01-01T00:00:00Z', expires_at: null,
    provenance_json: '{}', ...extra };
}
const legacyRow = { id: 1, document_id: 2, content: STALE, title: 'Foundayo side effects and UK position',
  source_uri: OLD_URL, trust_tier: 1, status: 'approved' };

function fakeDB(t, { graph = [graphRow('radar:old-foundayo', STALE)], legacy = [legacyRow], missingMonitor = false } = {}) {
  const queries = [];
  const DB = {
    prepare(sql) {
      queries.push(sql);
      assert.match(sql.trim(), /^SELECT\b/i, 'grounding must remain read-only');
      if (missingMonitor && sql.includes('medicines_watch_checks')) throw new Error('no such table');
      const result = sql.includes('FROM shift_knowledge_nodes') ? graph
        : sql.includes('FROM ai_knowledge_chunks') ? legacy : [];
      const statement = { bind: () => statement, all: async () => ({ results: result }), first: async () => null };
      return statement;
    },
    exec(sql) { queries.push(sql); throw new Error('grounding attempted a write'); },
  };
  t.after(() => assert.ok(queries.every(sql => /^SELECT\b/i.test(sql.trim()))));
  return { DB, queries };
}

async function ask(DB, message) {
  const calls = [];
  const env = { DB, AI: { run: async (model, options) => {
    calls.push({ model, ...options });
    return { response: JSON.stringify({ answer: 'The current evidence needs checking. [1]',
      keyPoints: [], nextSteps: [], followUps: [], confidence: 'high', limitations: 'See the source review status.' }) };
  } } };
  const request = new Request('https://shiftsometimber.co.uk/v1/ai/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://shiftsometimber.co.uk' },
    body: JSON.stringify({ message }),
  });
  const response = await askTimberRoutes(request, env);
  assert.equal(response.status, 200);
  return { body: await response.json(), calls, prompt: calls.flatMap(call => call.messages).map(m => m.content).join('\n') };
}

test('ordinary purchase and launch questions cannot retrieve stale graph or legacy medicine status', async t => {
  const { DB } = fakeDB(t);
  for (const query of ['Can I buy Foundayo?', 'Has retatrutide been released?', 'Has Foundayo launched in the UK?']) {
    const items = await retrieveUnifiedKnowledge(DB, query, 12);
    assert.ok(items.length, query);
    assert.ok(items.every(item => item.sourceWorld === 'medicines_watch'), query);
    assert.ok(!JSON.stringify(items).includes('STALE_STATUS_SENTINEL'), query);
    assert.ok(items.every(item => item.provenance.every(p => p.ref !== OLD_URL)), query);
  }
});

test('mixed-medicine formulation qualifiers remain attached to the correct medicine', async t => {
  const { DB } = fakeDB(t, { graph: [], legacy: [] });
  for (const [query, expected] of [
    ['Compare availability of Mounjaro pens and oral semaglutide', ['mounjaro', 'wegovy-tablet']],
    ['Compare availability of Wegovy injection and Foundayo tablet', ['foundayo', 'wegovy-injection']],
  ]) {
    const items = await retrieveUnifiedKnowledge(DB, query, 12);
    assert.deepEqual([...new Set(items.map(item => item.medicineId))].sort(), expected);
  }
});

test('compound Ask Timber status questions cannot reintroduce stale evidence through a secondary request part', async t => {
  const { DB } = fakeDB(t);
  const { body, calls, prompt } = await ask(DB, 'Is Foundayo approved and what side effects might I have?');
  assert.equal(calls.length, 1, 'test must inspect the actual model request');
  assert.match(prompt, /what side effects might I have/i, 'the full user question remains visible');
  assert.ok(!prompt.includes('STALE_STATUS_SENTINEL'));
  assert.ok(!prompt.includes(OLD_URL));
  assert.ok(body.sources.length);
  assert.ok(body.sources.every(item => item.citation.includes('medicines-watch:foundayo:')));
  assert.ok(body.sources.every(item => item.url !== OLD_URL));
});

test('unavailable medicine evidence stays status-only in the model prompt and caps claimed confidence', async t => {
  const { DB } = fakeDB(t, { missingMonitor: true });
  const { body, calls, prompt } = await ask(DB, 'Can I buy Foundayo?');
  assert.equal(calls.length, 1);
  assert.match(prompt, /not currently verified|unavailable/i);
  assert.match(prompt, /not confirm.*(?:stock|private availability|price)/i);
  assert.ok(!prompt.includes('STALE_STATUS_SENTINEL'));
  assert.equal(body.confidence, 'low', 'model-claimed high confidence cannot override missing evidence');
  assert.ok(body.sources.every(item => item.reviewState === 'unavailable'));
});

test('a graph node identified as a Watch copy is excluded across every joined provenance row', async t => {
  const watchUrl = 'https://shiftsometimber.co.uk/treatment-centre/medicines-watch';
  const copied = [
    graphRow('cms:copied-reference', STALE, { source_ref: watchUrl }),
    graphRow('cms:copied-reference', STALE, { source_ref: 'https://www.gov.uk/old-reference' }),
  ];
  for (const ordered of [copied, [...copied].reverse()]) {
    const { DB } = fakeDB(t, { graph: ordered, legacy: [] });
    const items = await retrieveUnifiedKnowledge(DB, 'Tell me about Foundayo', 12);
    assert.ok(!items.some(item => item.id === 'graph:cms:copied-reference'));
    assert.ok(!JSON.stringify(items).includes('STALE_STATUS_SENTINEL'));
  }
});

test('expired and invalid-dated graph sources cannot survive or pollute a valid node’s provenance', async t => {
  const expired = '2000-01-01T00:00:00Z', future = '2099-01-01T00:00:00Z';
  const graph = [
    graphRow('expired', 'EXPIRED_SENTINEL Foundayo context', { expires_at: expired }),
    graphRow('invalid-date', 'INVALID_DATE_SENTINEL Foundayo context', { expires_at: 'not-a-date' }),
    graphRow('mixed-validity', 'CURRENT_REFERENCE Foundayo context', { source_ref: 'https://example.org/expired', expires_at: expired }),
    graphRow('mixed-validity', 'CURRENT_REFERENCE Foundayo context', { source_ref: 'https://example.org/current', authority: 95, expires_at: future }),
  ];
  const { DB } = fakeDB(t, { graph, legacy: [] });
  const items = await retrieveUnifiedKnowledge(DB, 'Foundayo context', 12);
  assert.ok(!items.some(item => ['graph:expired', 'graph:invalid-date'].includes(item.id)));
  const current = items.find(item => item.id === 'graph:mixed-validity');
  assert.ok(current, 'a valid unrelated reviewed source remains available');
  assert.deepEqual(current.provenance.map(p => p.ref), ['https://example.org/current']);
});

test('source authority alone cannot make unrelated old health material relevant', async t => {
  const { DB } = fakeDB(t);
  const items = await retrieveUnifiedKnowledge(DB, 'cooking potato wedges', 12);
  assert.deepEqual(items, []);
});
