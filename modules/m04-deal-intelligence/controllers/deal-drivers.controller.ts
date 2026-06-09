// src/modules/deal-drivers/deal-drivers.controller.ts
// Edge cases wired at HTTP layer:
//   TC-G03: @Roles guard blocks rep role at route level
//   TC-G04: ForbiddenException from service propagates as 403
//   TC-G19: same-board comparison throws 400 Bad Request

import {
  BadRequestException,
  Body, Controller, Get, NotFoundException, Param,
  ParseUUIDPipe, Patch, Post, Query, Res, UseGuards, Req,
} from '@nestjs/common';
import { Response } from 'express';
import { Roles, Public } from '../interfaces/jwt.guard';
import { DealDriversService } from '../services/deal-drivers.service';
import { MatrixCache } from '../services/matrix.cache';
import { Period } from '../entities/deal-drivers.entities';
import {
  MatrixQueryDto, DrillDownQueryDto, BoardComparisonQueryDto, CoachingQueryDto,
  CreateWarningEventDto, OpenDealLifecycleDto, CloseDealLifecycleDto,
  CreateDealReassignmentDto, BulkWarningEventDto,
} from '../schemas/deal-drivers.dto';
import { WebhookSignatureGuard } from '../interfaces/webhook-signature.guard';
import { DatabaseService } from '../database/database.service';
import { v4 as uuidv4 } from 'uuid';

@Controller('deal-drivers')
// TC-G03: 'rep' role is intentionally NOT in this list → blocked at guard level
@Roles('sales_manager', 'cro', 'revops', 'admin')
export class DealDriversController {
  constructor(
    private readonly service: DealDriversService,
    private readonly db: DatabaseService,
    private readonly matrixCache: MatrixCache,
  ) {}

  // ─── Core read endpoints ─────────────────────────────────────────────────

  @Get('matrix')
  async getMatrix(@Query() q: MatrixQueryDto, @Req() req: any) {
    // TC-G04: ForbiddenException from assertManagerAccess propagates as 403
    return this.service.getMatrix({
      requestingUserId:    req.user.sub,
      requestingUserRoles: req.user.roles ?? [],
      managerId: q.managerId,
      boardId:   q.boardId,
      period:    q.period ?? Period.NOW,
    });
  }

  @Get('drill-down')
  async getDrillDown(@Query() q: DrillDownQueryDto, @Req() req: any) {
    // TC-G08: service returns empty deals array, not 404
    return this.service.getDrillDown({
      requestingUserRoles: req.user.roles ?? [],
      repId:     q.repId,
      warningId: q.warningId,
      boardId:   q.boardId,
      period:    q.period ?? Period.NOW,
    });
  }

  @Get('board-comparison')
  @Roles('cro', 'revops', 'admin')
  async getBoardComparison(@Query() q: BoardComparisonQueryDto, @Req() req: any) {
    // TC-G19: reject same-board comparison at controller level before hitting service
    if (q.baselineBoardId === q.comparisonBoardId) {
      throw new BadRequestException(
        'SAME_BOARD_COMPARISON: baseline and comparison boards must be different.',
      );
    }
    // TC-G22: managerId is optional; service handles null → all teams
    return this.service.getBoardComparison({
      requestingUserRoles:  req.user.roles ?? [],
      baselineBoardId:      q.baselineBoardId,
      comparisonBoardId:    q.comparisonBoardId,
      managerId:            q.managerId ?? null,
      period:               q.period ?? Period.NOW,
    });
  }

  @Get('coaching')
  async getCoachingEffectiveness(@Query() q: CoachingQueryDto, @Req() req: any) {
    // TC-G09: service handles null percentages when one period has no data
    return this.service.getCoachingEffectiveness({
      requestingUserRoles: req.user.roles ?? [],
      repId:   q.repId,
      boardId: q.boardId,
    });
  }

  @Get('boards')
  async getBoards(@Req() req: any): Promise<any[]> {
    return this.service['repo'].getBoardsForUser(req.user.sub);
  }

  @Get('managers')
  @Roles('cro', 'revops', 'admin')
  async getManagers(@Req() req: any): Promise<any[]> {
    // TC-G04: only return managers in the same org as the requesting CRO
    return this.service['repo'].getAllManagersForUser(req.user.sub);
  }

  @Get('reps')
  async getReps(@Query('managerId') managerId: string, @Req() req: any): Promise<any[]> {
    // GAP-9: Returns direct reports for a given manager.
    // Sales managers: returns their own direct reports (ignores managerId param).
    // CRO/Admin: returns direct reports of the specified manager.
    const isSalesManager = (req.user.roles ?? []).includes('sales_manager');
    const effectiveManagerId = isSalesManager ? req.user.sub : (managerId || req.user.sub);
    return this.service['repo'].getDirectReports(effectiveManagerId);
  }

  @Get('last-used-board')
  async getLastUsedBoard(@Req() req: any): Promise<any> {
    return this.service['repo'].getLastUsedBoard(req.user.sub);
  }

  @Get('warnings')
  async getWarnings() {
    return this.db.many(
      `SELECT id, key, label, description, is_active AS "isActive", created_at AS "createdAt"
         FROM deal_warning_definitions
        WHERE is_active = TRUE
        ORDER BY label ASC`,
    );
  }

  // ─── CSV export ──────────────────────────────────────────────────────────

  @Get('matrix/export')
  async exportMatrixCsv(@Query() q: MatrixQueryDto, @Req() req: any, @Res() res: Response) {
    const matrix = await this.service.getMatrix({
      requestingUserId:    req.user.sub,
      requestingUserRoles: req.user.roles ?? [],
      managerId: q.managerId,
      boardId:   q.boardId,
      period:    q.period ?? Period.NOW,
    });

    const warnings  = matrix.warnings;
    const csvEscape = (val: string | number): string => {
      const s = String(val);
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headerCols = ['Rep Name', 'Deal Count', ...warnings.map((w) => w.label)];
    const lines: string[] = [headerCols.map(csvEscape).join(',')];

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

    const dateStr      = new Date().toISOString().slice(0, 10);
    const safeBoardName = matrix.boardName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename      = `deal-drivers-${safeBoardName}-${q.period ?? 'NOW'}-${dateStr}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(lines.join('\n'));
  }

  // ─── Warning event ingestion ─────────────────────────────────────────────

  @Post('events')
  @Public()
  @UseGuards(WebhookSignatureGuard)
  async createWarningEvent(@Body() body: CreateWarningEventDto) {
    const deal = await this.db.one(`SELECT id FROM deals WHERE id = $1`, [body.dealId]);
    if (!deal) throw new NotFoundException(`Deal ${body.dealId} not found.`);
    const warning = await this.db.one(
      `SELECT id FROM deal_warning_definitions WHERE id = $1 AND is_active = TRUE`,
      [body.warningId],
    );
    if (!warning) throw new NotFoundException(`Warning definition ${body.warningId} not found or inactive.`);

    const id  = uuidv4();
    const row = await this.db.one(
      `INSERT INTO deal_warning_events (id, deal_id, warning_id, status, triggered_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, deal_id AS "dealId", warning_id AS "warningId", status, triggered_at AS "triggeredAt", created_at AS "createdAt"`,
      [id, body.dealId, body.warningId, body.status, body.triggeredAt],
    );
    try {
      const lifecycle = await this.db.one<{ board_id: string }>(
        `SELECT board_id FROM deal_lifecycle WHERE deal_id = $1 ORDER BY opened_at DESC LIMIT 1`,
        [body.dealId],
      );
      if (lifecycle?.board_id) this.matrixCache.invalidateByBoard(lifecycle.board_id);
    } catch { /* ignore */ }
    return row;
  }

  @Post('events/bulk')
  @Public()
  @UseGuards(WebhookSignatureGuard)
  async bulkCreateWarningEvents(@Body() body: BulkWarningEventDto) {
    const events = body.events;
    if (events.length === 0) return { inserted: 0, skipped: 0, errors: [] };

    const dealIds        = [...new Set(events.map((e) => e.dealId))];
    const validDealRows  = await this.db.many(`SELECT id FROM deals WHERE id = ANY($1::uuid[])`, [dealIds]);
    const validDealIds   = new Set(validDealRows.map((r: any) => r.id));
    const warningIds     = [...new Set(events.map((e) => e.warningId))];
    const validWarnRows  = await this.db.many(
      `SELECT id FROM deal_warning_definitions WHERE id = ANY($1::uuid[]) AND is_active = TRUE`,
      [warningIds],
    );
    const validWarningIds = new Set(validWarnRows.map((r: any) => r.id));

    const toInsert: typeof events = [];
    const errors: Array<{ index: number; reason: string }> = [];
    let skipped = 0;

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (!validDealIds.has(ev.dealId))    { errors.push({ index: i, reason: `Deal ${ev.dealId} not found.` }); skipped++; continue; }
      if (!validWarningIds.has(ev.warningId)) { errors.push({ index: i, reason: `Warning ${ev.warningId} not found or inactive.` }); skipped++; continue; }
      toInsert.push(ev);
    }
    if (toInsert.length === 0) return { inserted: 0, skipped, errors };

    const valuePlaceholders: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    for (const ev of toInsert) {
      valuePlaceholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, NOW())`);
      params.push(uuidv4(), ev.dealId, ev.warningId, ev.status, ev.triggeredAt);
    }
    await this.db.query(
      `INSERT INTO deal_warning_events (id, deal_id, warning_id, status, triggered_at, created_at) VALUES ${valuePlaceholders.join(', ')}`,
      params,
    );
    try {
      const affectedDealIds = [...new Set(toInsert.map((e) => e.dealId))];
      const lifecycles = await this.db.many<{ board_id: string }>(
        `SELECT DISTINCT board_id FROM deal_lifecycle WHERE deal_id = ANY($1::uuid[])`,
        [affectedDealIds],
      );
      for (const lc of lifecycles) { if (lc.board_id) this.matrixCache.invalidateByBoard(lc.board_id); }
    } catch { /* ignore */ }

    return { inserted: toInsert.length, skipped, errors };
  }

  // ─── Deal lifecycle management ───────────────────────────────────────────

  @Post('lifecycle')
  @Roles('revops', 'admin')
  async openDealLifecycle(@Body() body: OpenDealLifecycleDto) {
    const [deal, rep, board] = await Promise.all([
      this.db.one(`SELECT id FROM deals WHERE id = $1`, [body.dealId]),
      this.db.one(`SELECT id FROM users WHERE id = $1`, [body.repId]),
      this.db.one(`SELECT id FROM boards WHERE id = $1`, [body.boardId]),
    ]);
    if (!deal)  throw new NotFoundException(`Deal ${body.dealId} not found.`);
    if (!rep)   throw new NotFoundException(`Rep ${body.repId} not found.`);
    if (!board) throw new NotFoundException(`Board ${body.boardId} not found.`);

    const id  = uuidv4();
    const row = await this.db.one(
      `INSERT INTO deal_lifecycle (id, deal_id, rep_id, board_id, opened_at, closed_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NULL, NOW())
       ON CONFLICT (deal_id, rep_id, board_id) DO UPDATE SET opened_at = EXCLUDED.opened_at, closed_at = NULL
       RETURNING id, deal_id AS "dealId", rep_id AS "repId", board_id AS "boardId", opened_at AS "openedAt", closed_at AS "closedAt", created_at AS "createdAt"`,
      [id, body.dealId, body.repId, body.boardId, body.openedAt],
    );
    return row;
  }

  @Patch('lifecycle/:id/close')
  @Roles('revops', 'admin')
  async closeDealLifecycle(@Param('id', ParseUUIDPipe) lifecycleId: string, @Body() body: CloseDealLifecycleDto) {
    const row = await this.db.one(
      `UPDATE deal_lifecycle SET closed_at = $1 WHERE id = $2
       RETURNING id, deal_id AS "dealId", rep_id AS "repId", board_id AS "boardId", opened_at AS "openedAt", closed_at AS "closedAt"`,
      [body.closedAt, lifecycleId],
    );
    if (!row) throw new NotFoundException(`Lifecycle record ${lifecycleId} not found.`);
    return row;
  }

  @Post('reassignments')
  @Roles('revops', 'admin')
  async createDealReassignment(@Body() body: CreateDealReassignmentDto) {
    const [deal, fromRep, toRep] = await Promise.all([
      this.db.one(`SELECT id FROM deals WHERE id = $1`, [body.dealId]),
      this.db.one(`SELECT id FROM users WHERE id = $1`, [body.fromRepId]),
      this.db.one(`SELECT id FROM users WHERE id = $1`, [body.toRepId]),
    ]);
    if (!deal)    throw new NotFoundException(`Deal ${body.dealId} not found.`);
    if (!fromRep) throw new NotFoundException(`From-rep ${body.fromRepId} not found.`);
    if (!toRep)   throw new NotFoundException(`To-rep ${body.toRepId} not found.`);

    const id  = uuidv4();
    const row = await this.db.one(
      `INSERT INTO deal_reassignments (id, deal_id, from_rep_id, to_rep_id, reassigned_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, deal_id AS "dealId", from_rep_id AS "fromRepId", to_rep_id AS "toRepId", reassigned_at AS "reassignedAt", created_at AS "createdAt"`,
      [id, body.dealId, body.fromRepId, body.toRepId, body.reassignedAt],
    );
    return row;
  }
}
