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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DataCloudSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCloudSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const data_cloud_repository_1 = require("../repositories/data-cloud.repository");
const data_cloud_events_1 = require("../events/data-cloud.events");
const SCHEDULED_EXPORT_ENABLED = process.env.M10_DATA_EXPORT_SCHEDULED_EXPORT_ENABLED !== "false";
const CRON_EXPRESSION = process.env.M10_DATA_EXPORT_SYNC_CRON ?? "0 2 * * *";
let DataCloudSchedulerService = DataCloudSchedulerService_1 = class DataCloudSchedulerService {
    repo;
    exportQueue;
    logger = new common_1.Logger(DataCloudSchedulerService_1.name);
    constructor(repo, exportQueue) {
        this.repo = repo;
        this.exportQueue = exportQueue;
    }
    async triggerDailyExport() {
        if (!SCHEDULED_EXPORT_ENABLED) {
            this.logger.warn("[DataCloud Scheduler] Skipped — M10_DATA_EXPORT_SCHEDULED_EXPORT_ENABLED=false");
            return;
        }
        this.logger.log("[DataCloud Scheduler] 02:00 UTC trigger fired — queuing export jobs for all active connections");
        try {
            const activeConnections = await this.repo.findAllActiveConnections();
            this.logger.log(`[DataCloud Scheduler] Found ${activeConnections.length} active connections to export`);
            for (const connection of activeConnections) {
                const idempotencyKey = `${connection.tenantId}:${connection.id}:scheduled:${new Date().toISOString().split("T")[0]}`;
                await this.exportQueue.add("data-cloud-export", {
                    tenantId: connection.tenantId,
                    connectionId: connection.id,
                    datasetName: "all",
                    syncMode: "incremental",
                    idempotencyKey,
                }, {
                    jobId: idempotencyKey,
                    attempts: 3,
                    backoff: { type: "exponential", delay: 5000 },
                });
                this.logger.log(`[DataCloud Scheduler] Queued export job: tenant=${connection.tenantId} conn=${connection.id}`);
            }
        }
        catch (err) {
            this.logger.error(`[DataCloud Scheduler] Failed to queue export jobs: ${err.message}`);
        }
    }
};
exports.DataCloudSchedulerService = DataCloudSchedulerService;
__decorate([
    (0, schedule_1.Cron)(CRON_EXPRESSION, {
        name: "m10-data-cloud-daily-export",
        timeZone: "UTC",
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataCloudSchedulerService.prototype, "triggerDailyExport", null);
exports.DataCloudSchedulerService = DataCloudSchedulerService = DataCloudSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)(data_cloud_events_1.M10_DATA_CLOUD_QUEUES.EXPORT)),
    __metadata("design:paramtypes", [data_cloud_repository_1.DataCloudRepository,
        bullmq_2.Queue])
], DataCloudSchedulerService);
//# sourceMappingURL=data-cloud-scheduler.service.js.map