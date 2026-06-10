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
var AuditLogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let AuditLogService = AuditLogService_1 = class AuditLogService {
    prisma;
    logger = new common_1.Logger(AuditLogService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(entry) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    tenantid: entry.tenantId,
                    actorId: entry.actorId,
                    actorType: entry.actorType ?? 'system',
                    action: entry.action,
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    meta: entry.meta ?? {},
                },
            });
        }
        catch (err) {
            this.logger.warn(`[AuditLog] Failed to write audit entry (action=${entry.action}, ` +
                `entityId=${entry.entityId}): ${err.message}`);
        }
    }
    async findByTenant(tenantId, filters = {}) {
        const { dateFrom, dateTo, action, entityId, limit = 50, offset = 0, } = filters;
        const effectiveDateFrom = dateFrom
            ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const where = {
            tenantid: tenantId,
            createdAt: {
                gte: effectiveDateFrom,
                ...(dateTo ? { lte: dateTo } : {}),
            },
            ...(action ? { action } : {}),
            ...(entityId ? { entityId } : {}),
        };
        const [logs, total] = await this.prisma.$transaction([
            this.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return { logs, total };
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = AuditLogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map