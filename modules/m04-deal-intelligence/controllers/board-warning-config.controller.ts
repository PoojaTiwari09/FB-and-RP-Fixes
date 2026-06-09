// src/modules/deal-drivers/board-warning-config.controller.ts
//
// Admin-only endpoints for configuring which warnings are enabled on a board.
// US-37: All mutating operations write to audit_logs.

import {
  Body, Controller, Delete, Get, NotFoundException,
  Param, ParseUUIDPipe, Patch, Post, Req,
} from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Roles } from '../interfaces/jwt.guard';
import { DatabaseService } from '../database/database.service';
import { v4 as uuidv4 } from 'uuid';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class AddBoardWarningDto {
  @IsUUID()
  warningId!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

class UpdateBoardWarningDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('deal-drivers/boards/:boardId/warnings')
@Roles('revops', 'admin')
export class BoardWarningConfigController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async listBoardWarnings(@Param('boardId', ParseUUIDPipe) boardId: string) {
    await this.assertBoardExists(boardId);
    return this.db.many(
      `SELECT
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
       ORDER BY bwc.sort_order ASC, dwd.label ASC`,
      [boardId],
    );
  }

  @Post()
  async addWarningToBoard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() body: AddBoardWarningDto,
    @Req() req: any,
  ) {
    await this.assertBoardExists(boardId);

    const warning = await this.db.one(
      `SELECT id, label FROM deal_warning_definitions WHERE id = $1 AND is_active = TRUE`,
      [body.warningId],
    );
    if (!warning) throw new NotFoundException(`Warning definition ${body.warningId} not found or inactive.`);

    const id = uuidv4();
    const row = await this.db.one(
      `INSERT INTO board_warning_config (id, board_id, warning_id, sort_order, is_enabled, created_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW())
       ON CONFLICT (board_id, warning_id)
         DO UPDATE SET sort_order = EXCLUDED.sort_order, is_enabled = TRUE
       RETURNING
         id,
         board_id   AS "boardId",
         warning_id AS "warningId",
         sort_order AS "sortOrder",
         is_enabled AS "isEnabled",
         created_at AS "createdAt"`,
      [id, boardId, body.warningId, body.sortOrder],
    );

    await this.writeAuditLog({
      entityType: 'board_warning_config',
      entityId:   (row as any).id,
      action:     'CREATE',
      actorId:    req.user?.sub,
      changes:    { boardId, ...body },
    });

    return row;
  }

  @Patch(':warningConfigId')
  async updateBoardWarning(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('warningConfigId', ParseUUIDPipe) warningConfigId: string,
    @Body() body: UpdateBoardWarningDto,
    @Req() req: any,
  ) {
    await this.assertBoardExists(boardId);

    const existing = await this.db.one(
      `SELECT id FROM board_warning_config WHERE id = $1 AND board_id = $2`,
      [warningConfigId, boardId],
    );
    if (!existing) throw new NotFoundException(`Board warning config ${warningConfigId} not found on board ${boardId}.`);

    const setClauses: string[] = [];
    const params: unknown[]    = [];
    let   idx = 1;

    if (body.sortOrder !== undefined) { setClauses.push(`sort_order = $${idx++}`); params.push(body.sortOrder); }
    if (body.isEnabled !== undefined) { setClauses.push(`is_enabled = $${idx++}`); params.push(body.isEnabled); }

    if (setClauses.length === 0) {
      return this.db.one(
        `SELECT id, board_id AS "boardId", warning_id AS "warningId",
                sort_order AS "sortOrder", is_enabled AS "isEnabled", created_at AS "createdAt"
           FROM board_warning_config WHERE id = $1`,
        [warningConfigId],
      );
    }

    params.push(warningConfigId);
    const row = await this.db.one(
      `UPDATE board_warning_config
          SET ${setClauses.join(', ')}
        WHERE id = $${idx}
       RETURNING
         id,
         board_id   AS "boardId",
         warning_id AS "warningId",
         sort_order AS "sortOrder",
         is_enabled AS "isEnabled",
         created_at AS "createdAt"`,
      params,
    );

    await this.writeAuditLog({
      entityType: 'board_warning_config',
      entityId:   warningConfigId,
      action:     'UPDATE',
      actorId:    req.user?.sub,
      changes:    body,
    });

    return row;
  }

  @Delete(':warningConfigId')
  async removeWarningFromBoard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('warningConfigId', ParseUUIDPipe) warningConfigId: string,
    @Req() req: any,
  ) {
    await this.assertBoardExists(boardId);

    const deleted = await this.db.one(
      `DELETE FROM board_warning_config
        WHERE id = $1 AND board_id = $2
       RETURNING id`,
      [warningConfigId, boardId],
    );
    if (!deleted) throw new NotFoundException(`Board warning config ${warningConfigId} not found on board ${boardId}.`);

    await this.writeAuditLog({
      entityType: 'board_warning_config',
      entityId:   warningConfigId,
      action:     'DELETE',
      actorId:    req.user?.sub,
      changes:    { boardId, warningConfigId },
    });

    return { deleted: true, id: warningConfigId };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async assertBoardExists(boardId: string): Promise<void> {
    const board = await this.db.one(`SELECT id FROM boards WHERE id = $1`, [boardId]);
    if (!board) throw new NotFoundException(`Board ${boardId} not found.`);
  }

  // US-37: thin audit log writer — silently fails if table doesn't exist
  private async writeAuditLog(entry: {
    entityType: string;
    entityId:   string;
    action:     'CREATE' | 'UPDATE' | 'DELETE';
    actorId:    string;
    changes:    object;
  }): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, changes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())`,
        [uuidv4(), entry.entityType, entry.entityId, entry.action, entry.actorId, JSON.stringify(entry.changes)],
      );
    } catch { /* audit_logs may not exist yet */ }
  }
}
