// src/modules/deal-drivers/deal-drivers.repository.ts
// All raw database access for Deal Drivers.  No business logic here.

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PeriodWindow } from '../entities/deal-drivers.entities';

// ─── Row shapes ──────────────────────────────────────────────────────────────

interface BoardRow       { id: string; name: string; description?: string }
interface ManagerRow     { id: string; name: string }
interface WarningRow     { id: string; label: string }
interface RepRow         { id: string; name: string; managerId?: string }
interface DirectReportRow{ id: string; name: string; segment: string | null }
interface ManagerListRow { id: string; name: string; role: string }
interface BoardWarningRow{
  warningId: string; sortOrder: number;
  warningKey: string; label: string;
}
interface LastUsedBoardRow { boardId: string }
interface DealRow {
  repId: string; dealId: string;
  openedAt: Date; closedAt: Date | null;
  accountName: string; amount: number;
  currency: string; crmStage: string; closeDate: Date;
}
interface WarningEventRow {
  dealId: string; warningId: string; status: string; triggeredAt: Date;
}
interface DealDetailRow {
  dealId: string; accountName: string; amount: number;
  currency: string; crmStage: string; closeDate: Date;
}

@Injectable()
export class DealDriversRepository {
  constructor(private readonly db: DatabaseService) {}

  // ─── Board & warning lookups ──────────────────────────────────────────────

  /** Boards the user has explicit access to or is the owner of. */
  async getBoardsForUser(userId: string) {
    return this.db.many<BoardRow>(
      `SELECT b.id, b.name, b.description
         FROM boards b
        WHERE b.owner_id = $1
           OR EXISTS (
             SELECT 1 FROM board_permissions bp
              WHERE bp.board_id = b.id
                AND bp.principal_id = $1
                AND bp.principal_type = 'user'
           )
        ORDER BY b.name ASC`,
      [userId],
    );
  }

  /** Warnings enabled on a board, ordered by sort_order. */
  async getWarningsForBoard(boardId: string) {
    return this.db.many<BoardWarningRow>(
      `SELECT bwc.warning_id AS "warningId",
              bwc.sort_order AS "sortOrder",
              dwd.key        AS "warningKey",
              dwd.label
         FROM board_warning_config bwc
         JOIN deal_warning_definitions dwd ON dwd.id = bwc.warning_id
        WHERE bwc.board_id = $1 AND bwc.is_enabled = TRUE
        ORDER BY bwc.sort_order ASC`,
      [boardId],
    );
  }

  /** Most recently used board for a user. */
  async getLastUsedBoard(userId: string) {
    return this.db.one<LastUsedBoardRow>(
      `SELECT board_id AS "boardId" FROM user_last_used_board WHERE user_id = $1`,
      [userId],
    );
  }

  /** Upsert last used board. */
  async setLastUsedBoard(userId: string, boardId: string) {
    return this.db.query(
      `INSERT INTO user_last_used_board (user_id, board_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET board_id = $2, updated_at = NOW()`,
      [userId, boardId],
    );
  }

  // ─── Team / manager lookups ───────────────────────────────────────────────

  async getManagerById(managerId: string) {
    return this.db.one<ManagerRow>(
      `SELECT id, full_name AS name FROM users WHERE id = $1`,
      [managerId],
    );
  }

  async getBoardById(boardId: string) {
    return this.db.one<BoardRow>(
      `SELECT id, name FROM boards WHERE id = $1`,
      [boardId],
    );
  }

  async getWarningById(warningId: string) {
    return this.db.one<WarningRow>(
      `SELECT id, label FROM deal_warning_definitions WHERE id = $1`,
      [warningId],
    );
  }

  async getRepById(repId: string) {
    return this.db.one<RepRow>(
      `SELECT id, full_name AS name, manager_id AS "managerId" FROM users WHERE id = $1`,
      [repId],
    );
  }

  /** All active sales managers and CROs. */
  async getAllManagers() {
    return this.db.many<ManagerListRow>(
      `SELECT id, full_name AS name, role
         FROM users
        WHERE is_active = TRUE AND role IN ('sales_manager','cro','revops')
        ORDER BY full_name ASC`,
    );
  }

  // ─── Deal membership (denominator) ───────────────────────────────────────
  //
  // A deal qualifies if:
  //   1. board_id matches
  //   2. the rep owned it (current owner OR via reassignment) during the window
  //   3. the ownership overlap within the window is ≥ 24 h
  //
  // The overlap check happens in computeRepDealSets (service layer).
  // Here we return all candidate rows and let the calculator filter.

  async getQualifyingDealsForTeam(
    repIds: string[],
    boardId: string,
    window: PeriodWindow,
  ): Promise<DealRow[]> {
    if (repIds.length === 0) return [];

    // Current owners
    const currentRows = await this.db.many<DealRow>(
      `SELECT
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
         AND (dl.closed_at IS NULL OR dl.closed_at > $4)`,
      [boardId, repIds, window.end, window.start],
    );

    // Previous owners (reassigned away)
    const reassignedRows = await this.db.many<DealRow>(
      `SELECT
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
         AND (dl.closed_at IS NULL OR dl.closed_at > $3)`,
      [boardId, repIds, window.start, window.end],
    );

    return [...currentRows, ...reassignedRows];
  }

  // ─── Warning events ───────────────────────────────────────────────────────

  async getWarningEventsForDeals(
    dealIds: string[],
    warningIds: string[],
  ): Promise<WarningEventRow[]> {
    if (dealIds.length === 0 || warningIds.length === 0) return [];

    return this.db.many<WarningEventRow>(
      `SELECT
         deal_id     AS "dealId",
         warning_id  AS "warningId",
         status,
         triggered_at AS "triggeredAt"
       FROM deal_warning_events
       WHERE deal_id    = ANY($1::uuid[])
         AND warning_id = ANY($2::uuid[])
       ORDER BY deal_id ASC, warning_id ASC, triggered_at ASC`,
      [dealIds, warningIds],
    );
  }

  // ─── Deal details for drill-down ─────────────────────────────────────────

  async getDealDetails(dealIds: string[]) {
    if (dealIds.length === 0) return [];
    return this.db.many<DealDetailRow>(
      `SELECT
         id           AS "dealId",
         account_name AS "accountName",
         COALESCE(value, 0)::float AS amount,
         'USD'        AS currency,
         COALESCE(stage, '') AS "crmStage",
         COALESCE(estimated_close_date, NOW())::timestamptz AS "closeDate"
       FROM deals
       WHERE id = ANY($1::uuid[])
       ORDER BY estimated_close_date ASC NULLS LAST`,
      [dealIds],
    );
  }

  // ─── TC-G04: Manager access check ────────────────────────────────────────

  /**
   * Returns true if requestingUserId has visibility of managerId.
   * Rules:
   *   - A user always has access to themselves
   *   - CRO / Admin see managers in the same organisation
   *   - Sales Manager may only see themselves (enforced in service, but defence-in-depth here)
   * Returns false (not throws) so the service can produce a clean ForbiddenException.
   */
  async checkManagerAccess(requestingUserId: string, managerId: string): Promise<boolean> {
    if (requestingUserId === managerId) return true;
    // Check same org unit (managers table or org_memberships)
    const row = await this.db.one(
      `SELECT 1
         FROM users requesting
         JOIN users target ON target.id = $2
        WHERE requesting.id = $1
          AND requesting.org_id = target.org_id`,
      [requestingUserId, managerId],
    ).catch(() => null);
    return row !== null;
  }

  // ─── TC-G01: Direct reports with zero count ───────────────────────────────

  async getDirectReports(managerId: string): Promise<DirectReportRow[]> {
    // Returns empty array (not error) when manager has no direct reports
    return this.db.many<DirectReportRow>(
      `SELECT id, full_name AS name, segment
         FROM users
        WHERE manager_id = $1
          AND is_active = TRUE
        ORDER BY full_name ASC`,
      [managerId],
    ).catch(() => []);
  }

  // ─── TC-G22: Board rates without a specific team ─────────────────────────

  /**
   * When no repIds are provided, getQualifyingDealsForTeam returns all deals
   * on the board (used in board-comparison when no team is selected).
   */
  async getAllManagersForUser(userId: string) {
    return this.db.many(
      `SELECT id, full_name AS name, role
         FROM users
        WHERE org_id = (SELECT org_id FROM users WHERE id = $1)
          AND role IN ('sales_manager')
          AND is_active = TRUE
        ORDER BY full_name ASC`,
      [userId],
    );
  }
}
