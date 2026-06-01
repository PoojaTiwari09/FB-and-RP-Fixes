import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CallAiPipelineService } from './call-ai-pipeline.service';

interface TranscriptionCompletedPayload {
  eventId: string;
  version: string;
  occurredAt: string;
  tenantId: string;
  callId: string;
}

@Injectable()
export class AiExtractionSubscriber {
  private readonly logger = new Logger(AiExtractionSubscriber.name);

  constructor(private readonly pipeline: CallAiPipelineService) {}

  @OnEvent('call.transcription.completed', { async: true })
  async handleTranscriptionCompleted(payload: TranscriptionCompletedPayload): Promise<void> {
    const { tenantId, callId } = payload;
    this.logger.log(`[AiExtraction] call.transcription.completed — callId=${callId}`);
    await this.pipeline.runForCall(tenantId, callId);
    this.logger.log(`[AiExtraction] ✅ Pipeline complete for callId=${callId}`);
  }

  @OnEvent('transcription.completed', { async: true })
  async handleLegacy(payload: TranscriptionCompletedPayload): Promise<void> {
    await this.handleTranscriptionCompleted(payload);
  }
}
