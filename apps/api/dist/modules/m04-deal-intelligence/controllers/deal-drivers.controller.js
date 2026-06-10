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
exports.DealDriversController = void 0;
const permissions_decorator_1 = require("../../platform-core/decorators/permissions.decorator");
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../interfaces/jwt.guard");
const deal_drivers_service_1 = require("../services/deal-drivers.service");
const matrix_cache_1 = require("../services/matrix.cache");
const deal_drivers_entities_1 = require("../entities/deal-drivers.entities");
const deal_drivers_dto_1 = require("../schemas/deal-drivers.dto");
const webhook_signature_guard_1 = require("../interfaces/webhook-signature.guard");
const database_service_1 = require("../database/database.service");
const uuid_1 = require("uuid");
let DealDriversController = class DealDriversController {
    service;
    db;
    matrixCache;
    constructor(service, db, matrixCache) {
        this.service = service;
        this.db = db;
        this.matrixCache = matrixCache;
    }
    async getMatrix(q, req) {
        return this.service.getMatrix({
            requestingUserId: req.user.sub,
            requestingUserRoles: req.user.roles ?? [],
            managerId: q.managerId,
            boardId: q.boardId,
            period: q.period ?? deal_drivers_entities_1.Period.NOW,
        });
    }
    async getDrillDown(q, req) {
        return this.service.getDrillDown({
            requestingUserRoles: req.user.roles ?? [],
            repId: q.repId,
            warningId: q.warningId,
            boardId: q.boardId,
            period: q.period ?? deal_drivers_entities_1.Period.NOW,
        });
    }
    async getBoardComparison(q, req) {
        if (q.baselineBoardId === q.comparisonBoardId) {
            throw new common_1.BadRequestException('SAME_BOARD_COMPARISON: baseline and comparison boards must be different.');
        }
        return this.service.getBoardComparison({
            requestingUserRoles: req.user.roles ?? [],
            baselineBoardId: q.baselineBoardId,
            comparisonBoardId: q.comparisonBoardId,
            managerId: q.managerId ?? null,
            period: q.period ?? deal_drivers_entities_1.Period.NOW,
        });
    }
    async getCoachingEffectiveness(q, req) {
        return this.service.getCoachingEffectiveness({
            requestingUserRoles: req.user.roles ?? [],
            repId: q.repId,
            boardId: q.boardId,
        });
    }
    async getBoards(req) {
        return this.service['repo'].getBoardsForUser(req.user.sub);
    }
    async getManagers(req) {
        return this.service['repo'].getAllManagersForUser(req.user.sub);
    }
    async getReps(managerId, req) {
        const isSalesManager = (req.user.roles ?? []).includes('sales_manager');
        const effectiveManagerId = isSalesManager ? req.user.sub : (managerId || req.user.sub);
        return this.service['repo'].getDirectReports(effectiveManagerId);
    }
    async getLastUsedBoard(req) {
        return this.service['repo'].getLastUsedBoard(req.user.sub);
    }
    async getWarnings() {
        return this.db.many(`SELECT id, key, label, description, is_active AS "isActive", created_at AS "createdAt"
         FROM deal_warning_definitions
        WHERE is_active = TRUE
        ORDER BY label ASC`);
    }
    async exportMatrixCsv(q, req, res) {
        const matrix = await this.service.getMatrix({
            requestingUserId: req.user.sub,
            requestingUserRoles: req.user.roles ?? [],
            managerId: q.managerId,
            boardId: q.boardId,
            period: q.period ?? deal_drivers_entities_1.Period.NOW,
        });
        const warnings = matrix.warnings;
        const csvEscape = (val) => {
            const s = String(val);
            return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const headerCols = ['Rep Name', 'Deal Count', ...warnings.map((w) => w.label)];
        const lines = [headerCols.map(csvEscape).join(',')];
        for (const row of matrix.rows) {
            const cols = [
                csvEscape(row.repName),
                csvEscape(row.dealCount),
                ...warnings.map((w) => {
                    const cell = row.cells[w.warningId];
                    return csvEscape(cell?.isNull ? '—' : `${cell?.percentage ?? 0}%`);
                }),
            ];
            lines.push(cols.join(','));
        }
        const avgCols = [
            csvEscape('Team Average'), csvEscape('—'),
            ...warnings.map((w) => {
                const avg = matrix.teamAverage.averages[w.warningId];
                return csvEscape(avg == null ? '—' : `${avg}%`);
            }),
        ];
        lines.push(avgCols.join(','));
        const dateStr = new Date().toISOString().slice(0, 10);
        const safeBoardName = matrix.boardName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const filename = `deal-drivers-${safeBoardName}-${q.period ?? 'NOW'}-${dateStr}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(lines.join('\n'));
    }
    async createWarningEvent(body) {
        const deal = await this.db.one(`SELECT id FROM deals WHERE id = $1`, [body.dealId]);
        if (!deal)
            throw new common_1.NotFoundException(`Deal ${body.dealId} not found.`);
        const warning = await this.db.one(`SELECT id FROM deal_warning_definitions WHERE id = $1 AND is_active = TRUE`, [body.warningId]);
        if (!warning)
            throw new common_1.NotFoundException(`Warning definition ${body.warningId} not found or inactive.`);
        const id = (0, uuid_1.v4)();
        const row = await this.db.one(`INSERT INTO deal_warning_events (id, deal_id, warning_id, status, triggered_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, deal_id AS "dealId", warning_id AS "warningId", status, triggered_at AS "triggeredAt", created_at AS "createdAt"`, [id, body.dealId, body.warningId, body.status, body.triggeredAt]);
        try {
            const lifecycle = await this.db.one(`SELECT board_id FROM deal_lifecycle WHERE deal_id = $1 ORDER BY opened_at DESC LIMIT 1`, [body.dealId]);
            if (lifecycle?.board_id)
                this.matrixCache.invalidateByBoard(lifecycle.board_id);
        }
        catch { }
        return row;
    }
    async bulkCreateWarningEvents(body) {
        const events = body.events;
        if (events.length === 0)
            return { inserted: 0, skipped: 0, errors: [] };
        const dealIds = [...new Set(events.map((e) => e.dealId))];
        const validDealRows = await this.db.many(`SELECT id FROM deals WHERE id = ANY($1::uuid[])`, [dealIds]);
        const validDealIds = new Set(validDealRows.map((r) => r.id));
        const warningIds = [...new Set(events.map((e) => e.warningId))];
        const validWarnRows = await this.db.many(`SELECT id FROM deal_warning_definitions WHERE id = ANY($1::uuid[]) AND is_active = TRUE`, [warningIds]);
        const validWarningIds = new Set(validWarnRows.map((r) => r.id));
        const toInsert = [];
        const errors = [];
        let skipped = 0;
        for (let i = 0; i < events.length; i++) {
            const ev = events[i];
            if (!validDealIds.has(ev.dealId)) {
                errors.push({ index: i, reason: `Deal ${ev.dealId} not found.` });
                skipped++;
                continue;
            }
            if (!validWarningIds.has(ev.warningId)) {
                errors.push({ index: i, reason: `Warning ${ev.warningId} not found or inactive.` });
                skipped++;
                continue;
            }
            toInsert.push(ev);
        }
        if (toInsert.length === 0)
            return { inserted: 0, skipped, errors };
        const valuePlaceholders = [];
        const params = [];
        let idx = 1;
        for (const ev of toInsert) {
            valuePlaceholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, NOW())`);
            params.push((0, uuid_1.v4)(), ev.dealId, ev.warningId, ev.status, ev.triggeredAt);
        }
        await this.db.query(`INSERT INTO deal_warning_events (id, deal_id, warning_id, status, triggered_at, created_at) VALUES ${valuePlaceholders.join(', ')}`, params);
        try {
            const affectedDealIds = [...new Set(toInsert.map((e) => e.dealId))];
            const lifecycles = await this.db.many(`SELECT DISTINCT board_id FROM deal_lifecycle WHERE deal_id = ANY($1::uuid[])`, [affectedDealIds]);
            for (const lc of lifecycles) {
                if (lc.board_id)
                    this.matrixCache.invalidateByBoard(lc.board_id);
            }
        }
        catch { }
        return { inserted: toInsert.length, skipped, errors };
    }
    async openDealLifecycle(body) {
        const [deal, rep, board] = await Promise.all([
            this.db.one(`SELECT id FROM deals WHERE id = $1`, [body.dealId]),
            this.db.one(`SELECT id FROM users WHERE id = $1`, [body.repId]),
            this.db.one(`SELECT id FROM boards WHERE id = $1`, [body.boardId]),
        ]);
        if (!deal)
            throw new common_1.NotFoundException(`Deal ${body.dealId} not found.`);
        if (!rep)
            throw new common_1.NotFoundException(`Rep ${body.repId} not found.`);
        if (!board)
            throw new common_1.NotFoundException(`Board ${body.boardId} not found.`);
        const id = (0, uuid_1.v4)();
        const row = await this.db.one(`INSERT INTO deal_lifecycle (id, deal_id, rep_id, board_id, opened_at, closed_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NULL, NOW())
       ON CONFLICT (deal_id, rep_id, board_id) DO UPDATE SET opened_at = EXCLUDED.opened_at, closed_at = NULL
       RETURNING id, deal_id AS "dealId", rep_id AS "repId", board_id AS "boardId", opened_at AS "openedAt", closed_at AS "closedAt", created_at AS "createdAt"`, [id, body.dealId, body.repId, body.boardId, body.openedAt]);
        return row;
    }
    async closeDealLifecycle(lifecycleId, body) {
        const row = await this.db.one(`UPDATE deal_lifecycle SET closed_at = $1 WHERE id = $2
       RETURNING id, deal_id AS "dealId", rep_id AS "repId", board_id AS "boardId", opened_at AS "openedAt", closed_at AS "closedAt"`, [body.closedAt, lifecycleId]);
        if (!row)
            throw new common_1.NotFoundException(`Lifecycle record ${lifecycleId} not found.`);
        return row;
    }
    async createDealReassignment(body) {
        const [deal, fromRep, toRep] = await Promise.all([
            this.db.one(`SELECT id FROM deals WHERE id = $1`, [body.dealId]),
            this.db.one(`SELECT id FROM users WHERE id = $1`, [body.fromRepId]),
            this.db.one(`SELECT id FROM users WHERE id = $1`, [body.toRepId]),
        ]);
        if (!deal)
            throw new common_1.NotFoundException(`Deal ${body.dealId} not found.`);
        if (!fromRep)
            throw new common_1.NotFoundException(`From-rep ${body.fromRepId} not found.`);
        if (!toRep)
            throw new common_1.NotFoundException(`To-rep ${body.toRepId} not found.`);
        const id = (0, uuid_1.v4)();
        const row = await this.db.one(`INSERT INTO deal_reassignments (id, deal_id, from_rep_id, to_rep_id, reassigned_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, deal_id AS "dealId", from_rep_id AS "fromRepId", to_rep_id AS "toRepId", reassigned_at AS "reassignedAt", created_at AS "createdAt"`, [id, body.dealId, body.fromRepId, body.toRepId, body.reassignedAt]);
        return row;
    }
};
exports.DealDriversController = DealDriversController;
__decorate([
    (0, common_1.Get)('matrix'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deal_drivers_dto_1.MatrixQueryDto, Object]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "getMatrix", null);
__decorate([
    (0, common_1.Get)('drill-down'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deal_drivers_dto_1.DrillDownQueryDto, Object]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "getDrillDown", null);
__decorate([
    (0, common_1.Get)('board-comparison'),
    (0, permissions_decorator_1.RequirePermissions)('system.manage'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deal_drivers_dto_1.BoardComparisonQueryDto, Object]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "getBoardComparison", null);
__decorate([
    (0, common_1.Get)('coaching'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deal_drivers_dto_1.CoachingQueryDto, Object]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "getCoachingEffectiveness", null);
__decorate([
    (0, common_1.Get)('boards'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "getBoards", null);
__decorate([
    (0, common_1.Get)('managers'),
    (0, permissions_decorator_1.RequirePermissions)('system.manage'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "getManagers", null);
__decorate([
    (0, common_1.Get)('reps'),
    __param(0, (0, common_1.Query)('managerId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "getReps", null);
__decorate([
    (0, common_1.Get)('last-used-board'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "getLastUsedBoard", null);
__decorate([
    (0, common_1.Get)('warnings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "getWarnings", null);
__decorate([
    (0, common_1.Get)('matrix/export'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deal_drivers_dto_1.MatrixQueryDto, Object, Object]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "exportMatrixCsv", null);
__decorate([
    (0, common_1.Post)('events'),
    (0, jwt_guard_1.Public)(),
    (0, common_1.UseGuards)(webhook_signature_guard_1.WebhookSignatureGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deal_drivers_dto_1.CreateWarningEventDto]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "createWarningEvent", null);
__decorate([
    (0, common_1.Post)('events/bulk'),
    (0, jwt_guard_1.Public)(),
    (0, common_1.UseGuards)(webhook_signature_guard_1.WebhookSignatureGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deal_drivers_dto_1.BulkWarningEventDto]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "bulkCreateWarningEvents", null);
__decorate([
    (0, common_1.Post)('lifecycle'),
    (0, permissions_decorator_1.RequirePermissions)('system.manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deal_drivers_dto_1.OpenDealLifecycleDto]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "openDealLifecycle", null);
__decorate([
    (0, common_1.Patch)('lifecycle/:id/close'),
    (0, permissions_decorator_1.RequirePermissions)('system.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, deal_drivers_dto_1.CloseDealLifecycleDto]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "closeDealLifecycle", null);
__decorate([
    (0, common_1.Post)('reassignments'),
    (0, permissions_decorator_1.RequirePermissions)('system.manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deal_drivers_dto_1.CreateDealReassignmentDto]),
    __metadata("design:returntype", Promise)
], DealDriversController.prototype, "createDealReassignment", null);
exports.DealDriversController = DealDriversController = __decorate([
    (0, common_1.Controller)('deal-drivers'),
    (0, permissions_decorator_1.RequirePermissions)('system.manage'),
    __metadata("design:paramtypes", [deal_drivers_service_1.DealDriversService,
        database_service_1.DatabaseService,
        matrix_cache_1.MatrixCache])
], DealDriversController);
//# sourceMappingURL=deal-drivers.controller.js.map