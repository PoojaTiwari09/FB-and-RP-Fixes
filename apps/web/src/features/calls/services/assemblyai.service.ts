import { getStoredAssemblyAIKey, ASSEMBLYAI_KEY_HEADER } from '@calls/lib/assemblyai-key.storage';
import { fetchRemoteRecordingUrl } from '@calls/services/callsApi';
import {
  pickDemoRecordingUrl,
  toAssemblyAISafeUrl,
  toProxiedAudioUrl,
} from '@shared/lib/demo-recordings';

export interface TranscriptUtterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export interface AssemblyInsights {
  status: 'queued' | 'processing' | 'completed' | 'error';
  transcriptId: string;
  fullText: string;
  utterances: TranscriptUtterance[];
  summary: string;
  highlights: string[];
  sentiment: string;
  talkRatio: { rep: number; customer: number };
  topics: string[];
  actionItems: string[];
  error?: string;
}

export interface ResolvedAudioUrls {
  /** Same-origin URL for <audio> playback in the browser */
  playbackUrl: string;
  /** Public URL sent to AssemblyAI for transcription */
  assemblySourceUrl: string;
}

function normalizeRemoteUrl(raw: string, sessionId: string): string {
  let url = raw.trim();
  if (url.startsWith('/api/v1/conversation-intelligence/calls/audio')) {
    try {
      const parsed = new URL(url, 'http://localhost');
      const src = parsed.searchParams.get('src');
      if (src) url = decodeURIComponent(src);
    } catch {
      url = '';
    }
  }
  return toAssemblyAISafeUrl(url, sessionId);
}

function assemblyAIHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const key = getStoredAssemblyAIKey();
  if (key) headers[ASSEMBLYAI_KEY_HEADER] = key;
  return headers;
}

/** Resolve recording from M01 when possible; always return a public AssemblyAI-safe URL. */
export async function resolveAssemblyAudioUrls(sessionId: string): Promise<ResolvedAudioUrls> {
  let remote = pickDemoRecordingUrl(sessionId);

  try {
    const fromApi = await fetchRemoteRecordingUrl(sessionId);
    remote = normalizeRemoteUrl(fromApi, sessionId);
  } catch {
    remote = pickDemoRecordingUrl(sessionId);
  }

  return {
    playbackUrl: toProxiedAudioUrl(remote),
    assemblySourceUrl: remote,
  };
}

export async function submitTranscription(audioUrl: string, seed = 'fallback'): Promise<string> {
  const response = await fetch(`/api/assemblyai/submit?t=${Date.now()}`, {
    method: 'POST',
    headers: assemblyAIHeaders(),
    body: JSON.stringify({ audio_url: audioUrl, seed }),
    cache: 'no-store',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`AssemblyAI submit failed: ${(err as { error?: string }).error ?? response.status}`);
  }
  const data = await response.json();
  return data.id as string;
}

export async function pollTranscript(transcriptId: string): Promise<Record<string, unknown>> {
  while (true) {
    const res = await fetch(`/api/assemblyai/poll/${transcriptId}?t=${Date.now()}`, {
      headers: assemblyAIHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`AssemblyAI poll failed: ${res.status}`);
    const data = await res.json();
    if (data.status === 'completed' || data.status === 'error') {
      return data;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
}

export function parseAssemblyResult(data: Record<string, unknown>): AssemblyInsights {
  const fullText: string = (data.text as string) ?? '';

  const utterances: TranscriptUtterance[] = ((data.utterances as unknown[]) ?? []).map((u) => {
    const row = u as Record<string, unknown>;
    return {
      speaker: String(row.speaker),
      text: String(row.text),
      start: Number(row.start),
      end: Number(row.end),
    };
  });

  const totalMs = utterances.reduce((sum, u) => sum + (u.end - u.start), 0) || 1;
  const speakerMs: Record<string, number> = {};
  utterances.forEach((u) => {
    speakerMs[u.speaker] = (speakerMs[u.speaker] ?? 0) + (u.end - u.start);
  });
  const speakers = Object.keys(speakerMs).sort();
  const repPct = speakers.length > 0 ? Math.round((speakerMs[speakers[0]] / totalMs) * 100) : 60;
  const custPct = 100 - repPct;

  const highlightsResult = data.auto_highlights_result as { results?: { text: string }[] } | undefined;
  const highlights: string[] = (highlightsResult?.results ?? [])
    .slice(0, 5)
    .map((h) => h.text);

  const sentResults = (data.sentiment_analysis_results as { sentiment: string }[]) ?? [];
  const posCount = sentResults.filter((s) => s.sentiment === 'POSITIVE').length;
  const negCount = sentResults.filter((s) => s.sentiment === 'NEGATIVE').length;
  let sentiment = 'Neutral — balanced tone with professional rapport maintained';
  if (posCount > negCount + 2) {
    sentiment = 'Positive — rep maintained an upbeat, confident tone throughout';
  } else if (negCount > posCount) {
    sentiment = 'Mixed — some friction moments detected around objections';
  }

  let summary = data.summary as string | undefined;
  if (!summary) {
    const sentences = fullText
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);
    const keyPoints = sentences
      .filter((s) => /process|challenge|productivity|budget|schedule|demo|eliminate|pricing|integration/i.test(s))
      .slice(0, 3);

    summary =
      keyPoints.length > 0
        ? keyPoints.map((p) => `• ${p}.`).join('\n')
        : utterances.length > 0
          ? `• Call transcribed with ${utterances.length} speaker turns.\n• Review highlights and action items below.`
          : '• Transcription completed. Review the transcript for key moments.';
  }

  const iabSummary = (data.iab_categories_result as { summary?: Record<string, unknown> })?.summary ?? {};
  const topicList = Object.keys(iabSummary).slice(0, 4);

  const actionItems: string[] = [];
  const actionRegex = /(?:follow.up|send|schedule|review|confirm|check in|get back)[^.!?]*[.!?]/gi;
  let match;
  while ((match = actionRegex.exec(fullText)) !== null && actionItems.length < 4) {
    const item = match[0].trim();
    if (item.length > 20) actionItems.push(item);
  }

  return {
    status: 'completed',
    transcriptId: String(data.id ?? ''),
    fullText,
    utterances,
    summary,
    highlights:
      highlights.length > 0
        ? highlights
        : [
            'Strong rapport building in opening',
            'Clear pain point discovery questions',
            'Effective product fit alignment',
          ],
    sentiment,
    talkRatio: { rep: repPct, customer: custPct },
    topics: topicList.length > 0 ? topicList : ['Sales Discovery', 'Product Fit', 'Objection Handling'],
    actionItems:
      actionItems.length > 0
        ? actionItems
        : ['Send follow-up email with pricing details', 'Schedule demo for next week'],
  };
}
