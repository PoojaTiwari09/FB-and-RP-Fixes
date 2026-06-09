/**
 * FEATURE 4 — Immutable Submission Versioning
 * Unit tests for createDraft and submitForecast
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

describe('Feature 4 — Immutable Submission Versioning', () => {
  let service: M06ForecastingPredictionService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        M06ForecastingPredictionService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventPublisherService, useValue: { publish: jest.fn() } },
      ],
    }).compile();
    service = module.get(M06ForecastingPredictionService);
  });

  it('TC-F4-01 — createDraft creates version 1 for a new submission', async () => {
    prisma.forecastPeriod.findFirst.mockResolvedValue({ id: 'period-1', tenantId: TENANT, status: 'open' });
    prisma.forecastSubmission.findFirst.mockResolvedValue(null);
    prisma.forecastSubmission.create.mockResolvedValue({ id: 's1', version: 1 });

    const result = await service.createDraft(TENANT, { lob: 'ES', commitForecast: 100 });
    
    expect(prisma.forecastSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ version: 1 })
    }));
    expect(prisma.forecastSubmission.update).not.toHaveBeenCalled();
  });

  it('TC-F4-02 — Second createDraft call inserts version 2, does not update version 1', async () => {
    prisma.forecastPeriod.findFirst.mockResolvedValue({ id: 'period-1', tenantId: TENANT, status: 'open' });
    prisma.forecastSubmission.findFirst.mockResolvedValue({ id: 's1', version: 1, lob: 'ES', repUserId: 'rep-01' });
    prisma.forecastSubmission.create.mockResolvedValue({ id: 's2', version: 2 });

    await service.createDraft(TENANT, { lob: 'ES', commitForecast: 200 });

    expect(prisma.forecastSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ version: 2 })
    }));
    expect(prisma.forecastSubmission.update).not.toHaveBeenCalled();
  });

  it('TC-F4-03 — submitForecast inserts a new version with status: submitted', async () => {
    prisma.forecastSubmission.findFirst.mockResolvedValue({ id: 's2', version: 2, status: 'draft', repUserId: 'rep-01', periodId: 'period-1', lob: 'ES', commitForecast: 200 });
    prisma.forecastPeriod.findFirst.mockResolvedValue({ id: 'period-1', status: 'open' });
    prisma.forecastSubmission.create.mockResolvedValue({ id: 's3', version: 3, status: 'submitted' });

    await service.submitForecast(TENANT, 's2');

    expect(prisma.forecastSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ version: 3, status: 'submitted' })
    }));
    expect(prisma.forecastSubmission.update).not.toHaveBeenCalled();
  });
});
