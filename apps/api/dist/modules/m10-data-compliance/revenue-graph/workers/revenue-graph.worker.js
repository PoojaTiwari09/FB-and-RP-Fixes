"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RevenueGraphWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueGraphWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const bullmq_2 = require("bullmq");
const revenue_graph_service_1 = require("../services/revenue-graph.service");
const revenue_graph_events_1 = require("../events/revenue-graph.events");
const revenue_graph_schema_1 = require("../schemas/revenue-graph.schema");
let RevenueGraphWorker = RevenueGraphWorker_1 = class RevenueGraphWorker extends bullmq_1.WorkerHost {
    service;
    logger = new common_1.Logger(RevenueGraphWorker_1.name);
    constructor(service) {
        super();
        this.service = service;
    }
    async process(job) {
        this.logger.log(`Processing job [id=${job.id}] [name=${job.name}] [attempt=${job.attemptsMade + 1}]`);
        if (job.name !==
            revenue_graph_events_1.M10_REVENUE_GRAPH_EVENTS.CONSUMED.CALL_TRANSCRIPTION_COMPLETED) {
            this.logger.warn(`Unknown job name "${job.name}" — skipping`);
            return;
        }
        const parsed = revenue_graph_schema_1.TranscriptionCompletedEventSchema.safeParse(job.data);
        if (!parsed.success) {
            this.logger.error(`Job [id=${job.id}] invalid payload: ${JSON.stringify(parsed.error.flatten())}`);
            throw new Error(`UNRECOVERABLE: Invalid event payload — ${JSON.stringify(parsed.error.flatten())}`);
        }
        const event = parsed.data;
        if (!event.tenantId) {
            this.logger.error(`Job [id=${job.id}] rejected: missing tenantId`);
            throw new Error("UNRECOVERABLE: tenantId is required for Revenue Graph linking");
        }
        const intake = revenue_graph_schema_1.NormalizedIntakeSchema.parse({
            eventId: event.eventId,
            tenantId: event.tenantId,
            sourceType: event.sourceType,
            sourcePlatform: event.sourcePlatform,
            sourceRecordId: event.sourceRecordId,
            occurredAt: event.occurredAt,
            participants: event.participants,
            crmHints: event.crmHints ?? {},
            artifacts: event.artifacts ?? {},
        });
        await this.service.processInteractionLinking(intake);
        this.logger.log(`Job [id=${job.id}] completed successfully`);
    }
    onCompleted(job) {
        this.logger.debug(`Job [id=${job.id}] completed`);
    }
    onFailed(job, error) {
        const isUnrecoverable = error.message.startsWith("UNRECOVERABLE:");
        this.logger.error(`Job [id=${job?.id}] failed (attempt ${job?.attemptsMade ?? "?"}): ${error.message}`);
        if (isUnrecoverable) {
            this.logger.error(`Job [id=${job?.id}] is unrecoverable — will NOT be retried`);
        }
    }
    onStalled(jobId) {
        this.logger.warn(`Job [id=${jobId}] stalled — BullMQ will re-queue`);
    }
};
exports.RevenueGraphWorker = RevenueGraphWorker;
__decorate([
    (0, bullmq_1.OnWorkerEvent)("completed"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job]),
    __metadata("design:returntype", void 0)
], RevenueGraphWorker.prototype, "onCompleted", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)("failed"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job, Error]),
    __metadata("design:returntype", void 0)
], RevenueGraphWorker.prototype, "onFailed", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)("stalled"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RevenueGraphWorker.prototype, "onStalled", null);
exports.RevenueGraphWorker = RevenueGraphWorker = RevenueGraphWorker_1 = __decorate([
    (0, bullmq_1.Processor)(revenue_graph_events_1.M10_REVENUE_GRAPH_QUEUES.INTAKE),
    __metadata("design:paramtypes", [revenue_graph_service_1.RevenueGraphService])
], RevenueGraphWorker);
//# sourceMappingURL=revenue-graph.worker.js.map