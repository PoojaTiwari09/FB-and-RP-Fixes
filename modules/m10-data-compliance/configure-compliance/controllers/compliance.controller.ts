// M10 Configure Compliance — Policy Management Controller
// Owned by: modules/m10-data-compliance/ (TDD Doc #11b v3.0)
// Endpoints: POST /policies, GET /policies, GET /policies/:id,
//            PATCH /policies/:id, DELETE /policies/:id
//            POST /compliance/optouts, GET /compliance/optouts
//            GET /compliance/audit-log

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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

import { ComplianceService } from "../services/compliance.service";
import { JwtAuthGuard } from "../../../platform-core/guards/jwt.guard";
import { TenantGuard } from "../../../platform-core/guards/tenant.guard";
import { M10DevAuthGuard } from "../../guards/m10-dev-auth.guard";
import {
  CreatePolicySchema,
  UpdatePolicySchema,
  UpsertOptOutSchema,
  CreateConsentLogSchema,
} from "../schemas/compliance.schema";

const M10AuthGuard =
  process.env.M10_STANDALONE_AUTH === "true" ? M10DevAuthGuard : JwtAuthGuard;

interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: { userId: string; tenantId: string; email: string };
}

@Controller("api/v1/m10-data-compliance")
@UseGuards(M10AuthGuard, TenantGuard)
export class ComplianceController {
  private readonly logger = new Logger(ComplianceController.name);

  constructor(private readonly service: ComplianceService) {}

  // ─── POST /policies (TDD §7.1) ────────────────────────────────────────────

  @Post("policies")
  @HttpCode(HttpStatus.CREATED)
  async createPolicy(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = CreatePolicySchema.safeParse(body);
    if (!parsed.success) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Invalid request body",
        errors: parsed.error.flatten(),
      };
    }
    this.logger.log(
      `POST /policies — tenant=${req.tenantId} channel=${parsed.data.channel}`,
    );
    return this.service.createPolicy(
      req.tenantId,
      parsed.data,
      req.user?.userId,
    );
  }

  // ─── GET /policies (TDD §7.2) ─────────────────────────────────────────────

  @Get("policies")
  async getPolicies(
    @Req() req: AuthenticatedRequest,
    @Query("activeOnly") activeOnly?: string,
  ) {
    this.logger.debug(`GET /policies — tenant=${req.tenantId}`);
    return this.service.getPolicies(req.tenantId, activeOnly === "true");
  }

  // ─── GET /policies/:id ────────────────────────────────────────────────────

  @Get("policies/:id")
  async getPolicyById(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    this.logger.debug(`GET /policies/${id} — tenant=${req.tenantId}`);
    return this.service.getPolicyById(req.tenantId, id);
  }

  // ─── PATCH /policies/:id ──────────────────────────────────────────────────

  @Patch("policies/:id")
  async updatePolicy(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
  ) {
    const parsed = UpdatePolicySchema.safeParse(body);
    if (!parsed.success) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Invalid request body",
        errors: parsed.error.flatten(),
      };
    }
    this.logger.log(`PATCH /policies/${id} — tenant=${req.tenantId}`);
    return this.service.updatePolicy(req.tenantId, id, parsed.data);
  }

  // ─── DELETE /policies/:id (deactivate, not hard-delete) ──────────────────

  @Delete("policies/:id")
  async deactivatePolicy(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    this.logger.log(
      `DELETE /policies/${id} — tenant=${req.tenantId} (deactivating)`,
    );
    return this.service.deactivatePolicy(req.tenantId, id);
  }

  // ─── Opt-Out Management ───────────────────────────────────────────────────

  @Post("compliance/optouts")
  @HttpCode(HttpStatus.CREATED)
  async upsertOptOut(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = UpsertOptOutSchema.safeParse(body);
    if (!parsed.success) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Invalid request body",
        errors: parsed.error.flatten(),
      };
    }
    return this.service.upsertOptOut(req.tenantId, parsed.data);
  }

  @Get("compliance/optouts")
  async getOptOuts(
    @Req() req: AuthenticatedRequest,
    @Query("email") email?: string,
  ) {
    return this.service.getOptOutsForContact(req.tenantId, email ?? "");
  }

  // ─── Consent Logs ─────────────────────────────────────────────────────────

  @Post("compliance/consent-logs")
  @HttpCode(HttpStatus.CREATED)
  async createConsentLog(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const parsed = CreateConsentLogSchema.safeParse(body);
    if (!parsed.success) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Invalid request body",
        errors: parsed.error.flatten(),
      };
    }
    return this.service.createConsentLog(req.tenantId, parsed.data);
  }

  @Get("compliance/consent-logs")
  async getConsentLogs(
    @Req() req: AuthenticatedRequest,
    @Query("email") email?: string,
  ) {
    return this.service.getConsentLogsForContact(req.tenantId, email ?? "");
  }

  // ─── Audit Log ────────────────────────────────────────────────────────────

  @Get("compliance/audit-log")
  async getAuditLog(
    @Req() req: AuthenticatedRequest,
    @Query("email") email?: string,
    @Query("decision") decision?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    this.logger.debug(`GET /compliance/audit-log — tenant=${req.tenantId}`);
    return this.service.getAuditLog(req.tenantId, {
      recipientEmail: email,
      decision,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }
}
