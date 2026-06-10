"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M01CaptureTranscriptionModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const calls_controller_1 = require("./controllers/calls.controller");
const m01_frontend_calls_controller_1 = require("./controllers/m01-frontend-calls.controller");
const m01_frontend_calls_service_1 = require("./services/m01-frontend-calls.service");
const m01_frontend_call_detail_controller_1 = require("./controllers/m01-frontend-call-detail.controller");
const m01_frontend_transcript_service_1 = require("./services/m01-frontend-transcript.service");
const m01_frontend_upload_controller_1 = require("./controllers/m01-frontend-upload.controller");
const m01_frontend_smart_call_controller_1 = require("./controllers/m01-frontend-smart-call.controller");
const m01_frontend_smart_call_service_1 = require("./services/m01-frontend-smart-call.service");
const m01_frontend_smart_call_persistence_service_1 = require("./services/m01-frontend-smart-call-persistence.service");
const m01_frontend_ai_reviewer_controller_1 = require("./controllers/m01-frontend-ai-reviewer.controller");
const m01_frontend_ai_reviewer_service_1 = require("./services/m01-frontend-ai-reviewer.service");
const upload_controller_1 = require("./controllers/upload.controller");
const webhook_controller_1 = require("./controllers/webhook.controller");
const integrations_controller_1 = require("./controllers/integrations.controller");
const ai_extractor_controller_1 = require("./controllers/ai-extractor.controller");
const call_service_1 = require("./services/call.service");
const pii_redaction_service_1 = require("./services/pii-redaction.service");
const audit_log_service_1 = require("./services/audit-log.service");
const ai_extraction_client_1 = require("./services/ai-extraction.client");
const ai_extraction_subscriber_1 = require("./services/ai-extraction.subscriber");
const call_ai_pipeline_service_1 = require("./services/call-ai-pipeline.service");
const m01_frontend_call_processing_service_1 = require("./services/m01-frontend-call-processing.service");
const m02_ingest_client_1 = require("./services/m02-ingest.client");
const ai_extractor_service_1 = require("./services/ai-extractor.service");
const malware_scanner_service_1 = require("./services/malware-scanner.service");
const call_repository_1 = require("./repositories/call.repository");
const transcript_repository_1 = require("./repositories/transcript.repository");
const notes_repository_1 = require("./repositories/notes.repository");
const next_steps_repository_1 = require("./repositories/next-steps.repository");
const search_repository_1 = require("./repositories/search.repository");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
const m01_worker_1 = require("./workers/m01.worker");
let M01CaptureTranscriptionModule = class M01CaptureTranscriptionModule {
};
exports.M01CaptureTranscriptionModule = M01CaptureTranscriptionModule;
exports.M01CaptureTranscriptionModule = M01CaptureTranscriptionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            bullmq_1.BullModule.registerQueue({ name: 'm01-queue' }),
        ],
        controllers: [
            m01_frontend_calls_controller_1.M01FrontendCallsController,
            m01_frontend_call_detail_controller_1.M01FrontendCallDetailController,
            m01_frontend_call_detail_controller_1.M01FrontendBriefTemplatesController,
            m01_frontend_call_detail_controller_1.M01FrontendBriefPeriodsController,
            m01_frontend_upload_controller_1.M01FrontendUploadController,
            m01_frontend_smart_call_controller_1.M01FrontendSmartCallController,
            m01_frontend_ai_reviewer_controller_1.M01FrontendAiReviewerDetailController,
            m01_frontend_ai_reviewer_controller_1.M01FrontendCoachingInsightsController,
            calls_controller_1.CallsController,
            upload_controller_1.UploadController,
            webhook_controller_1.WebhookController,
            integrations_controller_1.IntegrationsController,
            ai_extractor_controller_1.AiExtractorController,
        ],
        providers: [
            call_service_1.CallService,
            m01_frontend_calls_service_1.M01FrontendCallsService,
            m01_frontend_transcript_service_1.M01FrontendTranscriptService,
            m01_frontend_call_processing_service_1.M01FrontendCallProcessingService,
            call_ai_pipeline_service_1.CallAiPipelineService,
            m01_frontend_smart_call_service_1.M01FrontendSmartCallService,
            m01_frontend_smart_call_persistence_service_1.M01FrontendSmartCallPersistenceService,
            m01_frontend_ai_reviewer_service_1.M01FrontendAiReviewerService,
            pii_redaction_service_1.PiiRedactionService,
            audit_log_service_1.AuditLogService,
            ai_extraction_client_1.AiExtractionClient,
            ai_extraction_subscriber_1.AiExtractionSubscriber,
            m02_ingest_client_1.M02IngestClient,
            ai_extractor_service_1.AiExtractorService,
            malware_scanner_service_1.MalwareScannerService,
            call_repository_1.CallRepository,
            transcript_repository_1.TranscriptRepository,
            notes_repository_1.NotesRepository,
            next_steps_repository_1.NextStepsRepository,
            search_repository_1.SearchRepository,
            search_repository_1.ShareRepository,
            m01_worker_1.M01CaptureTranscriptionWorker,
        ],
        exports: [
            call_service_1.CallService,
            call_repository_1.CallRepository,
            transcript_repository_1.TranscriptRepository,
            notes_repository_1.NotesRepository,
            next_steps_repository_1.NextStepsRepository,
            search_repository_1.SearchRepository,
            search_repository_1.ShareRepository,
            audit_log_service_1.AuditLogService,
            pii_redaction_service_1.PiiRedactionService,
        ],
    })
], M01CaptureTranscriptionModule);
//# sourceMappingURL=m01-capture-transcription.module.js.map