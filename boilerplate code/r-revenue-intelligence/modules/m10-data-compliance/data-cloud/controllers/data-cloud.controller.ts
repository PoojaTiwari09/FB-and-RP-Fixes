// M10 Data Cloud — REST Controller
// Owned by: modules/m10-data-compliance/ (TDD Doc #11c v3.0)
// Canonical API prefix: /api/v1/m10-data-compliance (TDD §7)

import {
  Controller, Get, Post, Param, Query, Body,
  UseGuards, Req, HttpCode, HttpStatus, Logger, ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';

import { DataCloudService } from '../services/data-cloud.service';
import { JwtAuthGuard } from '../../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../../platform-core/guards/tenant.guard';
import { RegisterConnectionSchema, ReplayExportSchema } from '../schemas/data-cloud.schema';

interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: { userId: string; tenantId: string; email: string };
}

@Controller('api/v1/m10-data-compliance')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DataCloudController {
  private readonly logger = new Logger(DataCloudController.name);

  constructor(private readonly service: DataCloudService) {}

  // ─── POST /exports/connections ─────────────────────────────────────────────
  /** Register a new warehouse destination (TDD §7.1) */
  @Post('exports/connections')
  @HttpCode(HttpStatus.CREATED)
  async registerConnection(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = RegisterConnectionSchema.safeParse(body);
    if (!parsed.success) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'Invalid request body', errors: parsed.error.flatten() };
    }
    this.logger.log(`POST exports/connections — tenant=${req.tenantId} dest=${parsed.data.destination}`);
    return this.service.registerConnection(req.tenantId, parsed.data);
  }

  // ─── GET /exports/connections ──────────────────────────────────────────────
  /** List all registered connections for this tenant */
  @Get('exports/connections')
  async getConnections(@Req() req: AuthenticatedRequest) {
    this.logger.debug(`GET exports/connections — tenant=${req.tenantId}`);
    return this.service.getConnections(req.tenantId);
  }

  // ─── POST /exports/connections/:id/test ───────────────────────────────────
  /** Test a connection — validates connectivity without permanent export (TDD §7.2) */
  @Post('exports/connections/:id/test')
  @HttpCode(HttpStatus.OK)
  async testConnection(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    this.logger.log(`POST exports/connections/${id}/test — tenant=${req.tenantId}`);
    return this.service.testConnection(req.tenantId, id);
  }

  // ─── POST /exports/replay ─────────────────────────────────────────────────
  /** Trigger manual replay for a failed or missed export window (TDD §7.3) */
  @Post('exports/replay')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerReplay(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = ReplayExportSchema.safeParse(body);
    if (!parsed.success) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'Invalid request body', errors: parsed.error.flatten() };
    }
    this.logger.log(`POST exports/replay — tenant=${req.tenantId} dataset=${parsed.data.datasetName}`);
    return this.service.triggerReplay(req.tenantId, parsed.data);
  }

  // ─── GET /exports/runs ────────────────────────────────────────────────────
  /** Get export run history for this tenant */
  @Get('exports/runs')
  async getExportRuns(
    @Req() req: AuthenticatedRequest,
    @Query('connectionId') connectionId?: string,
  ) {
    this.logger.debug(`GET exports/runs — tenant=${req.tenantId}`);
    return this.service.getExportRuns(req.tenantId, connectionId);
  }
}
