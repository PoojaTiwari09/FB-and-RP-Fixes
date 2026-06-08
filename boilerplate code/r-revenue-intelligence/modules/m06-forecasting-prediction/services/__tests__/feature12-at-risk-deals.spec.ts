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

describe('Feature 12 — At-Risk Deals API', () => {
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

  describe('getAtRiskDeals()', () => {
    it('returns deals with no activity in 14 days', async () => {
      const pastDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
      prisma.crmDeal.findMany.mockResolvedValue([
        { id: '1', dealName: 'Old Deal', stage: 'Negotiation', amount: 100, closeDate: new Date(), lastActivityDate: pastDate, riskReason: null, repUserId: 'rep-1' },
        { id: '2', dealName: 'Good Deal', stage: 'Negotiation', amount: 100, closeDate: new Date(), lastActivityDate: new Date(), riskReason: null, repUserId: 'rep-1' }
      ]);
      prisma.user.findMany.mockResolvedValue([{ id: 'rep-1', name: 'John Doe' }]);

      const result = await service.getAtRiskDeals(TENANT);
      expect(result.length).toBe(1);
      expect(result[0].dealName).toBe('Old Deal');
      expect(result[0].riskReason).toBe('No activity 14d');
      expect(result[0].repName).toBe('John Doe');
    });

    it('returns deals closing soon but in early stages', async () => {
      const nearFuture = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      prisma.crmDeal.findMany.mockResolvedValue([
        { id: '1', dealName: 'Early Stage Deal', stage: 'Discovery', amount: 100, closeDate: nearFuture, lastActivityDate: new Date(), riskReason: null, repUserId: 'rep-1' }
      ]);
      prisma.user.findMany.mockResolvedValue([{ id: 'rep-1', name: 'John Doe' }]);

      const result = await service.getAtRiskDeals(TENANT);
      expect(result.length).toBe(1);
      expect(result[0].dealName).toBe('Early Stage Deal');
      expect(result[0].riskReason).toBe('Closing soon but early stage');
    });

    it('returns deals with explicit risk reason', async () => {
      prisma.crmDeal.findMany.mockResolvedValue([
        { id: '1', dealName: 'Risky Deal', stage: 'Negotiation', amount: 100, closeDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), lastActivityDate: new Date(), riskReason: 'Customer budget cut', repUserId: 'rep-1' }
      ]);
      prisma.user.findMany.mockResolvedValue([{ id: 'rep-1', name: 'John Doe' }]);

      const result = await service.getAtRiskDeals(TENANT);
      expect(result.length).toBe(1);
      expect(result[0].dealName).toBe('Risky Deal');
      expect(result[0].riskReason).toBe('Customer budget cut');
    });
  });
});
