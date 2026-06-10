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
var DataCloudWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCloudWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const bullmq_2 = require("bullmq");
const data_cloud_service_1 = require("../services/data-cloud.service");
const data_cloud_events_1 = require("../events/data-cloud.events");
const data_cloud_schema_1 = require("../schemas/data-cloud.schema");
let DataCloudWorker = DataCloudWorker_1 = class DataCloudWorker extends bullmq_1.WorkerHost {
    service;
    logger = new common_1.Logger(DataCloudWorker_1.name);
    constructor(service) {
        super();
        this.service = service;
    }
    async process(job) {
        this.logger.log(`Processing export job [id=${job.id}] [attempt=${job.attemptsMade + 1}]`);
        const parsed = data_cloud_schema_1.ExportJobSchema.safeParse(job.data);
        if (!parsed.success) {
            const msg = `UNRECOVERABLE: Invalid job payload — ${JSON.stringify(parsed.error.flatten())}`;
            this.logger.error(msg);
            throw new Error(msg);
        }
        const { tenantId, connectionId } = parsed.data;
        if (!tenantId) {
            throw new Error('UNRECOVERABLE: tenantId required for data export job');
        }
        await this.service.runScheduledExport(tenantId, connectionId, job.data.runId);
        this.logger.log(`Export job [id=${job.id}] completed for tenant=${tenantId}`);
    }
    onCompleted(job) {
        this.logger.debug(`Job [id=${job.id}] completed`);
    }
    onFailed(job, error) {
        const isUnrecoverable = error.message.startsWith('UNRECOVERABLE:');
        this.logger.error(`Job [id=${job?.id}] failed (attempt ${job?.attemptsMade ?? '?'}): ${error.message}`);
        if (isUnrecoverable) {
            this.logger.error(`Job [id=${job?.id}] is unrecoverable — will NOT be retried`);
        }
    }
    onStalled(jobId) {
        this.logger.warn(`Job [id=${jobId}] stalled — BullMQ will re-queue`);
    }
};
exports.DataCloudWorker = DataCloudWorker;
__decorate([
    (0, bullmq_1.OnWorkerEvent)('completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job]),
    __metadata("design:returntype", void 0)
], DataCloudWorker.prototype, "onCompleted", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job, Error]),
    __metadata("design:returntype", void 0)
], DataCloudWorker.prototype, "onFailed", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)('stalled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DataCloudWorker.prototype, "onStalled", null);
exports.DataCloudWorker = DataCloudWorker = DataCloudWorker_1 = __decorate([
    (0, bullmq_1.Processor)(data_cloud_events_1.M10_DATA_CLOUD_QUEUES.EXPORT),
    __metadata("design:paramtypes", [data_cloud_service_1.DataCloudService])
], DataCloudWorker);
//# sourceMappingURL=data-cloud.worker.js.map