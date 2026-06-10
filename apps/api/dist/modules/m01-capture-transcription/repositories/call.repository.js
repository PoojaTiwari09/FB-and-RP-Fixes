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
exports.CallRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let CallRepository = class CallRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const { tenantId, ...rest } = data;
        return this.prisma.callRecord.create({
            data: {
                ...rest,
                tenantId: tenantId,
            },
        });
    }
    async findAll(tenantId, query, extra) {
        const { status, source, sortBy, order, limit, offset } = query;
        const where = {
            tenantId: tenantId,
            ...(status ? { transcriptStatus: status } : {}),
            ...(source ? { callSource: source } : {}),
            ...extra,
        };
        const [records, total] = await this.prisma.$transaction([
            this.prisma.callRecord.findMany({
                where,
                orderBy: { [sortBy]: order },
                take: limit,
                skip: offset,
                include: {
                    transcript: {
                        select: {
                            id: true,
                            summary: true,
                            keyHighlights: true,
                            talkRatio: true,
                            utterances: {
                                select: { endMs: true, startMs: true },
                                orderBy: { endMs: 'desc' },
                                take: 1,
                            },
                        },
                    },
                },
            }),
            this.prisma.callRecord.count({ where }),
        ]);
        return { records, total };
    }
    async findById(id, tenantId) {
        return this.prisma.callRecord.findFirst({
            where: { id, tenantId: tenantId },
            include: {
                transcript: {
                    include: {
                        utterances: { orderBy: { sequenceIndex: 'asc' } },
                    },
                },
                notes: { orderBy: { createdAt: 'desc' } },
                shares: true,
            },
        });
    }
    async updateStatus(id, tenantId, status, failureReason) {
        return this.prisma.callRecord.updateMany({
            where: { id, tenantId: tenantId },
            data: { transcriptStatus: status, failureReason },
        });
    }
    async updateDurationSeconds(id, tenantId, durationSeconds) {
        if (durationSeconds <= 0)
            return { count: 0 };
        return this.prisma.callRecord.updateMany({
            where: { id, tenantId: tenantId },
            data: { durationSeconds },
        });
    }
    async updateParticipants(id, tenantId, participants) {
        return this.prisma.callRecord.updateMany({
            where: { id, tenantId: tenantId },
            data: { participants },
        });
    }
    async updateSkipped(id, tenantId, skipReason) {
        return this.prisma.callRecord.updateMany({
            where: { id, tenantId: tenantId },
            data: { transcriptStatus: 'skipped', skipReason },
        });
    }
    async deleteById(id, tenantId) {
        return this.prisma.callRecord.deleteMany({ where: { id, tenantId: tenantId } });
    }
};
exports.CallRepository = CallRepository;
exports.CallRepository = CallRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CallRepository);
//# sourceMappingURL=call.repository.js.map