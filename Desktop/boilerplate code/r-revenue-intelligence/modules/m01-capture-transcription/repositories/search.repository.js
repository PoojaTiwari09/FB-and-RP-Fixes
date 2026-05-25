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
exports.ShareRepository = exports.SearchRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let SearchRepository = class SearchRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async searchAcrossOrg(tenantId, q, limit, offset) {
        return this.prisma.$queryRaw `
      SELECT
        u.id        AS "utteranceId",
        t."callId"  AS "callId",
        cr.title    AS "callTitle",
        cr."callDate",
        u.speaker,
        u.text      AS "excerpt",
        u."startMs"
      FROM utterances u
      JOIN transcripts t  ON t.id = u."transcriptId"
      JOIN call_records cr ON cr.id = t."callId"
      WHERE cr."tenantId" = ${tenantId}
        AND to_tsvector('english', u.text) @@ plainto_tsquery('english', ${q})
      ORDER BY cr."callDate" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    }
    async searchWithinCall(callId, tenantId, q) {
        return this.prisma.utterance.findMany({
            where: {
                transcript: { callId, tenantId },
                text: { contains: q, mode: 'insensitive' },
            },
            orderBy: { sequenceIndex: 'asc' },
        });
    }
};
exports.SearchRepository = SearchRepository;
exports.SearchRepository = SearchRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchRepository);
let ShareRepository = class ShareRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async share(callId, tenantId, sharedByUserId, dto) {
        return this.prisma.callShare.upsert({
            where: {
                callId_sharedWithId_sharedWithType: {
                    callId,
                    sharedWithId: dto.sharedWithId,
                    sharedWithType: dto.sharedWithType,
                },
            },
            update: {},
            create: { callId, tenantId, sharedByUserId, ...dto },
        });
    }
    async findByCallId(callId, tenantId) {
        return this.prisma.callShare.findMany({ where: { callId, tenantId } });
    }
};
exports.ShareRepository = ShareRepository;
exports.ShareRepository = ShareRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShareRepository);
