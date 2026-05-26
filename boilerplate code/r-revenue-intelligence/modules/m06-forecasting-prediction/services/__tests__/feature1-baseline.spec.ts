/**
 * FEATURE 1 — Projection Baseline Filter API
 * Unit tests for getBaselineRates() and getAiPrediction() with baseline param
 *
 * Framework: Jest + ts-jest
 * Mocks:     PrismaService via manual mock object
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { M06ForecastingPredictionService } from '../m06.service';
import { PrismaService } from '../../database/prisma.service';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockPrisma() {
  return {
    forecastPeriod: { findFirst: jest.fn() },
    aiForecastSnapshot: { findFirst: jest.fn() },
    historicalConversionRate: { findMany: jest.fn(), createMany: jest.fn() },
    crmDeal: { findMany: jest.fn(), create: jest.fn() },
    forecastSubmission: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    forecastAuditLog: { findMany: jest.fn(), create: jest.fn() },
    user: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), upsert: jest.fn() },
    quota: { findFirst: jest.fn(), findMany: jest.fn(), upsert: jest.fn(), create: jest.fn() },
  };
}

const TENANT = 'test-tenant';

const makePeriod = (name = 'Q2 FY26', status = 'open') => ({
  id: 'period-1', tenantId: TENANT, name, status,
  startDate: new Date('2026-04-01'), endDate: new Date('2026-06-30'),
  revenueTarget: 100000000, isLocked: false,
});

const makeSnapshot = () => ({
  snapshotId: 'snap-1', tenantId: TENANT, periodId: 'period-1',
  predictedAmount: 14260000, confidenceRangeLow: 13000000, confidenceRangeHigh: 15500000,
  computedAt: new Date(), idempotencyKey: 'seed-1',
  modelInputs: {
    deals: [
      { deal: 'Deal A', stage: 'Proposal', amount: 8000000, stageRate: 0.58, timeDecay: 1, contribution: 4640000, region: 'Americas', close: 'Jun 28', closeDate: '2026-06-28', aiConf: 'Med', contributionFactor: 0.58 },
    ],
    closedWonDetails: { total: 5000000, deals: [{ name: 'Won A', amount: 5000000, region: 'Americas' }] },
    pipelineByStage: [
      { stage: 'Proposal', pipeline: 8000000, convRate: 0.58, contribution: 4640000 },
    ],
    expectedDeals: { rate: 0.1, addressablePipeline: 8000000, contribution: 800000 },
  },
});

const makeRates = (periodName: string, convRate: number) => [
  { id: 'r1', tenantId: TENANT, fromStage: 'Proposal', toStage: 'Negotiation', conversionRate: convRate, sampleSize: 60, computedFromPeriod: 'p-old', periodName, computedAt: new Date() },
  { id: 'r2', tenantId: TENANT, fromStage: 'Discovery', toStage: 'Proposal', conversionRate: convRate * 0.4, sampleSize: 80, computedFromPeriod: 'p-old', periodName, computedAt: new Date() },
];

// ── Test Suite ───────────────────────────────────────────────────────────────

describe('Feature 1 — Projection Baseline Filter API', () => {
  let service: M06ForecastingPredictionService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: EventPublisherService, useValue: { publish: jest.fn() } },
        M06ForecastingPredictionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(M06ForecastingPredictionService);
  });

  // ── getBaselineRates() ──────────────────────────────────────────────────

  describe('getBaselineRates()', () => {
    // Access private method via bracket notation for white-box testing
    const callBaseline = (svc: any, tenant: string, baseline: string) =>
      svc.getBaselineRates(tenant, baseline);

    it('TC-F1-01 — avg_last_2: returns averaged rates across two most recent periods', async () => {
      const q1Rates = makeRates('Q1 FY26', 0.58);
      const q4Rates = makeRates('Q4 FY25', 0.55);
      prisma.historicalConversionRate.findMany.mockResolvedValue([...q1Rates, ...q4Rates]);

      const result = await callBaseline(service, TENANT, 'avg_last_2');

      expect(result.rateMap['Proposal']).toBeCloseTo((0.58 + 0.55) / 2, 2);
      expect(result.baselineNote).toContain('average');
      expect(result.baselineNote).toContain('Q1 FY26');
      expect(result.baselineNote).toContain('Q4 FY25');
    });

    it('TC-F1-02 — last_period: returns rates from single most-recent period', async () => {
      const q1Rates = makeRates('Q1 FY26', 0.58);
      const q4Rates = makeRates('Q4 FY25', 0.55);
      prisma.historicalConversionRate.findMany.mockResolvedValue([...q1Rates, ...q4Rates]);

      const result = await callBaseline(service, TENANT, 'last_period');

      expect(result.rateMap['Proposal']).toBeCloseTo(0.58, 2);
      expect(result.baselineNote).toContain('Q1 FY26');
      expect(result.baselineNote).not.toContain('Q4 FY25');
    });

    it('TC-F1-03 — same_period_last_year: returns matching quarter from prior FY', async () => {
      const q2fy26 = makeRates('Q2 FY26', 0.60);
      const q2fy25 = makeRates('Q2 FY25', 0.52);
      prisma.historicalConversionRate.findMany.mockResolvedValue([...q2fy26, ...q2fy25]);

      const result = await callBaseline(service, TENANT, 'same_period_last_year');

      expect(result.rateMap['Proposal']).toBeCloseTo(0.52, 2);
      expect(result.baselineNote).toContain('Q2 FY25');
    });

    it('TC-F1-04 — falls back gracefully when no historical data exists', async () => {
      prisma.historicalConversionRate.findMany.mockResolvedValue([]);

      const result = await callBaseline(service, TENANT, 'avg_last_2');

      // Should use heuristic fallback rates
      expect(result.rateMap['Discovery']).toBe(0.20);
      expect(result.rateMap['Proposal']).toBe(0.58);
      expect(result.rateMap['Negotiation']).toBe(0.74);
      expect(result.baselineNote).toContain('fallback');
    });
  });

  // ── getAiPrediction() with baseline ─────────────────────────────────────

  describe('getAiPrediction() with baseline', () => {
    beforeEach(() => {
      prisma.forecastPeriod.findFirst.mockResolvedValue(makePeriod());
      prisma.aiForecastSnapshot.findFirst.mockResolvedValue(makeSnapshot());
      prisma.crmDeal.findMany.mockResolvedValue([]);
    });

    it('TC-F1-06 — predictedAmount differs when baseline is supplied', async () => {
      // Historical rates lower than current → prediction should decrease
      const lowRates = makeRates('Q1 FY26', 0.30);
      prisma.historicalConversionRate.findMany.mockResolvedValue(lowRates);

      const withBaseline = await service.getAiPrediction(TENANT, 'period-1', 'last_period');
      prisma.historicalConversionRate.findMany.mockResolvedValue([]);
      const withoutBaseline = await service.getAiPrediction(TENANT, 'period-1');

      expect(withBaseline.aiPrediction.predictedAmount).not.toBe(withoutBaseline.aiPrediction.predictedAmount);
    });

    it('TC-F1-07 — baselineNote string is present when baseline param used', async () => {
      const rates = makeRates('Q1 FY26', 0.58);
      prisma.historicalConversionRate.findMany.mockResolvedValue(rates);

      const result = await service.getAiPrediction(TENANT, 'period-1', 'avg_last_2');

      expect(result.aiPrediction.baselineNote).toBeTruthy();
      expect(typeof result.aiPrediction.baselineNote).toBe('string');
    });

    it('TC-F1-08 — no baseline param returns current-rate prediction unchanged', async () => {
      prisma.historicalConversionRate.findMany.mockResolvedValue([]);

      const result = await service.getAiPrediction(TENANT, 'period-1');

      expect(result.aiPrediction.baselineNote).toBeNull();
      expect(result.aiPrediction.predictedAmount).toBe(makeSnapshot().predictedAmount);
    });
    it('keeps current baseline stable after switching to a historical baseline', async () => {
      prisma.crmDeal.findMany.mockResolvedValue([
        {
          dealName: 'Won A',
          stage: 'Closed Won',
          amount: 5000000,
          probability: 1,
          isClosedWon: true,
          isClosedLost: false,
          closeDate: new Date('2026-06-01'),
          region: 'Americas',
          repUserId: 'rep-01',
        },
        {
          dealName: 'Open A',
          stage: 'Proposal',
          amount: 8000000,
          probability: 0.58,
          isClosedWon: false,
          isClosedLost: false,
          closeDate: new Date('2026-06-28'),
          region: 'Americas',
          repUserId: 'rep-01',
        },
      ]);
      prisma.historicalConversionRate.findMany.mockResolvedValue([
        ...makeRates('Q2 FY26', 0.58),
        ...makeRates('Q1 FY26', 0.30),
      ]);

      const firstCurrent = await service.getAiPrediction(TENANT, 'period-1', undefined, undefined, 'rep-01');
      const historical = await service.getAiPrediction(TENANT, 'period-1', 'avg_last_2', undefined, 'rep-01');
      const secondCurrent = await service.getAiPrediction(TENANT, 'period-1', undefined, undefined, 'rep-01');

      expect(firstCurrent.aiPrediction.predictedAmount).toBe(secondCurrent.aiPrediction.predictedAmount);
      expect(historical.aiPrediction.predictedAmount).not.toBe(firstCurrent.aiPrediction.predictedAmount);
      expect(secondCurrent.aiPrediction.baseline).toBeNull();
      expect(secondCurrent.aiPrediction.baselineNote).toBeNull();
    });

    it('same_period_last_year uses the selected forecast period name, not the newest rate row', async () => {
      prisma.crmDeal.findMany.mockResolvedValue([]);
      prisma.historicalConversionRate.findMany.mockResolvedValue([
        ...makeRates('Q1 FY26', 0.60),
        ...makeRates('Q2 FY25', 0.52),
      ]);

      const result = await service.getAiPrediction(TENANT, 'period-1', 'same_period_last_year');

      expect(result.aiPrediction.baselineNote).toContain('Q2 FY25');
      expect(result.aiPrediction.predictedAmount).toBe(9960000);
    });
  });
});
