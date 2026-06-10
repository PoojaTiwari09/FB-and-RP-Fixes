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
exports.ShareRepository = exports.SearchRepository = exports.ExtendedSearchQuerySchema = void 0;
const zod_1 = require("zod");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const database_1 = require("@rri/database");
exports.ExtendedSearchQuerySchema = zod_1.z.object({
    q: zod_1.z.string().min(1).max(200),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
    dateFrom: zod_1.z.coerce.date().optional(),
    dateTo: zod_1.z.coerce.date().optional(),
    ownerId: zod_1.z.string().optional(),
    callType: zod_1.z.enum(['inbound', 'outbound', 'meeting']).optional(),
});
let SearchRepository = class SearchRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async searchAcrossOrg(tenantId, dto) {
        const { q, limit, offset, dateFrom, dateTo, ownerId, callType, } = dto;
        const dateClauses = [];
        const params = [tenantId, q, limit, offset];
        let paramIdx = 5;
        if (dateFrom) {
            dateClauses.push(`AND cr."callDate" >= $${paramIdx}`);
            params.push(dateFrom);
            paramIdx++;
        }
        if (dateTo) {
            dateClauses.push(`AND cr."callDate" <= $${paramIdx}`);
            params.push(dateTo);
            paramIdx++;
        }
        if (ownerId) {
            dateClauses.push(`AND cr."callOwner" = $${paramIdx}`);
            params.push(ownerId);
            paramIdx++;
        }
        if (callType) {
            dateClauses.push(`AND cr."callType" = $${paramIdx}`);
            params.push(callType);
            paramIdx++;
        }
        const filterSQL = dateClauses.join('\n        ');
        const filterSQLPart = filterSQL ? database_1.Prisma.sql `AND ${database_1.Prisma.raw(filterSQL.replace(/AND /g, ''))}` : database_1.Prisma.empty;
        const results = await this.prisma.$queryRaw `
      SELECT
        u.id              AS "utteranceId",
        t."callId"        AS "callId",
        cr.title          AS "callTitle",
        cr."callDate"     AS "callDate",
        u.speaker         AS "speaker",
        u.text            AS "excerpt",
        u."startMs"       AS "startMs"
      FROM utterances u
      JOIN transcripts   t  ON t.id = u."transcriptId"
      JOIN call_records  cr ON cr.id = t."callId"
      WHERE cr."tenantid" = ${params[0]}::uuid
        AND to_tsvector('english', u.text) @@ plainto_tsquery('english', ${params[1]})
        ${filterSQLPart}
      ORDER BY cr."callDate" DESC
      LIMIT ${params[params.length - 2]} OFFSET ${params[params.length - 1]}
    `;
        const countResult = await this.prisma.$queryRaw `
      SELECT COUNT(*) AS count
      FROM utterances u
      JOIN transcripts   t  ON t.id = u."transcriptId"
      JOIN call_records  cr ON cr.id = t."callId"
      WHERE cr."tenantid" = ${params[0]}::uuid
        AND to_tsvector('english', u.text) @@ plainto_tsquery('english', ${params[1]})
        ${filterSQLPart}
    `;
        const total = Number(countResult[0]?.count ?? 0);
        return {
            results,
            total,
            matchCount: results.length,
        };
    }
    async searchWithinCall(callId, tenantId, q) {
        const utterances = await this.prisma.utterance.findMany({
            where: {
                transcript: { callId, tenantId: tenantId },
                text: { contains: q, mode: 'insensitive' },
            },
            orderBy: { sequenceIndex: 'asc' },
        });
        return {
            results: utterances,
            matchCount: utterances.length,
        };
    }
};
exports.SearchRepository = SearchRepository;
exports.SearchRepository = SearchRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchRepository);
let ShareRepository = class ShareRepository {
    prisma;
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
            create: { callId, tenantId: tenantId, sharedByUserId, ...dto },
        });
    }
    async findByCallId(callId, tenantId) {
        return this.prisma.callShare.findMany({ where: { callId, tenantId: tenantId } });
    }
};
exports.ShareRepository = ShareRepository;
exports.ShareRepository = ShareRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShareRepository);
//# sourceMappingURL=search.repository.js.map