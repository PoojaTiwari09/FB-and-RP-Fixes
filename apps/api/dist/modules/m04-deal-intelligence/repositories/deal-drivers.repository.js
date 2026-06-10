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
exports.DealDriversRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let DealDriversRepository = class DealDriversRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async getBoardsForUser(userId) {
        return this.db.many(`SELECT b.id, b.name, b.description
         FROM boards b
        WHERE b.owner_id = $1
           OR EXISTS (
             SELECT 1 FROM board_permissions bp
              WHERE bp.board_id = b.id
                AND bp.principal_id = $1
                AND bp.principal_type = 'user'
           )
        ORDER BY b.name ASC`, [userId]);
    }
    async getWarningsForBoard(boardId) {
        return this.db.many(`SELECT bwc.warning_id AS "warningId",
              bwc.sort_order AS "sortOrder",
              dwd.key        AS "warningKey",
              dwd.label
         FROM board_warning_config bwc
         JOIN deal_warning_definitions dwd ON dwd.id = bwc.warning_id
        WHERE bwc.board_id = $1 AND bwc.is_enabled = TRUE
        ORDER BY bwc.sort_order ASC`, [boardId]);
    }
    async getLastUsedBoard(userId) {
        return this.db.one(`SELECT board_id AS "boardId" FROM user_last_used_board WHERE user_id = $1`, [userId]);
    }
    async setLastUsedBoard(userId, boardId) {
        return this.db.query(`INSERT INTO user_last_used_board (user_id, board_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET board_id = $2, updated_at = NOW()`, [userId, boardId]);
    }
    async getManagerById(managerId) {
        return this.db.one(`SELECT id, full_name AS name FROM users WHERE id = $1`, [managerId]);
    }
    async getBoardById(boardId) {
        return this.db.one(`SELECT id, name FROM boards WHERE id = $1`, [boardId]);
    }
    async getWarningById(warningId) {
        return this.db.one(`SELECT id, label FROM deal_warning_definitions WHERE id = $1`, [warningId]);
    }
    async getRepById(repId) {
        return this.db.one(`SELECT id, full_name AS name, manager_id AS "managerId" FROM users WHERE id = $1`, [repId]);
    }
    async getAllManagers() {
        return this.db.many(`SELECT id, full_name AS name, role
         FROM users
        WHERE is_active = TRUE AND role IN ('sales_manager','cro','revops')
        ORDER BY full_name ASC`);
    }
    async getQualifyingDealsForTeam(repIds, boardId, window) {
        if (repIds.length === 0)
            return [];
        const currentRows = await this.db.many(`SELECT
         dl.rep_id      AS "repId",
         dl.deal_id     AS "dealId",
         dl.opened_at   AS "openedAt",
         dl.closed_at   AS "closedAt",
         d.account_name AS "accountName",
         COALESCE(d.value, 0)::float AS amount,
         'USD'          AS currency,
         COALESCE(d.stage, '') AS "crmStage",
         COALESCE(d.estimated_close_date, NOW())::timestamptz AS "closeDate"
       FROM deal_lifecycle dl
       JOIN deals d ON d.id = dl.deal_id
       WHERE dl.board_id = $1
         AND dl.rep_id = ANY($2::uuid[])
         AND dl.opened_at < $3
         AND (dl.closed_at IS NULL OR dl.closed_at > $4)`, [boardId, repIds, window.end, window.start]);
        const reassignedRows = await this.db.many(`SELECT
         dr.from_rep_id AS "repId",
         dl.deal_id     AS "dealId",
         dl.opened_at   AS "openedAt",
         dr.reassigned_at AS "closedAt",
         d.account_name AS "accountName",
         COALESCE(d.value, 0)::float AS amount,
         'USD'          AS currency,
         COALESCE(d.stage, '') AS "crmStage",
         COALESCE(d.estimated_close_date, NOW())::timestamptz AS "closeDate"
       FROM deal_reassignments dr
       JOIN deal_lifecycle dl ON dl.deal_id = dr.deal_id AND dl.board_id = $1
       JOIN deals d ON d.id = dr.deal_id
       WHERE dr.from_rep_id = ANY($2::uuid[])
         AND dr.reassigned_at > $3
         AND dl.opened_at < $4
         AND (dl.closed_at IS NULL OR dl.closed_at > $3)`, [boardId, repIds, window.start, window.end]);
        return [...currentRows, ...reassignedRows];
    }
    async getWarningEventsForDeals(dealIds, warningIds) {
        if (dealIds.length === 0 || warningIds.length === 0)
            return [];
        return this.db.many(`SELECT
         deal_id     AS "dealId",
         warning_id  AS "warningId",
         status,
         triggered_at AS "triggeredAt"
       FROM deal_warning_events
       WHERE deal_id    = ANY($1::uuid[])
         AND warning_id = ANY($2::uuid[])
       ORDER BY deal_id ASC, warning_id ASC, triggered_at ASC`, [dealIds, warningIds]);
    }
    async getDealDetails(dealIds) {
        if (dealIds.length === 0)
            return [];
        return this.db.many(`SELECT
         id           AS "dealId",
         account_name AS "accountName",
         COALESCE(value, 0)::float AS amount,
         'USD'        AS currency,
         COALESCE(stage, '') AS "crmStage",
         COALESCE(estimated_close_date, NOW())::timestamptz AS "closeDate"
       FROM deals
       WHERE id = ANY($1::uuid[])
       ORDER BY estimated_close_date ASC NULLS LAST`, [dealIds]);
    }
    async checkManagerAccess(requestingUserId, managerId) {
        if (requestingUserId === managerId)
            return true;
        const row = await this.db.one(`SELECT 1
         FROM users requesting
         JOIN users target ON target.id = $2
        WHERE requesting.id = $1
          AND requesting.org_id = target.org_id`, [requestingUserId, managerId]).catch(() => null);
        return row !== null;
    }
    async getDirectReports(managerId) {
        return this.db.many(`SELECT id, full_name AS name, segment
         FROM users
        WHERE manager_id = $1
          AND is_active = TRUE
        ORDER BY full_name ASC`, [managerId]).catch(() => []);
    }
    async getAllManagersForUser(userId) {
        return this.db.many(`SELECT id, full_name AS name, role
         FROM users
        WHERE org_id = (SELECT org_id FROM users WHERE id = $1)
          AND role IN ('sales_manager')
          AND is_active = TRUE
        ORDER BY full_name ASC`, [userId]);
    }
};
exports.DealDriversRepository = DealDriversRepository;
exports.DealDriversRepository = DealDriversRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], DealDriversRepository);
//# sourceMappingURL=deal-drivers.repository.js.map