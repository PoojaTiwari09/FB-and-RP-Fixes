import { Injectable, NotFoundException } from '@nestjs/common';
import { CallService } from '../services/call.service';
import { CallAiPipelineService } from '../services/call-ai-pipeline.service';
import { M01FrontendTranscriptService } from './m01-frontend-transcript.service';

export type CallProcessPhase =
  | 'transcribing'
  | 'analyzing'
  | 'ready'
  | 'error';

@Injectable()
export class M01FrontendCallProcessingService {
  constructor(
    private readonly calls: CallService,
    private readonly pipeline: CallAiPipelineService,
    private readonly transcriptUi: M01FrontendTranscriptService,
  ) {}

  async getStatus(callId: string, tenantId: string) {
    const record = await this.calls.getCallDetail(callId, tenantId);
    if (!record) throw new NotFoundException('Call not found');

    const utteranceCount = record.transcript?.utterances?.length ?? 0;
    const status = record.transcriptStatus ?? 'pending';
    const hasSummary = Boolean(record.transcript?.summary?.trim());

    let phase: CallProcessPhase = 'ready';
    if (status === 'processing' || status === 'pending') {
      phase = utteranceCount > 0 ? 'analyzing' : 'transcribing';
    } else if (status === 'failed') {
      phase = 'error';
    } else if (status === 'completed' && utteranceCount === 0) {
      phase = 'error';
    } else if (status === 'completed' && utteranceCount > 0 && !hasSummary) {
      phase = 'analyzing';
    }

    return {
      callId,
      transcriptStatus: status,
      phase,
      utteranceCount,
      hasSummary,
      hasAudio: Boolean(record.audioUrl),
      message: this.statusMessage(phase, status),
    };
  }

  private statusMessage(phase: CallProcessPhase, transcriptStatus: string): string {
    if (phase === 'transcribing') return 'Transcribing recording…';
    if (phase === 'analyzing') return 'Analyzing transcript fields…';
    if (phase === 'error') return `Transcription ${transcriptStatus}. Retry processing.`;
    return 'Call is ready.';
  }

  /**
   * On call open: queue transcription if needed, then run AI field analysis.
   */
  async processCall(callId: string, tenantId: string) {
    const record = await this.calls.getCallDetail(callId, tenantId);
    if (!record) throw new NotFoundException('Call not found');

    const utteranceCount = record.transcript?.utterances?.length ?? 0;
    const status = record.transcriptStatus ?? 'pending';

    if (utteranceCount === 0) {
      if (!record.audioUrl) {
        return {
          phase: 'error' as CallProcessPhase,
          transcriptStatus: status,
          message: 'No recording available to transcribe.',
        };
      }
      if (status !== 'processing') {
        await this.calls.enqueueTranscription(callId, tenantId);
      }
      return {
        phase: 'transcribing' as CallProcessPhase,
        transcriptStatus: 'processing',
        message: 'Generating transcript from recording…',
      };
    }

    if (status === 'processing') {
      return {
        phase: 'transcribing' as CallProcessPhase,
        transcriptStatus: 'processing',
        message: 'Transcription in progress…',
      };
    }

    if (status === 'failed') {
      if (record.audioUrl) {
        await this.calls.enqueueTranscription(callId, tenantId);
        return {
          phase: 'transcribing' as CallProcessPhase,
          transcriptStatus: 'processing',
          message: 'Retrying transcription…',
        };
      }
      return {
        phase: 'error' as CallProcessPhase,
        transcriptStatus: status,
        message: record.failureReason || 'Transcription failed.',
      };
    }

    await this.pipeline.runForCall(tenantId, callId);
    await this.calls.syncCallMetadataFromTranscript(callId, tenantId);
    await this.transcriptUi.upsertAnalyzedBrief(callId, tenantId);

    return {
      phase: 'ready' as CallProcessPhase,
      transcriptStatus: 'completed',
      message: 'Transcript and analysis fields are ready.',
    };
  }
}
