/**
 * M02 API client — Conversation Intelligence via NestJS (Postgres/Prisma backend).
 */
import { m02ApiV1, DEV_TENANT_ID, DEV_USER_ID, defaultHeaders } from "./api-env.js";

const API_BASE = m02ApiV1();
const DEFAULT_HEADERS = { ...defaultHeaders() };

export function setM02Context(ctx = {}) {
  if (ctx.tenantId) DEFAULT_HEADERS["x-tenant-id"] = ctx.tenantId;
  if (ctx.userId) DEFAULT_HEADERS["x-user-id"] = ctx.userId;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
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

export async function listConversations(params = "") {
  const q = params ? (params.startsWith("?") ? params : `?${params}`) : "";
  return request(`/conversation-intelligence/conversations${q}`);
}

export async function searchConversations(query) {
  return request(`/conversation-intelligence/conversations/search?query=${encodeURIComponent(query)}`);
}

export async function getTranslationSettings() {
  return request(`/m02-conversation-intelligence/translate/settings`);
}

export async function saveTranslationSettings(body) {
  return request(`/m02-conversation-intelligence/translate/settings`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export { API_BASE };
