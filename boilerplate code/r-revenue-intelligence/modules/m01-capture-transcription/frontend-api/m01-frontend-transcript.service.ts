import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CallService } from '../services/call.service';
import {
  GenerateBriefSchema,
  PatchNextStepSchema,
  ShareInternalSchema,
  TranscriptListQuerySchema,
} from './m01-frontend-transcript.schema';
import {
  mapAudio,
  mapTalkRatio,
  mapTopicsFromHighlights,
  mapUtterance,
} from './m01-frontend-transcript.mapper';
import { parseNextSteps, serializeNextSteps } from './m01-frontend-next-steps.util';
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
  ) {}

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
    return {
      summary: t?.summary || '—',
      generatedAt: (t?.updatedAt || t?.createdAt || new Date()).toISOString?.()
        ? new Date(t.updatedAt || t.createdAt).toISOString()
        : new Date().toISOString(),
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
      where: { callId, tenantId },
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
    return {
      overview: { text: t?.summary || 'No summary available yet.' },
      keyDiscussionPoints: highlights.map((h: any) => ({
        timestamp: h.timestampMs != null ? `${Math.floor(h.timestampMs / 1000)}s` : '—',
        description: h.text || h.description || '',
      })),
      customerNeeds: [],
      risks: [],
      commitments: parseNextSteps(t?.nextSteps).map((s) => ({
        description: s.description,
        assigneeType: 'rep',
        dueDate: null,
      })),
      stakeholders: (record.participants ?? []).map((name: string) => ({
        name,
        title: '',
        company: record.accountId || '',
        avatarInitials: name.slice(0, 2).toUpperCase(),
      })),
      activityContext: [],
    };
  }

  async listBriefs(callId: string, tenantId: string, rawQuery: Record<string, string>) {
    await this.loadCall(callId, tenantId);
    const page = Math.max(1, parseInt(rawQuery.page || '1', 10));
    const size = Math.min(100, Math.max(1, parseInt(rawQuery.size || '20', 10)));
    const all = [...this.briefs.values()].filter((b) => b.callId === callId);
    const slice = all.slice((page - 1) * size, page * size);
    return {
      briefs: slice.map((b) => ({
        briefId: b.briefId,
        briefTemplate: b.briefTemplate,
        period: b.period,
        generatedAt: b.generatedAt,
        generatedFrom: b.generatedFrom,
      })),
    };
  }

  async getBrief(callId: string, briefId: string, tenantId: string) {
    const record = await this.loadCall(callId, tenantId);
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
