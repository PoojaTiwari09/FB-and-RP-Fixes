// M10 Configure Compliance — Runtime Evaluation Controller
// Owned by: modules/m10-data-compliance/ (TDD Doc #11b v3.0)
// TDD §7.3: POST /api/v1/m10-data-compliance/evaluate
// This is the critical outreach gate called by M8 Sales Engagement
// before any email, call, or SMS is dispatched.

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request } from "express";

import { ComplianceEvaluateService } from "../services/compliance-evaluate.service";
import { JwtAuthGuard } from "../../../platform-core/guards/jwt.guard";
import { TenantGuard } from "../../../platform-core/guards/tenant.guard";
import { M10DevAuthGuard } from "../../guards/m10-dev-auth.guard";
import { EvaluateOutreachSchema } from "../schemas/compliance.schema";

const M10AuthGuard =
  process.env.M10_STANDALONE_AUTH === "true" ? M10DevAuthGuard : JwtAuthGuard;

interface AuthenticatedRequest extends Request {
  tenantId: string;
  user: { userId: string; tenantId: string; email: string };
}

@Controller("api/v1/m10-data-compliance")
@UseGuards(M10AuthGuard, TenantGuard)
export class ComplianceEvaluateController {
  private readonly logger = new Logger(ComplianceEvaluateController.name);

  constructor(private readonly evaluateService: ComplianceEvaluateService) {}

  /**
   * POST /api/v1/m10-data-compliance/evaluate
   *
   * TDD §7.3 — Runtime outreach gate.
   * Called by M8 Sales Engagement before dispatching any outbound communication.
   *
   * Returns:
   *   200 OK  → { decision: "allow", reasonCode: "POLICY_PASSED", correlationId }
   *   403     → { decision: "block", reasonCode: "GDPR_CONSENT_REQUIRED", explanation, correlationId }
   */
  @Post("evaluate")
  @HttpCode(HttpStatus.OK)
  async evaluate(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = EvaluateOutreachSchema.safeParse(body);
    if (!parsed.success) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Invalid evaluation request body",
        errors: parsed.error.flatten(),
      };
    }

    const dto = parsed.data;
    this.logger.log(
      `POST /evaluate — correlationId=${dto.correlationId} tenant=${req.tenantId} recipient=${dto.recipientEmail} channel=${dto.channel}`,
    );

    const result = await this.evaluateService.evaluate(req.tenantId, dto);

    if (result.decision === "block") {
      this.logger.warn(
        `BLOCKED outreach correlationId=${dto.correlationId} reason=${result.reasonCode} tenant=${req.tenantId}`,
      );
      return {
        decision: "block",
        reasonCode: result.reasonCode,
        explanation: result.explanation,
        correlationId: result.correlationId,
        triggeredPolicyId: result.triggeredPolicyId ?? null,
      };
    }

    return {
      decision: "allow",
      reasonCode: result.reasonCode,
      correlationId: result.correlationId,
    };
  }
}
