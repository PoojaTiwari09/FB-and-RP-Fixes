import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { M02ConversationIntelligenceService } from '../services/m02.service';
import { M02SearchCallsQuerySchema, M02AiAskBodySchema } from '../schemas/m02-frontend-search.schema';
import { buildChartData, mapSearchResultRow, scoreLabel } from '../schemas/m02-frontend-search.mapper';
import { randomUUID } from 'crypto';

@Injectable()
export class M02FrontendSearchService {
  private readonly exportJobs = new Map<string, { status: string }>();
  private readonly streams = new Map<string, any>();

  constructor(
    private readonly m02: M02ConversationIntelligenceService,
    private readonly prisma: PrismaService,
  ) {}

  getFilterOptions() {
    return {
      teams: [
        { value: 'west', label: 'West' },
        { value: 'east', label: 'East' },
        { value: 'central', label: 'Central' },
        { value: 'all', label: 'All Teams' },
      ],
      reps: [{ value: 'all', label: 'All' }],
      stages: [
        { value: 'all', label: 'All' },
        { value: 'discovery', label: 'Discovery' },
        { value: 'negotiation', label: 'Negotiation' },
      ],
      topics: [{ value: 'all', label: 'All' }],
      trackers: [{ value: 'all', label: 'All Trackers' }],
      scorecardResults: [
        { value: 'all', label: 'All' },
        { value: 'excellent', label: 'Excellent (90-100)' },
        { value: 'good', label: 'Good (80-89)' },
      ],
      callTypes: [
        { value: 'all', label: 'All' },
        { value: 'internal', label: 'Internal calls' },
        { value: 'customer', label: 'Calls with customers' },
      ],
      phraseMatchTypes: [
        { value: 'contains', label: 'Results contain the term' },
        { value: 'mentioned_by_any', label: 'Mentioned by any party' },
        { value: 'said_anytime', label: 'Said anytime in call' },
      ],
    };
  }

  async getTeams(tenantId: string) {
    if ((this.prisma as any).team) {
      try {
        const teams = await (this.prisma as any).team.findMany({
          where: { tenantid: tenantId },
          select: { id: true, name: true }
        });
        if (teams && teams.length > 0) {
          return { teams };
        }
      } catch (e) {
        // Fallback
      }
    }
    return {
      teams: [
        { id: 'team_west', name: 'West Region' },
        { id: 'team_east', name: 'East Region' },
        { id: 'team_central', name: 'Central Region' },
      ],
    };
  }

  async searchCalls(tenantId: string, rawQuery: Record<string, string>) {
    const q = M02SearchCallsQuerySchema.parse(rawQuery);
    const queryText = [q.wordsOrPhrases, q.callTitle, q.participants].filter(Boolean).join(' ');

    const hits = await this.m02.searchConversations(
      {
        query: queryText || undefined,
        agent: q.rep && q.rep !== 'all' ? q.rep : undefined,
        topic: q.topics && q.topics !== 'all' ? q.topics : undefined,
        page: q.page,
        limit: q.size,
      },
      tenantId,
    );

    let rows = hits;
    if (q.scorecardResult && q.scorecardResult !== 'all') {
      rows = rows.filter((h) => {
        const s = Math.round((h.overallScore ?? 0) * (h.overallScore && h.overallScore <= 1 ? 100 : 1));
        if (q.scorecardResult === 'excellent') return s >= 90;
        if (q.scorecardResult === 'good') return s >= 80 && s < 90;
        if (q.scorecardResult === 'average') return s >= 70 && s < 80;
        if (q.scorecardResult === 'needs_improvement') return s < 70;
        return true;
      });
    }

    const results = rows.map((h) =>
      mapSearchResultRow({
        id: h.entityId,
        tenantId,
        title: h.title || 'Untitled',
        channel: 'call',
        customerName: h.customerName || h.snippet?.slice(0, 40) || '',
        agentName: h.agentName || '',
        date: h.date || '',
        duration: h.duration || '0m',
        sentiment: h.sentiment || 'Neutral',
        sentimentScore: typeof (h as any).sentimentScore === 'number' ? (h as any).sentimentScore : 0,
        overallScore: h.overallScore || 0,
        topics: h.topics || [],
        summary: h.snippet || '',
        transcript: '',
        diarizedTranscript: [],
        scorecard: {} as any,
        coachingSuggestion: '', keywords: [], competitorsDetected: [],
      }),
    );

    let emailsCount = 0;
    try {
      if ((this.prisma as any).engageActivity) {
        emailsCount = await (this.prisma as any).engageActivity.count({
          where: { tenantid: tenantId, channelType: { contains: 'email', mode: 'insensitive' } }
        });
      }
    } catch {
      // Fallback
    }
    if (emailsCount === 0) {
      emailsCount = rows.filter((r: any) => r.channel === 'email').length;
    }
    const callsCount = results.length;
    const count = results.length || 10;
    const gran = q.chartGranularity || 'weeks';

    const chartBlock = {
      granularity: gran,
      data: buildChartData(gran, count),
      days: buildChartData('days', count),
      weeks: buildChartData('weeks', count),
      months: buildChartData('months', count),
      quarters: buildChartData('quarters', count),
    };

    return {
      meta: {
        total: results.length,
        page: q.page,
        size: q.size,
        totalPages: Math.max(1, Math.ceil(results.length / q.size)),
        callsCount: q.tab === 'emails' ? 0 : callsCount,
        emailsCount: q.tab === 'calls' ? emailsCount : emailsCount,
      },
      chart: chartBlock,
      emailChart: chartBlock,
      emailResults: [],
      results,
    };
  }

  async getCallDrawer(tenantId: string, callId: string) {
    const record = await this.prisma.callRecord.findFirst({
      where: { id: callId, tenantid: tenantId },
      include: {
        transcript: { include: { utterances: { orderBy: { sequenceIndex: 'asc' } } } },
      },
    });
    if (!record) throw new NotFoundException('Call not found');

    const t = record.transcript;
    const highlights = Array.isArray(t?.keyHighlights) ? (t.keyHighlights as any[]) : [];
    let score = (record as any).overallScore ?? 85;
    try {
      if ((this.prisma as any).callReview) {
        const review = await (this.prisma as any).callReview.findFirst({
          where: { callTitle: record.title, tenantid: tenantId },
          select: { overallScore: true },
        });
        if (review && review.overallScore !== null) {
          score = review.overallScore;
        }
      }
    } catch {
      // Fallback
    }

    const formatTs = (ms: number) => {
      const sec = Math.floor(ms / 1000);
      return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
    };

    return {
      id: record.id,
      title: record.title,
      date: record.callDate.toISOString(),
      durationSeconds: record.durationSeconds,
      durationLabel: `${Math.floor(record.durationSeconds / 60)}m ${record.durationSeconds % 60}s`,
      participants: (record.participants ?? []).map((name) => ({
        name: name.replace(/\s*\(.*\)/, ''),
        role: name.includes('Rep') ? 'Rep' : 'Customer',
      })),
      account: record.accountId || '',
      type: record.callSource || 'manual',
      status: record.callSource || 'manual',
      score,
      scoreLabel: scoreLabel(score),
      recordingUrl: record.audioUrl || '',
      nextSteps: (t?.nextSteps ?? []).map((s: string) => {
        try {
          const p = JSON.parse(s);
          return p.description || s;
        } catch {
          return s;
        }
      }),
      keyHighlights: highlights.map((h: any) => ({
        label: h.label || 'Highlight',
        text: h.text || h.description || '',
      })),
      conversationHighlights: highlights.slice(0, 5).map((h: any, i: number) => ({
        timestampSeconds: h.timestampMs ? Math.floor(h.timestampMs / 1000) : i * 60,
        timestampLabel: h.timestampMs ? formatTs(h.timestampMs) : '00:00',
        tag: h.label || 'Moment',
        tagColor: 'blue',
        quote: (h.text || '').slice(0, 120),
      })),
      timelineLabel: '3 months',
      transcript: (t?.utterances ?? []).map((u) => ({
        timestampSeconds: Math.floor((u.startMs ?? 0) / 1000),
        timestampLabel: formatTs(u.startMs ?? 0),
        speaker: u.speaker,
        role: u.speaker.toLowerCase().includes('rep') ? 'Rep' : 'Customer',
        text: u.text,
      })),
    };
  }

  async aiAsk(tenantId: string, body: { callId?: string; question?: string }) {
    const dto = M02AiAskBodySchema.parse(body);
    const question = dto.question || 'How can I improve this call?';

    // If no callId provided, return a general AI response
    if (!dto.callId) {
      return {
        callId: null,
        question,
        answer: `AI Analysis: ${question} — Please provide a callId to get call-specific insights.`,
        suggestedQuestions: [
          'What were the main objections raised?',
          'What topics were discussed most?',
          'What are the action items from this call?',
        ],
      };
    }

    const record = await this.prisma.callRecord.findFirst({
      where: { id: dto.callId, tenantid: tenantId },
      include: { transcript: true },
    });
    if (!record) {
      return {
        callId: dto.callId,
        question,
        answer: `No call record found for ID ${dto.callId}.`,
        suggestedQuestions: [],
      };
    }

    const summary = record.transcript?.summary || 'No summary available.';
    const answer = `Based on the call "${record.title}": ${summary} (Question: ${question})`;

    return {
      callId: dto.callId,
      question,
      answer,
      suggestedQuestions: [],
    };
  }

  async startExport(_tenantId: string, _body: unknown) {
    const jobId = `export_${randomUUID().slice(0, 8)}`;
    this.exportJobs.set(jobId, { status: 'queued' });
    return { jobId, status: 'queued' };
  }

  async createStream(_tenantId: string, body: { name?: string; filters?: Record<string, unknown> }) {
    const streamId = `stream_${randomUUID().slice(0, 8)}`;
    const name = body.name || 'Unnamed Stream';
    this.streams.set(streamId, { ...body, name, status: 'active' });
    return { streamId, name, status: 'active' };
  }
}
