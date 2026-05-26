/**
 * API service layer for communicating with the backend.
 * Routes to FastAPI (port 8000) or NestJS (port 3000).
 */

const FASTAPI_BASE = 'http://localhost:8000';
const NESTJS_BASE = 'http://localhost:3000/api/v1';

// Default headers for user context
const defaultHeaders = {
  'Content-Type': 'application/json',
  'X-User-Id': 'c0000000-0000-0000-0000-000000000001',
  'X-Org-Id': 'a0000000-0000-0000-0000-000000000001',
  'X-Role': 'SALES_MANAGER',
  'X-Team-Id': 'b0000000-0000-0000-0000-000000000001',
};

export function setUserContext(ctx) {
  if (ctx.userId) defaultHeaders['X-User-Id'] = ctx.userId;
  if (ctx.orgId) defaultHeaders['X-Org-Id'] = ctx.orgId;
  if (ctx.role) defaultHeaders['X-Role'] = ctx.role;
  if (ctx.teamId) defaultHeaders['X-Team-Id'] = ctx.teamId;
}

// ============================================================
// Research Jobs
// ============================================================
export async function createResearchJob(params) {
  const res = await fetch(`${FASTAPI_BASE}/api/v1/research/run`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({
      query: params.query,
      context_type: params.contextType || 'ACCOUNT',
      scope: params.scope || 'ENTIRE_ACCOUNT',
      period_days: params.periodDays || 60,
      filters: params.filters || {},
      org_id: defaultHeaders['X-Org-Id'],
      user_id: defaultHeaders['X-User-Id'],
      web_data_enabled: params.webDataEnabled || false,
    }),
  });
  return res.json();
}

export async function getJobStatus(jobId) {
  const res = await fetch(`${FASTAPI_BASE}/api/v1/research/jobs/${jobId}`, {
    headers: defaultHeaders,
  });
  return res.json();
}

export async function cancelJob(jobId) {
  const res = await fetch(`${FASTAPI_BASE}/api/v1/research/jobs/${jobId}/cancel`, {
    method: 'POST',
    headers: defaultHeaders,
  });
  return res.json();
}

export async function listJobs(status = null) {
  let url = `${FASTAPI_BASE}/api/v1/research/jobs?org_id=${defaultHeaders['X-Org-Id']}`;
  if (status) url += `&status=${status}`;
  const res = await fetch(url, { headers: defaultHeaders });
  return res.json();
}

// ============================================================
// Reports
// ============================================================
export async function getReport(reportId) {
  const res = await fetch(`${FASTAPI_BASE}/api/v1/research/reports/${reportId}`, {
    headers: defaultHeaders,
  });
  return res.json();
}

export async function getReportHistory(reportId) {
  const res = await fetch(`${FASTAPI_BASE}/api/v1/research/reports/${reportId}/history`, {
    headers: defaultHeaders,
  });
  return res.json();
}

// ============================================================
// Ask Anything
// ============================================================
export async function askAnything(params) {
  const res = await fetch(`${FASTAPI_BASE}/api/v1/query`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({
      query: params.query,
      context_type: params.contextType || 'ACCOUNT',
      context_id: params.contextId,
      session_id: params.sessionId,
      org_id: defaultHeaders['X-Org-Id'],
      user_id: defaultHeaders['X-User-Id'],
    }),
  });
  return res.json();
}

// ============================================================
// Feedback
// ============================================================
export async function submitFeedback(reportId, feedback) {
  const res = await fetch(`${FASTAPI_BASE}/api/v1/research/reports/${reportId}/feedback`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({
      ...feedback,
      org_id: defaultHeaders['X-Org-Id'],
      user_id: defaultHeaders['X-User-Id'],
    }),
  });
  return res.json();
}

// ============================================================
// Data Summary
// ============================================================
export async function getDataSummary() {
  const res = await fetch(`${FASTAPI_BASE}/api/v1/data/summary?org_id=${defaultHeaders['X-Org-Id']}`, {
    headers: defaultHeaders,
  });
  return res.json();
}

// ============================================================
// Health Check
// ============================================================
export async function healthCheck() {
  try {
    const res = await fetch(`${FASTAPI_BASE}/health`);
    return res.json();
  } catch {
    return { status: 'disconnected' };
  }
}
