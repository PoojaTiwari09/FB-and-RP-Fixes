/**
 * Integration Tests — M06 Controller Endpoints
 * Tests HTTP layer via Supertest against real NestJS app module
 *
 * Config: jest-integration.json  (testRegex: *.integration-spec.ts)
 * Run:    npm run test:integration
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { M06ForecastingPredictionController } from '../m06.controller';
import { M06ExecutiveController } from '../executive.controller';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';
import { M06ForecastingPredictionService } from '../../services/m06.service';
import { PrismaService } from '../../database/prisma.service';

// ── Prisma Mock ──────────────────────────────────────────────────────────────

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

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('M06 Controller — Integration Tests', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeAll(async () => {
    prisma = mockPrisma();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [M06ForecastingPredictionController, M06ExecutiveController],
      providers: [
        { provide: EventPublisherService, useValue: { publish: jest.fn() } },
        M06ForecastingPredictionService,
        { provide: PrismaService, useValue: prisma },
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

  // ── FEATURE 1: Baseline Filter ────────────────────────────────────────────

  describe('F1 — GET /periods/:id/ai-prediction', () => {
    it('TC-F1-09 — ?baseline=last_period returns 200 with recalculated projection', () => {
      return request(app.getHttpServer())
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
      return request(app.getHttpServer())
        .get('/api/v1/forecasting/periods/period-1/ai-prediction?baseline=invalid')
        .set('x-tenant-id', TENANT)
        .expect(400);
    });

    it('TC-F1-08 — no baseline returns current prediction unchanged', () => {
      return request(app.getHttpServer())
        .get('/api/v1/forecasting/periods/period-1/ai-prediction')
        .set('x-tenant-id', TENANT)
        .expect(200)
        .then((res) => {
          expect(res.body.aiPrediction.baseline).toBeNull();
        });
    });
  });

  // ── FEATURE 2: Region Filter ──────────────────────────────────────────────

  describe('F2 — Region query param', () => {
    it('TC-F2-06 — ?region=EMEA returns 200', () => {
      return request(app.getHttpServer())
        .get('/api/v1/forecasting/periods/period-1/ai-prediction?region=EMEA')
        .set('x-tenant-id', TENANT)
        .expect(200)
        .then((res) => {
          expect(res.body.aiPrediction.region).toBe('EMEA');
        });
    });

    it('TC-F2-09 — ?region=Mars returns 400', () => {
      return request(app.getHttpServer())
        .get('/api/v1/forecasting/periods/period-1/ai-prediction?region=Mars')
        .set('x-tenant-id', TENANT)
        .expect(400);
    });

    it('TC-F2-07 — GET /team/board?region=APAC returns 200', () => {
      return request(app.getHttpServer())
        .get('/api/v1/forecasting/team/board?region=APAC')
        .set('x-tenant-id', TENANT)
        .expect(200);
    });
  });

  // ── FEATURE 11: Team Board Baseline ───────────────────────────────────────

  describe('F1+F2 — GET /team/board with baseline', () => {
    it('TC-F1-11 — ?baseline=avg_last_2 returns 200 with baselineNote', () => {
      return request(app.getHttpServer())
        .get('/api/v1/forecasting/team/board?baseline=avg_last_2')
        .set('x-tenant-id', TENANT)
        .expect(200)
        .then((res) => {
          expect(res.body.baseline).toBe('avg_last_2');
        });
    });
  });

  // ── Cross-cutting: Tenant ID enforcement ──────────────────────────────────

  describe('Cross-cutting — Tenant ID', () => {
    it('TC-X-05 — missing x-tenant-id returns 403', () => {
      return request(app.getHttpServer())
        .get('/api/v1/forecasting/periods/period-1/ai-prediction')
        .expect(403);
    });
  });

  // ── FEATURE 10: Executive Dashboard ───────────────────────────────────────

  describe('F10 — GET /executive/dashboard', () => {
    it('TC-F10-10 — returns 200 with required keys', () => {
      return request(app.getHttpServer())
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
      return request(app.getHttpServer())
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

  // ── Regression ────────────────────────────────────────────────────────────

  describe('Cross-cutting — Regression', () => {
    it('TC-X-01 — GET /periods/:id/ai-prediction (no params) still returns 200', () => {
      return request(app.getHttpServer())
        .get('/api/v1/forecasting/periods/period-1/ai-prediction')
        .set('x-tenant-id', TENANT)
        .expect(200);
    });

    it('TC-X-02 — GET /team/board (no params) still returns 200', () => {
      return request(app.getHttpServer())
        .get('/api/v1/forecasting/team/board')
        .set('x-tenant-id', TENANT)
        .expect(200);
    });
  });
});
