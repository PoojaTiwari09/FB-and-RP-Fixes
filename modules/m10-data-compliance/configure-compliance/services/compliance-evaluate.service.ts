// M10 Configure Compliance — Runtime Evaluation Engine
// Owned by: modules/m10-data-compliance/ (TDD Doc #11b v3.0)
// TDD §5.1 Real-Time Evaluation Algorithm

import { Injectable, Logger } from "@nestjs/common";
import { ComplianceRepository } from "../repositories/compliance.repository";
import { EPrivacyRepository } from "../eprivacy/repositories/eprivacy.repository";
import { GdprRepository } from "../gdpr/repositories/gdpr.repository";
import { COMPLIANCE_REASON_CODES } from "../events/compliance.events";
import type { EvaluateOutreachDto } from "../schemas/compliance.schema";

const ENFORCEMENT_ENABLED =
  process.env.M10_COMPLIANCE_RUNTIME_ENFORCEMENT_ENABLED !== "false";
const FAIL_CLOSED =
  process.env.M10_COMPLIANCE_FAIL_CLOSED_ON_MISSING_OPTOUT !== "false";
const GDPR_ENABLED =
  process.env.M10_COMPLIANCE_GDPR_RULESET_ENABLED !== "false";
const CCPA_ENABLED =
  process.env.M10_COMPLIANCE_CCPA_RULESET_ENABLED !== "false";
const DEFAULT_ACTION = (process.env.M10_COMPLIANCE_DEFAULT_POLICY_ACTION ??
  "block") as "allow" | "block";
const CRM_OPTOUT_API_BASE =
  process.env.M10_COMPLIANCE_CRM_OPTOUT_API_BASE_URL ??
  "http://crm-adapter.internal";
const CRM_OPTOUT_API_KEY = process.env.M10_COMPLIANCE_CRM_OPTOUT_API_KEY ?? "";
const OPTOUT_API_TIMEOUT_MS = 5_000;

const GDPR_JURISDICTIONS = new Set([
  "EU",
  "DE",
  "FR",
  "IT",
  "ES",
  "NL",
  "PL",
  "SE",
  "NO",
  "FI",
  "DK",
  "AT",
  "BE",
  "PT",
  "CZ",
  "HU",
  "RO",
  "BG",
  "HR",
  "SK",
  "SI",
  "LT",
  "LV",
  "EE",
  "LU",
  "MT",
  "CY",
  "IE",
  "EL",
  "GB",
]);

const CCPA_JURISDICTIONS = new Set(["US-CA", "CA-US", "CALIFORNIA"]);

export interface EvaluationResult {
  decision: "allow" | "block";
  reasonCode: string;
  explanation?: string;
  correlationId: string;
  triggeredPolicyId?: string;
}

@Injectable()
export class ComplianceEvaluateService {
  private readonly logger = new Logger(ComplianceEvaluateService.name);

  constructor(
    private readonly repo: ComplianceRepository,
    private readonly eprivacyRepo: EPrivacyRepository,
    private readonly gdprRepo: GdprRepository,
  ) {}

  async evaluate(
    tenantId: string,
    dto: EvaluateOutreachDto,
  ): Promise<EvaluationResult> {
    const { correlationId, recipientEmail, channel, context } = dto;
    const jurisdiction = (context.jurisdiction ?? "GLOBAL").toUpperCase();

    this.logger.log(
      `Evaluating outreach correlationId=${correlationId} tenant=${tenantId} email=${recipientEmail} channel=${channel} jurisdiction=${jurisdiction}`,
    );

    if (!ENFORCEMENT_ENABLED) {
      const result: EvaluationResult = {
        decision: "allow",
        reasonCode: COMPLIANCE_REASON_CODES.ALLOW.POLICY_PASSED,
        explanation:
          "Enforcement engine is disabled (M10_COMPLIANCE_RUNTIME_ENFORCEMENT_ENABLED=false)",
        correlationId,
      };
      await this.writeAudit(tenantId, dto, result, null);
      return result;
    }

    let optOutRecord: { isOptedOut: boolean } | null = null;
    try {
      optOutRecord = await this.fetchOptOutState(
        tenantId,
        recipientEmail,
        channel,
      );
    } catch (err) {
      this.logger.warn(
        `Opt-out fetch failed for ${recipientEmail}: ${(err as Error).message}`,
      );
      if (FAIL_CLOSED) {
        const result: EvaluationResult = {
          decision: "block",
          reasonCode: COMPLIANCE_REASON_CODES.BLOCK.FAIL_CLOSED_MISSING_DATA,
          explanation: `Opt-out state could not be verified. Blocked per fail-closed policy. Error: ${(err as Error).message}`,
          correlationId,
        };
        await this.writeAudit(tenantId, dto, result, null);
        return result;
      }
    }

    const suppression = await this.eprivacyRepo.checkSuppression(
      tenantId,
      recipientEmail,
    );
    if (suppression) {
      const result: EvaluationResult = {
        decision: "block",
        reasonCode: COMPLIANCE_REASON_CODES.BLOCK.SUPPRESSED,
        explanation: `Contact is on the suppression list (reason: ${suppression.reason}).`,
        correlationId,
      };
      await this.writeAudit(tenantId, dto, result, null);
      return result;
    }

    const activeErasure = await this.gdprRepo.getActiveErasureRequest(
      tenantId,
      recipientEmail,
    );
    if (activeErasure) {
      const result: EvaluationResult = {
        decision: "block",
        reasonCode: COMPLIANCE_REASON_CODES.BLOCK.GDPR_ERASURE_IN_PROGRESS,
        explanation: `Contact has an active Right to Erasure (DSAR) request pending.`,
        correlationId,
      };
      await this.writeAudit(tenantId, dto, result, null);
      return result;
    }

    if (optOutRecord?.isOptedOut === true) {
      const result: EvaluationResult = {
        decision: "block",
        reasonCode: COMPLIANCE_REASON_CODES.BLOCK.CRM_OPTED_OUT,
        explanation: `Contact ${recipientEmail} has opted out of ${channel} communications.`,
        correlationId,
      };
      await this.writeAudit(tenantId, dto, result, null);
      return result;
    }

    const policies = await this.repo.findActivePoliciesForChannel(
      tenantId,
      channel,
    );

    if (policies.length === 0 && DEFAULT_ACTION === "block") {
      const result: EvaluationResult = {
        decision: "block",
        reasonCode: COMPLIANCE_REASON_CODES.BLOCK.NO_ACTIVE_POLICY,
        explanation: `No active compliance policies configured for channel=${channel}. Default action is 'block'.`,
        correlationId,
      };
      await this.writeAudit(tenantId, dto, result, null);
      return result;
    }

    if (GDPR_ENABLED && GDPR_JURISDICTIONS.has(jurisdiction)) {
      const consentLog = await this.repo.findLatestConsentForContact(
        tenantId,
        recipientEmail,
        "email_marketing",
      );
      if (!consentLog || consentLog.status !== "granted") {
        const result: EvaluationResult = {
          decision: "block",
          reasonCode: COMPLIANCE_REASON_CODES.BLOCK.GDPR_CONSENT_REQUIRED,
          explanation: `Contact resides in ${jurisdiction} (EU/GDPR). No active explicit consent record found.`,
          correlationId,
        };
        await this.writeAudit(tenantId, dto, result, null);
        return result;
      }
    }

    if (CCPA_ENABLED && CCPA_JURISDICTIONS.has(jurisdiction)) {
      const optOut = await this.repo.findOptOut(
        tenantId,
        recipientEmail,
        channel,
      );
      if (optOut?.isOptedOut) {
        const result: EvaluationResult = {
          decision: "block",
          reasonCode: COMPLIANCE_REASON_CODES.BLOCK.CCPA_RESTRICTED,
          explanation: `Contact is in California (CCPA). Contact has opted out of the sale/sharing of personal information.`,
          correlationId,
        };
        await this.writeAudit(tenantId, dto, result, null);
        return result;
      }
    }

    if (
      GDPR_JURISDICTIONS.has(jurisdiction) &&
      (channel === "email" || channel === "sms")
    ) {
      const eprivacyConsent = await this.eprivacyRepo.getConsentStatus(
        tenantId,
        recipientEmail,
        channel,
        "marketing",
      );
      if (!eprivacyConsent || eprivacyConsent.status !== "granted") {
        const result: EvaluationResult = {
          decision: "block",
          reasonCode: COMPLIANCE_REASON_CODES.BLOCK.EPRIVACY_CONSENT_REQUIRED,
          explanation: `Contact resides in ${jurisdiction} (EU). Explicit ePrivacy consent required for ${channel} marketing.`,
          correlationId,
        };
        await this.writeAudit(tenantId, dto, result, null);
        return result;
      }
    }

    for (const policy of policies) {
      const ruleDef = policy.ruleDefinition as Record<string, unknown>;
      if (ruleDef.requireExplicitConsent) {
        const consentLog = await this.repo.findLatestConsentForContact(
          tenantId,
          recipientEmail,
          "email_marketing",
        );
        if (!consentLog || consentLog.status !== "granted") {
          const result: EvaluationResult = {
            decision: "block",
            reasonCode: COMPLIANCE_REASON_CODES.BLOCK.GDPR_CONSENT_REQUIRED,
            explanation: `Policy "${policy.name}" requires explicit consent. None found for ${recipientEmail}.`,
            correlationId,
            triggeredPolicyId: policy.id,
          };
          await this.writeAudit(tenantId, dto, result, policy.id);
          return result;
        }
      }
    }

    const result: EvaluationResult = {
      decision: "allow",
      reasonCode: COMPLIANCE_REASON_CODES.ALLOW.POLICY_PASSED,
      explanation: "All compliance checks passed.",
      correlationId,
    };
    await this.writeAudit(tenantId, dto, result, null);
    return result;
  }

  private async fetchOptOutState(
    tenantId: string,
    contactEmail: string,
    channel: string,
  ): Promise<{ isOptedOut: boolean } | null> {
    const cached = await this.repo.findOptOut(tenantId, contactEmail, channel);
    if (cached) return cached;

    const url = `${CRM_OPTOUT_API_BASE}/api/v1/crm/optout?email=${encodeURIComponent(contactEmail)}&channel=${channel}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPTOUT_API_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: { "x-api-key": CRM_OPTOUT_API_KEY, "x-tenant-id": tenantId },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`CRM opt-out API returned HTTP ${response.status}`);
      }
      const data = (await response.json()) as { isOptedOut: boolean };
      await this.repo.upsertOptOut(tenantId, {
        contactEmail,
        channel: channel as "email" | "call" | "sms",
        isOptedOut: data.isOptedOut,
      });
      return data;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  private async writeAudit(
    tenantId: string,
    dto: EvaluateOutreachDto,
    result: EvaluationResult,
    triggeredPolicyId: string | null,
  ): Promise<void> {
    try {
      await this.repo.createAuditEntry({
        tenantId,
        correlationId: dto.correlationId,
        recipientEmail: dto.recipientEmail,
        channel: dto.channel,
        decision: result.decision,
        reasonCode: result.reasonCode,
        explanation: result.explanation,
        triggeredPolicyId: triggeredPolicyId ?? undefined,
        evaluationMetadata: {
          jurisdiction: dto.context.jurisdiction ?? "GLOBAL",
          outboundType: dto.context.outboundType ?? null,
          senderId: dto.context.senderId ?? null,
          contactId: dto.context.contactId ?? null,
          enforcementEnabled: ENFORCEMENT_ENABLED,
          gdprEnabled: GDPR_ENABLED,
          ccpaEnabled: CCPA_ENABLED,
        },
      });
    } catch (auditErr) {
      this.logger.error(
        `Failed to write audit entry for correlationId=${dto.correlationId}: ${(auditErr as Error).message}`,
      );
    }
  }
}
