// M10 Revenue Graph — REST Controller
// Owned by: modules/m10-data-compliance/ (TDD Doc #11a v3.0)
// Canonical API prefix: /api/v1/m10-data-compliance (TDD §7)
// All routes require: JwtAuthGuard → TenantGuard → TenantId on request.

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  ParseUUIDPipe,
} from "@nestjs/common";
import { Request } from "express";

import { RevenueGraphService } from "../services/revenue-graph.service";
import { JwtAuthGuard } from "../../../platform-core/guards/jwt.guard";
import { TenantGuard } from "../../../platform-core/guards/tenant.guard";
import { M10DevAuthGuard } from "../../guards/m10-dev-auth.guard";

const M10AuthGuard =
  process.env.M10_STANDALONE_AUTH === "true" ? M10DevAuthGuard : JwtAuthGuard;
import { TriggerCrmSyncSchema } from "../schemas/revenue-graph.schema";

interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: { userId: string; tenantId: string; email: string };
}

@Controller("api/v1/m10-data-compliance")
@UseGuards(M10AuthGuard, TenantGuard)
export class RevenueGraphController {
  private readonly logger = new Logger(RevenueGraphController.name);

  constructor(private readonly service: RevenueGraphService) {}

  // ─── ACCOUNTS (TDD §7.1) ─────────────────────────────────────────────────────

  /** GET /api/v1/m10-data-compliance/accounts */
  @Get("accounts")
  async getAccounts(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    this.logger.debug(`GET accounts — tenant=${req.tenantId}`);
    return this.service.getAccounts(req.tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  /** GET /api/v1/m10-data-compliance/accounts/:id */
  @Get("accounts/:id")
  async getAccountById(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    this.logger.debug(`GET account/${id} — tenant=${req.tenantId}`);
    return this.service.getAccountById(req.tenantId, id);
  }

  // ─── DEALS (TDD §7.2) ────────────────────────────────────────────────────────

  /** GET /api/v1/m10-data-compliance/deals */
  @Get("deals")
  async getDeals(
    @Req() req: AuthenticatedRequest,
    @Query("accountId") accountId?: string,
    @Query("isActive") isActive?: string,
    @Query("stage") stage?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    this.logger.debug(`GET deals — tenant=${req.tenantId}`);
    return this.service.getDeals(req.tenantId, {
      accountId,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
      stage,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /** GET /api/v1/m10-data-compliance/deals/:id */
  @Get("deals/:id")
  async getDealById(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.service.getDealById(req.tenantId, id);
  }

  /** GET /api/v1/m10-data-compliance/deals/:id/relationship (TDD §7.3) */
  @Get("deals/:id/relationship")
  async getDealRelationship(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    this.logger.debug(`GET deals/${id}/relationship — tenant=${req.tenantId}`);
    return this.service.getDealRelationship(req.tenantId, id);
  }

  // ─── CONTACTS ────────────────────────────────────────────────────────────────

  /** GET /api/v1/m10-data-compliance/contacts/:id */
  @Get("contacts/:id")
  async getContactById(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.service.getContactById(req.tenantId, id);
  }

  // ─── CRM SYNC ────────────────────────────────────────────────────────────────

  /** POST /api/v1/m10-data-compliance/crm-sync */
  @Post("crm-sync")
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerCrmSync(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const parsed = TriggerCrmSyncSchema.safeParse(body);
    if (!parsed.success) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Invalid request body",
        errors: parsed.error.flatten(),
      };
    }
    this.logger.log(
      `POST crm-sync — tenant=${req.tenantId}, source=${parsed.data.crmSource}`,
    );
    return this.service.triggerCrmSync(
      req.tenantId,
      parsed.data.crmSource,
      parsed.data.entityTypes,
    );
  }

  /** GET /api/v1/m10-data-compliance/crm-sync-status */
  @Get("crm-sync-status")
  async getCrmSyncStatus(@Req() req: AuthenticatedRequest) {
    return this.service.getCrmSyncStatus(req.tenantId);
  }
}
