"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M02FrontendSearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const m02_service_1 = require("../services/m02.service");
const m02_frontend_search_schema_1 = require("../schemas/m02-frontend-search.schema");
const m02_frontend_search_mapper_1 = require("../schemas/m02-frontend-search.mapper");
const crypto_1 = require("crypto");
let M02FrontendSearchService = class M02FrontendSearchService {
    m02;
    prisma;
    exportJobs = new Map();
    streams = new Map();
    constructor(m02, prisma) {
        this.m02 = m02;
        this.prisma = prisma;
    }
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
    async getTeams(tenantId) {
        if (this.prisma.team) {
            try {
                const teams = await this.prisma.team.findMany({
                    where: { tenantid: tenantId },
                    select: { id: true, name: true }
                });
                if (teams && teams.length > 0) {
                    return { teams };
                }
            }
            catch (e) {
            }
        }
        return {
            teams: [
                { id: 'team_west', name: 'West Region' },
                { id: 'team_east', name: 'East Region' },
                { id: 'team_central', name: 'Central Region' },
            ]
        };
    }
    async searchCalls(tenantId, rawQuery) {
        const q = m02_frontend_search_schema_1.M02SearchCallsQuerySchema.parse(rawQuery);
        const queryText = [q.wordsOrPhrases, q.callTitle, q.participants].filter(Boolean).join(' ');
        const hits = await this.m02.searchConversations({
            query: queryText || undefined,
            agent: q.rep && q.rep !== 'all' ? q.rep : undefined,
            topic: q.topics && q.topics !== 'all' ? q.topics : undefined,
            page: q.page,
            limit: q.size,
        }, tenantId);
        let rows = hits;
        if (q.scorecardResult && q.scorecardResult !== 'all') {
            rows = rows.filter((h) => {
                const s = Math.round((h.overallScore ?? 0) * (h.overallScore && h.overallScore <= 1 ? 100 : 1));
                if (q.scorecardResult === 'excellent')
                    return s >= 90;
                if (q.scorecardResult === 'good')
                    return s >= 80 && s < 90;
                if (q.scorecardResult === 'average')
                    return s >= 70 && s < 80;
                if (q.scorecardResult === 'needs_improvement')
                    return s < 70;
                return true;
            });
        }
        const results = rows.map((h) => (0, m02_frontend_search_mapper_1.mapSearchResultRow)({
            id: h.entityId,
            tenantId,
            title: h.title || 'Untitled',
            channel: 'call',
            customerName: h.customerName || h.snippet?.slice(0, 40) || '—',
            agentName: h.agentName || 'Rep',
            date: h.date || new Date().toISOString(),
            duration: h.duration || '0m',
            sentiment: 'Neutral',
            sentimentScore: 0,
            overallScore: h.overallScore ?? 75,
            topics: h.topics || [],
            summary: h.snippet || '',
            transcript: '',
            diarizedTranscript: [],
            scorecard: {},
            coachingSuggestion: '', keywords: [], competitorsDetected: [],
        }));
        const emailsCount = 0;
        const callsCount = results.length;
        const count = results.length || 10;
        const gran = q.chartGranularity || 'weeks';
        const chartBlock = {
            granularity: gran,
            data: (0, m02_frontend_search_mapper_1.buildChartData)(gran, count),
            days: (0, m02_frontend_search_mapper_1.buildChartData)('days', count),
            weeks: (0, m02_frontend_search_mapper_1.buildChartData)('weeks', count),
            months: (0, m02_frontend_search_mapper_1.buildChartData)('months', count),
            quarters: (0, m02_frontend_search_mapper_1.buildChartData)('quarters', count),
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
    async getCallDrawer(tenantId, callId) {
        const record = await this.prisma.callRecord.findFirst({
            where: { id: callId, tenantid: tenantId },
            include: {
                transcript: { include: { utterances: { orderBy: { sequenceIndex: 'asc' } } } },
            },
        });
        if (!record)
            throw new common_1.NotFoundException('Call not found');
        const t = record.transcript;
        const highlights = Array.isArray(t?.keyHighlights) ? t.keyHighlights : [];
        const score = 85;
        const formatTs = (ms) => {
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
            account: record.accountId || '—',
            type: record.callSource || 'manual',
            status: record.callSource || 'manual',
            score,
            scoreLabel: (0, m02_frontend_search_mapper_1.scoreLabel)(score),
            recordingUrl: record.audioUrl || '',
            nextSteps: (t?.nextSteps ?? []).map((s) => {
                try {
                    const p = JSON.parse(s);
                    return p.description || s;
                }
                catch {
                    return s;
                }
            }),
            keyHighlights: highlights.map((h) => ({
                label: h.label || 'Highlight',
                text: h.text || h.description || '',
            })),
            conversationHighlights: highlights.slice(0, 5).map((h, i) => ({
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
    async aiAsk(tenantId, body) {
        const dto = m02_frontend_search_schema_1.M02AiAskBodySchema.parse(body);
        const record = await this.prisma.callRecord.findFirst({
            where: { id: dto.callId, tenantid: tenantId },
            include: { transcript: true },
        });
        if (!record)
            throw new common_1.NotFoundException('Call not found');
        const summary = record.transcript?.summary || 'No summary available.';
        const answer = `Based on the call "${record.title}": ${summary} (Question: ${dto.question})`;
        return {
            callId: dto.callId,
            question: dto.question,
            answer,
            suggestedQuestions: [
                'What objections came up most?',
                'Where did the rep struggle?',
                'What were the key customer concerns?',
            ],
        };
    }
    async startExport(_tenantId, _body) {
        const jobId = `export_${(0, crypto_1.randomUUID)().slice(0, 8)}`;
        this.exportJobs.set(jobId, { status: 'queued' });
        return { jobId, status: 'queued' };
    }
    async createStream(_tenantId, body) {
        const streamId = `stream_${(0, crypto_1.randomUUID)().slice(0, 8)}`;
        this.streams.set(streamId, { ...body, status: 'active' });
        return { streamId, name: body.name, status: 'active' };
    }
};
exports.M02FrontendSearchService = M02FrontendSearchService;
exports.M02FrontendSearchService = M02FrontendSearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [m02_service_1.M02ConversationIntelligenceService,
        prisma_service_1.PrismaService])
], M02FrontendSearchService);
//# sourceMappingURL=m02-frontend-search.service.js.map