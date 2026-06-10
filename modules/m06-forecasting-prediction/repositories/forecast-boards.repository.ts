import { Prisma } from '@rri/database';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/**
 * Data access for Forecast Boards (TDD §5 — m06_forecasting_prediction tables).
 * Maps Prisma `public` models to TDD table names: forecast_periods, forecast_submissions,
 * predictive_snapshots (ai_forecast_snapshots), pipeline_coverage_metrics.
 */
@Injectable()
export class ForecastBoardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPeriodsByTenant(tenantId: string) {
    return this.prisma.forecastPeriod.findMany({
      where: { tenantid: tenantId },
      orderBy: { startDate: 'desc' },
    });
  }

  resolvePeriod(tenantId: string, periodId: string) {
    const where =
      periodId === 'current'
        ? { tenantid: tenantId, status: 'open' as const }
        : { id: periodId, tenantid: tenantId };

    return this.prisma.forecastPeriod.findFirst({ where });
  }

  findLatestAiSnapshot(tenantId: string, periodId: string) {
    return this.prisma.aiForecastSnapshot.findFirst({
      where: { tenantid: tenantId, periodId },
      orderBy: { computedAt: 'desc' },
    });
  }

  findLatestCoverageMetrics(tenantId: string, periodId: string) {
    return this.prisma.pipelineCoverageMetrics.findFirst({
      where: { tenantid: tenantId, periodId },
      orderBy: { computedAt: 'desc' },
    });
  }

  findOpenPipelineDeals(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.crmDeal.findMany({
      where: {
        tenantid: tenantId,
        isClosedWon: false,
        isClosedLost: false,
        closeDate: { gte: startDate, lte: endDate },
      },
    });
  }

  findSubmissionsForPeriod(tenantId: string, periodId: string) {
    return this.prisma.forecastSubmission.findMany({
      where: { tenantid: tenantId, periodId },
      orderBy: [{ repUserId: 'asc' }, { version: 'desc' }],
    });
  }

  findSubmissionByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.forecastSubmission.findUnique({
      where: { idempotencyKey },
    });
  }

  findMaxVersionForUser(tenantId: string, periodId: string, userId: string) {
    return this.prisma.forecastSubmission.findFirst({
      where: { tenantid: tenantId, periodId, repUserId: userId },
      orderBy: { version: 'desc' },
    });
  }

  appendSubmission(
    data: Parameters<PrismaService['forecastSubmission']['create']>[0]['data'],
  ) {
    return this.prisma.forecastSubmission.create({ data });
  }

  appendAuditLog(
    data: Parameters<PrismaService['forecastAuditLog']['create']>[0]['data'],
  ) {
    return this.prisma.forecastAuditLog.create({ data });
  }
}
