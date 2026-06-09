import { Injectable, Logger } from '@nestjs/common';
import { TranscriptRepository } from '../repositories/transcript.repository';
import { AiExtractorService } from './ai-extractor.service';
import {
  AiExtractionClient,
  UtterancePayload,
  type TalkRatioResult,
} from './ai-extraction.client';

/** Runs summarize, highlights, talk-ratio, and custom extraction for a call. */
@Injectable()
export class CallAiPipelineService {
  private readonly logger = new Logger(CallAiPipelineService.name);

  constructor(
    private readonly transcripts: TranscriptRepository,
    private readonly aiClient: AiExtractionClient,
    private readonly aiExtractor: AiExtractorService,
  ) {}

  async runForCall(tenantId: string, callId: string): Promise<void> {
    const transcript = await this.transcripts.findByCallId(callId, tenantId);
    if (!transcript) {
      this.logger.warn(`[CallAiPipeline] No transcript for callId=${callId}`);
      return;
    }

    const utterances: UtterancePayload[] = transcript.utterances.map((u) => ({
      speaker: u.speaker,
      text: u.text,
      start_ms: u.startMs,
      end_ms: u.endMs,
      sequence_index: u.sequenceIndex,
    }));

    const fullText = transcript.fullText || utterances.map((u) => u.text).join(' ');

    await this.runSummarize(tenantId, callId, fullText, utterances);
    await this.runHighlights(tenantId, callId, fullText, utterances);
    await this.runTalkRatio(tenantId, callId, utterances);
    try {
      await this.aiExtractor.runExtraction(tenantId, callId);
    } catch (err) {
      this.logger.error(`[CallAiPipeline][CustomFields] callId=${callId}`, err);
    }
  }

  private normalizeTalkRatio(result: TalkRatioResult): Record<string, unknown> {
    const speakers = result.speakers ?? [];
    if (speakers.length === 0) {
      return { Rep: { durationMs: 0, percentage: 0.5 }, Customer: { durationMs: 0, percentage: 0.5 } };
    }
    const sorted = [...speakers].sort((a, b) => b.duration_ms - a.duration_ms);
    const rep = sorted[0];
    const customer = sorted[1] ?? sorted[0];
    return {
      Rep: { durationMs: rep.duration_ms, percentage: rep.percentage },
      Customer: {
        durationMs: customer.duration_ms,
        percentage: customer.percentage ?? 1 - (rep.percentage ?? 0.5),
      },
    };
  }

  private async runSummarize(
    tenantId: string,
    callId: string,
    fullText: string,
    utterances: UtterancePayload[],
  ): Promise<void> {
    try {
      const result = await this.aiClient.summarize(tenantId, callId, fullText, utterances);
      if (result.flagged_for_review) return;
      await this.transcripts.patchAiFields(callId, tenantId, {
        summary: result.summary,
        nextSteps: result.next_steps,
      });
    } catch (err) {
      this.logger.error(`[CallAiPipeline][Summarize] callId=${callId}`, err);
    }
  }

  private async runHighlights(
    tenantId: string,
    callId: string,
    fullText: string,
    utterances: UtterancePayload[],
  ): Promise<void> {
    try {
      const result = await this.aiClient.extractHighlights(tenantId, callId, fullText, utterances);
      if (result.flagged_for_review) return;
      await this.transcripts.patchAiFields(callId, tenantId, {
        keyHighlights: result.highlights,
      });
    } catch (err) {
      this.logger.error(`[CallAiPipeline][Highlights] callId=${callId}`, err);
    }
  }

  private async runTalkRatio(
    tenantId: string,
    callId: string,
    utterances: UtterancePayload[],
  ): Promise<void> {
    try {
      const result = await this.aiClient.computeTalkRatio(tenantId, callId, utterances);
      await this.transcripts.patchAiFields(callId, tenantId, {
        talkRatio: this.normalizeTalkRatio(result),
      });
    } catch (err) {
      this.logger.error(`[CallAiPipeline][TalkRatio] callId=${callId}`, err);
    }
  }
}
