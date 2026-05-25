/**
 * FEATURE 2 — Region Filter & Region-Scoped Data
 * Unit tests for buildExplainability() region filtering, getTeamBoard() region scoping
 */
import { Test, TestingModule } from '@nestjs/testing';
import { M06ForecastingPredictionService } from '../m06.service';
import { PrismaService } from '../../database/prisma.service';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';

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

const TENANT = 'test-tenant';
const period = {
  id: 'period-1', tenantId: TENANT, name: 'Q2 FY26', status: 'open',
  startDate: new Date('2026-04-01'), endDate: new Date('2026-06-30'),
  revenueTarget: 100000000, isLocked: false,
};

const makeDeal = (name: string, region: string, stage = 'Proposal', amount = 1000000) => ({
  id: `deal-${name}`, tenantId: TENANT, dealName: name, stage, amount,
  closeDate: new Date('2026-06-15'), probability: 0.5,
  isClosedWon: false, isClosedLost: false, region, lob: null, repUserId: null,
});

const snapshot = {
  snapshotId: 'snap-1', tenantId: TENANT, periodId: 'period-1',
  predictedAmount: 14260000, confidenceRangeLow: 13000000, confidenceRangeHigh: 15500000,
  computedAt: new Date(), idempotencyKey: 'seed-1',
  modelInputs: {
    deals: [],
    closedWonDetails: { total: 5000000, deals: [] },
    pipelineByStage: [{ stage: 'Proposal', pipeline: 8000000, convRate: 0.58, contribution: 4640000 }],
    expectedDeals: { rate: 0.1, addressablePipeline: 8000000, contribution: 800000 },
  },
};

describe('Feature 2 — Region Filter & Region-Scoped Data', () => {
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

  it('TC-F2-03 — buildExplainability filters deals by region when param present', async () => {
    const deals = [
      makeDeal('D1', 'Americas'), makeDeal('D2', 'Americas'),
      makeDeal('D3', 'EMEA'), makeDeal('D4', 'EMEA'), makeDeal('D5', 'EMEA'),
      makeDeal('D6', 'APAC'), makeDeal('D7', 'APAC'), makeDeal('D8', 'APAC'),
      makeDeal('D9', 'Americas'), makeDeal('D10', 'Americas'),
    ];
    prisma.crmDeal.findMany.mockResolvedValue(deals);
    prisma.historicalConversionRate.findMany.mockResolvedValue([]);

    const result = await (service as any).buildExplainability(TENANT, period, snapshot.modelInputs, 'EMEA');

    const emea = result.deals.filter((d: any) => d.region === 'EMEA');
    expect(emea.length).toBe(3);
    expect(result.deals.every((d: any) => d.region === 'EMEA')).toBe(true);
  });

  it('TC-F2-04 — buildExplainability returns all deals when region is Company', async () => {
    const deals = [
      makeDeal('D1', 'Americas'), makeDeal('D2', 'EMEA'), makeDeal('D3', 'APAC'),
    ];
    prisma.crmDeal.findMany.mockResolvedValue(deals);
    prisma.historicalConversionRate.findMany.mockResolvedValue([]);

    const result = await (service as any).buildExplainability(TENANT, period, snapshot.modelInputs, 'Company');

    expect(result.deals.length).toBe(3);
    expect(result.closedWonByRegion).toHaveProperty('Americas');
    expect(result.closedWonByRegion).toHaveProperty('EMEA');
    expect(result.closedWonByRegion).toHaveProperty('APAC');
  });

  it('TC-F2-05 — getTeamBoard scopes reps by region when filter applied', async () => {
    prisma.forecastPeriod.findFirst.mockResolvedValue(period);
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', repId: 'rep-01', name: 'Rep A', email: 'a@t.com', region: 'Americas', role: 'sales_rep', tenantId: TENANT },
    ]);
    prisma.forecastSubmission.findMany.mockResolvedValue([]);
    prisma.forecastAuditLog.findMany.mockResolvedValue([]);
    prisma.aiForecastSnapshot.findFirst.mockResolvedValue(snapshot);
    prisma.historicalConversionRate.findMany.mockResolvedValue([]);
    prisma.crmDeal.findMany.mockResolvedValue([]);
    prisma.quota.findMany.mockResolvedValue([]);

    const result = await service.getTeamBoard(TENANT, undefined, 'Americas');

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ region: 'Americas' }) }),
    );
    expect(result.team.every((r: any) => r.region === 'Americas')).toBe(true);
  });
});
