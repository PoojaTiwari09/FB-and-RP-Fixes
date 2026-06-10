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
var M06PredictionQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.M06PredictionQueueService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../database/prisma.service");
let M06PredictionQueueService = M06PredictionQueueService_1 = class M06PredictionQueueService {
    queue;
    prisma;
    logger = new common_1.Logger(M06PredictionQueueService_1.name);
    constructor(queue, prisma) {
        this.queue = queue;
        this.prisma = prisma;
    }
    async enqueuePrediction(tenantId, periodId, trigger, opts) {
        const idempotencyKey = `pred:${tenantId}:${periodId}:${trigger}:${opts?.submissionId ?? 'none'}`;
        const existing = await this.prisma.m06PredictionJob.findUnique({
            where: { idempotencyKey },
        });
        if (existing && ['pending', 'running'].includes(existing.status)) {
            return { jobId: existing.id, status: existing.status };
        }
        const jobRecord = await this.prisma.m06PredictionJob.upsert({
            where: { idempotencyKey },
            create: {
                tenantId: tenantId,
                periodId,
                status: 'pending',
                trigger,
                idempotencyKey,
            },
            update: { status: 'pending', error: null, completedAt: null },
        });
        const bullJob = await this.queue.add('m06-job', {
            type: 'ai.prediction.run',
            tenantId,
            periodId,
            trigger,
            baseline: opts?.baseline,
            region: opts?.region,
            submissionId: opts?.submissionId,
            dbJobId: jobRecord.id,
        }, {
            jobId: idempotencyKey,
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });
        this.logger.log(`Enqueued prediction ${bullJob.id} for period ${periodId}`);
        return { jobId: jobRecord.id, status: 'pending' };
    }
    async enqueueExecutiveMaterialize(tenantId, periodId, submissionId, payload) {
        const idempotencyKey = `exec:${tenantId}:${periodId}:${submissionId}`;
        await this.queue.add('m06-job', {
            type: 'forecast.executive.materialize',
            tenantId,
            periodId,
            submissionId,
            payload,
        }, {
            jobId: idempotencyKey,
            removeOnComplete: 100,
            attempts: 3,
            backoff: { type: 'exponential', delay: 3000 },
        });
    }
    async getLatestJob(tenantId, periodId) {
        return this.prisma.m06PredictionJob.findFirst({
            where: { tenantId: tenantId, periodId },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.M06PredictionQueueService = M06PredictionQueueService;
exports.M06PredictionQueueService = M06PredictionQueueService = M06PredictionQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('m06-queue')),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        prisma_service_1.PrismaService])
], M06PredictionQueueService);
//# sourceMappingURL=m06-prediction-queue.service.js.map