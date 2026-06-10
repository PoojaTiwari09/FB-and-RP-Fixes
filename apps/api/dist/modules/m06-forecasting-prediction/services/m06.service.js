"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M06ForecastingPredictionService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../database/prisma.service");
const event_publisher_service_1 = require("../../platform-core/events/event-publisher.service");
const m06_prediction_queue_service_1 = require("./m06-prediction-queue.service");
let M06ForecastingPredictionService = class M06ForecastingPredictionService {
    prisma;
    eventPublisher;
    predictionQueue;
    constructor(prisma, eventPublisher, predictionQueue) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
        this.predictionQueue = predictionQueue;
    }
    stageFallbackRates = {
        Discovery: 0.20,
        Proposal: 0.58,
        'Proposal sent': 0.58,
        Negotiation: 0.74,
        'Closed Won': 1,
        'Closed Lost': 0,
    };
    normalizeBaseline(baseline) {
        if (!baseline || baseline === 'current' || baseline === 'null')
            return undefined;
        return baseline;
    }
    fiscalSortKey(periodName) {
        const match = periodName?.match(/Q(\d)\s+FY(\d{2})/i);
        if (!match)
            return Number.MIN_SAFE_INTEGER;
        return (2000 + Number(match[2])) * 10 + Number(match[1]);
    }
    stageRate(rateMap, stage, fallback) {
        const alias = Object.keys(rateMap).find((key) => {
            const lhs = stage.toLowerCase();
            const rhs = key.toLowerCase();
            return lhs.includes(rhs) || rhs.includes(lhs);
        });
        return rateMap[stage]
            ?? (alias ? rateMap[alias] : undefined)
            ?? fallback
            ?? this.stageFallbackRates[stage]
            ?? this.stageFallbackRates.Discovery;
    }
    async resolvePeriod(tenantId, periodId) {
        if (periodId === 'current') {
            let period = await this.prisma.forecastPeriod.findFirst({
                where: { tenantId, status: 'open' },
                orderBy: { startDate: 'desc' },
            });
            if (!period) {
                period = await this.prisma.forecastPeriod.findFirst({
                    where: { tenantId, isLocked: false },
                    orderBy: { startDate: 'desc' },
                });
            }
            if (!period) {
                period = await this.prisma.forecastPeriod.findFirst({
                    where: { tenantId },
                    orderBy: { startDate: 'desc' },
                });
            }
            if (!period)
                throw new common_1.NotFoundException('Period not found');
            return period;
        }
        const period = await this.prisma.forecastPeriod.findFirst({
            where: { id: periodId, tenantId },
        });
        if (!period)
            throw new common_1.NotFoundException('Period not found');
        return period;
    }
    timeDecay(closeDate) {
        const daysToClose = Math.max(0, (closeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysToClose < 30)
            return 1;
        if (daysToClose < 60)
            return 0.8;
        if (daysToClose < 90)
            return 0.65;
        return 0.5;
    }
    async getStageRateMap(tenantId) {
        const rows = await this.prisma.historicalConversionRate.findMany({ where: { tenantId } });
        if (!rows.length)
            return { ...this.stageFallbackRates };
        const latestPeriod = Array.from(new Set(rows.map((row) => row.periodName).filter(Boolean)))
            .sort((a, b) => this.fiscalSortKey(b) - this.fiscalSortKey(a))[0];
        const currentRows = latestPeriod ? rows.filter((row) => row.periodName === latestPeriod) : rows;
        return currentRows.reduce((rates, row) => {
            rates[row.fromStage] = row.conversionRate;
            return rates;
        }, { ...this.stageFallbackRates });
    }
    async getBaselineRates(tenantId, baseline, currentPeriodName) {
        const allRates = await this.prisma.historicalConversionRate.findMany({
            where: { tenantId },
            orderBy: { computedAt: 'desc' },
        });
        if (!allRates.length)
            return { rateMap: { ...this.stageFallbackRates }, baselineNote: 'No historical rates found; using heuristic fallback rates.' };
        const seenPeriods = Array.from(new Set(allRates.map((rate) => rate.periodName).filter(Boolean)))
            .sort((a, b) => this.fiscalSortKey(b) - this.fiscalSortKey(a));
        let selectedPeriods = [];
        let baselineNote = '';
        const currentSortKey = this.fiscalSortKey(currentPeriodName);
        const priorPeriods = currentSortKey === Number.MIN_SAFE_INTEGER
            ? seenPeriods
            : seenPeriods.filter((periodName) => this.fiscalSortKey(periodName) < currentSortKey);
        if (baseline === 'avg_last_2') {
            selectedPeriods = priorPeriods.slice(0, 2);
            baselineNote = selectedPeriods.length ? `Baseline: average of last 2 periods (${selectedPeriods.join(', ')})` : 'Baseline: avg_last_2 — insufficient periods, using fallback rates.';
        }
        else if (baseline === 'last_period') {
            selectedPeriods = priorPeriods.slice(0, 1);
            baselineNote = selectedPeriods.length ? `Baseline: last period (${selectedPeriods[0]})` : 'Baseline: last_period — no period found, using fallback rates.';
        }
        else if (baseline === 'same_period_last_year') {
            const periodNameForComparison = currentPeriodName ?? seenPeriods[0] ?? '';
            const match = periodNameForComparison.match(/^(Q\d)\s+FY(\d{2})$/);
            if (match) {
                const fy = parseInt(match[2], 10) - 1;
                const targetPeriodName = `${match[1]} FY${fy.toString().padStart(2, '0')}`;
                selectedPeriods = [targetPeriodName];
                baselineNote = `Baseline: same quarter last year (${targetPeriodName})`;
            }
            else {
                baselineNote = 'Baseline: same_period_last_year — current period name could not be parsed; using fallback rates.';
            }
        }
        if (!selectedPeriods.length)
            return { rateMap: { ...this.stageFallbackRates }, baselineNote };
        const relevant = allRates.filter((r) => r.periodName && selectedPeriods.includes(r.periodName));
        if (!relevant.length)
            return { rateMap: { ...this.stageFallbackRates }, baselineNote: `${baselineNote} — no matching rows found; using fallback rates.` };
        const grouped = {};
        for (const r of relevant) {
            if (!grouped[r.fromStage])
                grouped[r.fromStage] = [];
            grouped[r.fromStage].push(r.conversionRate);
        }
        const rateMap = { ...this.stageFallbackRates };
        for (const [stage, values] of Object.entries(grouped)) {
            rateMap[stage] = values.reduce((a, b) => a + b, 0) / values.length;
        }
        return { rateMap, baselineNote };
    }
    applyBaselineToSnapshot(snapshot, baselineRateMap) {
        const inputs = snapshot.modelInputs;
        const pipelineByStage = Array.isArray(inputs?.pipelineByStage) ? inputs.pipelineByStage : [];
        let baselinePipelineContribution = 0;
        for (const stageEntry of pipelineByStage) {
            const stage = stageEntry.stage;
            const rate = this.stageRate(baselineRateMap, stage, stageEntry.convRate);
            baselinePipelineContribution += stageEntry.pipeline * rate;
        }
        const closedWonTotal = inputs?.closedWonDetails?.total ?? 0;
        const expectedDealsContribution = inputs?.expectedDeals?.contribution ?? 0;
        if (!pipelineByStage.length) {
            return { predictedAmount: snapshot.predictedAmount, confidenceRangeLow: snapshot.confidenceRangeLow, confidenceRangeHigh: snapshot.confidenceRangeHigh };
        }
        const originalPipelineContrib = pipelineByStage.reduce((sum, s) => sum + s.contribution, 0);
        const scalingFactor = originalPipelineContrib > 0 ? baselinePipelineContribution / originalPipelineContrib : 1;
        const predictedAmount = Math.round(closedWonTotal + baselinePipelineContribution + expectedDealsContribution);
        const rangeSpread = (snapshot.confidenceRangeHigh - snapshot.confidenceRangeLow) * scalingFactor;
        return {
            predictedAmount,
            confidenceRangeLow: Math.round(predictedAmount - rangeSpread / 2),
            confidenceRangeHigh: Math.round(predictedAmount + rangeSpread / 2),
        };
    }
    confidenceLabel(stageRate, probability, timeDecay) {
        const normalizedProbability = probability == null ? stageRate : probability > 1 ? probability / 100 : probability;
        const score = (stageRate * 0.25) + (normalizedProbability * 0.30) + ((stageRate >= 0.58 ? 0.80 : 0.50) * 0.10) + (Math.max(stageRate, normalizedProbability) * 0.10) + (timeDecay * 0.10) + (1.00 * 0.05) + (0.75 * 0.05) + (timeDecay * 0.05);
        return score >= 0.65 ? 'High' : score >= 0.40 ? 'Med' : 'Low';
    }
    async buildExplainability(tenantId, period, modelInputs, region, customRates, repUserId) {
        const rates = customRates ?? await this.getStageRateMap(tenantId);
        let crmDealsQuery = { tenantId, closeDate: { gte: period.startDate, lte: period.endDate } };
        if (repUserId)
            crmDealsQuery.repUserId = repUserId;
        let crmDeals = await this.prisma.crmDeal.findMany({
            where: crmDealsQuery,
            orderBy: { closeDate: 'asc' },
        });
        crmDeals = crmDeals.filter(d => !d.dealName.startsWith('Historical Deal'));
        const dbActiveDeals = crmDeals.filter((deal) => !deal.isClosedLost && !deal.isClosedWon).map((deal) => {
            const stageRate = this.stageRate(rates, deal.stage);
            const timeDecay = this.timeDecay(deal.closeDate);
            const contributionFactor = stageRate * timeDecay;
            return {
                deal: deal.dealName, stage: deal.stage, amount: deal.amount,
                aiConf: this.confidenceLabel(stageRate, deal.probability, timeDecay),
                close: deal.closeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                closeDate: deal.closeDate.toISOString(),
                stageRate, timeDecay, contributionFactor, contribution: Math.round(deal.amount * contributionFactor),
                region: deal.region, lob: deal.lob,
            };
        });
        const deals = [...dbActiveDeals];
        const dbClosedWon = crmDeals.filter((deal) => deal.isClosedWon || deal.stage === 'Closed Won').map((deal) => ({ name: deal.dealName, amount: deal.amount, region: deal.region }));
        const dbClosedWonTotal = dbClosedWon.reduce((sum, deal) => sum + deal.amount, 0);
        const mergedClosedWonDeals = [...dbClosedWon];
        const closedWonByRegion = { Americas: { total: 0, deals: [] }, EMEA: { total: 0, deals: [] }, APAC: { total: 0, deals: [] } };
        for (const deal of mergedClosedWonDeals) {
            const reg = deal.region || 'Americas';
            if (closedWonByRegion[reg]) {
                closedWonByRegion[reg].deals.push(deal);
                closedWonByRegion[reg].total += deal.amount;
            }
        }
        const pipelineByRegion = { Americas: { stages: [], total: 0 }, EMEA: { stages: [], total: 0 }, APAC: { stages: [], total: 0 } };
        const regionStageMap = {};
        for (const deal of deals) {
            const reg = deal.region || 'Americas';
            if (!pipelineByRegion[reg])
                continue;
            const stage = deal.stage;
            const rate = deal.stageRate ?? this.stageRate(rates, stage);
            const decay = deal.timeDecay ?? this.timeDecay(new Date(deal.closeDate));
            const contrib = deal.contribution ?? Math.round(deal.amount * rate * decay);
            if (!regionStageMap[reg])
                regionStageMap[reg] = {};
            if (!regionStageMap[reg][stage])
                regionStageMap[reg][stage] = { pipeline: 0, contribution: 0, convRate: rate };
            regionStageMap[reg][stage].pipeline += deal.amount;
            regionStageMap[reg][stage].contribution += contrib;
        }
        for (const reg of ['Americas', 'EMEA', 'APAC']) {
            const stagesMap = regionStageMap[reg] || {};
            let regTotal = 0;
            for (const [stage, data] of Object.entries(stagesMap)) {
                pipelineByRegion[reg].stages.push({ stage, pipeline: data.pipeline, convRate: data.convRate, contribution: data.contribution });
                regTotal += data.contribution;
            }
            pipelineByRegion[reg].total = regTotal;
        }
        let filteredDeals = deals;
        let filteredClosedWonDetails = { total: dbClosedWonTotal, deals: mergedClosedWonDeals };
        if (region && region !== 'Company') {
            filteredDeals = deals.filter((d) => d.region === region);
            const filteredCWDeals = mergedClosedWonDeals.filter((d) => d.region === region);
            filteredClosedWonDetails = { total: filteredCWDeals.reduce((sum, d) => sum + d.amount, 0), deals: filteredCWDeals };
        }
        const globalStageMap = {};
        let totalPipeline = 0;
        for (const deal of deals) {
            const stage = deal.stage;
            const rate = deal.stageRate ?? this.stageRate(rates, stage);
            const contrib = deal.contribution ?? Math.round(deal.amount * rate * (deal.timeDecay ?? 1));
            if (!globalStageMap[stage])
                globalStageMap[stage] = { pipeline: 0, contribution: 0, convRate: rate };
            globalStageMap[stage].pipeline += deal.amount;
            globalStageMap[stage].contribution += contrib;
            totalPipeline += deal.amount;
        }
        const pipelineByStage = Object.entries(globalStageMap).map(([stage, data]) => ({ stage, ...data }));
        const expectedDeals = modelInputs.expectedDeals ?? { rate: 0.124, addressablePipeline: 126600000, contribution: Math.round(126600000 * 0.124) };
        return { ...modelInputs, deals: filteredDeals, closedWonDetails: filteredClosedWonDetails, closedWonByRegion, pipelineByRegion, pipelineByStage, expectedDeals };
    }
    async requestAiPrediction(tenantId, periodId) {
        const period = await this.resolvePeriod(tenantId, periodId);
        if (!this.predictionQueue)
            throw new common_1.BadRequestException('Prediction queue not available');
        return this.predictionQueue.enqueuePrediction(tenantId, period.id, 'api.manual');
    }
    async getAiPredictionJobStatus(tenantId, periodId) {
        const period = await this.resolvePeriod(tenantId, periodId);
        const job = await this.predictionQueue?.getLatestJob(tenantId, period.id);
        const snapshot = await this.prisma.aiForecastSnapshot.findFirst({
            where: { tenantId, periodId: period.id },
            orderBy: { computedAt: 'desc' },
        });
        return {
            job: job ?? null,
            hasSnapshot: Boolean(snapshot),
            latestSnapshotAt: snapshot?.computedAt ?? null,
        };
    }
    async getAiPrediction(tenantId, periodId, baseline, region, repUserId) {
        const period = await this.resolvePeriod(tenantId, periodId);
        const normalizedBaseline = this.normalizeBaseline(baseline);
        const snapshot = await this.prisma.aiForecastSnapshot.findFirst({ where: { tenantId, periodId: period.id }, orderBy: { computedAt: 'desc' } });
        if (!snapshot) {
            const job = await this.predictionQueue?.getLatestJob(tenantId, period.id);
            throw new common_1.NotFoundException({
                message: 'Prediction pending',
                jobStatus: job?.status ?? 'none',
                hint: 'POST /periods/:id/ai-prediction/run to enqueue',
            });
        }
        let baselineNote;
        let customRates;
        if (normalizedBaseline) {
            const result = await this.getBaselineRates(tenantId, normalizedBaseline, period.name);
            baselineNote = result.baselineNote;
            customRates = result.rateMap;
        }
        const explainability = await this.buildExplainability(tenantId, period, snapshot.modelInputs, region, customRates, repUserId);
        const closedWon = explainability.closedWonDetails?.total || 0;
        const weightedPipeline = explainability.deals.reduce((sum, d) => sum + (d.contribution || 0), 0);
        const hasLiveForecastData = closedWon > 0 || explainability.deals.length > 0;
        const shouldUseSnapshotMath = !hasLiveForecastData && !repUserId && (!region || region === 'Company');
        let expectedDealsContrib = snapshot.modelInputs?.expectedDeals?.contribution || 0;
        const isCompany = !region || region === 'Company';
        if (!isCompany) {
            const totalPipeline = snapshot.modelInputs?.pipelineByStage?.reduce((sum, s) => sum + s.pipeline, 0) || 1;
            const regionPipeline = explainability.deals.reduce((sum, d) => sum + d.amount, 0);
            expectedDealsContrib = Math.round(expectedDealsContrib * (regionPipeline / totalPipeline));
        }
        const snapshotMath = shouldUseSnapshotMath
            ? (normalizedBaseline && customRates ? this.applyBaselineToSnapshot(snapshot, customRates) : snapshot)
            : null;
        const predictedAmount = snapshotMath?.predictedAmount ?? closedWon + weightedPipeline + expectedDealsContrib;
        const spreadRatio = snapshot.predictedAmount > 0 ? (snapshot.confidenceRangeHigh - snapshot.confidenceRangeLow) / snapshot.predictedAmount : 0.2;
        const rangeSpread = predictedAmount * spreadRatio;
        const confidenceRangeLow = snapshotMath?.confidenceRangeLow ?? Math.round(predictedAmount - rangeSpread / 2);
        const confidenceRangeHigh = snapshotMath?.confidenceRangeHigh ?? Math.round(predictedAmount + rangeSpread / 2);
        return {
            periodId: period.id, tenantId, period,
            aiPrediction: {
                predictedAmount, confidenceRangeLow, confidenceRangeHigh, computedAt: snapshot.computedAt,
                baseline: normalizedBaseline ?? null, baselineNote: baselineNote ?? null, region: region ?? 'Company',
                explainability, freshnessAgeSeconds: Math.floor((Date.now() - snapshot.computedAt.getTime()) / 1000), stale: false,
            }
        };
    }
    async getBoard(tenantId, periodId, repUserId, lob) {
        const period = await this.resolvePeriod(tenantId, periodId);
        const predictionResponse = await this.getAiPrediction(tenantId, period.id, undefined, undefined, repUserId).catch(() => null);
        if (predictionResponse?.aiPrediction?.explainability) {
            const liveDealsQuery = {
                tenantId,
                isClosedWon: false,
                isClosedLost: false,
                closeDate: { gte: period.startDate, lte: period.endDate }
            };
            if (repUserId) {
                const user = await this.prisma.forecastUser.findFirst({
                    where: { tenantId, OR: [{ id: repUserId }, { repId: repUserId }] }
                });
                if (user) {
                    liveDealsQuery.repUserId = { in: [user.id, user.repId].filter(Boolean) };
                }
                else {
                    liveDealsQuery.repUserId = repUserId;
                }
            }
            let realDeals = await this.prisma.crmDeal.findMany({ where: liveDealsQuery });
            realDeals = realDeals.filter(d => !d.dealName.startsWith('Historical Deal'));
            const mappedDeals = realDeals.map(d => ({
                deal: d.dealName,
                stage: d.stage,
                amount: d.amount,
                closeDate: d.closeDate.toISOString(),
                close: new Date(d.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                probability: d.probability,
                region: d.region,
                lob: d.lob,
                aiConf: d.probability && d.probability > 0.6 ? 'High' : d.probability && d.probability < 0.3 ? 'Low' : 'Med',
                contribution: Math.round(d.amount * (d.probability || 0.4)),
                contributionFactor: d.probability || 0.4,
            }));
            const pipelineByStageMap = new Map();
            let totalPipelineContribution = 0;
            mappedDeals.forEach(d => {
                const p = pipelineByStageMap.get(d.stage) || { pipeline: 0, contribution: 0, convRate: d.contributionFactor };
                p.pipeline += d.amount;
                p.contribution += d.contribution;
                pipelineByStageMap.set(d.stage, p);
                totalPipelineContribution += d.contribution;
            });
            const newPipelineByStage = Array.from(pipelineByStageMap.entries()).map(([stage, p]) => ({
                stage,
                pipeline: p.pipeline,
                convRate: p.convRate,
                contribution: p.contribution
            }));
            predictionResponse.aiPrediction.explainability.deals = mappedDeals;
            predictionResponse.aiPrediction.explainability.pipelineByStage = newPipelineByStage;
            const closedWonQuery = {
                tenantId,
                isClosedWon: true,
                closeDate: { gte: period.startDate, lte: period.endDate }
            };
            if (repUserId) {
                const user = await this.prisma.forecastUser.findFirst({
                    where: { tenantId, OR: [{ id: repUserId }, { repId: repUserId }] }
                });
                if (user) {
                    closedWonQuery.repUserId = { in: [user.id, user.repId].filter(Boolean) };
                }
                else {
                    closedWonQuery.repUserId = repUserId;
                }
            }
            let closedWonDeals = await this.prisma.crmDeal.findMany({ where: closedWonQuery });
            closedWonDeals = closedWonDeals.filter(d => !d.dealName.startsWith('Historical Deal'));
            const closedWon = closedWonDeals.reduce((s, d) => s + d.amount, 0);
            const closedWonDealsMapped = closedWonDeals.map(d => ({
                deal: d.dealName, amount: d.amount, stage: 'Closed Won',
                closeDate: d.closeDate.toISOString(), contribution: d.amount
            }));
            predictionResponse.aiPrediction.explainability.closedWonDetails = {
                total: closedWon,
                deals: closedWonDealsMapped
            };
            const expected = predictionResponse.aiPrediction.explainability.expectedDeals?.contribution || 0;
            const newPredictedAmount = closedWon + totalPipelineContribution + expected;
            predictionResponse.aiPrediction.predictedAmount = newPredictedAmount;
            predictionResponse.aiPrediction.confidenceRangeLow = Math.round(newPredictedAmount * 0.9);
            predictionResponse.aiPrediction.confidenceRangeHigh = Math.round(newPredictedAmount * 1.1);
        }
        if (predictionResponse?.aiPrediction?.explainability?.deals && lob) {
            predictionResponse.aiPrediction.explainability.deals = predictionResponse.aiPrediction.explainability.deals.filter((d) => d.lob === lob);
        }
        const whereClause = { tenantId, periodId: period.id };
        if (lob)
            whereClause.lob = lob;
        const allSubmissions = await this.prisma.forecastSubmission.findMany({
            where: whereClause,
            orderBy: [{ repUserId: 'asc' }, { lob: 'asc' }, { version: 'desc' }]
        });
        const activeSubmissionsMap = new Map();
        for (const sub of allSubmissions) {
            const key = `${sub.repUserId}-${sub.lob}`;
            if (!activeSubmissionsMap.has(key))
                activeSubmissionsMap.set(key, sub);
        }
        const submissions = Array.from(activeSubmissionsMap.values());
        let quota = null;
        if (repUserId) {
            const quotaRecord = await this.prisma.quota.findFirst({ where: { tenantId, periodId: period.id, repUserId } });
            if (quotaRecord)
                quota = quotaRecord.amount;
            else {
                const user = await this.prisma.forecastUser.findFirst({ where: { tenantId, OR: [{ id: repUserId }, { repId: repUserId }] } });
                if (user) {
                    const quotaByUser = await this.prisma.quota.findFirst({ where: { tenantId, periodId: period.id, repUserId: user.id } });
                    if (quotaByUser)
                        quota = quotaByUser.amount;
                }
            }
        }
        const repDrafts = repUserId ? allSubmissions.filter(s => s.repUserId === repUserId && s.status === 'draft') : [];
        let forecastEntryLocked = false;
        if (period.isLocked || period.status === 'locked' || period.status === 'closed') {
            forecastEntryLocked = true;
        }
        else if (repUserId) {
            const latestSub = submissions.find(s => s.repUserId === repUserId);
            if (latestSub && (latestSub.status === 'submitted' || latestSub.status === 'resubmitted' || latestSub.status === 'approved')) {
                forecastEntryLocked = true;
            }
        }
        return {
            period,
            aiPrediction: predictionResponse?.aiPrediction ?? null,
            submissions,
            repDrafts,
            quota,
            hasUnsavedChanges: submissions.some(s => s.status === 'draft' || s.status === 'reopened'),
            forecastEntryLocked,
        };
    }
    async createDraft(tenantId, data) {
        const repUserId = data.repUserId || 'rep-01';
        const openPeriod = await this.resolvePeriod(tenantId, 'current');
        if (openPeriod.isLocked || openPeriod.status === 'locked') {
            throw new common_1.ForbiddenException('Forecast period is locked. No new submissions accepted.');
        }
        const maxSub = await this.prisma.forecastSubmission.findFirst({
            where: { tenantId, repUserId, lob: data.lob, periodId: openPeriod.id },
            orderBy: { version: 'desc' }
        });
        const newVersion = (maxSub?.version ?? 0) + 1;
        const submission = await this.prisma.forecastSubmission.create({
            data: {
                tenantId,
                periodId: openPeriod.id,
                repUserId,
                lob: data.lob,
                version: newVersion,
                commitForecast: data.commitForecast,
                bestCaseForecast: data.bestCaseForecast,
                notes: data.notes,
                status: data.status === 'draft' && maxSub?.status === 'reopened' ? 'reopened' : 'draft',
            }
        });
        await this.prisma.forecastAuditLog.create({
            data: {
                tenantId,
                forecastSubmissionId: submission.id,
                action: 'Draft created',
                actorId: repUserId,
                actorRole: 'Sales Rep',
                metadata: { version: newVersion }
            }
        });
        return submission;
    }
    async submitForecast(tenantId, submissionId) {
        const sub = await this.prisma.forecastSubmission.findFirst({ where: { id: submissionId, tenantId } });
        if (!sub)
            throw new common_1.NotFoundException('Submission not found');
        const period = await this.resolvePeriod(tenantId, sub.periodId);
        if (period.isLocked || period.status === 'locked') {
            throw new common_1.ForbiddenException('Forecast period is locked. No new submissions accepted.');
        }
        const nextStatus = sub.status === 'reopened' ? 'resubmitted' : 'submitted';
        const newVersion = sub.version + 1;
        const updated = await this.prisma.forecastSubmission.create({
            data: {
                tenantId: sub.tenantId,
                periodId: sub.periodId,
                repUserId: sub.repUserId,
                lob: sub.lob,
                version: newVersion,
                commitForecast: sub.commitForecast,
                bestCaseForecast: sub.bestCaseForecast,
                notes: sub.notes,
                status: nextStatus,
                submittedAt: new Date(),
                managerOverride: sub.managerOverride,
                managerComment: sub.managerComment,
                managerId: sub.managerId,
                managerName: sub.managerName,
            }
        });
        await this.prisma.forecastAuditLog.create({
            data: {
                tenantId,
                forecastSubmissionId: updated.id,
                action: nextStatus === 'resubmitted' ? 'Resubmitted' : 'Submitted',
                actorId: sub.repUserId,
                actorRole: 'Sales Rep',
                metadata: { version: newVersion }
            }
        });
        this.eventPublisher?.publish('forecast.submitted', {
            tenantId,
            correlationId: crypto.randomUUID(),
            payload: {
                submissionId: updated.id,
                periodId: updated.periodId,
                userId: updated.repUserId,
                submittedAmount: updated.commitForecast,
                version: newVersion,
                lob: updated.lob,
            }
        });
        return updated;
    }
    async approveSubmission(tenantId, submissionId, managerId, managerName) {
        const sub = await this.prisma.forecastSubmission.findFirst({ where: { id: submissionId, tenantId } });
        if (!sub)
            throw new common_1.NotFoundException('Submission not found');
        const newVersion = sub.version + 1;
        const updated = await this.prisma.forecastSubmission.create({
            data: {
                ...sub,
                id: undefined,
                createdAt: undefined,
                updatedAt: undefined,
                committedDealIds: sub.committedDealIds ? JSON.parse(JSON.stringify(sub.committedDealIds)) : [],
                version: newVersion,
                status: 'approved',
                managerId,
                managerName,
                approvedAt: new Date(),
            }
        });
        await this.prisma.forecastAuditLog.create({
            data: {
                tenantId, forecastSubmissionId: updated.id, action: 'Approved',
                actorId: managerId, actorRole: 'Manager', metadata: { managerName, version: newVersion }
            }
        });
        return updated;
    }
    async reopenSubmission(tenantId, submissionId, managerId, managerName, comment) {
        const sub = await this.prisma.forecastSubmission.findFirst({ where: { id: submissionId, tenantId } });
        if (!sub)
            throw new common_1.NotFoundException('Submission not found');
        const newVersion = sub.version + 1;
        const updated = await this.prisma.forecastSubmission.create({
            data: {
                ...sub,
                id: undefined,
                createdAt: undefined,
                updatedAt: undefined,
                committedDealIds: sub.committedDealIds ? JSON.parse(JSON.stringify(sub.committedDealIds)) : [],
                version: newVersion,
                status: 'reopened',
                managerId,
                managerName,
                managerComment: comment,
                reopenedAt: new Date(),
            }
        });
        await this.prisma.forecastAuditLog.create({
            data: {
                tenantId, forecastSubmissionId: updated.id, action: 'Reopened by Manager',
                actorId: managerId, actorRole: 'Manager', metadata: { managerName, comment, version: newVersion }
            }
        });
        return updated;
    }
    async overrideSubmission(tenantId, submissionId, managerId, managerName, overrideValue, justification, approveNow = false) {
        const sub = await this.prisma.forecastSubmission.findFirst({ where: { id: submissionId, tenantId } });
        if (!sub)
            throw new common_1.NotFoundException('Submission not found');
        if (!justification || !justification.trim())
            throw new common_1.BadRequestException('Justification is required');
        const period = await this.resolvePeriod(tenantId, sub.periodId);
        const predictionResponse = await this.getAiPrediction(tenantId, period.id).catch(() => null);
        const aiProjection = predictionResponse?.aiPrediction?.predictedAmount ?? 0;
        const overrideImpact = {
            originalCommit: sub.commitForecast,
            adjustedCommit: overrideValue,
            reduction: sub.commitForecast - overrideValue,
            reductionPct: Number(((sub.commitForecast - overrideValue) / sub.commitForecast * 100).toFixed(1)),
            aiProjection,
            newVsAi: overrideValue - aiProjection,
            newVsAiPct: Number(((overrideValue - aiProjection) / aiProjection * 100).toFixed(1)),
            closerToAi: Math.abs(overrideValue - aiProjection) < Math.abs(sub.commitForecast - aiProjection)
        };
        const newVersion = sub.version + 1;
        const updated = await this.prisma.forecastSubmission.create({
            data: {
                ...sub,
                id: undefined,
                createdAt: undefined,
                updatedAt: undefined,
                committedDealIds: sub.committedDealIds ? JSON.parse(JSON.stringify(sub.committedDealIds)) : [],
                version: newVersion,
                managerOverride: overrideValue,
                managerComment: justification,
                managerId,
                managerName,
                overriddenAt: new Date(),
                status: approveNow ? 'approved' : sub.status,
                approvedAt: approveNow ? new Date() : sub.approvedAt,
            }
        });
        const systemLog = `Manager Override: ₹${(sub.commitForecast / 100000).toFixed(0)}L → ₹${(overrideValue / 100000).toFixed(0)}L`;
        await this.prisma.forecastAuditLog.create({
            data: {
                tenantId, forecastSubmissionId: updated.id, action: systemLog,
                actorId: managerId, actorRole: 'Manager',
                metadata: { managerName, justification, original: sub.commitForecast, override: overrideValue, version: newVersion }
            }
        });
        if (approveNow) {
            await this.prisma.forecastAuditLog.create({
                data: {
                    tenantId, forecastSubmissionId: updated.id, action: 'Approved',
                    actorId: managerId, actorRole: 'Manager', metadata: { managerName, afterOverride: true, version: newVersion }
                }
            });
        }
        return { updated, overrideImpact, systemLog };
    }
    async getSubmission(tenantId, submissionId) {
        const submission = await this.prisma.forecastSubmission.findFirst({ where: { id: submissionId, tenantId } });
        if (!submission)
            throw new common_1.NotFoundException('Submission not found');
        const latest = await this.prisma.forecastSubmission.findFirst({
            where: { tenantId, periodId: submission.periodId, repUserId: submission.repUserId, lob: submission.lob },
            orderBy: { version: 'desc' }
        });
        return latest || submission;
    }
    async getAuditLog(tenantId, submissionId) {
        const sub = await this.prisma.forecastSubmission.findFirst({ where: { id: submissionId, tenantId } });
        if (!sub)
            return { auditLogs: [], versions: [] };
        const allVersions = await this.prisma.forecastSubmission.findMany({
            where: { tenantId, periodId: sub.periodId, repUserId: sub.repUserId, lob: sub.lob },
            select: { id: true }
        });
        const ids = allVersions.map(v => v.id);
        const auditLogs = await this.prisma.forecastAuditLog.findMany({
            where: { tenantId, forecastSubmissionId: { in: ids } },
            orderBy: { createdAt: 'desc' }
        });
        const versions = await this.prisma.forecastSubmission.findMany({
            where: { tenantId, periodId: sub.periodId, repUserId: sub.repUserId, lob: sub.lob },
            orderBy: { version: 'desc' }
        });
        return { auditLogs, versions };
    }
    async getLifecycle(tenantId, submissionId) {
        const sub = await this.getSubmission(tenantId, submissionId);
        const { auditLogs: logs } = await this.getAuditLog(tenantId, sub.id);
        const actions = logs.map((l) => l.action.toLowerCase());
        const hasDraft = actions.some((a) => a.includes('draft'));
        const hasSubmitted = actions.some((a) => a.includes('submitted'));
        const hasReopened = actions.some((a) => a.includes('reopened'));
        const hasApproved = actions.some((a) => a.includes('approved'));
        let currentStep = 'Draft';
        if (hasSubmitted)
            currentStep = 'Under Review';
        if (hasReopened)
            currentStep = 'Reopened';
        if (hasApproved)
            currentStep = 'Approved';
        if (actions.some((a) => a.includes('resubmitted')))
            currentStep = 'Under Review';
        const stages = [
            { step: 'Draft Created', completed: hasDraft, timestamp: logs.find((l) => l.action.toLowerCase().includes('draft'))?.createdAt?.toISOString(), actor: logs.find((l) => l.action.toLowerCase().includes('draft'))?.metadata?.managerName || 'Sales Rep' },
            { step: 'Submitted', completed: hasSubmitted, timestamp: logs.find((l) => l.action.toLowerCase().includes('submitted') && !l.action.toLowerCase().includes('resubmitted'))?.createdAt?.toISOString(), actor: 'Sales Rep' },
            { step: 'Under Review', completed: hasSubmitted && !hasReopened && !hasApproved, timestamp: null, actor: 'System' },
            { step: 'Reopened', completed: hasReopened },
            { step: 'Resubmitted', completed: actions.some((a) => a.includes('resubmitted')) },
            { step: 'Approved', completed: hasApproved, timestamp: logs.find((l) => l.action.toLowerCase().includes('approved'))?.createdAt?.toISOString(), actor: logs.find((l) => l.action.toLowerCase().includes('approved'))?.metadata?.managerName || 'Manager' }
        ];
        const period = await this.resolvePeriod(tenantId, sub.periodId);
        const aiPred = await this.getAiPrediction(tenantId, period.id).catch(() => null);
        return {
            stages,
            currentStep,
            finalStatus: {
                status: sub.status,
                lastUpdated: sub.updatedAt,
                commit: sub.managerOverride ?? sub.commitForecast,
                aiProjection: aiPred?.aiPrediction?.predictedAmount ?? 0,
                approvedValue: sub.status === 'approved' ? (sub.managerOverride ?? sub.commitForecast) : null
            }
        };
    }
    async getRepDrillDown(tenantId, repId, periodId) {
        const period = await this.resolvePeriod(tenantId, periodId);
        const user = await this.prisma.forecastUser.findFirst({ where: { tenantId, OR: [{ id: repId }, { repId: repId }] } });
        if (!user)
            throw new common_1.NotFoundException('Rep not found');
        const board = await this.getBoard(tenantId, period.id, user.id);
        const activeSubmissions = board.submissions.filter(s => s.repUserId === user.id || s.repUserId === user.repId);
        const submission = activeSubmissions[0];
        let lifecycle = null;
        let auditLogs = [];
        if (submission) {
            lifecycle = await this.getLifecycle(tenantId, submission.id);
            const auditData = await this.getAuditLog(tenantId, submission.id);
            auditLogs = auditData.auditLogs;
        }
        return {
            submission,
            aiComparison: {
                aiProjection: board.aiPrediction?.predictedAmount ?? 0,
                quota: board.quota ?? 0,
            },
            pipelineOverview: board.aiPrediction?.explainability,
            lifecycle,
            auditLogs,
            canApprove: submission?.status === 'submitted' || submission?.status === 'resubmitted',
            canReopen: submission?.status === 'approved' || submission?.status === 'submitted' || submission?.status === 'resubmitted',
            canOverride: submission?.status === 'submitted' || submission?.status === 'resubmitted' || submission?.status === 'approved',
        };
    }
    async getMath(tenantId, periodId) {
        const period = await this.resolvePeriod(tenantId, periodId);
        const snapshot = await this.prisma.aiForecastSnapshot.findFirst({ where: { tenantId, periodId: period.id }, orderBy: { computedAt: 'desc' } });
        if (!snapshot)
            throw new common_1.NotFoundException('Snapshot not found');
        return { period, aiPrediction: snapshot.predictedAmount, math: await this.buildExplainability(tenantId, period, snapshot.modelInputs) };
    }
    async registerUser(data) {
        const existing = await this.prisma.forecastUser.findUnique({ where: { email: data.email } });
        if (existing)
            throw new Error('Email already registered');
        const normalizedRole = data.role?.toLowerCase() || 'sales_rep';
        const user = await this.prisma.forecastUser.create({
            data: { tenantId: 'demo-tenant-01', name: data.name, email: data.email, password: data.password, role: normalizedRole, repId: normalizedRole === 'sales_rep' ? `rep-${Date.now()}` : null }
        });
        const { password: _, ...safeUser } = user;
        return safeUser;
    }
    async loginUser(email, password) {
        const user = await this.prisma.forecastUser.findUnique({ where: { email } });
        if (!user || user.password !== password)
            throw new common_1.NotFoundException('Invalid credentials');
        const { password: _, ...safeUser } = user;
        return safeUser;
    }
    async getTeamBoard(tenantId, baseline, region, periodId = 'current') {
        const period = await this.resolvePeriod(tenantId, periodId);
        const normalizedBaseline = this.normalizeBaseline(baseline);
        if (!period)
            throw new common_1.NotFoundException('No open period');
        const repWhere = { tenantId, role: 'sales_rep' };
        if (region && region !== 'Company')
            repWhere.region = region;
        const reps = await this.prisma.forecastUser.findMany({ where: repWhere });
        const repIds = Array.from(new Set(reps.flatMap((r) => [r.id, r.repId]).filter(Boolean)));
        let realDeals = await this.prisma.crmDeal.findMany({
            where: { tenantId, closeDate: { gte: period.startDate, lte: period.endDate } }
        });
        realDeals = realDeals.filter(d => !d.dealName.startsWith('Historical Deal'));
        let closedWonTotal = 0;
        let weightedPipelineTotal = 0;
        const activeRepIds = new Set();
        realDeals.forEach(d => {
            if (d.repUserId)
                activeRepIds.add(d.repUserId);
            if (d.stage === 'Closed Won' || d.isClosedWon) {
                closedWonTotal += d.amount;
            }
            else if (!d.isClosedLost) {
                weightedPipelineTotal += Math.round(d.amount * (d.probability || 0.4));
            }
        });
        const activeReps = activeRepIds.size
            ? reps.filter(r => activeRepIds.has(r.id) || (r.repId && activeRepIds.has(r.repId)))
            : reps;
        const allSubmissions = await this.prisma.forecastSubmission.findMany({
            where: { tenantId, periodId: period.id, repUserId: { in: repIds } },
            orderBy: [{ repUserId: 'asc' }, { lob: 'asc' }, { version: 'desc' }],
        });
        const activeSubmissionsMap = new Map();
        for (const sub of allSubmissions) {
            const key = `${sub.repUserId}-${sub.lob}`;
            if (!activeSubmissionsMap.has(key))
                activeSubmissionsMap.set(key, sub);
        }
        const submissions = Array.from(activeSubmissionsMap.values());
        const auditLogs = await this.prisma.forecastAuditLog.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
        const predictionResponse = await this.getAiPrediction(tenantId, period.id, normalizedBaseline, region).catch(() => null);
        const baselineRates = normalizedBaseline
            ? (await this.getBaselineRates(tenantId, normalizedBaseline, period.name).catch(() => null))
            : null;
        const effectiveRates = baselineRates?.rateMap ?? (await this.getStageRateMap(tenantId));
        const expectedDealsTotal = predictionResponse?.aiPrediction?.explainability?.expectedDeals?.contribution || 0;
        if (period.status === 'open' && !period.isLocked) {
            if (normalizedBaseline) {
                weightedPipelineTotal = 0;
                realDeals.forEach(d => {
                    if (!d.isClosedWon && !d.isClosedLost && d.stage !== 'Closed Won') {
                        const rate = this.stageRate(effectiveRates, d.stage, 0.4);
                        weightedPipelineTotal += Math.round(d.amount * rate);
                    }
                });
            }
        }
        else {
            closedWonTotal = predictionResponse?.aiPrediction?.explainability?.closedWonDetails?.total || 0;
            weightedPipelineTotal = (predictionResponse?.aiPrediction?.explainability?.pipelineByStage || []).reduce((s, p) => s + p.contribution, 0);
        }
        const quotas = await this.prisma.quota.findMany({
            where: { tenantId, periodId: period.id, repUserId: { in: repIds } }
        });
        const teamData = activeReps.map(rep => {
            const repIdentifiers = new Set([rep.id, rep.repId].filter(Boolean));
            const submission = submissions.find((s) => repIdentifiers.has(s.repUserId)) || null;
            let repAiProj = 0;
            if (period.status === 'open' && !period.isLocked) {
                const repDeals = realDeals.filter(d => d.repUserId && repIdentifiers.has(d.repUserId));
                const repClosedWon = repDeals.filter(d => d.stage === 'Closed Won' || d.isClosedWon).reduce((s, d) => s + d.amount, 0);
                const repWeighted = repDeals
                    .filter(d => d.stage !== 'Closed Won' && !d.isClosedWon && !d.isClosedLost)
                    .reduce((s, d) => {
                    const rate = normalizedBaseline
                        ? this.stageRate(effectiveRates, d.stage, 0.4)
                        : (d.probability || 0.4);
                    return s + Math.round(d.amount * rate);
                }, 0);
                const repExpected = (expectedDealsTotal / Math.max(activeReps.length, 1));
                repAiProj = repClosedWon + repWeighted + repExpected;
            }
            else {
                repAiProj = submission?.commitForecast ? submission.commitForecast * 0.92 : ((predictionResponse?.aiPrediction?.predictedAmount ?? 0) / Math.max(activeReps.length, 1));
            }
            const quotaRecord = quotas.find(q => q.repUserId === rep.id || (rep.repId && q.repUserId === rep.repId));
            const quota = quotaRecord ? quotaRecord.amount : repAiProj * 1.1;
            const commit = submission?.commitForecast ?? 0;
            const effectiveCommit = submission?.managerOverride ?? commit;
            const variance = effectiveCommit - quota;
            const varianceVsAi = effectiveCommit - repAiProj;
            const variancePctAi = repAiProj > 0 ? (varianceVsAi / repAiProj) * 100 : 0;
            const repPastCloseDeals = realDeals.filter(d => d.repUserId && repIdentifiers.has(d.repUserId) && new Date(d.closeDate) < new Date() && d.stage !== 'Closed Won' && !d.isClosedWon && !d.isClosedLost).length;
            let riskLevel = 'On Track';
            if (variancePctAi < -30 || repPastCloseDeals > 1)
                riskLevel = 'Critical';
            else if (variancePctAi < -15 || repPastCloseDeals === 1)
                riskLevel = 'At Risk';
            let repLogs = [];
            if (submission) {
                const allVersionsForRep = allSubmissions.filter(s => repIdentifiers.has(s.repUserId)).map(s => s.id);
                repLogs = auditLogs.filter(l => allVersionsForRep.includes(l.forecastSubmissionId));
            }
            return {
                repId: rep.repId, userId: rep.id, name: rep.name, initials: rep.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
                email: rep.email, region: rep.region, submission, aiProjection: repAiProj, quota, commit: effectiveCommit, originalCommit: commit,
                variance, variancePct: variancePctAi, status: submission?.status ?? 'no_submission', riskLevel, auditLogs: repLogs.slice(0, 5),
            };
        });
        const unattributedClosedWon = realDeals
            .filter(d => !d.repUserId && (d.stage === 'Closed Won' || d.isClosedWon))
            .reduce((s, d) => s + d.amount, 0);
        let teamAiProjection = teamData.reduce((sum, rep) => sum + rep.aiProjection, 0) + unattributedClosedWon;
        const repClosedWonTotal = teamData.reduce((sum, rep) => {
            const repDeals = realDeals.filter(d => d.repUserId && [rep.repId, rep.userId].filter(Boolean).includes(d.repUserId));
            return sum + repDeals.filter(d => d.stage === 'Closed Won' || d.isClosedWon).reduce((s, d) => s + d.amount, 0);
        }, 0) + unattributedClosedWon;
        const repWeightedTotal = teamData.reduce((sum, rep) => {
            const repDeals = realDeals.filter(d => d.repUserId && [rep.repId, rep.userId].filter(Boolean).includes(d.repUserId));
            return sum + repDeals.filter(d => d.stage !== 'Closed Won' && !d.isClosedWon && !d.isClosedLost).reduce((s, d) => {
                const rate = normalizedBaseline ? this.stageRate(effectiveRates, d.stage, 0.4) : (d.probability || 0.4);
                return s + Math.round(d.amount * rate);
            }, 0);
        }, 0);
        if (!teamData.length) {
            teamAiProjection = repClosedWonTotal + repWeightedTotal + expectedDealsTotal;
        }
        return {
            period, teamAiProjection, baseline: normalizedBaseline ?? null, baselineNote: predictionResponse?.aiPrediction?.baselineNote ?? null,
            region: region ?? 'Company',
            aiSnapshot: predictionResponse?.aiPrediction ?? null,
            team: teamData,
            breakdown: { closedWon: repClosedWonTotal, weightedPipeline: repWeightedTotal, expectedDeals: expectedDealsTotal }
        };
    }
    async getExecutiveDashboard(tenantId, baseline, region, periodId = 'current', opts) {
        const period = await this.resolvePeriod(tenantId, periodId);
        const normalizedBaseline = this.normalizeBaseline(baseline);
        if (!period)
            throw new common_1.NotFoundException('No open period');
        if (!opts?.skipSnapshot) {
            const materialized = await this.prisma.forecastExecutiveSnapshot.findFirst({
                where: { tenantId, periodId: period.id },
                orderBy: { computedAt: 'desc' },
            });
            if (materialized?.payload) {
                return materialized.payload;
            }
        }
        const teamBoard = await this.getTeamBoard(tenantId, normalizedBaseline, region, periodId);
        const predictedAmount = teamBoard.teamAiProjection;
        const closedWon = teamBoard.breakdown.closedWon;
        const weightedPipeline = teamBoard.breakdown.weightedPipeline;
        const expectedDeals = teamBoard.breakdown.expectedDeals;
        const format = (val) => '₹' + (val / 10000000).toFixed(2) + 'Cr';
        const reconciliation = `${format(closedWon)} + ${format(weightedPipeline)} + ${format(expectedDeals)} = ${format(predictedAmount)}`;
        const teamOverview = teamBoard.team.map((rep) => ({
            name: rep.name, quota: rep.quota, aiProjection: rep.aiProjection, commit: rep.commit, variance: rep.variance, status: rep.status, risk: rep.riskLevel,
        }));
        const aggregateTotals = {
            quota: teamOverview.reduce((sum, r) => sum + r.quota, 0), aiProjection: teamOverview.reduce((sum, r) => sum + r.aiProjection, 0),
            commit: teamOverview.reduce((sum, r) => sum + r.commit, 0), variance: teamOverview.reduce((sum, r) => sum + r.variance, 0),
        };
        const baselineRates = normalizedBaseline ? (await this.getBaselineRates(tenantId, normalizedBaseline, period.name).catch(() => null)) : null;
        const effectiveRates = baselineRates?.rateMap ?? (await this.getStageRateMap(tenantId));
        let realDeals = await this.prisma.crmDeal.findMany({
            where: {
                tenantId,
                closeDate: { gte: period.startDate, lte: period.endDate }
            }
        });
        realDeals = realDeals.filter(d => !d.dealName.startsWith('Historical Deal'));
        const regions = ['Americas', 'EMEA', 'APAC'];
        const closedWonByRegion = {};
        const pipelineByRegion = {};
        for (const reg of regions) {
            const regDeals = realDeals.filter(d => d.region === reg);
            const cwDeals = regDeals.filter(d => d.stage === 'Closed Won' || d.isClosedWon);
            closedWonByRegion[reg] = {
                total: cwDeals.reduce((s, d) => s + d.amount, 0),
                deals: cwDeals.map(d => ({ deal: d.dealName, amount: d.amount }))
            };
            const openDeals = regDeals.filter(d => d.stage !== 'Closed Won' && !d.isClosedWon && !d.isClosedLost);
            const stageMap = new Map();
            let pipeTotal = 0;
            openDeals.forEach(d => {
                const rate = normalizedBaseline ? this.stageRate(effectiveRates, d.stage, 0.4) : (d.probability || 0.4);
                const contrib = Math.round(d.amount * rate);
                const p = stageMap.get(d.stage) || { pipeline: 0, contribution: 0, convRate: rate };
                p.pipeline += d.amount;
                p.contribution += contrib;
                stageMap.set(d.stage, p);
                pipeTotal += contrib;
            });
            pipelineByRegion[reg] = {
                total: pipeTotal,
                stages: Array.from(stageMap.entries()).map(([stage, p]) => ({ stage, pipeline: p.pipeline, contribution: p.contribution, convRate: p.convRate }))
            };
        }
        return {
            period, aiProjection: { total: predictedAmount, breakdown: { closedWon, weightedPipeline, expectedDeals } }, reconciliation,
            closedWonByRegion,
            pipelineByRegion,
            teamOverview, aggregateTotals,
        };
    }
    async createDeal(tenantId, data) {
        const normalizedProbability = data.probability == null ? undefined : data.probability > 1 ? data.probability / 100 : data.probability;
        const deal = await this.prisma.crmDeal.create({ data: { tenantId, dealName: data.dealName, stage: data.stage, amount: data.amount, closeDate: new Date(data.closeDate), probability: normalizedProbability, isClosedWon: data.stage === 'Closed Won', isClosedLost: data.stage === 'Closed Lost', region: data.region, lob: data.lob, repUserId: data.repUserId, source: 'manual', createdBy: 'user' } });
        const period = await this.prisma.forecastPeriod.findFirst({ where: { tenantId, status: 'open' } });
        if (period && this.predictionQueue) {
            await this.predictionQueue.enqueuePrediction(tenantId, period.id, 'deal.created');
        }
        if (data.repUserId && period) {
            const allRepSubs = await this.prisma.forecastSubmission.findMany({
                where: { tenantId, periodId: period.id, repUserId: data.repUserId },
                orderBy: { version: 'desc' }
            });
            const latestByLob = new Map();
            for (const sub of allRepSubs) {
                if (!latestByLob.has(sub.lob))
                    latestByLob.set(sub.lob, sub);
            }
            for (const latestSub of latestByLob.values()) {
                if (latestSub.status === 'submitted' || latestSub.status === 'resubmitted' || latestSub.status === 'approved') {
                    await this.prisma.forecastSubmission.create({
                        data: {
                            tenantId,
                            periodId: period.id,
                            repUserId: data.repUserId,
                            lob: latestSub.lob,
                            version: latestSub.version + 1,
                            commitForecast: latestSub.commitForecast,
                            bestCaseForecast: latestSub.bestCaseForecast,
                            notes: latestSub.notes,
                            status: 'draft',
                            managerOverride: latestSub.managerOverride,
                            managerComment: latestSub.managerComment,
                            managerId: latestSub.managerId,
                            managerName: latestSub.managerName,
                        }
                    });
                    await this.prisma.forecastAuditLog.create({
                        data: {
                            tenantId,
                            forecastSubmissionId: latestSub.id,
                            action: 'Forecast unlocked due to new deal',
                            actorId: data.repUserId,
                            actorRole: 'System',
                            metadata: { version: latestSub.version + 1 }
                        }
                    });
                }
            }
        }
        return deal;
    }
    async upsertQuota(tenantId, periodId, repUserId, amount) { return this.prisma.quota.upsert({ where: { tenantId_periodId_repUserId: { tenantId, periodId, repUserId } }, update: { amount }, create: { tenantId, periodId, repUserId, amount } }); }
    async getQuotas(tenantId, periodId) { return this.prisma.quota.findMany({ where: { tenantId, periodId } }); }
    async getAtRiskDeals(tenantId, region) {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const whereClause = { tenantId, isClosedWon: false, isClosedLost: false, stage: { notIn: ['Closed Won', 'Closed Lost'] } };
        if (region && region !== 'Company')
            whereClause.region = region;
        const deals = await this.prisma.crmDeal.findMany({ where: whereClause });
        const allReps = await this.prisma.forecastUser.findMany({ where: { tenantId, role: 'sales_rep' } });
        const repNameMap = new Map();
        allReps.forEach(r => {
            repNameMap.set(r.id, r.name);
            if (r.repId)
                repNameMap.set(r.repId, r.name);
        });
        const period = await this.prisma.forecastPeriod.findFirst({ where: { tenantId, status: 'open' } });
        const criticalRepIds = new Set();
        if (period) {
            const allDeals = await this.prisma.crmDeal.findMany({
                where: { tenantId, closeDate: { gte: period.startDate, lte: period.endDate }, repUserId: { not: null } }
            });
            const subs = await this.prisma.forecastSubmission.findMany({
                where: { tenantId, periodId: period.id },
                orderBy: { version: 'desc' },
            });
            const latestSubs = new Map();
            for (const s of subs) {
                if (!latestSubs.has(s.repUserId))
                    latestSubs.set(s.repUserId, s);
            }
            const repPipelineMap = new Map();
            for (const d of allDeals) {
                if (!d.repUserId)
                    continue;
                const rate = d.stage === 'Closed Won' || d.isClosedWon ? 1 : (d.probability || 0.4);
                repPipelineMap.set(d.repUserId, (repPipelineMap.get(d.repUserId) || 0) + Math.round(d.amount * rate));
            }
            for (const [repId, aiProj] of Array.from(repPipelineMap.entries())) {
                const sub = latestSubs.get(repId);
                const effectiveCommit = (sub?.managerOverride ?? sub?.commitForecast) || 0;
                const variancePct = aiProj > 0 ? ((effectiveCommit - aiProj) / aiProj) * 100 : 0;
                if (variancePct < -30)
                    criticalRepIds.add(repId);
            }
        }
        const repAverages = new Map();
        deals.forEach(d => {
            if (!d.repUserId)
                return;
            const current = repAverages.get(d.repUserId) || { sum: 0, count: 0 };
            repAverages.set(d.repUserId, { sum: current.sum + d.amount, count: current.count + 1 });
        });
        for (const [repId, data] of Array.from(repAverages.entries())) {
            repAverages.set(repId, data.sum / data.count);
        }
        const atRiskDeals = deals.filter(deal => {
            if (!deal.repUserId)
                return false;
            const lastActivityDate = deal.lastActivityDate ?? deal.updatedAt;
            const isStale = !lastActivityDate || lastActivityDate < fourteenDaysAgo;
            const isPastClose = deal.closeDate < startOfToday;
            const daysToClose = (deal.closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            const isClosingSoonEarlyStage = daysToClose >= 0 && daysToClose <= 14 && ['Discovery', 'Proposal'].includes(deal.stage);
            const isOutlier = deal.repUserId && deal.amount > (repAverages.get(deal.repUserId) * 2.5);
            const isCriticalRep = criticalRepIds.has(deal.repUserId);
            return isStale || isPastClose || isClosingSoonEarlyStage || isOutlier || deal.riskReason || isCriticalRep;
        }).map(deal => {
            let riskReason = deal.riskReason;
            if (!riskReason) {
                const lastActivityDate = deal.lastActivityDate ?? deal.updatedAt;
                const daysToClose = (deal.closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                if (deal.closeDate < startOfToday) {
                    riskReason = 'Expected close date passed';
                }
                else if (daysToClose >= 0 && daysToClose <= 14 && ['Discovery', 'Proposal'].includes(deal.stage)) {
                    riskReason = 'Closing soon but early stage';
                }
                else if (!lastActivityDate || lastActivityDate < fourteenDaysAgo) {
                    riskReason = 'No activity 14d';
                }
                else if (deal.repUserId && deal.amount > (repAverages.get(deal.repUserId) * 2.5)) {
                    riskReason = 'Amount is an outlier for this rep';
                }
                else if (deal.repUserId && criticalRepIds.has(deal.repUserId)) {
                    riskReason = 'Rep is Critical Risk — commit far below AI projection';
                }
                else {
                    riskReason = 'Unknown Risk';
                }
            }
            return {
                id: deal.id,
                dealName: deal.dealName,
                stage: deal.stage,
                amount: deal.amount,
                closeDate: deal.closeDate.toISOString(),
                riskReason,
                repUserId: deal.repUserId,
                repName: (deal.repUserId ? repNameMap.get(deal.repUserId) : null) || 'Unassigned',
            };
        });
        return atRiskDeals;
    }
    async getExecutiveTrends(tenantId) {
        const periods = await this.prisma.forecastPeriod.findMany({
            where: { tenantId, status: { in: ['closed', 'locked', 'open'] } },
            orderBy: { startDate: 'desc' },
            take: 4,
        });
        periods.reverse();
        const trends = [];
        for (const period of periods) {
            const closedDeals = await this.prisma.crmDeal.findMany({
                where: {
                    tenantId,
                    OR: [{ isClosedWon: true }, { isClosedLost: true }],
                    closeDate: { gte: period.startDate, lte: period.endDate }
                }
            });
            const bookings = closedDeals.filter(d => d.isClosedWon).reduce((sum, d) => sum + d.amount, 0);
            const totalClosedAmount = closedDeals.reduce((sum, d) => sum + d.amount, 0);
            const winRate = totalClosedAmount > 0 ? bookings / totalClosedAmount : 0;
            const metrics = await this.prisma.pipelineCoverageMetrics.findFirst({
                where: { tenantId, periodId: period.id },
                orderBy: { computedAt: 'desc' }
            });
            trends.push({
                periodId: period.id,
                periodName: period.name,
                bookings: bookings || (metrics?.closedWonAmount ?? 0),
                winRate: winRate || 0.45,
                target: period.revenueTarget,
            });
        }
        if (trends.length === 0) {
            return [
                { periodName: "Q1 FY25", bookings: 120000000, winRate: 0.42, target: 130000000 },
                { periodName: "Q2 FY25", bookings: 145000000, winRate: 0.46, target: 140000000 },
                { periodName: "Q3 FY25", bookings: 160000000, winRate: 0.51, target: 155000000 },
                { periodName: "Q4 FY25", bookings: 185000000, winRate: 0.55, target: 180000000 },
            ];
        }
        return trends;
    }
};
exports.M06ForecastingPredictionService = M06ForecastingPredictionService;
exports.M06ForecastingPredictionService = M06ForecastingPredictionService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_publisher_service_1.EventPublisherService,
        m06_prediction_queue_service_1.M06PredictionQueueService])
], M06ForecastingPredictionService);
//# sourceMappingURL=m06.service.js.map