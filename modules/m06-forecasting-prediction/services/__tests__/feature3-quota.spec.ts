/**
 * FEATURE 3 — Quota Model & Real Quota Lookups
 * Unit tests for Quota reads in getTeamBoard and getBoard
 */
import { Test, TestingModule } from '@nestjs/testing';
import { M06ForecastingPredictionService } from '../m06.service';
import { PrismaService } from '../../database/prisma.service';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';

function mockPrisma() {
  const userMock = { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), upsert: jest.fn() };
  return {
    forecastPeriod: { findFirst: jest.fn(), findMany: jest.fn() },
    aiForecastSnapshot: { findFirst: jest.fn() },
    historicalConversionRate: { findMany: jest.fn(), createMany: jest.fn() },
    crmDeal: { findMany: jest.fn(), create: jest.fn() },
    forecastSubmission: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    forecastAuditLog: { findMany: jest.fn(), create: jest.fn() },
    user: userMock,
    forecastUser: userMock,
    quota: { findFirst: jest.fn(), findMany: jest.fn(), upsert: jest.fn(), create: jest.fn() },
    forecastExecutiveSnapshot: { findFirst: jest.fn(), findMany: jest.fn(), upsert: jest.fn(), create: jest.fn() },
    pipelineValuesCache: { findFirst: jest.fn(), findMany: jest.fn(), upsert: jest.fn(), create: jest.fn() },
    pipelineCoverageMetrics: { findFirst: jest.fn(), findMany: jest.fn() },
  };
}

const TENANT = 'test-tenant';
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
    pipelineByStage: [], expectedDeals: { rate: 0.1, addressablePipeline: 8000000, contribution: 800000 },
  },
};

describe('Feature 3 — Quota Model & Real Quota Lookups', () => {
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

  it('TC-F3-02 — getTeamBoard reads quota from DB, not aiProjection * 1.1', async () => {
    prisma.forecastPeriod.findFirst.mockResolvedValue(period);
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', repId: 'rep-01', name: 'Rep A', email: 'a@t.com', region: 'Americas', role: 'sales_rep', tenantId: TENANT },
    ]);
    prisma.forecastSubmission.findMany.mockResolvedValue([
      { id: 's1', repUserId: 'rep-01', commitForecast: 4500000, bestCaseForecast: 5000000, status: 'submitted', lob: 'ES' },
    ]);
    prisma.forecastAuditLog.findMany.mockResolvedValue([]);
    prisma.aiForecastSnapshot.findFirst.mockResolvedValue(snapshot);
    prisma.historicalConversionRate.findMany.mockResolvedValue([]);
    prisma.crmDeal.findMany.mockResolvedValue([]);
    prisma.quota.findMany.mockResolvedValue([
      { id: 'q1', tenantId: TENANT, periodId: 'period-1', repUserId: 'u1', amount: 5000000 },
    ]);

    const result = await service.getTeamBoard(TENANT);
    const repRow = result.team[0];

    expect(repRow.quota).toBe(5000000);
    // Should NOT be 4500000 * 0.92 * 1.1 (the old hack)
    expect(repRow.quota).not.toBeCloseTo(4500000 * 0.92 * 1.1, -3);
  });

  it('TC-F3-05 — missing quota returns fallback, not crash', async () => {
    prisma.forecastPeriod.findFirst.mockResolvedValue(period);
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', repId: 'rep-01', name: 'Rep A', email: 'a@t.com', region: 'Americas', role: 'sales_rep', tenantId: TENANT },
    ]);
    prisma.forecastSubmission.findMany.mockResolvedValue([]);
    prisma.forecastAuditLog.findMany.mockResolvedValue([]);
    prisma.aiForecastSnapshot.findFirst.mockResolvedValue(snapshot);
    prisma.historicalConversionRate.findMany.mockResolvedValue([]);
    prisma.crmDeal.findMany.mockResolvedValue([]);
    prisma.quota.findMany.mockResolvedValue([]); // no quota seeded

    const result = await service.getTeamBoard(TENANT);

    expect(result.team.length).toBe(1);
    // quota should fall back to aiProjection * 1.1 when no DB row exists
    expect(typeof result.team[0].quota).toBe('number');
  });

  it('TC-F3-04 — getBoard includes quota from DB for repUserId', async () => {
    prisma.forecastPeriod.findFirst.mockResolvedValue(period);
    prisma.aiForecastSnapshot.findFirst.mockResolvedValue(snapshot);
    prisma.historicalConversionRate.findMany.mockResolvedValue([]);
    prisma.crmDeal.findMany.mockResolvedValue([]);
    prisma.forecastSubmission.findMany.mockResolvedValue([]);
    prisma.quota.findFirst.mockResolvedValue({ id: 'q1', amount: 6000000 });

    const result = await service.getBoard(TENANT, 'period-1', 'rep-01');

    expect(result.quota).toBe(6000000);
  });

  it('TC-X-06 — getTeamBoard reflects latest rep submission saved with user id', async () => {
    prisma.forecastPeriod.findFirst.mockResolvedValue(period);
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', repId: 'rep-01', name: 'Rep A', email: 'a@t.com', region: 'Americas', role: 'sales_rep', tenantId: TENANT },
    ]);
    prisma.forecastSubmission.findMany.mockResolvedValue([
      {
        id: 's2',
        repUserId: 'u1',
        commitForecast: 7200000,
        bestCaseForecast: 8000000,
        status: 'submitted',
        lob: 'ES',
        version: 2,
        updatedAt: new Date('2026-05-20T10:00:00Z'),
        createdAt: new Date('2026-05-20T09:00:00Z'),
      },
      {
        id: 's1',
        repUserId: 'rep-01',
        commitForecast: 4500000,
        bestCaseForecast: 5000000,
        status: 'draft',
        lob: 'ES',
        version: 1,
        updatedAt: new Date('2026-05-19T10:00:00Z'),
        createdAt: new Date('2026-05-19T09:00:00Z'),
      },
    ]);
    prisma.forecastAuditLog.findMany.mockResolvedValue([]);
    prisma.aiForecastSnapshot.findFirst.mockResolvedValue(snapshot);
    prisma.historicalConversionRate.findMany.mockResolvedValue([]);
    prisma.crmDeal.findMany.mockResolvedValue([]);
    prisma.quota.findMany.mockResolvedValue([]);

    const result = await service.getTeamBoard(TENANT);

    expect(prisma.forecastSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          repUserId: { in: expect.arrayContaining(['u1', 'rep-01']) },
        }),
      }),
    );
    expect(result.team[0].submission?.id).toBe('s2');
    expect(result.team[0].commit).toBe(7200000);
    expect(result.team[0].status).toBe('submitted');
  });
});
