"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const m06_controller_1 = require("../m06.controller");
const executive_controller_1 = require("../executive.controller");
const event_publisher_service_1 = require("../../../platform-core/events/event-publisher.service");
const m06_service_1 = require("../../services/m06.service");
const prisma_service_1 = require("../../database/prisma.service");
function mockPrisma() {
    return {
        forecastPeriod: { findFirst: jest.fn() },
        aiForecastSnapshot: { findFirst: jest.fn() },
        historicalConversionRate: { findMany: jest.fn() },
        crmDeal: { findMany: jest.fn(), create: jest.fn() },
        forecastSubmission: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
        forecastAuditLog: { findMany: jest.fn(), create: jest.fn() },
        user: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), upsert: jest.fn() },
        quota: { findFirst: jest.fn(), findMany: jest.fn(), upsert: jest.fn(), create: jest.fn() },
    };
}
const TENANT = 'demo-tenant-01';
const period = {
    id: 'period-1', tenantId: TENANT, name: 'Q2 FY26', status: 'open',
    startDate: new Date('2026-04-01'), endDate: new Date('2026-06-30'),
    revenueTarget: 100000000, isLocked: false,
};
const snapshot = {
    snapshotId: 'snap-1', tenantId: TENANT, periodId: 'period-1',
    predictedAmount: 14260000, confidenceRangeLow: 13000000, confidenceRangeHigh: 15500000,
    computedAt: new Date(), idempotencyKey: 'seed-1',
    modelInputs: {
        deals: [], closedWonDetails: { total: 5000000, deals: [] },
        pipelineByStage: [{ stage: 'Proposal', pipeline: 8000000, convRate: 0.58, contribution: 4640000 }],
        expectedDeals: { rate: 0.1, addressablePipeline: 8000000, contribution: 800000 },
    },
};
describe('M06 Controller — Integration Tests', () => {
    let app;
    let prisma;
    beforeAll(async () => {
        prisma = mockPrisma();
        const moduleFixture = await testing_1.Test.createTestingModule({
            controllers: [m06_controller_1.M06ForecastingPredictionController, executive_controller_1.M06ExecutiveController],
            providers: [
                { provide: event_publisher_service_1.EventPublisherService, useValue: { publish: jest.fn() } },
                m06_service_1.M06ForecastingPredictionService,
                { provide: prisma_service_1.PrismaService, useValue: prisma },
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });
    afterAll(async () => { await app.close(); });
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.forecastPeriod.findFirst.mockResolvedValue(period);
        prisma.aiForecastSnapshot.findFirst.mockResolvedValue(snapshot);
        prisma.historicalConversionRate.findMany.mockResolvedValue([]);
        prisma.crmDeal.findMany.mockResolvedValue([]);
        prisma.forecastSubmission.findMany.mockResolvedValue([]);
        prisma.forecastAuditLog.findMany.mockResolvedValue([]);
        prisma.user.findMany.mockResolvedValue([]);
        prisma.quota.findMany.mockResolvedValue([]);
        prisma.quota.findFirst.mockResolvedValue(null);
    });
    describe('F1 — GET /periods/:id/ai-prediction', () => {
        it('TC-F1-09 — ?baseline=last_period returns 200 with recalculated projection', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/forecasting/periods/period-1/ai-prediction?baseline=last_period')
                .set('x-tenant-id', TENANT)
                .expect(200)
                .then((res) => {
                expect(res.body.aiPrediction).toBeDefined();
                expect(res.body.aiPrediction.predictedAmount).toBeDefined();
                expect(res.body.aiPrediction.confidenceRangeLow).toBeDefined();
                expect(res.body.aiPrediction.confidenceRangeHigh).toBeDefined();
            });
        });
        it('TC-F1-10 — ?baseline=invalid returns 400', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/forecasting/periods/period-1/ai-prediction?baseline=invalid')
                .set('x-tenant-id', TENANT)
                .expect(400);
        });
        it('TC-F1-08 — no baseline returns current prediction unchanged', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/forecasting/periods/period-1/ai-prediction')
                .set('x-tenant-id', TENANT)
                .expect(200)
                .then((res) => {
                expect(res.body.aiPrediction.baseline).toBeNull();
            });
        });
    });
    describe('F2 — Region query param', () => {
        it('TC-F2-06 — ?region=EMEA returns 200', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/forecasting/periods/period-1/ai-prediction?region=EMEA')
                .set('x-tenant-id', TENANT)
                .expect(200)
                .then((res) => {
                expect(res.body.aiPrediction.region).toBe('EMEA');
            });
        });
        it('TC-F2-09 — ?region=Mars returns 400', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/forecasting/periods/period-1/ai-prediction?region=Mars')
                .set('x-tenant-id', TENANT)
                .expect(400);
        });
        it('TC-F2-07 — GET /team/board?region=APAC returns 200', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/forecasting/team/board?region=APAC')
                .set('x-tenant-id', TENANT)
                .expect(200);
        });
    });
    describe('F1+F2 — GET /team/board with baseline', () => {
        it('TC-F1-11 — ?baseline=avg_last_2 returns 200 with baselineNote', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/forecasting/team/board?baseline=avg_last_2')
                .set('x-tenant-id', TENANT)
                .expect(200)
                .then((res) => {
                expect(res.body.baseline).toBe('avg_last_2');
            });
        });
    });
    describe('Cross-cutting — Tenant ID', () => {
        it('TC-X-05 — missing x-tenant-id returns 403', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/forecasting/periods/period-1/ai-prediction')
                .expect(403);
        });
    });
    describe('F10 — GET /executive/dashboard', () => {
        it('TC-F10-10 — returns 200 with required keys', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/forecasting/executive/dashboard')
                .set('x-tenant-id', TENANT)
                .expect(200)
                .then((res) => {
                expect(res.body).toHaveProperty('period');
                expect(res.body).toHaveProperty('aiProjection');
                expect(res.body).toHaveProperty('reconciliation');
                expect(res.body).toHaveProperty('closedWonByRegion');
                expect(res.body).toHaveProperty('teamOverview');
                expect(res.body).toHaveProperty('aggregateTotals');
            });
        });
        it('TC-F2-08 — ?region=Company returns all regions in closedWonByRegion', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/forecasting/executive/dashboard?region=Company')
                .set('x-tenant-id', TENANT)
                .expect(200)
                .then((res) => {
                expect(res.body.closedWonByRegion).toHaveProperty('Americas');
                expect(res.body.closedWonByRegion).toHaveProperty('EMEA');
                expect(res.body.closedWonByRegion).toHaveProperty('APAC');
            });
        });
    });
    describe('Cross-cutting — Regression', () => {
        it('TC-X-01 — GET /periods/:id/ai-prediction (no params) still returns 200', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/forecasting/periods/period-1/ai-prediction')
                .set('x-tenant-id', TENANT)
                .expect(200);
        });
        it('TC-X-02 — GET /team/board (no params) still returns 200', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/forecasting/team/board')
                .set('x-tenant-id', TENANT)
                .expect(200);
        });
    });
});
//# sourceMappingURL=m06.integration-spec.js.map