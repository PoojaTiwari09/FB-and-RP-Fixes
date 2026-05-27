import { Injectable, Logger } from '@nestjs/common';
import { OnEvent }             from '@nestjs/event-emitter';
import { TranscriptRepository } from '../repositories/transcript.repository';
import { CallRepository }        from '../repositories/call.repository';
import {
  AiExtractionClient,
  UtterancePayload,
} from './ai-extraction.client';

interface TranscriptionCompletedPayload {
  eventId:    string;
  version:    string;
  occurredAt: string;
  tenantId:   string;
  callId:     string;
}

/**
 * AiExtractionSubscriber — listens for 'transcription.completed' and
 * drives the full AI extraction pipeline:
 *
 *   US-12: summarize call → writes summary + nextSteps to transcript
 *   US-13: extract highlights → writes keyHighlights to transcript
 *   US-14: compute talk ratio → writes talkRatio to transcript
 *
 * Coding Standards:
 *   - Uses @OnEvent (NestJS EventEmitter2) for decoupled, async consumption.
 *   - Does NOT call LLM directly — delegates to Python ai-services via
 *     AiExtractionClient (Golden Rule #1).
 *   - Checks flagged_for_review before writing sensitive fields (§5.2).
 *   - Each stage is independently try/caught so one failure does not block
 *     the others (resilient pipeline pattern).
 */
@Injectable()
export class AiExtractionSubscriber {
  private readonly logger = new Logger(AiExtractionSubscriber.name);

  constructor(
    private readonly transcripts: TranscriptRepository,
    private readonly calls:       CallRepository,
    private readonly aiClient:    AiExtractionClient,
  ) {}

  @OnEvent('call.transcription.completed', { async: true })
  async handleTranscriptionCompleted(
    payload: TranscriptionCompletedPayload,
  ): Promise<void> {
    const { tenantId, callId } = payload;
    this.logger.log(
      `[AiExtraction] call.transcription.completed received — callId=${callId}`,
    );

    // ── Load the saved transcript + utterances from DB ─────────────────
    const transcript = await this.transcripts.findByCallId(callId, tenantId);

    if (!transcript) {
      this.logger.warn(
        `[AiExtraction] Transcript not found for callId=${callId} — skipping AI pipeline`,
      );
      return;
    }

    // Map to the Python service's snake_case payload shape
    const utterances: UtterancePayload[] = transcript.utterances.map((u) => ({
      speaker:        u.speaker,
      text:           u.text,        // already PII-redacted from Phase 2
      start_ms:       u.startMs,
      end_ms:         u.endMs,
      sequence_index: u.sequenceIndex,
    }));

    // ── Stage 1: Summarize (US-12) ─────────────────────────────────────
    await this.runSummarize(tenantId, callId, transcript.fullText, utterances);

    // ── Stage 2: Extract Highlights (US-13) ───────────────────────────
    await this.runHighlights(tenantId, callId, transcript.fullText, utterances);

    // ── Stage 3: Talk Ratio (US-14) ───────────────────────────────────
    await this.runTalkRatio(tenantId, callId, utterances);

    this.logger.log(
      `[AiExtraction] ✅ All stages complete for callId=${callId}`,
    );
  }

  // ── Stage 1: Summary + Next Steps ─────────────────────────────────────────
  private async runSummarize(
    tenantId:   string,
    callId:     string,
    fullText:   string,
    utterances: UtterancePayload[],
  ): Promise<void> {
    try {
      const result = await this.aiClient.summarize(
        tenantId, callId, fullText, utterances,
      );

      // §5.2: If flagged_for_review is true, do NOT auto-write — hold for human
      if (result.flagged_for_review) {
        this.logger.warn(
          `[AiExtraction][Summarize] Low confidence (${result.confidence_score}) ` +
          `for callId=${callId} — flagged for review, skipping auto-write`,
        );
        return;
      }

      await this.transcripts.patchAiFields(callId, tenantId, {
        summary:   result.summary,
        nextSteps: result.next_steps,
      });

      this.logger.log(
        `[AiExtraction][Summarize] ✅ Written — confidence=${result.confidence_score}`,
      );
    } catch (err) {
      // Failure in one stage must not block the others
      this.logger.error(
        `[AiExtraction][Summarize] ❌ Failed for callId=${callId}:`,
        err,
      );
    }
  }

  // ── Stage 2: Key Highlights ───────────────────────────────────────────────
  private async runHighlights(
    tenantId:   string,
    callId:     string,
    fullText:   string,
    utterances: UtterancePayload[],
  ): Promise<void> {
    try {
      const result = await this.aiClient.extractHighlights(
        tenantId, callId, fullText, utterances,
      );

      if (result.flagged_for_review) {
        this.logger.warn(
          `[AiExtraction][Highlights] Low confidence (${result.confidence_score}) ` +
          `for callId=${callId} — skipping auto-write`,
        );
        return;
      }

      await this.transcripts.patchAiFields(callId, tenantId, {
        keyHighlights: result.highlights,
      });

      this.logger.log(
        `[AiExtraction][Highlights] ✅ Written ${result.highlights.length} highlights`,
      );
    } catch (err) {
      this.logger.error(
        `[AiExtraction][Highlights] ❌ Failed for callId=${callId}:`,
        err,
      );
    }
  }

  // ── Stage 3: Talk Ratio (pure math — no flagged_for_review) ─────────────
  private async runTalkRatio(
    tenantId:   string,
    callId:     string,
    utterances: UtterancePayload[],
  ): Promise<void> {
    try {
      const result = await this.aiClient.computeTalkRatio(
        tenantId, callId, utterances,
      );

      // Talk ratio has no LLM confidence — always safe to write
      await this.transcripts.patchAiFields(callId, tenantId, {
        talkRatio: result,
      });

      this.logger.log(
        `[AiExtraction][TalkRatio] ✅ Written — ${result.speakers.length} speakers`,
      );
    } catch (err) {
      this.logger.error(
        `[AiExtraction][TalkRatio] ❌ Failed for callId=${callId}:`,
        err,
      );
    }
  }
}
