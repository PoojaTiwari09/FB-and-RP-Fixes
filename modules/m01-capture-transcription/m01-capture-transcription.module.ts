import { Module }     from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

// Controllers (real, production)
import { CallsController }   from './controllers/calls.controller';
import { M01FrontendCallsController } from './frontend-api/m01-frontend-calls.controller';
import { M01FrontendCallsService } from './frontend-api/m01-frontend-calls.service';
import {
  M01FrontendBriefPeriodsController,
  M01FrontendBriefTemplatesController,
  M01FrontendCallDetailController,
} from './frontend-api/m01-frontend-call-detail.controller';
import { M01FrontendTranscriptService } from './frontend-api/m01-frontend-transcript.service';
import { M01FrontendUploadController } from './frontend-api/m01-frontend-upload.controller';
import { M01FrontendSmartCallController } from './frontend-api/m01-frontend-smart-call.controller';
import { M01FrontendSmartCallService } from './frontend-api/m01-frontend-smart-call.service';
import { M01FrontendSmartCallPersistenceService } from './frontend-api/m01-frontend-smart-call-persistence.service';
import {
  M01FrontendAiReviewerDetailController,
  M01FrontendCoachingInsightsController,
} from './frontend-api/m01-frontend-ai-reviewer.controller';
import { M01FrontendAiReviewerService } from './frontend-api/m01-frontend-ai-reviewer.service';
import { UploadController }  from './controllers/upload.controller';
import { WebhookController } from './controllers/webhook.controller';
import { IntegrationsController } from './controllers/integrations.controller';
import { AiExtractorController } from './controllers/ai-extractor.controller';

// Services
import { CallService }              from './services/call.service';
import { PiiRedactionService }      from './services/pii-redaction.service';
import { AuditLogService }          from './services/audit-log.service';
import { AiExtractionClient }       from './services/ai-extraction.client';
import { AiExtractionSubscriber }   from './services/ai-extraction.subscriber';
import { CallAiPipelineService }    from './services/call-ai-pipeline.service';
import { M01FrontendCallProcessingService } from './frontend-api/m01-frontend-call-processing.service';
import { M02IngestClient }          from './services/m02-ingest.client';
import { AiExtractorService }       from './services/ai-extractor.service';

// Repositories
import { CallRepository }       from './repositories/call.repository';
import { TranscriptRepository } from './repositories/transcript.repository';
import { NotesRepository }      from './repositories/notes.repository';
import { NextStepsRepository }  from './repositories/next-steps.repository';
import {
  SearchRepository,
  ShareRepository,
} from './repositories/search.repository';

// Infrastructure
import { PrismaModule }         from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

// Workers
import { M01CaptureTranscriptionWorker } from './workers/m01.worker';

/**
 * M01 — Capture & Transcription
 *
 * The foundational lifecycle module for the platform. Every other module
 * (M02–M10) consumes calls / transcripts produced here, so this module is
 * responsible for:
 *
 *   1. Persistence of CallRecord / Transcript / Utterance / CallNote / CallShare
 *   2. Audio capture (direct upload + Zoom/Teams webhooks)
 *   3. ASR via AssemblyAI (BullMQ worker on m01-queue)
 *   4. PII redaction (US-04) before any text touches the DB
 *   5. Emission of `transcription.completed` → consumed by M02/M03/M05
 *   6. Local AI pipeline subscriber that calls apps/ai-services for
 *      summary / highlights / talk-ratio (US-12/13/14)
 *   7. Audit trail (US-30) for every state transition
 *
 * NOTE: The mock M01CaptureTranscriptionController/Service/Repository was
 * removed in the M01 deep validation pass — it shadowed real routes with
 * hard-coded responses and confused downstream consumers.
 */
@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm01-queue' }),
  ],
  controllers: [
    M01FrontendCallsController,
    M01FrontendCallDetailController,
    M01FrontendBriefTemplatesController,
    M01FrontendBriefPeriodsController,
    M01FrontendUploadController,
    M01FrontendSmartCallController,
    M01FrontendAiReviewerDetailController,
    M01FrontendCoachingInsightsController,
    CallsController,
    UploadController,
    WebhookController,
    IntegrationsController,
    AiExtractorController,
  ],
  providers: [
    // Services
    CallService,
    M01FrontendCallsService,
    M01FrontendTranscriptService,
    M01FrontendCallProcessingService,
    CallAiPipelineService,
    M01FrontendSmartCallService,
    M01FrontendSmartCallPersistenceService,
    M01FrontendAiReviewerService,
    PiiRedactionService,
    AuditLogService,
    AiExtractionClient,
    AiExtractionSubscriber,
    M02IngestClient,
    AiExtractorService,
    // Repositories
    CallRepository,
    TranscriptRepository,
    NotesRepository,
    NextStepsRepository,
    SearchRepository,
    ShareRepository,
    // Workers
    M01CaptureTranscriptionWorker,
  ],
  exports: [
    CallService,
    CallRepository,
    TranscriptRepository,
    NotesRepository,
    NextStepsRepository,
    SearchRepository,
    ShareRepository,
    AuditLogService,
    PiiRedactionService,
  ],
})
export class M01CaptureTranscriptionModule {}
