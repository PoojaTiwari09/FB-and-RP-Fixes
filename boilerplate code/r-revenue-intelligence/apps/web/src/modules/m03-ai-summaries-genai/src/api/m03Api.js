/**
 * M03 API client — all AI/workspace calls go through NestJS (no browser Supabase/Gemini).
 */
const viteStandalone =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_M03_STANDALONE === 'true';

function getM03ApiBase() {
  if (viteStandalone) {
    const u = import.meta.env?.VITE_M03_API_URL;
    if (u === '' || u === undefined) {
      return '/api/v1/ai-summaries-genai';
    }
    const root = String(u).replace(/\/$/, '');
    return `${root}/api/v1/ai-summaries-genai`;
  }
  return '/api/v1/ai-summaries-genai';
}

const API_BASE = getM03ApiBase();

const demoTenant =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TENANT_ID) ||
  '00000000-0000-0000-0000-000000000001';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'X-User-Id':
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USER_ID) ||
    '00000000-0000-0000-0000-000000000002',
  'X-Org-Id': demoTenant,
  'X-Role': 'SALES_MANAGER',
  'X-Team-Id': 'b0000000-0000-0000-0000-000000000001',
};

export function setUserContext(ctx) {
  if (ctx.userId) defaultHeaders['X-User-Id'] = ctx.userId;
  if (ctx.orgId) defaultHeaders['X-Org-Id'] = ctx.orgId;
  if (ctx.role) defaultHeaders['X-Role'] = ctx.role;
  if (ctx.teamId) defaultHeaders['X-Team-Id'] = ctx.teamId;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || body.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export async function fetchWorkspace() {
  return request('/workspace');
}

export async function fetchChatHistory() {
  return request('/workspace/chat-history');
}

export async function saveChatMessage(question, answer, citations = []) {
  return request('/workspace/chat-history', {
    method: 'POST',
    body: JSON.stringify({ question, answer, citations }),
  });
}

export async function deleteChatMessage(id) {
  return request(`/workspace/chat-history/${id}`, { method: 'DELETE' });
}

export async function getBrief(briefType, entityId) {
  return request(`/briefs/${briefType}/${entityId}`);
}

export async function generateBrief(briefType, entityId) {
  return request(`/briefs/${briefType}/${entityId}/generate`, { method: 'POST' });
}

export async function askQuery(params) {
  return request('/query', {
    method: 'POST',
    body: JSON.stringify({
      query: params.query,
      contextType: params.contextType || 'ACCOUNT',
      contextId: params.contextId,
      sessionId: params.sessionId,
    }),
  });
}

export async function createResearchJob(params) {
  return request('/research/jobs', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getJobStatus(jobId) {
  return request(`/research/jobs/${jobId}`);
}

export async function listJobs(status) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/research/jobs${q}`);
}

export async function getReport(reportId) {
  return request(`/research/reports/${reportId}`);
}

export async function submitFeedback(reportId, feedback) {
  return request(`/feedback/reports/${reportId}`, {
    method: 'POST',
    body: JSON.stringify(feedback),
  });
}

export async function healthCheck() {
  try {
    return await request('/test/health');
  } catch {
    return { success: false, database: 'down' };
  }
}
