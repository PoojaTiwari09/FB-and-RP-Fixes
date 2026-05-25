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
const m01_controller_1 = require("./controllers/m01.controller");
const calls_controller_1 = require("./controllers/calls.controller");
const m01_service_1 = require("./services/m01.service");
const call_service_1 = require("./services/call.service");
const m01_repository_1 = require("./repositories/m01.repository");
const call_repository_1 = require("./repositories/call.repository");
const transcript_repository_1 = require("./repositories/transcript.repository");
const notes_repository_1 = require("./repositories/notes.repository");
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
            m01_controller_1.M01CaptureTranscriptionController,
            calls_controller_1.CallsController,
        ],
        providers: [
            m01_service_1.M01CaptureTranscriptionService,
            call_service_1.CallService,
            m01_repository_1.M01CaptureTranscriptionRepository,
            call_repository_1.CallRepository,
            transcript_repository_1.TranscriptRepository,
            notes_repository_1.NotesRepository,
            search_repository_1.SearchRepository,
            search_repository_1.ShareRepository,
            m01_worker_1.M01CaptureTranscriptionWorker,
        ],
        exports: [
            m01_service_1.M01CaptureTranscriptionService,
            call_service_1.CallService,
        ],
    })
], M01CaptureTranscriptionModule);
