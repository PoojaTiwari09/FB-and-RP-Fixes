/**
 * Backend smoke driver.
 *
 * Hits every mounted /api/v1/* endpoint with a sensible payload, records
 * HTTP status + body snippet, and writes a per-module result block.
 */
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:3001';
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const REP_ID = 'cu33333333rep333333';
const CALL_ID = 'cl0000000000acme01';
const NOTE_ID = 'cn0000000000acme01';

const HDR = {
  'content-type': 'application/json',
  'x-tenant-id': TENANT_ID,
  'x-user-id': REP_ID,
  authorization: 'Bearer dev-token',
};

async function call(method, url, body, opts = {}) {
  const t0 = Date.now();
  let status = 0;
  let snippet = '';
  let ok = false;
  try {
    const res = await fetch(BASE + url, {
      method,
      headers: HDR,
      body: body == null ? undefined : JSON.stringify(body),
    });
    status = res.status;
    const text = await res.text();
    snippet = text.slice(0, 300);
    ok = res.ok || (opts.acceptStatus || []).includes(status);
  } catch (err) {
    snippet = 'NET_ERR: ' + (err.message || err);
  }
  const ms = Date.now() - t0;
  return { method, url, status, ms, ok, snippet };
}

const MODULES = {
  m01: [
    ['GET', '/api/v1/capture-transcription'],
    ['GET', '/api/v1/capture-transcription/calls'],
    ['GET', `/api/v1/capture-transcription/calls/${CALL_ID}`],
    ['GET', `/api/v1/capture-transcription/calls/search?q=pricing`],
    ['GET', `/api/v1/capture-transcription/calls/${CALL_ID}/search?q=pricing`],
    [
      'POST',
      `/api/v1/capture-transcription/calls/${CALL_ID}/notes`,
      { content: 'Smoke test note: follow up on pricing' },
    ],
    [
      'PUT',
      `/api/v1/capture-transcription/calls/${CALL_ID}/notes/${NOTE_ID}`,
      { content: 'Smoke test note (updated)' },
    ],
    [
      'POST',
      `/api/v1/capture-transcription/calls/${CALL_ID}/share`,
      { sharedWithId: 'cu22222222manager22', sharedWithType: 'user' },
    ],
  ],
  m02: [
    ['GET', '/api/v1/conversation-intelligence'],
    ['POST', '/api/v1/conversation-intelligence', { ping: 'smoke' }],
  ],
  m03: [
    ['GET', '/api/v1/ai-summaries-genai'],
    ['POST', '/api/v1/ai-summaries-genai', { ping: 'smoke' }],
  ],
  m05: [
    ['GET', '/api/v1/account-intelligence'],
    ['POST', '/api/v1/account-intelligence', { ping: 'smoke' }],
  ],
  m06: [
    ['GET', '/api/v1/forecasting-prediction'],
    ['POST', '/api/v1/forecasting-prediction', { ping: 'smoke' }],
  ],
  m07: [
    ['GET', '/api/v1/revenue-dashboards'],
    ['POST', '/api/v1/revenue-dashboards', { ping: 'smoke' }],
  ],
  m08: [
    ['GET', '/api/v1/sales-engagement'],
    ['POST', '/api/v1/sales-engagement', { ping: 'smoke' }],
  ],
  m09: [
    ['GET', '/api/v1/coaching-training'],
    ['POST', '/api/v1/coaching-training', { ping: 'smoke' }],
  ],
  m10: [
    ['GET', '/api/v1/data-compliance'],
    ['POST', '/api/v1/data-compliance', { ping: 'smoke' }],
  ],
};

(async () => {
  const allResults = {};
  for (const [mod, cases] of Object.entries(MODULES)) {
    console.log(`\n=== ${mod.toUpperCase()} ===`);
    allResults[mod] = [];
    for (const [method, url, body] of cases) {
      const r = await call(method, url, body);
      allResults[mod].push(r);
      const tag = r.ok ? 'PASS' : 'FAIL';
      console.log(
        `  ${tag.padEnd(4)} ${method.padEnd(5)} ${r.status} ${(r.ms + 'ms').padEnd(7)} ${url}`,
      );
      if (!r.ok) console.log(`        body: ${r.snippet.replace(/\s+/g, ' ').slice(0, 180)}`);
    }
  }

  const outPath = path.join(__dirname, 'smoke-results.json');
  fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));
  console.log(`\nResults written to ${outPath}`);

  const totals = Object.values(allResults).flat();
  const pass = totals.filter((t) => t.ok).length;
  console.log(`Overall: ${pass}/${totals.length} passing`);
})();
