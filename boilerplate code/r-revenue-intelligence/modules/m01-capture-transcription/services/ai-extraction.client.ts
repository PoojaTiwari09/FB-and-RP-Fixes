import { Injectable, Logger } from '@nestjs/common';
import {
  computeTalkRatioLocal,
  extractHighlightsLocal,
  summarizeLocal,
} from '../lib/ai-extraction-local';

/**
 * AiExtractionClient — NestJS HTTP client for the Python ai-services.
 *
 * Coding Standards:
 *   - All AI logic (LLM calls, prompts) lives in Python ai-services (Golden Rule #1).
 *   - This service is the NestJS boundary: it only sends the request and
 *     receives the structured result. No AI logic here.
 *   - Uses native fetch (Node 18+) — no extra HTTP library needed.
 *   - Checks flagged_for_review before allowing writes (§5.2).
 */

const AI_SERVICES_URL =
  process.env.AI_SERVICES_URL ?? 'http://localhost:8000';

const FORCE_LOCAL =
  process.env.AI_SERVICES_USE_LOCAL_FALLBACK === 'true' ||
  process.env.DISABLE_AI_SERVICES === 'true';

function isServiceUnreachable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  if (msg.includes('fetch failed') || msg.includes('econnrefused')) return true;
  const cause = (err as Error & { cause?: { code?: string } }).cause;
  return cause?.code === 'ECONNREFUSED' || cause?.code === 'ENOTFOUND';
}

export interface UtterancePayload {
  speaker:        string;
  text:           string;
  start_ms:       number;
  end_ms:         number;
  sequence_index: number;
}

// ── Response shapes (mirrors Python Pydantic models) ──────────────────────────

export interface SummarizeResult {
  summary:            string;
  next_steps:         string[];
  confidence_score:   number;
  flagged_for_review: boolean;
}

export interface Highlight {
  label:        string;
  text:         string;
  timestamp_ms: number;
  speaker:      string;
}

export interface HighlightsResult {
  highlights:         Highlight[];
  confidence_score:   number;
  flagged_for_review: boolean;
}

export interface SpeakerRatio {
  speaker:     string;
  duration_ms: number;
  percentage:  number;
}

export interface TalkRatioResult {
  speakers:          SpeakerRatio[];
  total_duration_ms: number;
}

@Injectable()
export class AiExtractionClient {
  private readonly logger = new Logger(AiExtractionClient.name);

  // ── US-12: Call Summarizer ──────────────────────────────────────────────
  async summarize(
    tenantId:   string,
    callId:     string,
    fullText:   string,
    utterances: UtterancePayload[],
  ): Promise<SummarizeResult> {
    if (FORCE_LOCAL) return summarizeLocal(fullText);
    return this.post<SummarizeResult>(
      '/v1/extract/summarize',
      { tenant_id: tenantId, call_id: callId, full_text: fullText, utterances },
      () => summarizeLocal(fullText),
    );
  }

  // ── US-13: Key Highlights Extractor ───────────────────────────────────
  async extractHighlights(
    tenantId:   string,
    callId:     string,
    fullText:   string,
    utterances: UtterancePayload[],
  ): Promise<HighlightsResult> {
    if (FORCE_LOCAL) return extractHighlightsLocal(utterances);
    return this.post<HighlightsResult>(
      '/v1/extract/highlights',
      { tenant_id: tenantId, call_id: callId, full_text: fullText, utterances },
      () => extractHighlightsLocal(utterances),
    );
  }

  // ── US-14: Talk Ratio Calculator ───────────────────────────────────────
  async computeTalkRatio(
    tenantId:   string,
    callId:     string,
    utterances: UtterancePayload[],
  ): Promise<TalkRatioResult> {
    if (FORCE_LOCAL) return computeTalkRatioLocal(utterances);
    return this.post<TalkRatioResult>(
      '/v1/extract/talk-ratio',
      { tenant_id: tenantId, call_id: callId, utterances },
      () => computeTalkRatioLocal(utterances),
    );
  }

  // ── Internal HTTP helper ───────────────────────────────────────────────
  private async post<T>(
    path: string,
    body: unknown,
    localFallback: () => T,
  ): Promise<T> {
    const url = `${AI_SERVICES_URL}${path}`;
    this.logger.debug(`[AiExtractionClient] POST ${url}`);

    try {
      const response = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(
          `[AiExtractionClient] ${path} responded ${response.status}: ${text}`,
        );
        throw new Error(`ai-services ${path} failed: ${response.status}`);
      }

      return response.json() as Promise<T>;
    } catch (err) {
      if (isServiceUnreachable(err)) {
        this.logger.warn(
          `[AiExtractionClient] ai-services unreachable at ${AI_SERVICES_URL} — using local fallback for ${path}`,
        );
        return localFallback();
      }
      throw err;
    }
  }
}
