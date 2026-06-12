import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { GdprDsarService } from "../services/gdpr-dsar.service";
import { GdprErasureService } from "../services/gdpr-erasure.service";
import { GdprPortabilityService } from "../services/gdpr-portability.service";
import { GdprRopaService } from "../services/gdpr-ropa.service";
import { JwtAuthGuard } from "../../../../platform-core/guards/jwt.guard";
import { TenantGuard } from "../../../../platform-core/guards/tenant.guard";
import { M10DevAuthGuard } from "../../../guards/m10-dev-auth.guard";
import {
  CreateDsarSchema,
  UpdateDsarStatusSchema,
  CreateRopaSchema,
  CreateDataBreachSchema,
} from "../schemas/gdpr.schema";
import { Request } from "express";

interface AuthRequest extends Request {
  tenantId: string;
}

const M10AuthGuard =
  process.env.M10_STANDALONE_AUTH === "true" ? M10DevAuthGuard : JwtAuthGuard;

@Controller("api/v1/m10-data-compliance/gdpr")
@UseGuards(M10AuthGuard, TenantGuard)
export class GdprController {
  private readonly logger = new Logger(GdprController.name);

  constructor(
    private readonly dsarService: GdprDsarService,
    private readonly erasureService: GdprErasureService,
    private readonly portabilityService: GdprPortabilityService,
    private readonly ropaService: GdprRopaService,
  ) {}

  @Post("dsar")
  @HttpCode(HttpStatus.CREATED)
  async createDsar(@Req() req: AuthRequest, @Body() body: unknown) {
    const parsed = CreateDsarSchema.parse(body);
    return this.dsarService.createDsar(req.tenantId, parsed);
  }

  @Patch("dsar/:id/status")
  async updateDsarStatus(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const parsed = UpdateDsarStatusSchema.parse(body);
    return this.dsarService.updateDsarStatus(req.tenantId, id, parsed);
  }

  @Post("dsar/:id/execute-erasure")
  async executeErasure(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body("contactEmail") contactEmail: string,
  ) {
    return this.erasureService.executeErasure(req.tenantId, id, contactEmail);
  }

  @Get("dsar/portability")
  async getPortabilityExport(
    @Req() req: AuthRequest,
    @Body("contactEmail") contactEmail: string,
  ) {
    return this.portabilityService.generatePortabilityExport(
      req.tenantId,
      contactEmail,
    );
  }

  @Post("ropa")
  @HttpCode(HttpStatus.CREATED)
  async createRopa(@Req() req: AuthRequest, @Body() body: unknown) {
    const parsed = CreateRopaSchema.parse(body);
    return this.ropaService.createRopa(req.tenantId, parsed);
  }

  @Post("data-breach")
  @HttpCode(HttpStatus.CREATED)
  async createDataBreach(@Req() req: AuthRequest, @Body() body: unknown) {
    const parsed = CreateDataBreachSchema.parse(body);
    return this.ropaService.createDataBreach(req.tenantId, parsed);
  }
}
