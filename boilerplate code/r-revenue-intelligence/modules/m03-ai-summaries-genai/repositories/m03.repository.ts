import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { m03DataStore, M03_DEV_ORG } from '../services/m03-data.store';
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
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });
    }
    return m03DataStore.listBriefs(tenantId);
  }

  async create(data: { tenantId: string; briefType?: string; entityId?: string; generatedSummary?: string }) {
    const row = {
      id: randomUUID(),
      tenantId: data.tenantId,
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
            tenantId_briefType_entityId: {
              tenantId: row.tenantId,
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
    const delegate = this.aiBriefDelegate();
    if (delegate?.findUnique) {
      try {
        const row = await delegate.findUnique({
          where: {
            tenantId_briefType_entityId: { tenantId, briefType, entityId },
          },
        });
        if (row) return this.mapBrief(row);
      } catch {
        /* fall through to memory */
      }
    }

    const mem = m03DataStore.listBriefs(tenantId, entityId).find(
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
        where: { tenantId },
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
      tenantId: params.tenantId,
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

  getWorkspace(tenantId: string) {
    if (tenantId !== M03_DEV_ORG && tenantId !== '00000000-0000-0000-0000-000000000001') {
      return { deals: [], accounts: [], contacts: [], calls: [] };
    }
    return m03DataStore.workspace;
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
