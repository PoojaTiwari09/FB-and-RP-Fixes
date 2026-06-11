import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { m03DataStore, M03_DEV_ORG } from '../services/m03-data.store';
import { resolveM03TenantId, M03_DEMO_TENANT } from '../services/m03-tenant.util';
import { randomUUID } from 'crypto';

@Injectable()
export class M03AiSummariesGenaiRepository {
  constructor(private readonly prisma: PrismaService) {}

  private aiBriefDelegate(): any | null {
    return (this.prisma as any).aiBrief ?? null;
  }

  private chatDelegate(): any | null {
    return (this.prisma as any).aiChatHistory ?? null;
  }

  async findAll(tenantId: string) {
    const delegate = this.aiBriefDelegate();
    if (delegate?.findMany) {
      return delegate.findMany({
        where: { tenantid: tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });
    }
    return m03DataStore.listBriefs(tenantId);
  }

  async create(data: { tenantId: string; briefType?: string; entityId?: string; generatedSummary?: string }) {
    const row = {
      id: randomUUID(),
      tenantid: data.tenantId,
      briefType: data.briefType || 'account',
      entityId: data.entityId || 'unknown',
      generatedSummary: data.generatedSummary || null,
      generationStatus: 'completed',
      sourceReferences: [],
      llmModel: 'mock',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const delegate = this.aiBriefDelegate();
    if (delegate?.upsert) {
      try {
        return await delegate.upsert({
          where: {
            tenantid_briefType_entityId: {
              tenantid: row.tenantid ?? row.tenantId,
              briefType: row.briefType,
              entityId: row.entityId,
            },
          },
          create: row,
          update: {
            generatedSummary: row.generatedSummary,
            generationStatus: row.generationStatus,
            updatedAt: new Date(),
          },
        });
      } catch {
        /* memory fallback below */
      }
    }

    m03DataStore.insertBrief({
      id: row.id,
      org_id: row.tenantId,
      brief_type: row.briefType,
      entity_id: row.entityId,
      generated_summary: row.generatedSummary,
      generation_status: row.generationStatus,
      created_at: row.createdAt.toISOString(),
    });
    return row;
  }

  async getBrief(tenantId: string, briefType: string, entityId: string) {
    const tid = resolveM03TenantId(tenantId);
    const delegate = this.aiBriefDelegate();
    if (delegate?.findUnique) {
      try {
        const row = await delegate.findUnique({
          where: {
            tenantid_briefType_entityId: { tenantid: tid, briefType, entityId },
          },
        });
        if (row) return this.mapBrief(row);
      } catch {
        /* fall through to memory */
      }
    }

    const mem = m03DataStore.listBriefs(tid, entityId).find(
      (b) => b.brief_type === briefType && b.entity_id === entityId,
    );
    return mem ? this.mapBrief(mem) : null;
  }

  async upsertBrief(params: {
    tenantId: string;
    briefType: string;
    entityId: string;
    generatedSummary: string;
    generationStatus?: string;
    llmModel?: string;
    sourceReferences?: any[];
  }) {
    try {
      return await this.create({
        tenantId: params.tenantId,
        briefType: params.briefType,
        entityId: params.entityId,
        generatedSummary: params.generatedSummary,
      });
    } catch {
      m03DataStore.insertBrief({
        id: randomUUID(),
        org_id: params.tenantId,
        brief_type: params.briefType,
        entity_id: params.entityId,
        generated_summary: params.generatedSummary,
        generation_status: params.generationStatus || 'completed',
        created_at: new Date().toISOString(),
      });
      return this.getBrief(params.tenantId, params.briefType, params.entityId);
    }
  }

  async listChatHistory(tenantId: string, limit = 50) {
    const delegate = this.chatDelegate();
    if (delegate?.findMany) {
      return delegate.findMany({
        where: { tenantid: tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    }
    return m03DataStore.chatHistory
      .filter((c) => c.tenant_id === tenantId || c.org_id === tenantId)
      .slice(0, limit);
  }

  async saveChatMessage(params: {
    tenantId: string;
    userId: string;
    question: string;
    answer: string;
    citations?: any[];
  }) {
    const row = {
      id: randomUUID(),
      tenantid: params.tenantId,
      userId: params.userId,
      question: params.question,
      answer: params.answer,
      citations: params.citations || [],
      createdAt: new Date(),
    };

    const delegate = this.chatDelegate();
    if (delegate?.create) {
      return delegate.create({ data: row });
    }

    m03DataStore.chatHistory.unshift({
      id: row.id,
      tenant_id: row.tenantId,
      org_id: row.tenantId,
      user_id: row.userId,
      question: row.question,
      answer: row.answer,
      citations: row.citations,
      created_at: row.createdAt.toISOString(),
    });
    return row;
  }

  async getWorkspace(tenantId: string) {
    const tid = resolveM03TenantId(tenantId);
    try {
      const fromDb = await this.loadWorkspaceFromPostgres(tid);
      if (
        fromDb.calls.length > 0 ||
        fromDb.accounts.length > 0 ||
        fromDb.deals.length > 0
      ) {
        return fromDb;
      }
    } catch (err: any) {
      console.warn('[M03] Postgres workspace load failed:', err?.message || err);
    }

    if (tid === M03_DEMO_TENANT || tid === M03_DEV_ORG) {
      return m03DataStore.workspace;
    }
    return { deals: [], accounts: [], contacts: [], calls: [] };
  }

  async loadEntityContext(tenantId: string, briefType: string, entityId: string) {
    const ws = await this.getWorkspace(tenantId);
    if (briefType === 'call') {
      return ws.calls.find((c: any) => c.id === entityId) ?? null;
    }
    if (briefType === 'deal') {
      return ws.deals.find((d: any) => d.id === entityId) ?? null;
    }
    if (briefType === 'account') {
      return ws.accounts.find((a: any) => a.id === entityId) ?? null;
    }
    if (briefType === 'contact') {
      return ws.contacts.find((c: any) => c.id === entityId) ?? null;
    }
    return null;
  }

  private async loadWorkspaceFromPostgres(tenantId: string) {
    const prisma = this.prisma as any;

    const [callRecords, accounts, deals, m10Contacts] = await Promise.all([
      prisma.callRecord?.findMany
        ? prisma.callRecord.findMany({
            where: { tenantid: tenantId },
            orderBy: { callDate: 'desc' },
            take: 50,
            include: { transcript: true },
          })
        : [],
      prisma.account?.findMany
        ? prisma.account.findMany({
            where: { tenantid: tenantId },
            orderBy: { updatedAt: 'desc' },
            take: 50,
          })
        : [],
      prisma.deal?.findMany
        ? prisma.deal.findMany({
            where: { tenantid: tenantId },
            orderBy: { updatedAt: 'desc' },
            take: 50,
            include: { account: true },
          })
        : [],
      prisma.m10Contact?.findMany
        ? prisma.m10Contact.findMany({
            where: { tenantid: tenantId },
            orderBy: { updatedAt: 'desc' },
            take: 50,
          })
        : [],
    ]);

    const accountNameById = new Map<string, string>(
      (accounts as any[]).map((a) => [a.id, a.name]),
    );

    const calls = (callRecords as any[]).map((c) => {
      const transcriptText =
        c.transcript?.fullText ||
        c.transcript?.summary ||
        '';
      const accountName = c.accountId
        ? accountNameById.get(c.accountId) || null
        : null;
      return {
        id: c.id,
        title: c.title || 'Call',
        transcript: transcriptText,
        account_id: c.accountId || '',
        accountId: c.accountId || '',
        account_name: accountName,
        deal_id: c.opportunityId || '',
        dealId: c.opportunityId || '',
        call_owner: c.callOwner,
        duration_seconds: c.durationSeconds,
        created_at: c.callDate?.toISOString?.() || c.createdAt?.toISOString?.() || '',
        transcript_status: c.transcriptStatus,
        call_source: c.callSource,
        participants: c.participants || [],
      };
    });

    const dealsNorm = (deals as any[]).map((d) => ({
      id: d.id,
      name: d.name,
      stage: d.stage,
      amount: d.amount != null ? String(d.amount) : null,
      account_id: d.accountId || d.account?.id || '',
      accountId: d.accountId || d.account?.id || '',
      account_name: d.account?.name || accountNameById.get(d.accountId) || null,
      created_at: d.createdAt?.toISOString?.() || '',
    }));

    const accountsNorm = (accounts as any[]).map((a) => ({
      id: a.id,
      name: a.name,
      industry: a.industry || 'Technology',
      owner_name: a.ownerName,
      health_score: a.healthScore,
      created_at: a.createdAt?.toISOString?.() || '',
    }));

    let contactsNorm = (m10Contacts as any[]).map((c) => ({
      id: c.id,
      name: c.name || c.email,
      email: c.email,
      role: c.title || 'Stakeholder',
      account_id: c.accountId || '',
      accountId: c.accountId || '',
    }));

    if (contactsNorm.length === 0) {
      contactsNorm = this.contactsFromCallParticipants(calls);
    }

    return {
      deals: dealsNorm,
      accounts: accountsNorm,
      contacts: contactsNorm,
      calls,
    };
  }

  private contactsFromCallParticipants(calls: any[]) {
    const seen = new Set<string>();
    const out: any[] = [];
    for (const call of calls) {
      for (const p of call.participants || []) {
        const name = typeof p === 'string' ? p : p?.name || p?.email;
        if (!name || seen.has(name)) continue;
        seen.add(name);
        out.push({
          id: `participant-${seen.size}`,
          name,
          email: name.includes('@') ? name : '',
          role: 'Participant',
          account_id: call.account_id || '',
          accountId: call.account_id || '',
        });
      }
    }
    return out.slice(0, 30);
  }

  private mapBrief(row: any) {
    return {
      id: row.id,
      briefType: row.briefType ?? row.brief_type,
      entityId: row.entityId ?? row.entity_id,
      generatedSummary: row.generatedSummary ?? row.generated_summary,
      generationStatus: row.generationStatus ?? row.generation_status,
      sourceReferences: row.sourceReferences ?? row.source_references ?? [],
      llmModel: row.llmModel ?? row.llm_model,
      createdAt: row.createdAt ?? row.created_at,
    };
  }
}
