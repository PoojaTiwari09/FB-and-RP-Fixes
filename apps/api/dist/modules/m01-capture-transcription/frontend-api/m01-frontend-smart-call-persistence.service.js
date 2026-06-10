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
exports.M01FrontendSmartCallPersistenceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const TENANT_ID = '00000000-0000-0000-0000-000000000001';
let M01FrontendSmartCallPersistenceService = class M01FrontendSmartCallPersistenceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async startPersistedSession(body) {
        const row = await this.prisma.liveCallSession.upsert({
            where: { id: body.externalSessionId },
            create: {
                id: body.externalSessionId,
                tenantId: TENANT_ID,
                sessionName: body.sessionName ?? 'Live Call',
                clientName: body.clientName ?? 'Client',
                contactId: body.contactId,
                dealCompany: body.dealCompany,
                status: 'active',
            },
            update: {
                status: 'active',
                sessionName: body.sessionName,
                clientName: body.clientName,
                dealCompany: body.dealCompany,
            },
        });
        return { dbSessionId: row.id };
    }
    async insertChunk(sessionId, chunk) {
        const session = await this.prisma.liveCallSession.findUnique({ where: { id: sessionId } });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        await this.prisma.liveCallSummary.create({
            data: {
                sessionId,
                chunkIndex: chunk.chunk_index,
                timeStart: chunk.time_start,
                timeEnd: chunk.time_end,
                summaryText: chunk.summary_text,
                keyTopics: chunk.key_topics ?? [],
                sentiment: chunk.sentiment ?? 'neutral',
                competitorsMentioned: chunk.competitors_mentioned ?? [],
                rawTranscript: chunk.raw_transcript ?? '',
            },
        });
        return { ok: true };
    }
    async listChunks(sessionId) {
        const session = await this.prisma.liveCallSession.findUnique({
            where: { id: sessionId },
            include: {
                summaries: { orderBy: { chunkIndex: 'asc' } },
            },
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        return session.summaries.map((s) => ({
            chunk_index: s.chunkIndex,
            time_start: s.timeStart,
            time_end: s.timeEnd,
            summary_text: s.summaryText,
            key_topics: s.keyTopics,
            sentiment: s.sentiment,
            competitors_mentioned: s.competitorsMentioned,
            raw_transcript: s.rawTranscript ?? '',
        }));
    }
    async completeSession(sessionId, body) {
        const session = await this.prisma.liveCallSession.findUnique({ where: { id: sessionId } });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        await this.prisma.liveCallSession.update({
            where: { id: sessionId },
            data: {
                status: 'completed',
                endedAt: new Date(),
                finalSummary: body.finalSummary,
                totalSegments: body.totalSegments ?? session.totalSegments,
                salesRepName: body.salesRepName ?? session.salesRepName,
                clientName: body.clientName ?? session.clientName,
                transcript: body.transcript ?? session.transcript,
            },
        });
        return { ok: true };
    }
};
exports.M01FrontendSmartCallPersistenceService = M01FrontendSmartCallPersistenceService;
exports.M01FrontendSmartCallPersistenceService = M01FrontendSmartCallPersistenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], M01FrontendSmartCallPersistenceService);
//# sourceMappingURL=m01-frontend-smart-call-persistence.service.js.map