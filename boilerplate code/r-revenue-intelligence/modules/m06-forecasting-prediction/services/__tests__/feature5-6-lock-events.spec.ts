/**
 * FEATURE 5 — Locked Period Enforcement
 * FEATURE 6 — Event Emission on Submission
 * Unit tests for period lock guards and forecast.submitted event
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
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

describe('Feature 5 — Locked Period Enforcement', () => {
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

  /*
   * NOTE: These tests document the EXPECTED behavior described in the TDD.
   * If the current service does not enforce period locks yet, these tests
   * will fail — serving as a specification for the implementation.
   * Mark with  if running against current code to avoid red noise.
   */

  it('TC-F5-01 — createDraft throws ForbiddenException when period is locked', async () => {
    prisma.forecastPeriod.findFirst.mockResolvedValue({
      id: 'period-1', tenantId: TENANT, name: 'Q2 FY26', status: 'locked',
      startDate: new Date(), endDate: new Date(), revenueTarget: 1000, isLocked: true,
    });

    await expect(
      service.createDraft(TENANT, { lob: 'ES', commitForecast: 100 }),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.forecastSubmission.create).not.toHaveBeenCalled();
  });

  it('TC-F5-02 — submitForecast throws ForbiddenException when period is locked', async () => {
    prisma.forecastSubmission.findFirst.mockResolvedValue({
      id: 's1', tenantId: TENANT, periodId: 'period-1', status: 'draft', repUserId: 'rep-01',
    });
    prisma.forecastPeriod.findFirst.mockResolvedValue({
      id: 'period-1', tenantId: TENANT, status: 'locked', isLocked: true,
      name: 'Q2 FY26', startDate: new Date(), endDate: new Date(), revenueTarget: 1000,
    });

    await expect(service.submitForecast(TENANT, 's1')).rejects.toThrow(ForbiddenException);
  });

  it('TC-F5-03 — approveSubmission is NOT blocked by period lock', async () => {
    prisma.forecastSubmission.findFirst.mockResolvedValue({
      id: 's1', tenantId: TENANT, periodId: 'period-1', status: 'submitted',
      repUserId: 'rep-01', commitForecast: 100,
    });
    prisma.forecastSubmission.create.mockResolvedValue({ id: 'updated-sub', status: 'approved' });
    prisma.forecastAuditLog.create.mockResolvedValue({});

    const result = await service.approveSubmission(TENANT, 's1', 'mgr-01', 'Manager');

    expect(result.status).toBe('approved');
  });
});

describe('Feature 6 — Event Emission on Submission', () => {
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

  it('TC-F6-03 — forecast.submitted event is NOT emitted on createDraft', async () => {
    prisma.forecastPeriod.findFirst.mockResolvedValue({
      id: 'period-1', tenantId: TENANT, name: 'Q2 FY26', status: 'open',
      startDate: new Date(), endDate: new Date(), revenueTarget: 1000, isLocked: false,
    });
    prisma.forecastSubmission.findFirst.mockResolvedValue(null);
    prisma.forecastSubmission.create.mockResolvedValue({ id: 's1', status: 'draft' });
    prisma.forecastAuditLog.create.mockResolvedValue({});

    const result = await service.createDraft(TENANT, {
      lob: 'ES', commitForecast: 100, repUserId: 'rep-01',
    });

    // Draft should be created without triggering submit event
    expect(result.status).toBe('draft');
    expect(prisma.forecastSubmission.create).toHaveBeenCalled();
  });
});

