import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { M03AiSummariesGenaiRepository } from '../repositories/m03.repository';
import { m03DataStore } from './m03-data.store';

@Injectable()
export class BriefService {
  constructor(
    private readonly repo: M03AiSummariesGenaiRepository,
    @Optional() private config?: ConfigService,
  ) {}

  async getBrief(tenantId: string, briefType: string, entityId: string) {
    const brief = await this.repo.getBrief(tenantId, briefType, entityId);
    if (!brief) return { success: true, data: null };
    return {
      success: true,
      data: this.parseSummary(brief.generatedSummary),
      id: brief.id,
      generationStatus: brief.generationStatus,
    };
  }

  async generateBrief(tenantId: string, briefType: string, entityId: string) {
    const context = this.buildContext(briefType, entityId);
    const summary = this.mockGenerate(briefType, entityId, context);
    const summaryJson = JSON.stringify(summary);

    await this.repo.upsertBrief({
      tenantId,
      briefType,
      entityId,
      generatedSummary: summaryJson,
      generationStatus: 'completed',
      llmModel: this.getLlmModel(),
      sourceReferences: summary.citations || [],
    });

    return { success: true, data: summary, saved: true };
  }

  private buildContext(briefType: string, entityId: string) {
    const ws = m03DataStore.workspace;
    if (briefType === 'call') {
      return ws.calls.find((c) => c.id === entityId);
    }
    if (briefType === 'deal') {
      return ws.deals.find((d) => d.id === entityId);
    }
    if (briefType === 'account') {
      return ws.accounts.find((a) => a.id === entityId);
    }
    if (briefType === 'contact') {
      return ws.contacts.find((c) => c.id === entityId);
    }
    return null;
  }

  private mockGenerate(briefType: string, entityId: string, context: any) {
    const name = context?.name || context?.title || entityId;
    return {
      title: `${briefType.charAt(0).toUpperCase() + briefType.slice(1)} Brief — ${name}`,
      summary: `AI-generated ${briefType} brief for ${name}. Key themes: budget alignment, competitive pressure, and next-step scheduling.`,
      sections: [
        { heading: 'Executive Summary', body: `Overview of ${name} based on recent CRM activity.` },
        { heading: 'Risks', body: 'Timeline slip risk if procurement delays continue.' },
        { heading: 'Next Steps', body: 'Confirm executive sponsor and schedule technical validation.' },
      ],
      citations: [
        { citation_id: 'cit-1', source_type: 'call', source_id: 'call-1', excerpt: 'Budget and timeline discussed.' },
      ],
    };
  }

  private parseSummary(raw: string | null) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return { summary: raw };
    }
  }

  private getLlmModel(): string {
    const key = this.config?.get?.('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    return key ? 'gemini-server' : 'mock-llm';
  }
}
