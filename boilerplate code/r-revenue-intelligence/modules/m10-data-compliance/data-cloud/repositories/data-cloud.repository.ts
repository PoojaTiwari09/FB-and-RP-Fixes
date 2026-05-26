// M10 Data Cloud — Repository
// Owned by: modules/m10-data-compliance/ (TDD Doc #11c v3.0)
// The ONLY layer that reads/writes m10_data_cloud_* tables.
// V1: PostgreSQL is both source AND destination (staging export tables).

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DataCloudRepository {
  private readonly logger = new Logger(DataCloudRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── CONNECTIONS ─────────────────────────────────────────────────────────────

  async createConnection(tenantId: string, data: {
    destination: string;
    config: object;
  }): Promise<any> {
    return this.prisma.m10DataCloudConnection.create({
      data: { tenantId, destination: data.destination, config: data.config },
    });
  }

  async findConnections(tenantId: string): Promise<any[]> {
    return this.prisma.m10DataCloudConnection.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findConnectionById(tenantId: string, connectionId: string): Promise<any | null> {
    return this.prisma.m10DataCloudConnection.findFirst({
      where: { id: connectionId, tenantId },
    });
  }

  async setConnectionActive(tenantId: string, connectionId: string, isActive: boolean): Promise<any> {
    return this.prisma.m10DataCloudConnection.updateMany({
      where: { id: connectionId, tenantId },
      data: { isActive, updatedAt: new Date() },
    });
  }

  // ─── EXPORT RUNS ──────────────────────────────────────────────────────────────

  async createExportRun(data: {
    tenantId: string;
    connectionId: string;
    status: string;
  }): Promise<any> {
    return this.prisma.m10DataCloudExportRun.create({ data });
  }

  async updateExportRun(runId: string, data: {
    status: string;
    rowsExported?: number;
    errorMessage?: string;
    completedAt?: Date;
  }): Promise<any> {
    return this.prisma.m10DataCloudExportRun.update({
      where: { id: runId },
      data,
    });
  }

  async findExportRuns(tenantId: string, connectionId?: string): Promise<any[]> {
    return this.prisma.m10DataCloudExportRun.findMany({
      where: {
        tenantId,
        ...(connectionId ? { connectionId } : {}),
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: { connection: { select: { destination: true, id: true } } },
    });
  }

  // ─── CHECKPOINTS ─────────────────────────────────────────────────────────────

  async getCheckpoint(tenantId: string, domain: string): Promise<any | null> {
    return this.prisma.m10DataCloudCheckpoint.findUnique({
      where: { tenantId_domain: { tenantId, domain } },
    });
  }

  async upsertCheckpoint(tenantId: string, domain: string, lastCursor: string): Promise<any> {
    return this.prisma.m10DataCloudCheckpoint.upsert({
      where: { tenantId_domain: { tenantId, domain } },
      update: { lastCursor, updatedAt: new Date() },
      create: { tenantId, domain, lastCursor },
    });
  }

  // ─── SOURCE DATA (V1: read from same PostgreSQL) ───────────────────────────

  async extractAccounts(tenantId: string, since?: Date): Promise<any[]> {
    return this.prisma.m10Account.findMany({
      where: {
        tenantId,
        ...(since ? { updatedAt: { gt: since } } : {}),
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  async extractContacts(tenantId: string, since?: Date): Promise<any[]> {
    return this.prisma.m10Contact.findMany({
      where: {
        tenantId,
        ...(since ? { updatedAt: { gt: since } } : {}),
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  async extractDeals(tenantId: string, since?: Date): Promise<any[]> {
    return this.prisma.m10Deal.findMany({
      where: {
        tenantId,
        ...(since ? { updatedAt: { gt: since } } : {}),
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  async extractActivities(tenantId: string, since?: Date): Promise<any[]> {
    return this.prisma.m10Activity.findMany({
      where: {
        tenantId,
        ...(since ? { updatedAt: { gt: since } } : {}),
      },
      orderBy: { updatedAt: 'asc' },
    });
  }
}
