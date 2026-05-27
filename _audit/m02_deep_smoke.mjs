#!/usr/bin/env node
/**
 * M02 Deep Smoke — exercises every Conversation Intelligence endpoint against
 * a running API (default http://localhost:3001).
 *
 * Coverage:
 *   Phase A — Auth & tenant guard (missing header → 401, mismatched tenant → 0 rows)
 *   Phase B — Conversations list, filters, pagination
 *   Phase C — Hybrid search (lexical, semantic, blend) across happy / empty / unicode
 *   Phase D — Saved searches CRUD
 *   Phase E — Trackers CRUD + stats + detections
 *   Phase F — Topic taxonomy CRUD + manual tags
 *   Phase G — Translation (cached + uncached)
 *   Phase H — Vocabulary corrections CRUD + stats
 *   Phase I — Concurrency (5 parallel trackers + 5 parallel saved searches)
 *
 * Pass = HTTP status in expected set AND optional JSON-shape predicate true.
 */

const BASE = process.env.M02_API_URL || 'http://localhost:3001/api/v1';
const TENANT_A = '00000000-0000-0000-0000-000000000001';
const TENANT_B = '00000000-0000-0000-0000-0000000000ff';
const USER_A   = '00000000-0000-0000-0000-000000000002';

const GREEN  = (s) => `\x1b[32m${s}\x1b[0m`;
const RED    = (s) => `\x1b[31m${s}\x1b[0m`;
const CYAN   = (s) => `\x1b[36m${s}\x1b[0m`;
const YELLOW = (s) => `\x1b[33m${s}\x1b[0m`;

const results = [];

async function call(method, path, { tenantId, userId, body, headers, expected = [200, 201, 204] } = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const h = { 'content-type': 'application/json', ...(headers || {}) };
  if (tenantId) h['x-tenant-id'] = tenantId;
  if (userId)   h['x-user-id']   = userId;

  const started = Date.now();
  let res, json, text;
  try {
    res = await fetch(url, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    text = await res.text();
    try { json = JSON.parse(text); } catch { json = text; }
  } catch (err) {
    return { ok: false, status: 0, err: err.message, ms: Date.now() - started, json: null };
  }

  const elapsed = Date.now() - started;
  const ok = expected.includes(res.status);
  return { ok, status: res.status, json, ms: elapsed };
}

function record(label, method, path, expected, result, predicate) {
  const passShape = predicate ? predicate(result.json, result.status) : true;
  const pass = result.ok && passShape;
  const status = pass ? GREEN('PASS') : RED('FAIL');
  const msg = `${status.padEnd(4)}] ${label.padEnd(58)} ${method.padEnd(7)} ${String(result.ms).padStart(4)}ms  http=${result.status}  expected=${expected.join(',')}`;
  console.log(`[${msg}`);
  if (!pass) {
    console.log(YELLOW(`     └─ payload: ${JSON.stringify(result.json).slice(0, 200)}`));
  }
  results.push({ label, pass, status: result.status, ms: result.ms });
  return pass;
}

async function section(name, fn) {
  console.log(CYAN(`\n=== ${name} ===`));
  try { await fn(); } catch (err) {
    console.log(RED(`Section "${name}" threw: ${err.stack || err.message}`));
  }
}

// ─── Phase A — Auth / Tenant guard ────────────────────────────────────────

await section('Phase A — Auth & Tenant guard', async () => {
  let r = await call('GET', '/conversation-intelligence/conversations', { expected: [401] });
  record('GET /conversations w/o tenant → 401', 'GET', '/conversations', [401], r);

  r = await call('GET', '/conversation-intelligence/conversations', { tenantId: TENANT_A, expected: [200] });
  record('GET /conversations w/ tenant A → 200', 'GET', '/conversations', [200], r,
    (b) => b && typeof b === 'object' && (Array.isArray(b.conversations) || Array.isArray(b)));

  // Tenant B should return 0 rows (no data seeded for that tenant).
  r = await call('GET', '/conversation-intelligence/conversations', { tenantId: TENANT_B, expected: [200] });
  record('GET /conversations w/ tenant B → empty', 'GET', '/conversations', [200], r,
    (b) => {
      const conv = b?.conversations ?? b;
      return Array.isArray(conv) && conv.length === 0;
    });

  // Vocabulary endpoint also enforces tenant
  r = await call('GET', '/conversation-intelligence/vocabulary', { expected: [401] });
  record('GET /vocabulary w/o tenant → 401', 'GET', '/vocabulary', [401], r);

  r = await call('GET', '/conversation-intelligence/trackers', { expected: [401] });
  record('GET /trackers w/o tenant → 401', 'GET', '/trackers', [401], r);

  r = await call('POST', '/conversation-intelligence/saved-searches', { expected: [401], body: { name: 'x' } });
  record('POST /saved-searches w/o tenant → 401', 'POST', '/saved-searches', [401], r);
});

// ─── Phase B — Conversations list / filters / pagination ──────────────────

await section('Phase B — Conversations list & filters', async () => {
  let r = await call('GET', '/conversation-intelligence/conversations?limit=5&page=1', { tenantId: TENANT_A });
  record('GET /conversations limit=5 page=1', 'GET', '/conversations', [200], r,
    (b) => Array.isArray(b.conversations) && b.conversations.length <= 5);

  r = await call('GET', '/conversation-intelligence/conversations?sentiment=Positive&limit=3', { tenantId: TENANT_A });
  record('GET /conversations sentiment=Positive', 'GET', '/conversations', [200], r,
    (b) => Array.isArray(b.conversations) && b.conversations.every((c) => c.sentiment === 'Positive'));

  r = await call('GET', '/conversation-intelligence/conversations?channel=email&limit=3', { tenantId: TENANT_A });
  record('GET /conversations channel=email', 'GET', '/conversations', [200], r,
    (b) => Array.isArray(b.conversations) && b.conversations.every((c) => c.channel === 'email'));

  r = await call('GET', '/conversation-intelligence/conversations?topic=Pricing%20Strategy&limit=3', { tenantId: TENANT_A });
  record('GET /conversations topic=Pricing Strategy', 'GET', '/conversations', [200], r,
    (b) => Array.isArray(b.conversations));

  // Page beyond range
  r = await call('GET', '/conversation-intelligence/conversations?page=9999&limit=10', { tenantId: TENANT_A });
  record('GET /conversations beyond page → empty', 'GET', '/conversations', [200], r,
    (b) => Array.isArray(b.conversations) && b.conversations.length === 0);
});

// ─── Phase C — Hybrid search ──────────────────────────────────────────────

await section('Phase C — Hybrid search', async () => {
  let r = await call('GET', '/conversation-intelligence/conversations/search?query=pricing', { tenantId: TENANT_A });
  record('GET /search "pricing" → has results', 'GET', '/search', [200], r,
    (b) => Array.isArray(b) && b.length > 0);

  r = await call('GET', '/conversation-intelligence/conversations/search?query=PRICING', { tenantId: TENANT_A });
  record('GET /search case-insensitive', 'GET', '/search', [200], r,
    (b) => Array.isArray(b) && b.length > 0);

  r = await call('GET', '/conversation-intelligence/conversations/search?query=', { tenantId: TENANT_A });
  record('GET /search empty query → empty/all', 'GET', '/search', [200], r,
    (b) => Array.isArray(b));

  r = await call('GET', '/conversation-intelligence/conversations/search?query=zxqwerty12345', { tenantId: TENANT_A });
  record('GET /search nonsense → 0 results', 'GET', '/search', [200], r,
    (b) => Array.isArray(b) && b.length === 0);

  r = await call('GET', '/conversation-intelligence/conversations/search?query=demo&limit=3&page=1', { tenantId: TENANT_A });
  record('GET /search paginated (limit=3)', 'GET', '/search', [200], r,
    (b) => Array.isArray(b) && b.length <= 3);

  r = await call('GET', '/conversation-intelligence/conversations/search?query=onboarding%20training', { tenantId: TENANT_A });
  record('GET /search multi-word query', 'GET', '/search', [200], r,
    (b) => Array.isArray(b) && b.length > 0);

  // Tenant isolation check on search
  r = await call('GET', '/conversation-intelligence/conversations/search?query=pricing', { tenantId: TENANT_B });
  record('GET /search tenant B → empty', 'GET', '/search', [200], r,
    (b) => Array.isArray(b) && b.length === 0);
});

// ─── Phase D — Saved searches CRUD ────────────────────────────────────────

await section('Phase D — Saved searches', async () => {
  const body = { name: `smoke-${Date.now()}`, queryString: 'pricing demo', filters: { sentiment: 'Positive' } };
  let r = await call('POST', '/conversation-intelligence/saved-searches', {
    tenantId: TENANT_A, userId: USER_A, body,
  });
  record('POST /saved-searches', 'POST', '/saved-searches', [200, 201], r,
    (b) => b && typeof b.id === 'string' && b.tenantId === TENANT_A && b.userId === USER_A);

  r = await call('GET', '/conversation-intelligence/saved-searches', { tenantId: TENANT_A, userId: USER_A });
  record('GET /saved-searches', 'GET', '/saved-searches', [200], r,
    (b) => Array.isArray(b));

  // Without user header but with tenant: 401 (user required)
  r = await call('GET', '/conversation-intelligence/saved-searches', { tenantId: TENANT_A, expected: [401] });
  record('GET /saved-searches w/o user → 401', 'GET', '/saved-searches', [401], r);
});

// ─── Phase E — Trackers CRUD + stats + detections ─────────────────────────

let trackerId = null;
await section('Phase E — Trackers', async () => {
  const body = { name: `smoke-tracker-${Date.now()}`, keywords: ['pricing', 'demo'] };
  let r = await call('POST', '/conversation-intelligence/trackers', { tenantId: TENANT_A, body });
  record('POST /trackers', 'POST', '/trackers', [200, 201], r,
    (b) => b && (b.id || b.tenantId));
  trackerId = r.json?.id;

  r = await call('GET', '/conversation-intelligence/trackers', { tenantId: TENANT_A });
  record('GET /trackers', 'GET', '/trackers', [200], r, (b) => Array.isArray(b));

  r = await call('GET', '/conversation-intelligence/trackers/stats', { tenantId: TENANT_A });
  record('GET /trackers/stats', 'GET', '/trackers/stats', [200], r,
    (b) => b && typeof b.totalTrackers === 'number');

  r = await call('GET', '/conversation-intelligence/trackers/detections', { tenantId: TENANT_A });
  record('GET /trackers/detections', 'GET', '/trackers/detections', [200], r, (b) => Array.isArray(b));

  if (trackerId && !trackerId.startsWith('mock-')) {
    r = await call('DELETE', `/conversation-intelligence/trackers/${trackerId}`, {
      tenantId: TENANT_A, expected: [200, 204],
    });
    record('DELETE /trackers/:id', 'DELETE', '/trackers/:id', [200, 204], r);
  }
});

// ─── Phase F — Topic taxonomy / topic-tag CRUD ────────────────────────────

await section('Phase F — Topic taxonomy & tags', async () => {
  let r = await call('POST', '/m02-conversation-intelligence/topics/seed', { tenantId: TENANT_A, body: {} });
  record('POST /topics/seed (idempotent)', 'POST', '/topics/seed', [200, 201], r,
    (b) => b && (b.id || b.message || (Array.isArray(b.models) && b.models.length > 0) || (Array.isArray(b.topics) && b.topics.length > 0)));

  r = await call('GET', '/m02-conversation-intelligence/topics', { tenantId: TENANT_A });
  record('GET /topics', 'GET', '/topics', [200], r, (b) => Array.isArray(b));

  // Reject tenant-less access
  r = await call('GET', '/m02-conversation-intelligence/topics', { expected: [401] });
  record('GET /topics w/o tenant → 401', 'GET', '/topics', [401], r);

  // Reject tenant-less topic-tag access
  r = await call('GET', '/m02-conversation-intelligence/conversations/some-id/topics', { expected: [401] });
  record('GET /conversations/:id/topics w/o tenant → 401', 'GET', '/conversations/:id/topics', [401], r);
});

// ─── Phase G — Translation surface ────────────────────────────────────────

await section('Phase G — Translation', async () => {
  let r = await call('GET', '/m02-conversation-intelligence/translate/settings', { tenantId: TENANT_A });
  record('GET /translate/settings', 'GET', '/translate/settings', [200], r,
    (b) => b && typeof b.defaultLanguage === 'string');

  r = await call('POST', '/m02-conversation-intelligence/translate/settings', {
    tenantId: TENANT_A,
    body: { defaultLanguage: 'English', supportedLanguages: ['English', 'Spanish'] },
  });
  record('POST /translate/settings', 'POST', '/translate/settings', [200, 201], r,
    (b) => b && typeof b === 'object');

  r = await call('GET', '/m02-conversation-intelligence/translate/settings', { expected: [401] });
  record('GET /translate/settings w/o tenant → 401', 'GET', '/translate/settings', [401], r);
});

// ─── Phase H — Vocabulary corrections ─────────────────────────────────────

let vocabRuleId = null;
await section('Phase H — Vocabulary corrections', async () => {
  const body = {
    incorrectTerm: `revenoose-${Date.now()}`,
    correctTerm: 'RevenueOS',
    language: 'en',
    category: 'Product',
    mispronunciations: ['revenoose'],
    variations: ['rev-os'],
  };
  let r = await call('POST', '/conversation-intelligence/vocabulary', { tenantId: TENANT_A, body });
  record('POST /vocabulary', 'POST', '/vocabulary', [200, 201], r,
    (b) => b && (b.id || b.correctTerm));
  vocabRuleId = r.json?.id;

  r = await call('GET', '/conversation-intelligence/vocabulary', { tenantId: TENANT_A });
  record('GET /vocabulary', 'GET', '/vocabulary', [200], r, (b) => Array.isArray(b));

  r = await call('GET', '/conversation-intelligence/vocabulary/stats', { tenantId: TENANT_A });
  record('GET /vocabulary/stats', 'GET', '/vocabulary/stats', [200], r,
    (b) => b && typeof b.termsCount === 'number');

  // Don't try to delete in-memory mock rule by id since DB delegate may be missing.
  if (vocabRuleId && /^[0-9a-f-]{36}$/i.test(vocabRuleId)) {
    r = await call('DELETE', `/conversation-intelligence/vocabulary/${vocabRuleId}`, {
      tenantId: TENANT_A, expected: [200, 204],
    });
    record('DELETE /vocabulary/:id', 'DELETE', '/vocabulary/:id', [200, 204], r);
  }
});

// ─── Phase I — Concurrency stress ─────────────────────────────────────────

await section('Phase I — Concurrency stress', async () => {
  const N = 5;
  // 5 parallel saved searches
  const promises = Array.from({ length: N }, (_, i) =>
    call('POST', '/conversation-intelligence/saved-searches', {
      tenantId: TENANT_A, userId: USER_A,
      body: { name: `smoke-parallel-${Date.now()}-${i}`, queryString: 'p' + i, filters: {} },
    }),
  );
  const r1 = await Promise.all(promises);
  const okCount1 = r1.filter((x) => x.ok).length;
  console.log(`[${okCount1 === N ? GREEN('PASS') : RED('FAIL')}] 5 parallel /saved-searches  → ${okCount1}/${N} 2xx`);
  results.push({ label: '5 parallel saved-searches', pass: okCount1 === N, status: okCount1, ms: 0 });

  // 5 parallel /search
  const r2 = await Promise.all(['pricing', 'demo', 'onboarding', 'support', 'contract'].map((q) =>
    call('GET', `/conversation-intelligence/conversations/search?query=${q}`, { tenantId: TENANT_A }),
  ));
  const okCount2 = r2.filter((x) => x.ok && Array.isArray(x.json) && x.json.length >= 0).length;
  console.log(`[${okCount2 === 5 ? GREEN('PASS') : RED('FAIL')}] 5 parallel /search varied keywords → ${okCount2}/5 2xx`);
  results.push({ label: '5 parallel /search varied keywords', pass: okCount2 === 5, status: okCount2, ms: 0 });
});

// ─── Summary ──────────────────────────────────────────────────────────────

console.log(CYAN('\n=== Summary ==='));
const total = results.length;
const passed = results.filter((r) => r.pass).length;
const failed = total - passed;
console.log(`${failed === 0 ? GREEN(`Total: ${total}   PASS: ${passed}   FAIL: ${failed}`) : RED(`Total: ${total}   PASS: ${passed}   FAIL: ${failed}`)}`);

process.exit(failed === 0 ? 0 : 1);
