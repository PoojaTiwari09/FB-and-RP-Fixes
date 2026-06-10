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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningDefinitionsController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../../platform-core/decorators/permissions.decorator");
const database_service_1 = require("../database/database.service");
const deal_drivers_dto_1 = require("../schemas/deal-drivers.dto");
const uuid_1 = require("uuid");
let WarningDefinitionsController = class WarningDefinitionsController {
    db;
    constructor(db) {
        this.db = db;
    }
    async listWarningDefinitions() {
        return this.db.many(`SELECT
         id,
         key,
         label,
         description,
         is_active   AS "isActive",
         created_at  AS "createdAt"
       FROM deal_warning_definitions
       ORDER BY label ASC`);
    }
    async createWarningDefinition(body, req) {
        const existing = await this.db.one(`SELECT id FROM deal_warning_definitions WHERE key = $1`, [body.key]);
        if (existing) {
            throw new common_1.ConflictException(`Warning key "${body.key}" already exists.`);
        }
        const id = (0, uuid_1.v4)();
        const row = await this.db.one(`INSERT INTO deal_warning_definitions (id, key, label, description, is_active, created_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW())
       RETURNING
         id, key, label, description,
         is_active  AS "isActive",
         created_at AS "createdAt"`, [id, body.key, body.label, body.description ?? null]);
        await this.writeAuditLog({
            entityType: 'warning_definition',
            entityId: id,
            action: 'CREATE',
            actorId: req.user?.sub,
            changes: body,
        });
        return row;
    }
    async updateWarningDefinition(id, body, req) {
        const existing = await this.db.one(`SELECT id FROM deal_warning_definitions WHERE id = $1`, [id]);
        if (!existing)
            throw new common_1.NotFoundException(`Warning definition ${id} not found.`);
        const setClauses = [];
        const params = [];
        let idx = 1;
        if (body.label !== undefined) {
            setClauses.push(`label = $${idx++}`);
            params.push(body.label);
        }
        if (body.description !== undefined) {
            setClauses.push(`description = $${idx++}`);
            params.push(body.description);
        }
        if (body.isActive !== undefined) {
            setClauses.push(`is_active = $${idx++}`);
            params.push(body.isActive);
        }
        if (setClauses.length === 0) {
            return this.db.one(`SELECT id, key, label, description, is_active AS "isActive", created_at AS "createdAt"
           FROM deal_warning_definitions WHERE id = $1`, [id]);
        }
        params.push(id);
        const row = await this.db.one(`UPDATE deal_warning_definitions
          SET ${setClauses.join(', ')}
        WHERE id = $${idx}
       RETURNING
         id, key, label, description,
         is_active  AS "isActive",
         created_at AS "createdAt"`, params);
        await this.writeAuditLog({
            entityType: 'warning_definition',
            entityId: id,
            action: 'UPDATE',
            actorId: req.user?.sub,
            changes: body,
        });
        return row;
    }
    async writeAuditLog(entry) {
        try {
            await this.db.query(`INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, changes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())`, [(0, uuid_1.v4)(), entry.entityType, entry.entityId, entry.action, entry.actorId, JSON.stringify(entry.changes)]);
        }
        catch {
        }
    }
};
exports.WarningDefinitionsController = WarningDefinitionsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WarningDefinitionsController.prototype, "listWarningDefinitions", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deal_drivers_dto_1.CreateWarningDefinitionDto, Object]),
    __metadata("design:returntype", Promise)
], WarningDefinitionsController.prototype, "createWarningDefinition", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, deal_drivers_dto_1.UpdateWarningDefinitionDto, Object]),
    __metadata("design:returntype", Promise)
], WarningDefinitionsController.prototype, "updateWarningDefinition", null);
exports.WarningDefinitionsController = WarningDefinitionsController = __decorate([
    (0, common_1.Controller)('deal-drivers/warning-definitions'),
    (0, permissions_decorator_1.RequirePermissions)('system.manage'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], WarningDefinitionsController);
//# sourceMappingURL=warning-definitions.controller.js.map