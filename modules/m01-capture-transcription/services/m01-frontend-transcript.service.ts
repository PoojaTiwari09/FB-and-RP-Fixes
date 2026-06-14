import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CallService } from './call.service';
import {
  GenerateBriefSchema,
  PatchNextStepSchema,
  ShareInternalSchema,
  TranscriptListQuerySchema,
} from '../schemas/m01-frontend-transcript.schema';
import {
  mapAudio,
  mapTalkRatio,
  mapTopicsFromHighlights,
  mapUtterance,
} from './m01-frontend-transcript.mapper';
import { parseNextSteps, serializeNextSteps } from './m01-frontend-next-steps.util';
import {
  deriveCustomerNeeds,
  deriveRisks,
  deriveKeyDiscussionPointsFromUtterances,
  deriveStakeholdersFromCall,
} from './brief-field-analysis';
import { resolveDurationSeconds } from './call-duration.util';
import { randomUUID } from 'crypto';

type StoredBrief = {
  briefId: string;
  callId: string;
  briefTemplate: string;
  period: string;
  generatedAt: string;
  generatedFrom: string;
  status: 'processing' | 'completed';
  body?: Record<string, unknown>;
};

@Injectable()
export class M01FrontendTranscriptService {
  private readonly briefs = new Map<string, StoredBrief>();

  constructor(
    private readonly calls: CallService,
    private readonly prisma: PrismaService,
  ) { }

  private async loadCall(callId: string, tenantId: string) {
    const record = await this.calls.getCallDetail(callId, tenantId);
    if (!record) throw new NotFoundException('Call not found');
    return record;
  }

  async getTranscript(callId: string, tenantId: string, rawQuery: Record<string, string>) {
    const q = TranscriptListQuerySchema.parse(rawQuery);
    const record = await this.loadCall(callId, tenantId);
    let utterances = record.transcript?.utterances ?? [];

    if (q.search?.trim()) {
      const needle = q.search.trim().toLowerCase();
      utterances = utterances.filter((u: any) => u.text?.toLowerCase().includes(needle));
    }
    if (q.showLowConfidenceOnly) {
      utterances = utterances.filter((u: any) => u.isLowConfidence || (u.confidence ?? 1) < 0.8);
    }

    const totalCount = utterances.length;
    const offset = (q.page - 1) * q.size;
    const pageRows = utterances.slice(offset, offset + q.size);

    return {
      totalCount,
      transcript: pageRows.map(mapUtterance),
    };
  }

  async getSummary(callId: string, tenantId: string) {
    const record = await this.loadCall(callId, tenantId);
    const t = record.transcript;
    const rawDate = t?.updatedAt || t?.createdAt;
    const generatedAt = rawDate
      ? new Date(rawDate).toISOString()
      : new Date().toISOString();
    return {
      summary: t?.summary || '—',
      generatedAt,
    };
  }

  async getTalkRatio(callId: string, tenantId: string) {
    const record = await this.loadCall(callId, tenantId);
    return mapTalkRatio(record.transcript?.talkRatio);
  }

  async getAudio(callId: string, tenantId: string) {
    const record = await this.loadCall(callId, tenantId);
    return mapAudio(record);
  }

  async getTopics(callId: string, tenantId: string) {
    const record = await this.loadCall(callId, tenantId);
    return {
      topics: mapTopicsFromHighlights(record.transcript?.keyHighlights as any[]),
    };
  }

  async getNextSteps(callId: string, tenantId: string) {
    const record = await this.loadCall(callId, tenantId);
    const steps = parseNextSteps(record.transcript?.nextSteps);
    return { nextSteps: steps };
  }

  async patchNextStep(
    callId: string,
    stepId: string,
    tenantId: string,
    body: unknown,
  ) {
    const dto = PatchNextStepSchema.parse(body);
    const record = await this.loadCall(callId, tenantId);
    const steps = parseNextSteps(record.transcript?.nextSteps);
    const idx = steps.findIndex((s) => s.stepId === stepId);
    if (idx < 0) throw new NotFoundException('Next step not found');

    steps[idx].completed = dto.completed;
    await this.prisma.transcript.updateMany({
      where: { callId, tenantid: tenantId },
      data: { nextSteps: serializeNextSteps(steps) },
    });

    return {
      stepId,
      completed: dto.completed,
      updatedAt: new Date().toISOString(),
    };
  }

  // ── Briefs (in-memory store + transcript-derived content) ─────────────

  private buildBriefBody(record: any): Record<string, unknown> {
    const t = record.transcript;
    const highlights = Array.isArray(t?.keyHighlights) ? t.keyHighlights : [];
    const utterances = Array.isArray(t?.utterances) ? t.utterances : [];
    const summary =
      t?.summary?.trim() ||
      (utterances.length > 0
        ? utterances
          .slice(0, 3)
          .map((u: any) => u.text)
          .join(' ')
          .slice(0, 500)
        : 'No summary available yet.');
    const account = record.accountId || record.accountName || '';
    return {
      overview: { text: summary },
      keyDiscussionPoints: deriveKeyDiscussionPointsFromUtterances(utterances, highlights),
      customerNeeds: deriveCustomerNeeds(highlights, summary),
      risks: deriveRisks(highlights, summary),
      commitments: parseNextSteps(t?.nextSteps).map((s) => ({
        description: s.description,
        assigneeType: 'rep',
        dueDate: null,
      })),
      stakeholders: deriveStakeholdersFromCall(record.participants, utterances, account),
      activityContext: [],
    };
  }

  private analyzedBriefId(callId: string) {
    return `analyzed-${callId}`;
  }

  private autoBriefId(callId: string) {
    return `auto-${callId}`;
  }

  /** Persist AI-analyzed brief after pipeline runs (Calls List detail open). */
  async upsertAnalyzedBrief(callId: string, tenantId: string) {
    const record = await this.loadCall(callId, tenantId);
    const briefId = this.analyzedBriefId(callId);
    const body = this.buildBriefBody(record);
    const stored: StoredBrief = {
      briefId,
      callId,
      briefTemplate: 'AI Call Analysis',
      period: 'Full Call',
      generatedAt: new Date().toISOString(),
      generatedFrom: 'ai-analysis',
      status: 'completed',
      body,
    };
    this.briefs.set(briefId, stored);
    return { briefId };
  }

  private autoBriefGeneratedAt(record: any): string {
    const t = record.transcript;
    const raw = t?.updatedAt || t?.createdAt || new Date();
    return raw instanceof Date ? raw.toISOString() : new Date(raw).toISOString();
  }

  async listBriefs(callId: string, tenantId: string, rawQuery: Record<string, string>) {
    const record = await this.loadCall(callId, tenantId);
    const page = Math.max(1, parseInt(rawQuery.page || '1', 10));
    const size = Math.min(100, Math.max(1, parseInt(rawQuery.size || '20', 10)));
    const stored = [...this.briefs.values()].filter((b) => b.callId === callId);
    let items = stored.map((b) => ({
      briefId: b.briefId,
      briefTemplate: b.briefTemplate,
      period: b.period,
      generatedAt: b.generatedAt,
      generatedFrom: b.generatedFrom,
    }));
    if (items.length === 0 && record.transcript) {
      const analyzedId = this.analyzedBriefId(callId);
      const analyzed = this.briefs.get(analyzedId);
      if (analyzed) {
        items = [
          {
            briefId: analyzed.briefId,
            briefTemplate: analyzed.briefTemplate,
            period: analyzed.period,
            generatedAt: analyzed.generatedAt,
            generatedFrom: analyzed.generatedFrom,
          },
        ];
      } else {
        items = [
          {
            briefId: this.autoBriefId(callId),
            briefTemplate: 'Transcript Analysis',
            period: 'Full Call',
            generatedAt: this.autoBriefGeneratedAt(record),
            generatedFrom: 'transcript',
          },
        ];
      }
    }
    const slice = items.slice((page - 1) * size, page * size);
    return { briefs: slice };
  }

  async getBrief(callId: string, briefId: string, tenantId: string) {
    const record = await this.loadCall(callId, tenantId);
    const analyzed = this.briefs.get(this.analyzedBriefId(callId));
    if (analyzed && (briefId === analyzed.briefId || briefId === this.analyzedBriefId(callId))) {
      return {
        briefId: analyzed.briefId,
        briefTemplate: analyzed.briefTemplate,
        period: analyzed.period,
        generatedAt: analyzed.generatedAt,
        generatedFrom: analyzed.generatedFrom,
        ...(analyzed.body || this.buildBriefBody(record)),
      };
    }
    if (briefId === this.autoBriefId(callId)) {
      return {
        briefId,
        briefTemplate: 'Transcript Analysis',
        period: 'Full Call',
        generatedAt: this.autoBriefGeneratedAt(record),
        generatedFrom: 'transcript',
        ...this.buildBriefBody(record),
      };
    }
    const b = this.briefs.get(briefId);
    if (!b || b.callId !== callId) throw new NotFoundException('Brief not found');
    return {
      briefId: b.briefId,
      briefTemplate: b.briefTemplate,
      period: b.period,
      generatedAt: b.generatedAt,
      generatedFrom: b.generatedFrom,
      ...(b.body || this.buildBriefBody(record)),
    };
  }

  async generateBrief(callId: string, tenantId: string, body: unknown) {
    const dto = GenerateBriefSchema.parse(body);
    const record = await this.loadCall(callId, tenantId);
    const briefId = randomUUID();
    const bodyContent = this.buildBriefBody(record);
    const stored: StoredBrief = {
      briefId,
      callId,
      briefTemplate: dto.briefTemplate,
      period: dto.period,
      generatedAt: new Date().toISOString(),
      generatedFrom: 'ai',
      status: 'completed',
      body: bodyContent,
    };
    this.briefs.set(briefId, stored);
    return {
      briefId,
      briefTemplate: dto.briefTemplate,
      period: dto.period,
      generatedAt: stored.generatedAt,
      status: 'completed' as const,
    };
  }

  getBriefTemplates() {
    return {
      templates: [
        { templateId: 'standard', templateName: 'Standard Call Brief' },
        { templateId: 'executive', templateName: 'Executive Summary' },
        { templateId: 'follow_up', templateName: 'Follow-up Brief' },
      ],
    };
  }

  getBriefPeriods() {
    return {
      periods: [
        { periodId: 'this_call', periodLabel: 'This call only' },
        { periodId: 'last_7_days', periodLabel: 'Last 7 days' },
        { periodId: 'last_30_days', periodLabel: 'Last 30 days' },
      ],
    };
  }

  shareLink(_callId: string, briefId: string) {
    if (!this.briefs.has(briefId)) throw new NotFoundException('Brief not found');
    return {
      shareableLink: `https://app.example.com/shared/briefs/${briefId}`,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
  }

  shareInternal(_callId: string, briefId: string, body: unknown) {
    ShareInternalSchema.parse(body);
    if (!this.briefs.has(briefId)) throw new NotFoundException('Brief not found');
    const dto = ShareInternalSchema.parse(body);
    return {
      message: 'Brief shared successfully',
      sentTo: dto.recipientEmails,
    };
  }

  exportPdf(_callId: string, briefId: string) {
    if (!this.briefs.has(briefId)) throw new NotFoundException('Brief not found');
    return {
      downloadUrl: `https://app.example.com/exports/briefs/${briefId}.pdf`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
  }

  formattedSummary(callId: string, briefId: string, tenantId: string) {
    return this.getBrief(callId, briefId, tenantId);
  }
}
