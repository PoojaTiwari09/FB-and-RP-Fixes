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
exports.BoardWarningConfigController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const permissions_decorator_1 = require("../../platform-core/decorators/permissions.decorator");
const database_service_1 = require("../database/database.service");
const uuid_1 = require("uuid");
class AddBoardWarningDto {
    warningId;
    sortOrder;
}
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddBoardWarningDto.prototype, "warningId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AddBoardWarningDto.prototype, "sortOrder", void 0);
class UpdateBoardWarningDto {
    sortOrder;
    isEnabled;
}
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateBoardWarningDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateBoardWarningDto.prototype, "isEnabled", void 0);
let BoardWarningConfigController = class BoardWarningConfigController {
    db;
    constructor(db) {
        this.db = db;
    }
    async listBoardWarnings(boardId) {
        await this.assertBoardExists(boardId);
        return this.db.many(`SELECT
         bwc.id           AS "id",
         bwc.board_id     AS "boardId",
         bwc.warning_id   AS "warningId",
         dwd.key          AS "warningKey",
         dwd.label,
         dwd.description,
         bwc.sort_order   AS "sortOrder",
         bwc.is_enabled   AS "isEnabled",
         bwc.created_at   AS "createdAt"
       FROM board_warning_config bwc
       JOIN deal_warning_definitions dwd ON dwd.id = bwc.warning_id
       WHERE bwc.board_id = $1
       ORDER BY bwc.sort_order ASC, dwd.label ASC`, [boardId]);
    }
    async addWarningToBoard(boardId, body, req) {
        await this.assertBoardExists(boardId);
        const warning = await this.db.one(`SELECT id, label FROM deal_warning_definitions WHERE id = $1 AND is_active = TRUE`, [body.warningId]);
        if (!warning)
            throw new common_1.NotFoundException(`Warning definition ${body.warningId} not found or inactive.`);
        const id = (0, uuid_1.v4)();
        const row = await this.db.one(`INSERT INTO board_warning_config (id, board_id, warning_id, sort_order, is_enabled, created_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW())
       ON CONFLICT (board_id, warning_id)
         DO UPDATE SET sort_order = EXCLUDED.sort_order, is_enabled = TRUE
       RETURNING
         id,
         board_id   AS "boardId",
         warning_id AS "warningId",
         sort_order AS "sortOrder",
         is_enabled AS "isEnabled",
         created_at AS "createdAt"`, [id, boardId, body.warningId, body.sortOrder]);
        await this.writeAuditLog({
            entityType: 'board_warning_config',
            entityId: row.id,
            action: 'CREATE',
            actorId: req.user?.sub,
            changes: { boardId, ...body },
        });
        return row;
    }
    async updateBoardWarning(boardId, warningConfigId, body, req) {
        await this.assertBoardExists(boardId);
        const existing = await this.db.one(`SELECT id FROM board_warning_config WHERE id = $1 AND board_id = $2`, [warningConfigId, boardId]);
        if (!existing)
            throw new common_1.NotFoundException(`Board warning config ${warningConfigId} not found on board ${boardId}.`);
        const setClauses = [];
        const params = [];
        let idx = 1;
        if (body.sortOrder !== undefined) {
            setClauses.push(`sort_order = $${idx++}`);
            params.push(body.sortOrder);
        }
        if (body.isEnabled !== undefined) {
            setClauses.push(`is_enabled = $${idx++}`);
            params.push(body.isEnabled);
        }
        if (setClauses.length === 0) {
            return this.db.one(`SELECT id, board_id AS "boardId", warning_id AS "warningId",
                sort_order AS "sortOrder", is_enabled AS "isEnabled", created_at AS "createdAt"
           FROM board_warning_config WHERE id = $1`, [warningConfigId]);
        }
        params.push(warningConfigId);
        const row = await this.db.one(`UPDATE board_warning_config
          SET ${setClauses.join(', ')}
        WHERE id = $${idx}
       RETURNING
         id,
         board_id   AS "boardId",
         warning_id AS "warningId",
         sort_order AS "sortOrder",
         is_enabled AS "isEnabled",
         created_at AS "createdAt"`, params);
        await this.writeAuditLog({
            entityType: 'board_warning_config',
            entityId: warningConfigId,
            action: 'UPDATE',
            actorId: req.user?.sub,
            changes: body,
        });
        return row;
    }
    async removeWarningFromBoard(boardId, warningConfigId, req) {
        await this.assertBoardExists(boardId);
        const deleted = await this.db.one(`DELETE FROM board_warning_config
        WHERE id = $1 AND board_id = $2
       RETURNING id`, [warningConfigId, boardId]);
        if (!deleted)
            throw new common_1.NotFoundException(`Board warning config ${warningConfigId} not found on board ${boardId}.`);
        await this.writeAuditLog({
            entityType: 'board_warning_config',
            entityId: warningConfigId,
            action: 'DELETE',
            actorId: req.user?.sub,
            changes: { boardId, warningConfigId },
        });
        return { deleted: true, id: warningConfigId };
    }
    async assertBoardExists(boardId) {
        const board = await this.db.one(`SELECT id FROM boards WHERE id = $1`, [boardId]);
        if (!board)
            throw new common_1.NotFoundException(`Board ${boardId} not found.`);
    }
    async writeAuditLog(entry) {
        try {
            await this.db.query(`INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, changes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())`, [(0, uuid_1.v4)(), entry.entityType, entry.entityId, entry.action, entry.actorId, JSON.stringify(entry.changes)]);
        }
        catch { }
    }
};
exports.BoardWarningConfigController = BoardWarningConfigController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('boardId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BoardWarningConfigController.prototype, "listBoardWarnings", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('boardId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AddBoardWarningDto, Object]),
    __metadata("design:returntype", Promise)
], BoardWarningConfigController.prototype, "addWarningToBoard", null);
__decorate([
    (0, common_1.Patch)(':warningConfigId'),
    __param(0, (0, common_1.Param)('boardId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('warningConfigId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateBoardWarningDto, Object]),
    __metadata("design:returntype", Promise)
], BoardWarningConfigController.prototype, "updateBoardWarning", null);
__decorate([
    (0, common_1.Delete)(':warningConfigId'),
    __param(0, (0, common_1.Param)('boardId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('warningConfigId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BoardWarningConfigController.prototype, "removeWarningFromBoard", null);
exports.BoardWarningConfigController = BoardWarningConfigController = __decorate([
    (0, common_1.Controller)('deal-drivers/boards/:boardId/warnings'),
    (0, permissions_decorator_1.RequirePermissions)('system.manage'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], BoardWarningConfigController);
//# sourceMappingURL=board-warning-config.controller.js.map