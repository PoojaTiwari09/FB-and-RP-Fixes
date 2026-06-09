/**
 * SalesIQ API Client — place at:
 *   salesiq-enhanced/src/lib/api-client.js
 *
 * Routes AI calls: Frontend → NestJS (3001) → FastAPI (8000)
 * Falls back to direct FastAPI if NestJS unavailable.
 * Falls back silently if both backends are down (Groq direct in component).
 */

import { m02ApiV1 } from "./api-env.js";

const NESTJS_BASE = m02ApiV1();
const FASTAPI_BASE = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000";

// Cache health check result for 30s
let _healthCache = { nestjs: null, fastapi: null, checkedAt: 0 };
const HEALTH_TTL_MS = 30_000;

async function checkHealth() {
  const now = Date.now();
  if (now - _healthCache.checkedAt < HEALTH_TTL_MS) return _healthCache;

  const [nestjs, fastapi] = await Promise.all([
    fetch(`${NESTJS_BASE.replace("/api/v1", "")}/health`, { signal: AbortSignal.timeout(2000) })
      .then((r) => r.ok).catch(() => false),
    fetch(`${FASTAPI_BASE}/health`, { signal: AbortSignal.timeout(2000) })
      .then((r) => r.ok).catch(() => false),
  ]);

  _healthCache = { nestjs, fastapi, checkedAt: now };
  return _healthCache;
}

export async function checkBackendHealth() {
  return checkHealth();
}

async function post(base, path, body, apiKey = null) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;

  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function postForm(base, path, formData, apiKey = null) {
  const headers = {};
  if (apiKey) headers["X-API-Key"] = apiKey;

  const res = await fetch(`${base}${path}`, { 
    method: "POST", 
    body: formData,
    headers
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

async function routedPost(nestjsPath, fastapiPath, body, apiKey = null) {
  const health = await checkHealth();
  if (health.nestjs) {
    try {
      return await post(NESTJS_BASE, nestjsPath, body, apiKey);
    } catch (e) {
      console.warn(`NestJS ${nestjsPath} failed (${e.message}), trying FastAPI...`);
    }
  }
  if (health.fastapi) {
    return await post(FASTAPI_BASE, fastapiPath, body, apiKey);
  }
  throw new Error("Both NestJS and FastAPI are unavailable. Using direct-Groq mode.");
}

export async function summarizeText({ text, doc_name, mode, audience = "", model = "groq/meta-llama/llama-4-scout-17b-16e-instruct", apiKey = null }) {
  return routedPost("/documents/analyze/text", "/ai/summarize/text", {
    text, doc_name, mode, audience, model, user_id: "demo",
  }, apiKey);
}

export async function summarizeFile(file, { mode, audience = "", model = "groq/meta-llama/llama-4-scout-17b-16e-instruct", apiKey = null }) {
  const health = await checkHealth();
  const form = new FormData();
  form.append("file", file);
  form.append("mode", mode);
  form.append("audience", audience);
  form.append("model", model);

  if (health.nestjs) {
    try { return await postForm(NESTJS_BASE, "/upload/file", form, apiKey); }
    catch (e) { console.warn("NestJS upload failed:", e.message); }
  }
  if (health.fastapi) return await postForm(FASTAPI_BASE, "/ai/summarize/upload", form, apiKey);
  throw new Error("Backend unavailable for file upload.");
}

export async function ragChat({ text, question, chat_history = [], mode, model, doc_name }) {
  return routedPost("/chat/ask", "/ai/rag/ask", {
    text, question, chat_history, mode, model, doc_name, user_id: "demo",
  });
}

export async function compareDocuments({ documents, mode, model }) {
  return routedPost("/compare/documents", "/ai/compare/documents", {
    documents, mode, model, user_id: "demo",
  });
}

export async function versionDiff({ original_text, new_text, original_name = "Version 1", new_name = "Version 2", mode = "executive", model }) {
  return routedPost("/version/diff", "/ai/version/diff", {
    original_text, new_text, original_name, new_name, mode, model, user_id: "demo",
  });
}

export async function extractInsights({ text, mode = "analyst", model }) {
  return routedPost("/documents/extract/insights", "/ai/extract/insights", { text, mode, model });
}
