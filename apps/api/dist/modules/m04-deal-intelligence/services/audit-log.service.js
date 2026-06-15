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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@m04/database/inject-repository");
const m04_prisma_repository_1 = require("@m04/database/m04-prisma.repository");
const entities_1 = require("@m04/entities");
let AuditLogService = class AuditLogService {
    auditLogRepository;
    constructor(auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    async log(dto) {
        const auditLog = this.auditLogRepository.create(dto);
        return this.auditLogRepository.save(auditLog);
    }
    async findByEntity(entityType, entityId, limit = 50) {
        return this.auditLogRepository.find({
            where: { entityType, entityId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async findByUser(userId, limit = 50) {
        return this.auditLogRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async findByAction(action, limit = 50) {
        return this.auditLogRepository.find({
            where: { action },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async findRecentDealUpdates(limit = 30) {
        return this.auditLogRepository.find({
            where: { entityType: entities_1.AuditEntityType.DEAL, action: entities_1.AuditAction.UPDATE_DEAL },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(entities_1.AuditLog)),
    __metadata("design:paramtypes", [typeof (_a = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _a : Object])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map