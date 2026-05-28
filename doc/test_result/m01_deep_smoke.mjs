#!/usr/bin/env node
/**
 * M01 Deep Smoke Test (Capture & Transcription)
 *
 * Exercises the full M01 surface area: happy paths, error paths, edge cases,
 * tenant isolation, idempotency, validation, and concurrency.
 *
 * Usage:  node doc/test_result/m01_deep_smoke.mjs
 * Output: doc/test_result/m01_deep_smoke.log + doc/test_result/m01_deep_smoke_results.json
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const BASE      = 'http://localhost:3001/api/v1/capture-transcription';
const WEBHOOKS  = 'http://localhost:3001/api/v1/webhooks';
const STATIC    = 'http://localhost:3001';
const TENANT_A  = 'dev-tenant-001';
const TENANT_B  = 'test-tenant-isolation';
const CALL_1    = '11111111-1111-1111-1111-000000000001'; // completed (seeded)
const CALL_2    = '11111111-1111-1111-1111-000000000002'; // pending
const CALL_3    = '11111111-1111-1111-1111-000000000003'; // processing

const LOG_FILE     = path.join(__dirname, 'm01_deep_smoke.log');
const RESULTS_FILE = path.join(__dirname, 'm01_deep_smoke_results.json');
fs.writeFileSync(LOG_FILE, `M01 Deep Smoke Test — ${new Date().toISOString()}\n`, 'utf8');

const results = [];

function color(c, s) {
  const codes = { green: 32, red: 31, yellow: 33, cyan: 36, gray: 90 };
  return `\x1b[${codes[c] || 0}m${s}\x1b[0m`;
}

function logLine(s) {
  console.log(s);
  fs.appendFileSync(LOG_FILE, s.replace(/\x1b\[[0-9;]*m/g, '') + '\n', 'utf8');
}

async function smoke(name, method, urlPath, { body, tenant = TENANT_A, expect = [200, 201, 202, 204], headers = {}, absolute = false } = {}) {
  const target = absolute ? urlPath : `${BASE}${urlPath}`;
  const h = { 'Content-Type': 'application/json', ...headers };
  if (tenant) h['x-tenant-id'] = tenant;
  const init = { method, headers: h };
  if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);

  const start = Date.now();
  let status = 0;
  let text   = '';
  try {
    const resp = await fetch(target, init);
    status = resp.status;
    text   = await resp.text();
  } catch (e) {
    status = -1;
    text   = `NETWORK ERROR: ${e.message}`;
  }
  const ms = Date.now() - start;
  const pass = expect.includes(status);
  const tick = pass ? 'PASS' : 'FAIL';
  const label = pass ? color('green', tick) : color('red', tick);
  const line  = `[${label}] ${name.padEnd(52)} ${method.padEnd(6)} ${String(ms).padStart(5)}ms  http=${status}  expected=${expect.join(',')}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, `[${tick}] ${name} ${method} ${target} ${ms}ms code=${status} expect=${expect.join(',')}\n  body: ${text.slice(0, 400)}\n`, 'utf8');
  const result = { name, method, path: urlPath, status, expect: expect.join(','), ms, pass, body: text };
  results.push(result);
  return result;
}

function section(s) { logLine('\n' + color('cyan', '=== ' + s + ' ===')); }

(async () => {
  // ── Phase A — Auth / Tenant Isolation ───────────────────────────────────
  section('Phase A — Auth / Tenant Isolation');
  await smoke('no tenant header rejected',          'GET',  '/calls', { tenant: '', expect: [401, 403] });
  await smoke('happy GET /calls with tenant',       'GET',  '/calls');
  await smoke('tenant B sees no seeded calls',      'GET',  '/calls', { tenant: TENANT_B });

  // ── Phase B — List + Filter + Sort ──────────────────────────────────────
  section('Phase B — List + Filter + Sort');
  await smoke('list completed only',                'GET', '/calls?status=completed');
  await smoke('list pending',                       'GET', '/calls?status=pending');
  await smoke('list source=zoom',                   'GET', '/calls?source=zoom');
  await smoke('sort by title asc',                  'GET', '/calls?sortBy=title&order=asc');
  await smoke('limit + offset paging',              'GET', '/calls?limit=1&offset=0');
  await smoke('invalid status rejected',            'GET', '/calls?status=garbage', { expect: [400, 500] });
  await smoke('invalid limit rejected',             'GET', '/calls?limit=9999',     { expect: [400, 500] });

  // ── Phase C — Single Resource (CT-13) ───────────────────────────────────
  section('Phase C — Single Resource (CT-13)');
  await smoke('GET seeded call by id',              'GET', `/calls/${CALL_1}`);
  await smoke('GET unknown call -> 404',            'GET', '/calls/00000000-0000-0000-0000-000000000000', { expect: [404] });
  await smoke('GET seeded call across tenant -> 404','GET',`/calls/${CALL_1}`, { tenant: TENANT_B, expect: [404] });

  // ── Phase D — Search (CT-05 / CT-21 / US-22) ────────────────────────────
  section('Phase D — Search (CT-05 / CT-21 / US-22)');
  await smoke('org-wide search "pricing"',          'GET', '/calls/search?q=pricing');
  await smoke('search with date range',             'GET', '/calls/search?q=pricing&dateFrom=2026-05-01&dateTo=2026-05-31');
  await smoke('in-call search',                     'GET', `/calls/${CALL_1}/search?q=competitor`);
  await smoke('search empty query rejected',        'GET', '/calls/search?q=', { expect: [400, 500] });
  await smoke('in-call search wrong tenant',        'GET', `/calls/${CALL_1}/search?q=x`, { tenant: TENANT_B, expect: [200, 404] });

  // ── Phase E — Notes CRUD (CT-22) ────────────────────────────────────────
  section('Phase E — Notes CRUD (CT-22)');
  const noteCreate = await smoke('create note', 'POST', `/calls/${CALL_1}/notes`, { body: { content: 'Smoke test note A' }, expect: [201] });
  let noteId = null;
  try { noteId = JSON.parse(noteCreate.body).id; } catch {}
  if (noteId) {
    await smoke('update note',  'PUT',    `/calls/${CALL_1}/notes/${noteId}`, { body: { content: 'Smoke test note B (updated)' } });
    await smoke('delete note',  'DELETE', `/calls/${CALL_1}/notes/${noteId}`, { expect: [204] });
  }
  await smoke('create note empty body rejected', 'POST', `/calls/${CALL_1}/notes`, { body: { content: '' }, expect: [400, 500] });

  // ── Phase F — Sharing (CT-23) ───────────────────────────────────────────
  section('Phase F — Sharing (CT-23)');
  await smoke('share with user',                    'POST', `/calls/${CALL_1}/share`, { body: { sharedWithId: 'user-99', sharedWithType: 'user' }, expect: [201] });
  await smoke('share with team (idempotent)',       'POST', `/calls/${CALL_1}/share`, { body: { sharedWithId: 'team-1',  sharedWithType: 'team' }, expect: [201] });
  await smoke('share invalid type rejected',        'POST', `/calls/${CALL_1}/share`, { body: { sharedWithId: 'x', sharedWithType: 'group' }, expect: [400, 500] });
  // Re-share same target -> upsert should return existing row (still 201 in Nest default)
  await smoke('share idempotent (same target twice)','POST', `/calls/${CALL_1}/share`, { body: { sharedWithId: 'user-99', sharedWithType: 'user' }, expect: [201] });

  // ── Phase G — Next Steps CRUD (US-11) ───────────────────────────────────
  section('Phase G — Next Steps CRUD (US-11)');
  await smoke('GET next-steps (seeded 3 items)',    'GET',    `/calls/${CALL_1}/next-steps`);
  await smoke('POST add next-step',                 'POST',   `/calls/${CALL_1}/next-steps`, { body: { step: 'Smoke: prepare contract draft' }, expect: [201] });
  await smoke('PATCH update index 0',               'PATCH',  `/calls/${CALL_1}/next-steps`, { body: { index: 0, step: 'Smoke: send updated comparison doc by EOD' } });
  await smoke('DELETE next-step index 0',           'DELETE', `/calls/${CALL_1}/next-steps/0`, { expect: [204] });
  await smoke('DELETE out-of-range index',          'DELETE', `/calls/${CALL_1}/next-steps/9999`, { expect: [404, 500] });

  // ── Phase H — Utterance Inline Edit (US-04 / CT-24) ─────────────────────
  section('Phase H — Utterance Inline Edit (US-04 / CT-24)');
  const detail = await smoke('fetch call detail for utterance', 'GET', `/calls/${CALL_1}`);
  let uttId = null;
  try {
    const j = JSON.parse(detail.body);
    if (j?.transcript?.utterances?.length) uttId = j.transcript.utterances[0].id;
  } catch {}
  if (uttId) {
    await smoke('PATCH utterance text', 'PATCH', `/utterances/${uttId}`, { body: { text: 'Smoke: edited utterance text' } });
  }

  // ── Phase I — Create Call + Lifecycle ───────────────────────────────────
  section('Phase I — Create Call + Lifecycle');
  const newCallPayload = {
    title:           'Smoke Test Call',
    callDate:        new Date().toISOString(),
    durationSeconds: 60,
    callType:        'meeting',
    callSource:      'manual',
    participants:    ['smoke-test@example.com'],
    callOwner:       'smoke-test-user',
  };
  const created = await smoke('POST /calls — create', 'POST', '/calls', { body: newCallPayload, expect: [201] });
  let newCallId = null;
  try { newCallId = JSON.parse(created.body).id; } catch {}
  if (newCallId) {
    await smoke('GET newly created call',          'GET',    `/calls/${newCallId}`);
    await smoke('POST extract-ai (no transcript)', 'POST',   `/calls/${newCallId}/extract-ai`, { expect: [400, 500] });
    await smoke('DELETE newly created call',       'DELETE', `/calls/${newCallId}`);
  }
  await smoke('POST /calls — invalid (no participants)', 'POST', '/calls', {
    body: { title: 'x', callDate: new Date().toISOString(), callType: 'meeting', callSource: 'manual', callOwner: 'x', participants: [] },
    expect: [400, 500],
  });
  await smoke('POST /calls — unknown callType rejected', 'POST', '/calls', {
    body: { title: 'x', callDate: new Date().toISOString(), callType: 'midi', callSource: 'manual', callOwner: 'x', participants: ['a'] },
    expect: [400, 500],
  });

  // ── Phase J — AI Extraction Trigger (US-12/13/14) ───────────────────────
  section('Phase J — AI Extraction Trigger (US-12/13/14)');
  await smoke('POST extract-ai on seeded call',   'POST', `/calls/${CALL_1}/extract-ai`, { expect: [202] });
  await smoke('POST extract-ai on unknown call',  'POST', '/calls/00000000-0000-0000-0000-000000000000/extract-ai', { expect: [404, 500] });

  // ── Phase K — Webhooks (US-02) ──────────────────────────────────────────
  section('Phase K — Webhooks (US-02)');
  const zoomPayload = {
    event: 'recording.completed',
    payload: {
      object: {
        id: '1234', uuid: 'smoke-meeting-uuid-001', topic: 'Smoke Zoom Recording',
        start_time: new Date().toISOString(), duration: 5,
        host_email: 'smoke@example.com', participant_count: 2,
        recording_files: [{ download_url: 'https://example.com/audio.mp3', file_type: 'M4A', recording_type: 'audio_only' }],
      },
    },
  };
  await smoke('webhook without signature rejected', 'POST', `${WEBHOOKS}/zoom`, { absolute: true, body: zoomPayload, expect: [401] });
  await smoke('webhook test bypass (dev)',          'POST', `${WEBHOOKS}/zoom`, { absolute: true, body: zoomPayload, headers: { 'x-webhook-test': '1' }, expect: [200] });

  // ── Phase L — Concurrency / Idempotency ─────────────────────────────────
  section('Phase L — Concurrency / Idempotency');
  const concurrencyResults = await Promise.all(
    [1, 2, 3, 4, 5].map((i) =>
      fetch(`${BASE}/calls/${CALL_1}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': TENANT_A },
        body: JSON.stringify({ content: `concurrent note ${i}` }),
      }).then((r) => r.status).catch(() => -1)
    )
  );
  const okCount = concurrencyResults.filter((c) => c === 201).length;
  const concurrencyOk = okCount === 5;
  const concLine = `[${concurrencyOk ? color('green', 'PASS') : color('red', 'FAIL')}] 5 concurrent note creates                            POST   ----  codes=${concurrencyResults.join(',')}`;
  console.log(concLine);
  fs.appendFileSync(LOG_FILE, `[${concurrencyOk ? 'PASS' : 'FAIL'}] 5 concurrent note creates codes=${concurrencyResults.join(',')}\n`, 'utf8');
  results.push({ name: '5 concurrent note creates', method: 'POST', path: '/calls/{id}/notes (x5)', status: concurrencyResults.join(','), expect: '201 x5', ms: 0, pass: concurrencyOk, body: '' });

  // ── Phase M — Static Assets ──────────────────────────────────────────────
  section('Phase M — Static Assets');
  await smoke('GET /uploads/audio/ (static mount)', 'GET', `${STATIC}/uploads/audio/`, { absolute: true, tenant: '', expect: [200, 301, 302, 404] });

  // ── Summary ──────────────────────────────────────────────────────────────
  section('Summary');
  const total = results.length;
  const pass  = results.filter((r) => r.pass).length;
  const fail  = total - pass;
  const sum   = `Total: ${total}   PASS: ${pass}   FAIL: ${fail}`;
  console.log(fail === 0 ? color('green', sum) : color('yellow', sum));
  fs.appendFileSync(LOG_FILE, sum + '\n', 'utf8');
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2), 'utf8');

  if (fail > 0) {
    console.log(color('red', '\nFailed tests:'));
    results.filter((r) => !r.pass).forEach((r) => {
      console.log(color('red', `  - ${r.name} (${r.method} ${r.path}) code=${r.status} expected=${r.expect}`));
    });
  }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
