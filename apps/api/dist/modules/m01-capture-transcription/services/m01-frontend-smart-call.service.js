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
exports.M01FrontendSmartCallService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const m01_frontend_smart_call_persistence_service_1 = require("./m01-frontend-smart-call-persistence.service");
const prisma_service_1 = require("../database/prisma.service");
let M01FrontendSmartCallService = class M01FrontendSmartCallService {
    persistence;
    prisma;
    sessions = new Map();
    constructor(persistence, prisma) {
        this.persistence = persistence;
        this.prisma = prisma;
    }
    async listContacts(query) {
        const q = (query.q || '').toLowerCase();
        const limit = Math.min(50, parseInt(query.limit || '20', 10));
        const offset = parseInt(query.offset || '0', 10);
        const where = {};
        if (q) {
            where.OR = [
                { contactName: { contains: q, mode: 'insensitive' } },
                { company: { contains: q, mode: 'insensitive' } },
            ];
        }
        const total = await this.prisma.engageContact.count({ where });
        const list = await this.prisma.engageContact.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { contactName: 'asc' },
        });
        return {
            contacts: list.map((c) => ({
                contactId: c.contactId,
                contactName: c.contactName,
                jobTitle: c.jobTitle || '',
                company: c.company || '',
                avatarUrl: null,
                lastInteractionLabel: 'Seeded Contact',
                phone: c.phone || '',
            })),
            total,
            hasMore: offset + list.length < total,
        };
    }
    async getPreCallBrief(contactId) {
        const c = await this.prisma.engageContact.findFirst({
            where: { contactId },
        });
        if (!c)
            throw new common_1.NotFoundException('Contact not found');
        const dealInfo = c.dealInfo;
        const accountInfo = c.accountInfo;
        return {
            contactId,
            contactName: c.contactName,
            contactCompany: c.company || '',
            supportedIntegrations: ['ZOOM', 'MEET', 'TEAMS'],
            preCallBriefing: c.notes ||
                "Sarah has shown high pricing interest. Last call focused on ROI concerns. Lead with the TechCorp case study — similar use case, 3x ROI in 6 months. She's the decision maker but needs IT sign-off.",
            keyObjections: ['Budget', 'Integration complexity'],
            dealStage: dealInfo?.dealStage || 'Negotiation',
            arrValue: accountInfo?.arrValue || '$240K ARR',
        };
    }
    async startSession(body) {
        const c = await this.prisma.engageContact.findFirst({
            where: { contactId: body.contactId },
        });
        if (!c)
            throw new common_1.NotFoundException('Contact not found');
        const sessionId = (0, crypto_1.randomUUID)();
        const port = process.env.UNIFIED_API_PORT ?? process.env.M01_API_PORT ?? '3001';
        this.sessions.set(sessionId, {
            sessionId,
            contactId: body.contactId,
            contactName: c.contactName,
            contactCompany: c.company,
            taskTitle: 'Follow up on Q2 contract renewal',
            status: 'LIVE',
            startedAt: new Date().toISOString(),
            transcript: [],
        });
        try {
            await this.persistence.startPersistedSession({
                externalSessionId: sessionId,
                contactId: body.contactId,
                dealCompany: c.company || undefined,
                clientName: c.contactName,
                sessionName: `Live Call - ${c.contactName}`,
            });
        }
        catch (e) {
            console.warn('[SmartCall] Postgres session create skipped:', e.message);
        }
        return {
            sessionId,
            contactId: body.contactId,
            contactName: c.contactName,
            contactCompany: c.company || '',
            taskTitle: 'Follow up on Q2 contract renewal',
            status: 'LIVE',
            wsEndpoint: `ws://localhost:${port}/api/smart-call/ws/${sessionId}`,
            message: 'Live Assist session started',
        };
    }
    endSession(sessionId, body) {
        const s = this.sessions.get(sessionId);
        if (!s)
            throw new common_1.NotFoundException('Session not found');
        s.status = 'ENDED';
        s.endedAt = body?.endedAt || new Date().toISOString();
        return {
            sessionId,
            status: 'ENDED',
            callSummaryId: `summary_${sessionId}`,
            message: 'Session ended. Generating call summary...',
        };
    }
    async persistSession(sessionId, body) {
        if (body.action === 'start') {
            return this.persistence.startPersistedSession({
                externalSessionId: sessionId,
                contactId: body.contactId,
                dealCompany: body.dealCompany,
                clientName: body.clientName,
                sessionName: body.sessionName,
            });
        }
        if (body.action === 'complete') {
            return this.persistence.completeSession(sessionId, {
                finalSummary: body.finalSummary,
                totalSegments: body.totalSegments,
                salesRepName: body.salesRepName,
                clientName: body.clientName,
                transcript: body.transcript,
            });
        }
        return { ok: false };
    }
    async persistChunk(sessionId, body) {
        return this.persistence.insertChunk(sessionId, body);
    }
    async listSummaries(sessionId) {
        try {
            return await this.persistence.listChunks(sessionId);
        }
        catch (e) {
            if (e.status === 404)
                return [];
            throw e;
        }
    }
    getSummary(sessionId) {
        const s = this.sessions.get(sessionId);
        if (!s)
            throw new common_1.NotFoundException('Session not found');
        return {
            sessionId,
            callSummaryId: `summary_${sessionId}`,
            duration: '3:46',
            callType: s.taskTitle || 'Follow up on Q2 contract renewal',
            signalLabel: 'Positive Signal',
            signalType: 'POSITIVE',
            overallScore: 78,
            dimensionScores: [
                { dimension: 'DISCOVERY', score: 82, maxScore: 100 },
                { dimension: 'OBJECTION_HANDLING', score: 75, maxScore: 100 },
                { dimension: 'CLOSING', score: 77, maxScore: 100 },
            ],
            aiSummary: 'Strong opening with good rapport building. Successfully navigated price sensitivity by focusing on ROI and value proposition.',
            keyMoments: [
                {
                    timestamp: '2:25',
                    type: 'OBJECTION',
                    color: 'yellow',
                    description: 'Price concern raised - handled well with ROI breakdown',
                },
                {
                    timestamp: '3:50',
                    type: 'INTEREST_SIGNAL',
                    color: 'green',
                    description: 'Strong buying signal detected when discussing integration capabilities',
                },
            ],
            missedOpportunities: {
                title: 'Missed Opportunities',
                subLabel: 'Key questions you could have asked:',
                questions: [
                    'When is the decision being made?',
                    'Who else is involved in the decision-making process?',
                ],
            },
            suggestedImprovements: [
                'Ask more open-ended questions early to uncover deeper pain points',
                'Confirm budget authority before diving into pricing details',
            ],
            conversationTimeline: [
                { startTime: '0:00', endTime: '0:30', topic: 'Introduction and rapport building' },
                { startTime: '0:30', endTime: '1:00', topic: 'Discussed current challenges' },
            ],
            transcriptUrl: `https://app.relanto.ai/transcripts/${sessionId}`,
        };
    }
    async getTranscript(sessionId) {
        const s = this.sessions.get(sessionId);
        const dbSession = await this.prisma.liveCallSession.findUnique({
            where: { id: sessionId },
        });
        const contactName = s?.contactName || dbSession?.clientName || 'Contact';
        const transcript = s?.transcript;
        const dbTranscript = dbSession?.transcript;
        const mappedDbTranscript = Array.isArray(dbTranscript)
            ? dbTranscript.map((t) => ({
                timestamp: t.timestamp || '0:00',
                speaker: t.speaker || 'REP',
                text: t.text || '',
            }))
            : undefined;
        return {
            sessionId,
            contactName,
            duration: '3:46',
            segments: transcript || mappedDbTranscript || [
                {
                    timestamp: '0:00',
                    speaker: 'REP',
                    text: 'Hi Sarah, thanks for taking the time to connect today.',
                },
                {
                    timestamp: '0:08',
                    speaker: 'CUSTOMER',
                    text: "I'm doing well, thanks. I wanted to discuss the renewal terms.",
                },
            ],
        };
    }
};
exports.M01FrontendSmartCallService = M01FrontendSmartCallService;
exports.M01FrontendSmartCallService = M01FrontendSmartCallService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [m01_frontend_smart_call_persistence_service_1.M01FrontendSmartCallPersistenceService,
        prisma_service_1.PrismaService])
], M01FrontendSmartCallService);
//# sourceMappingURL=m01-frontend-smart-call.service.js.map