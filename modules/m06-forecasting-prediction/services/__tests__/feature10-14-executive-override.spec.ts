/**
 * FEATURE 10 — CRO/VP Executive Dashboard
 * FEATURE 14 — Override Impact Calculation
 * Unit tests for getExecutiveDashboard and overrideSubmission
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
    deals: [
      { deal: 'D1', stage: 'Proposal', amount: 8000000, stageRate: 0.58, timeDecay: 1, contribution: 4640000, region: 'Americas', close: 'Jun 28', closeDate: '2026-06-28', aiConf: 'Med', contributionFactor: 0.58 },
    ],
    closedWonDetails: { total: 5000000, deals: [{ name: 'Won A', amount: 5000000, region: 'Americas' }] },
    pipelineByStage: [{ stage: 'Proposal', pipeline: 8000000, convRate: 0.58, contribution: 4640000 }],
    expectedDeals: { rate: 0.1, addressablePipeline: 8000000, contribution: 800000 },
  },
};

describe('Feature 10 — CRO/VP Executive Dashboard', () => {
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

    prisma.forecastPeriod.findFirst.mockResolvedValue(period);
    prisma.aiForecastSnapshot.findFirst.mockResolvedValue(snapshot);
    prisma.historicalConversionRate.findMany.mockResolvedValue([]);
    prisma.crmDeal.findMany.mockResolvedValue([]);
    prisma.forecastSubmission.findMany.mockResolvedValue([]);
    prisma.forecastAuditLog.findMany.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([]);
    prisma.quota.findMany.mockResolvedValue([]);
  });

  it('TC-F10-01 — aiProjection.total equals closedWon + weightedPipeline + expectedDeals', async () => {
    const result = await service.getExecutiveDashboard(TENANT);

    const { closedWon, weightedPipeline, expectedDeals } = result.aiProjection.breakdown;
    expect(result.aiProjection.total).toBe(closedWon + weightedPipeline + expectedDeals);
  });

  it('TC-F10-02 — closedWonByRegion contains all three region keys', async () => {
    const result = await service.getExecutiveDashboard(TENANT, undefined, 'Company');

    expect(result.closedWonByRegion).toHaveProperty('Americas');
    expect(result.closedWonByRegion).toHaveProperty('EMEA');
    expect(result.closedWonByRegion).toHaveProperty('APAC');
  });

  it('TC-F10-07 — reconciliation string contains breakdown values', async () => {
    const result = await service.getExecutiveDashboard(TENANT);

    expect(typeof result.reconciliation).toBe('string');
    expect(result.reconciliation).toContain('+');
    expect(result.reconciliation).toContain('=');
  });
});

describe('Feature 14 — Override Impact Calculation', () => {
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

  it('TC-F14-08 — audit log systemLog contains original and adjusted amounts', async () => {
    prisma.forecastSubmission.findFirst.mockResolvedValue({
      id: 's1', tenantId: TENANT, periodId: 'period-1', status: 'submitted',
      repUserId: 'rep-01', commitForecast: 4500000, approvedAt: null,
    });
    prisma.forecastSubmission.create.mockResolvedValue({ id: 'updated-s1' });
    prisma.forecastAuditLog.create.mockResolvedValue({});

    prisma.forecastPeriod.findFirst.mockResolvedValue({ id: 'period-1', status: 'open' });
    await service.overrideSubmission(TENANT, 's1', 'mgr-01', 'Manager', 3800000, 'Too optimistic');

    // Verify audit log was created with the override amounts
    const auditCall = prisma.forecastAuditLog.create.mock.calls[0][0];
    expect(auditCall.data.action).toContain('Override');
    expect(auditCall.data.metadata).toEqual(
      expect.objectContaining({ original: 4500000, override: 3800000 }),
    );
  });

  it('TC-F14-10 — override with approveNow creates two audit entries', async () => {
    prisma.forecastSubmission.findFirst.mockResolvedValue({
      id: 's1', tenantId: TENANT, periodId: 'period-1', status: 'submitted',
      repUserId: 'rep-01', commitForecast: 4500000, approvedAt: null,
    });
    prisma.forecastSubmission.create.mockResolvedValue({ id: 'updated-s1' });
    prisma.forecastAuditLog.create.mockResolvedValue({});

    prisma.forecastPeriod.findFirst.mockResolvedValue({ id: 'period-1', status: 'open' });
    await service.overrideSubmission(TENANT, 's1', 'mgr-01', 'Manager', 3800000, 'Adjusting down', true);

    // One for override + one for approval
    expect(prisma.forecastAuditLog.create).toHaveBeenCalledTimes(2);
  });
});
