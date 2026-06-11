import { getBackendUrl } from '@shared/config/module-api';

/** LLM keys are server-side only (Next.js API routes). */
export function hasServerLlmKeys(): boolean {
  return true;
}

export async function transcribeAudioBlob(audioBlob: Blob): Promise<{ text: string; duration?: number }> {
  const form = new FormData();
  form.append('file', audioBlob, 'audio.webm');
  const res = await fetch('/api/smart-call/transcribe', { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
  return res.json();
}

export async function generateLiveAssistInsights(payload: Record<string, unknown>) {
  const res = await fetch('/api/smart-call/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Insights failed: ${res.status}`);
  }
  return res.json();
}

export async function analyzeCompetitorThreat(competitor: string, transcriptContext: string) {
  const res = await fetch('/api/smart-call/competitor-flash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ competitor, transcriptContext }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateStrategicSummary(payload: Record<string, unknown>) {
  const res = await fetch('/api/smart-call/final-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Final summary failed: ${res.status}`);
  const data = await res.json() as { summary?: string };
  return data.summary ?? null;
}

export async function createLiveCallDbSession(body: {
  sessionId: string;
  contactId?: string;
  dealCompany?: string;
  clientName?: string;
  sessionName?: string;
}) {
  const res = await fetch(`${getBackendUrl()}/api/v1/capture-transcription/smart-call/sessions/${body.sessionId}/persist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'start', ...body }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { dbSessionId?: string };
  return data.dbSessionId ?? null;
}

export async function storeLiveCallChunk(
  sessionId: string,
  chunk: Record<string, unknown>,
) {
  await fetch(`${getBackendUrl()}/api/v1/capture-transcription/smart-call/sessions/${sessionId}/chunks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chunk),
  });
}

export async function completeLiveCallDbSession(
  sessionId: string,
  body: {
    finalSummary?: string;
    totalSegments?: number;
    salesRepName?: string;
    clientName?: string;
    transcript?: unknown[];
  },
) {
  await fetch(`${getBackendUrl()}/api/v1/capture-transcription/smart-call/sessions/${sessionId}/persist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'complete', ...body }),
  });
}

