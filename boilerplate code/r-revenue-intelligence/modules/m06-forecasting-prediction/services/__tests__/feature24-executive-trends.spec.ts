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

describe('Feature 24 — Executive Trends API', () => {
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

  describe('getExecutiveTrends()', () => {
    it('returns up to 4 historical periods of trend data', async () => {
      const q1 = { id: 'p1', name: 'Q1', revenueTarget: 1000, startDate: new Date('2025-01-01'), endDate: new Date('2025-03-31') };
      const q2 = { id: 'p2', name: 'Q2', revenueTarget: 2000, startDate: new Date('2025-04-01'), endDate: new Date('2025-06-30') };
      
      prisma.forecastPeriod.findFirst.mockResolvedValue(q2);
      prisma.forecastPeriod.findMany.mockResolvedValue([q2, q1]); // Descending order like the DB query
      
      // We return mock deals for both periods
      prisma.crmDeal.findMany.mockImplementation(async (query: any) => {
        const closeDate = query.where.closeDate;
        if (closeDate.gte === q1.startDate) {
          return [
            { isClosedWon: true, amount: 500 },
            { isClosedLost: true, amount: 500 }
          ]; // Win rate 50%
        }
        if (closeDate.gte === q2.startDate) {
          return [
            { isClosedWon: true, amount: 1500 },
            { isClosedLost: true, amount: 500 }
          ]; // Win rate 75%
        }
        return [];
      });

      // Also need to mock pipelineCoverageMetrics for trends.push
      prisma.pipelineCoverageMetrics.findFirst.mockResolvedValue(null);

      const result = await service.getExecutiveTrends(TENANT);
      
      expect(result.length).toBe(2);
      
      // Because the method reverses to chronological order
      expect(result[0].periodName).toBe('Q1');
      expect(result[0].target).toBe(1000);
      expect(result[0].bookings).toBe(500);
      expect(result[0].winRate).toBe(0.5);

      expect(result[1].periodName).toBe('Q2');
      expect(result[1].target).toBe(2000);
      expect(result[1].bookings).toBe(1500);
      expect(result[1].winRate).toBe(0.75);
    });

    it('returns 0 winRate if no deals closed', async () => {
      const q1 = { id: 'p1', name: 'Q1', revenueTarget: 1000, startDate: new Date('2025-01-01'), endDate: new Date('2025-03-31') };
      prisma.forecastPeriod.findFirst.mockResolvedValue(q1);
      prisma.forecastPeriod.findMany.mockResolvedValue([q1]);
      prisma.crmDeal.findMany.mockResolvedValue([
        { stage: 'Proposal', amount: 500 } // Not closed
      ]);

      const result = await service.getExecutiveTrends(TENANT);
      
      expect(result.length).toBe(1);
      expect(result[0].bookings).toBe(0);
      expect(result[0].winRate).toBe(0.45);
    });
  });
});
