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
Object.defineProperty(exports, "__esModule", { value: true });
exports.M06ForecastingPredictionWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../database/prisma.service");
const m06_service_1 = require("../services/m06.service");
const M06_RECALC_LIMIT_MINUTES = 60;
let M06ForecastingPredictionWorker = class M06ForecastingPredictionWorker extends bullmq_1.WorkerHost {
    prisma;
    forecastingService;
    constructor(prisma, forecastingService) {
        super();
        this.prisma = prisma;
        this.forecastingService = forecastingService;
    }
    async process(job) {
        const { type, tenantId, periodId } = job.data;
        if (type === 'forecast.executive.materialize') {
            await this.materializeExecutive(job);
            return;
        }
        if (type === 'ai.prediction.run' || type === 'deal.stage.changed') {
            await this.runPrediction(job);
            return;
        }
    }
    async runPrediction(job) {
        const { tenantId, periodId, dbJobId } = job.data;
        if (dbJobId) {
            await this.prisma.m06PredictionJob.update({
                where: { id: dbJobId },
                data: { status: 'running', startedAt: new Date() },
            });
        }
        const lastSnapshot = await this.prisma.aiForecastSnapshot.findFirst({
            where: { tenantId, periodId },
            orderBy: { computedAt: 'desc' },
        });
        if (lastSnapshot) {
            const minutesSince = (Date.now() - lastSnapshot.computedAt.getTime()) / 60000;
            if (minutesSince < M06_RECALC_LIMIT_MINUTES && lastSnapshot.idempotencyKey === job.id) {
                return;
            }
        }
        try {
            const period = await this.prisma.forecastPeriod.findFirst({
                where: { id: periodId, tenantId },
            });
            if (!period)
                throw new Error('Period not found');
            const explainability = await this.forecastingService['buildExplainability'](tenantId, period, lastSnapshot?.modelInputs ?? {});
            const closedWon = explainability.closedWonDetails?.total || 0;
            const weightedPipeline = explainability.deals?.reduce((s, d) => s + (d.contribution || 0), 0) || 0;
            const expectedDeals = lastSnapshot?.modelInputs?.expectedDeals?.contribution || 0;
            let predictedAmount = closedWon + weightedPipeline + expectedDeals;
            const spread = predictedAmount * 0.2;
            let modelInputs = lastSnapshot?.modelInputs ?? { source: 'worker' };
            try {
                const res = await fetch('http://localhost:8000/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tenantId, periodId }),
                });
                if (res.ok) {
                    const prediction = await res.json();
                    predictedAmount = prediction.predictedAmount ?? predictedAmount;
                    await this.prisma.aiForecastSnapshot.create({
                        data: {
                            tenantId,
                            periodId,
                            predictedAmount: prediction.predictedAmount ?? predictedAmount,
                            confidenceRangeLow: prediction.confidenceRangeLow ?? predictedAmount - spread / 2,
                            confidenceRangeHigh: prediction.confidenceRangeHigh ?? predictedAmount + spread / 2,
                            modelInputs: prediction.modelInputs ?? modelInputs,
                            idempotencyKey: job.id ?? (0, crypto_1.randomUUID)(),
                        },
                    });
                    if (dbJobId) {
                        await this.prisma.m06PredictionJob.update({
                            where: { id: dbJobId },
                            data: { status: 'completed', completedAt: new Date() },
                        });
                    }
                    return;
                }
            }
            catch {
            }
            await this.prisma.aiForecastSnapshot.create({
                data: {
                    tenantId,
                    periodId,
                    predictedAmount,
                    confidenceRangeLow: Math.round(predictedAmount - spread / 2),
                    confidenceRangeHigh: Math.round(predictedAmount + spread / 2),
                    modelInputs,
                    idempotencyKey: job.id ?? (0, crypto_1.randomUUID)(),
                },
            });
            if (dbJobId) {
                await this.prisma.m06PredictionJob.update({
                    where: { id: dbJobId },
                    data: { status: 'completed', completedAt: new Date() },
                });
            }
        }
        catch (err) {
            if (dbJobId) {
                await this.prisma.m06PredictionJob.update({
                    where: { id: dbJobId },
                    data: { status: 'failed', error: err?.message, completedAt: new Date() },
                });
            }
            throw err;
        }
    }
    async materializeExecutive(job) {
        const { tenantId, periodId, submissionId } = job.data;
        const idempotencyKey = `exec:${tenantId}:${periodId}:${submissionId}`;
        const existing = await this.prisma.forecastExecutiveSnapshot.findUnique({
            where: { idempotencyKey },
        });
        if (existing)
            return;
        const dashboard = await this.forecastingService.getExecutiveDashboard(tenantId, undefined, undefined, periodId, { skipSnapshot: true });
        await this.prisma.forecastExecutiveSnapshot.create({
            data: {
                tenantId,
                periodId,
                submissionId,
                payload: dashboard,
                idempotencyKey,
            },
        });
    }
};
exports.M06ForecastingPredictionWorker = M06ForecastingPredictionWorker;
exports.M06ForecastingPredictionWorker = M06ForecastingPredictionWorker = __decorate([
    (0, bullmq_1.Processor)('m06-queue'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        m06_service_1.M06ForecastingPredictionService])
], M06ForecastingPredictionWorker);
//# sourceMappingURL=m06.worker.js.map