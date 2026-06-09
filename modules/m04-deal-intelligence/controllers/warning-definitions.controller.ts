// src/modules/deal-drivers/warning-definitions.controller.ts
// US-28: Admin CRUD for deal warning definitions.
//
// All routes require JwtAuthGuard + revops|admin role.
// Audit logging is written inline via the thin helper below.

import {
  Body, ConflictException, Controller, Get, NotFoundException, Param,
  ParseUUIDPipe, Patch, Post, Req,
} from '@nestjs/common';
import { Roles } from '../interfaces/jwt.guard';
import { DatabaseService } from '../database/database.service';
import {
  CreateWarningDefinitionDto, UpdateWarningDefinitionDto,
} from '../schemas/deal-drivers.dto';
import { v4 as uuidv4 } from 'uuid';

@Controller('deal-drivers/warning-definitions')
@Roles('revops', 'admin')
export class WarningDefinitionsController {
  constructor(private readonly db: DatabaseService) {}

  /**
   * GET /deal-drivers/warning-definitions
   * List all warning definitions (active + inactive), ordered by label.
   */
  @Get()
  async listWarningDefinitions() {
    return this.db.many(
      `SELECT
         id,
         key,
         label,
         description,
         is_active   AS "isActive",
         created_at  AS "createdAt"
       FROM deal_warning_definitions
       ORDER BY label ASC`,
    );
  }

  /**
   * POST /deal-drivers/warning-definitions
   * Create a new warning definition.
   * Body: { key, label, description }
   */
  @Post()
  async createWarningDefinition(
    @Body() body: CreateWarningDefinitionDto,
    @Req() req: any,
  ) {
    // Check key uniqueness — throw 409 ConflictException if duplicate
    const existing = await this.db.one(
      `SELECT id FROM deal_warning_definitions WHERE key = $1`,
      [body.key],
    );
    if (existing) {
      throw new ConflictException(`Warning key "${body.key}" already exists.`);
    }

    const id = uuidv4();
    const row = await this.db.one(
      `INSERT INTO deal_warning_definitions (id, key, label, description, is_active, created_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW())
       RETURNING
         id, key, label, description,
         is_active  AS "isActive",
         created_at AS "createdAt"`,
      [id, body.key, body.label, body.description ?? null],
    );

    // US-37: audit log
    await this.writeAuditLog({
      entityType: 'warning_definition',
      entityId:   id,
      action:     'CREATE',
      actorId:    req.user?.sub,
      changes:    body,
    });

    return row;
  }

  /**
   * PATCH /deal-drivers/warning-definitions/:id
   * Update label, description, or isActive. Key cannot be changed.
   * Body: { label?, description?, isActive? }
   */
  @Patch(':id')
  async updateWarningDefinition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateWarningDefinitionDto,
    @Req() req: any,
  ) {
    const existing = await this.db.one(
      `SELECT id FROM deal_warning_definitions WHERE id = $1`,
      [id],
    );
    if (!existing) throw new NotFoundException(`Warning definition ${id} not found.`);

    const setClauses: string[] = [];
    const params: unknown[]    = [];
    let   idx = 1;

    if (body.label !== undefined)       { setClauses.push(`label = $${idx++}`);       params.push(body.label); }
    if (body.description !== undefined) { setClauses.push(`description = $${idx++}`); params.push(body.description); }
    if (body.isActive !== undefined)    { setClauses.push(`is_active = $${idx++}`);   params.push(body.isActive); }

    if (setClauses.length === 0) {
      return this.db.one(
        `SELECT id, key, label, description, is_active AS "isActive", created_at AS "createdAt"
           FROM deal_warning_definitions WHERE id = $1`,
        [id],
      );
    }

    params.push(id);
    const row = await this.db.one(
      `UPDATE deal_warning_definitions
          SET ${setClauses.join(', ')}
        WHERE id = $${idx}
       RETURNING
         id, key, label, description,
         is_active  AS "isActive",
         created_at AS "createdAt"`,
      params,
    );

    // US-37: audit log
    await this.writeAuditLog({
      entityType: 'warning_definition',
      entityId:   id,
      action:     'UPDATE',
      actorId:    req.user?.sub,
      changes:    body,
    });

    return row;
  }

  // ─── Audit helper ──────────────────────────────────────────────────────────
  // US-37: writes to audit_logs (migration 008_audit_logs.sql).
  // Silently swallows errors so the main operation is never blocked.

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
    } catch {
      // audit_logs table may not exist yet — fail silently
    }
  }
}
