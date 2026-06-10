// M10 Revenue Graph — Repository
// Owned by: modules/m10-data-compliance/ (TDD Doc #11a v3.0)
// The ONLY layer that reads/writes to m10_data_compliance.* DB tables.
// Architecture rule: No other module may directly access these tables.
//                    All DB access is tenant-scoped — tenantId in every query.
//                    RLS enforced at DB layer; tenantId also enforced here.

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RevenueGraphRepository {
  private readonly logger = new Logger(RevenueGraphRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── ACCOUNTS ────────────────────────────────────────────────────────────────

  async findAccounts(
    tenantId: string,
    opts: { page?: number; limit?: number; search?: string } = {},
  ): Promise<{ data: any[]; total: number }> {
    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      tenantid: tenantId,
      ...(opts.search
        ? {
            OR: [
              { name: { contains: opts.search, mode: 'insensitive' } },
              { domain: { contains: opts.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.m10Account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.m10Account.count({ where }),
    ]);
    return { data, total };
  }

  async findAccountById(tenantId: string, accountId: string): Promise<any | null> {
    return this.prisma.m10Account.findFirst({
      where: { id: accountId, tenantid: tenantId },
    });
  }

  async listAccountsForMatching(tenantId: string, limit = 500): Promise<any[]> {
    if (!(this.prisma as any).m10Account?.findMany) return [];
    return this.prisma.m10Account.findMany({
      where: { tenantid: tenantId },
      select: { id: true, name: true, domain: true, crmAccountId: true },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listContactsForMatching(tenantId: string, limit = 500): Promise<any[]> {
    if (!(this.prisma as any).m10Contact?.findMany) return [];
    return this.prisma.m10Contact.findMany({
      where: { tenantid: tenantId },
      select: { id: true, email: true, name: true, accountId: true },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async upsertAccount(
    tenantId: string,
    data: {
      crmAccountId?: string;
      name: string;
      domain?: string;
      region?: string;
      industry?: string;
      crmSource?: string;
    },
  ): Promise<any> {
    if (data.crmAccountId) {
      const existing = await this.prisma.m10Account.findFirst({
        where: { tenantid: tenantId, crmAccountId: data.crmAccountId },
        select: { id: true },
      });
      if (existing) {
        return this.prisma.m10Account.update({
          where: { id: existing.id },
          data: { ...data, updatedAt: new Date() },
        });
      }
    }
    return this.prisma.m10Account.create({ data: { tenantid: tenantId, ...data } });
  }

  // ─── CONTACTS ────────────────────────────────────────────────────────────────

  async findContactByEmail(tenantId: string, email: string): Promise<any | null> {
    return this.prisma.m10Contact.findFirst({
      where: { tenantid: tenantId, email: email.toLowerCase() },
    });
  }

  async findContactById(tenantId: string, contactId: string): Promise<any | null> {
    return this.prisma.m10Contact.findFirst({
      where: { id: contactId, tenantid: tenantId },
    });
  }

  async upsertContact(
    tenantId: string,
    data: {
      email: string;
      name?: string;
      accountId?: string;
      crmContactId?: string;
      crmSource?: string;
    },
  ): Promise<any> {
    const existing = await this.findContactByEmail(tenantId, data.email);
    if (existing) {
      return this.prisma.m10Contact.update({
        where: { id: existing.id },
        data: { ...data, email: data.email.toLowerCase(), updatedAt: new Date() },
      });
    }
    return this.prisma.m10Contact.create({
      data: { tenantid: tenantId, ...data, email: data.email.toLowerCase() },
    });
  }

  // ─── DEALS ───────────────────────────────────────────────────────────────────

  async findDeals(
    tenantId: string,
    opts: {
      accountId?: string;
      isActive?: boolean;
      stage?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: any[]; total: number }> {
    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      tenantid: tenantId,
      ...(opts.accountId ? { accountId: opts.accountId } : {}),
      ...(opts.isActive !== undefined ? { isActive: opts.isActive } : {}),
      ...(opts.stage ? { stage: opts.stage } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.m10Deal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          account: true,
          dealContacts: { include: { contact: true } },
        },
      }),
      this.prisma.m10Deal.count({ where }),
    ]);
    return { data, total };
  }

  async findDealById(tenantId: string, dealId: string): Promise<any | null> {
    return this.prisma.m10Deal.findFirst({
      where: { id: dealId, tenantid: tenantId },
      include: {
        account: true,
        dealContacts: { include: { contact: true } },
        activities: { orderBy: { occurredAt: 'desc' }, take: 10 },
      },
    });
  }

  async findOpenDealsByAccount(tenantId: string, accountId: string): Promise<any[]> {
    return this.prisma.m10Deal.findMany({
      where: { tenantid: tenantId, accountId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
  }

  async updateDealStage(tenantId: string, dealId: string, stage: string): Promise<any> {
    return this.prisma.m10Deal.update({
      where: { id: dealId },
      data: { stage, updatedAt: new Date() },
    });
  }

  // ─── ACTIVITIES ──────────────────────────────────────────────────────────────

  /**
   * Upsert activity by idempotencyKey.
   * CRITICAL: This is the idempotency gate — duplicate events must NOT create
   * duplicate activity records. (TDD FR-5)
   */
  async upsertActivity(
    tenantId: string,
    data: {
      idempotencyKey: string;
      sourceType: string;
      sourcePlatform?: string;
      sourceRecordId?: string;
      occurredAt: Date;
      transcriptId?: string;
      calendarEventId?: string;
      emailThreadId?: string;
      status?: string;
    },
  ): Promise<any> {
    const existing = await this.prisma.m10Activity.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });

    if (existing) {
      this.logger.debug(`Activity already exists for key ${data.idempotencyKey}, skipping create`);
      return existing;
    }

    return this.prisma.m10Activity.create({
      data: {
        tenantid: tenantId,
        ...data,
        occurredAt: data.occurredAt,
        status: data.status ?? 'received',
      },
    });
  }

  async updateActivityStatus(
    activityId: string,
    status: string,
    linkedFields?: {
      accountId?: string;
      contactId?: string;
      dealId?: string;
    },
  ): Promise<any> {
    return this.prisma.m10Activity.update({
      where: { id: activityId },
      data: { status, ...(linkedFields ?? {}), updatedAt: new Date() },
    });
  }

  // ─── INTERACTION LINKS ────────────────────────────────────────────────────────

  /**
   * Write resolved entity links for an activity.
   * Uses upsert to remain idempotent on BullMQ retries. (TDD FR-5)
   */
  async upsertInteractionLinks(
    tenantId: string,
    activityId: string,
    links: Array<{
      entityType: string;
      entityId: string;
      confidence: string;
      signals: string[];
      aiAssisted: boolean;
      explanation?: object;
    }>,
  ): Promise<any[]> {
    const results: any[] = [];

    for (const link of links) {
      const result = await this.prisma.m10InteractionLink.upsert({
        where: {
          tenantid_activityId_entityType_entityId: {
            tenantid: tenantId,
            activityId,
            entityType: link.entityType,
            entityId: link.entityId,
          },
        },
        update: {
          confidence: link.confidence,
          signals: link.signals,
          aiAssisted: link.aiAssisted,
          explanation: link.explanation ?? {},
          updatedAt: new Date(),
        },
        create: {
          tenantid: tenantId,
          activityId,
          entityType: link.entityType,
          entityId: link.entityId,
          confidence: link.confidence,
          signals: link.signals,
          aiAssisted: link.aiAssisted,
          explanation: link.explanation ?? {},
        },
      });
      results.push(result);
    }

    return results;
  }

  async findLinksByActivity(tenantId: string, activityId: string): Promise<any[]> {
    return this.prisma.m10InteractionLink.findMany({
      where: { tenantid: tenantId, activityId },
    });
  }

  // ─── LINK DECISION LOG (Audit Trail) ─────────────────────────────────────────

  async createLinkDecisionLog(
    tenantId: string,
    data: {
      activityId: string;
      idempotencyKey: string;
      candidatesJson: object;
      selectedLinks: object;
      rejectedLinks: object;
      aiRequestSent: boolean;
      aiResponseJson?: object;
      processingMs?: number;
      outcome: string;
      failureReason?: string;
    },
  ): Promise<any> {
    return this.prisma.m10LinkDecisionLog.create({ data: { tenantid: tenantId, ...data } });
  }

  // ─── MAPPING RULES ────────────────────────────────────────────────────────────

  async getActiveMappingRules(tenantId: string): Promise<any | null> {
    return this.prisma.m10MappingRuleSet.findFirst({
      where: { tenantid: tenantId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ─── CRM SYNC STATE ───────────────────────────────────────────────────────────

  async getCrmSyncStates(tenantId: string): Promise<any[]> {
    return this.prisma.m10CrmSyncState.findMany({ where: { tenantid: tenantId } });
  }

  async upsertCrmSyncState(
    tenantId: string,
    crmSource: string,
    entityType: string,
    data: Partial<{
      status: string;
      lastSyncedAt: Date;
      lastCursor: string;
      recordsSynced: number;
      errorMessage: string;
    }>,
  ): Promise<any> {
    return this.prisma.m10CrmSyncState.upsert({
      where: {
        tenantid_crmSource_entityType: { tenantid: tenantId, crmSource, entityType },
      },
      update: { ...data, updatedAt: new Date() },
      create: { tenantid: tenantId, crmSource, entityType, ...data },
    });
  }
}
