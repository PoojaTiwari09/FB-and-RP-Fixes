import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from "@nestjs/common";
import { EPrivacyService } from "../services/eprivacy.service";
import { JwtAuthGuard } from "../../../../platform-core/guards/jwt.guard";
import { TenantGuard } from "../../../../platform-core/guards/tenant.guard";
import { M10DevAuthGuard } from "../../../guards/m10-dev-auth.guard";
import {
  UpdateEPrivacyConsentSchema,
  AddSuppressionSchema,
} from "../schemas/eprivacy.schema";
import { Request } from "express";

interface AuthRequest extends Request {
  tenantId: string;
}

const M10AuthGuard =
  process.env.M10_STANDALONE_AUTH === "true" ? M10DevAuthGuard : JwtAuthGuard;

@Controller("api/v1/m10-data-compliance/eprivacy")
@UseGuards(M10AuthGuard, TenantGuard)
export class EPrivacyController {
  private readonly logger = new Logger(EPrivacyController.name);

  constructor(private readonly service: EPrivacyService) {}

  @Post("consent")
  @HttpCode(HttpStatus.OK)
  async updateConsent(@Req() req: AuthRequest, @Body() body: unknown) {
    const parsed = UpdateEPrivacyConsentSchema.parse(body);
    return this.service.updateConsent(req.tenantId, parsed);
  }

  @Get("consent")
  async getConsentStatus(
    @Req() req: AuthRequest,
    @Query("email") email: string,
    @Query("channel") channel: string,
    @Query("purpose") purpose: string,
  ) {
    return this.service.checkConsent(req.tenantId, email, channel, purpose);
  }

  @Post("suppression")
  @HttpCode(HttpStatus.CREATED)
  async addSuppression(@Req() req: AuthRequest, @Body() body: unknown) {
    const parsed = AddSuppressionSchema.parse(body);
    return this.service.addSuppression(req.tenantId, parsed);
  }

  @Get("suppression")
  async checkSuppression(
    @Req() req: AuthRequest,
    @Query("email") email: string,
  ) {
    return this.service.checkSuppression(req.tenantId, email);
  }
}
