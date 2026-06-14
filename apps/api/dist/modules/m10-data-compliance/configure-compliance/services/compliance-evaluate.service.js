"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ComplianceEvaluateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceEvaluateService = void 0;
const common_1 = require("@nestjs/common");
const compliance_repository_1 = require("../repositories/compliance.repository");
const eprivacy_repository_1 = require("../eprivacy/repositories/eprivacy.repository");
const gdpr_repository_1 = require("../gdpr/repositories/gdpr.repository");
const compliance_events_1 = require("../events/compliance.events");
const ENFORCEMENT_ENABLED = process.env.M10_COMPLIANCE_RUNTIME_ENFORCEMENT_ENABLED !== 'false';
const FAIL_CLOSED = process.env.M10_COMPLIANCE_FAIL_CLOSED_ON_MISSING_OPTOUT !== 'false';
const GDPR_ENABLED = process.env.M10_COMPLIANCE_GDPR_RULESET_ENABLED !== 'false';
const CCPA_ENABLED = process.env.M10_COMPLIANCE_CCPA_RULESET_ENABLED !== 'false';
const DEFAULT_ACTION = (process.env.M10_COMPLIANCE_DEFAULT_POLICY_ACTION ?? 'block');
const CRM_OPTOUT_API_BASE = process.env.M10_COMPLIANCE_CRM_OPTOUT_API_BASE_URL ?? 'http://crm-adapter.internal';
const CRM_OPTOUT_API_KEY = process.env.M10_COMPLIANCE_CRM_OPTOUT_API_KEY ?? '';
const OPTOUT_API_TIMEOUT_MS = 5_000;
const GDPR_JURISDICTIONS = new Set([
    'EU', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'SE', 'NO', 'FI', 'DK', 'AT', 'BE',
    'PT', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'LU', 'MT', 'CY', 'IE', 'EL', 'GB',
]);
const CCPA_JURISDICTIONS = new Set(['US-CA', 'CA-US', 'CALIFORNIA']);
let ComplianceEvaluateService = ComplianceEvaluateService_1 = class ComplianceEvaluateService {
    repo;
    eprivacyRepo;
    gdprRepo;
    logger = new common_1.Logger(ComplianceEvaluateService_1.name);
    constructor(repo, eprivacyRepo, gdprRepo) {
        this.repo = repo;
        this.eprivacyRepo = eprivacyRepo;
        this.gdprRepo = gdprRepo;
    }
    async evaluate(tenantId, dto) {
        const { correlationId, recipientEmail, channel, context } = dto;
        const jurisdiction = (context.jurisdiction ?? 'GLOBAL').toUpperCase();
        this.logger.log(`Evaluating outreach correlationId=${correlationId} tenant=${tenantId} email=${recipientEmail} channel=${channel} jurisdiction=${jurisdiction}`);
        if (!ENFORCEMENT_ENABLED) {
            const result = {
                decision: 'allow',
                reasonCode: compliance_events_1.COMPLIANCE_REASON_CODES.ALLOW.POLICY_PASSED,
                explanation: 'Enforcement engine is disabled (M10_COMPLIANCE_RUNTIME_ENFORCEMENT_ENABLED=false)',
                correlationId,
            };
            await this.writeAudit(tenantId, dto, result, null);
            return result;
        }
        let optOutRecord = null;
        try {
            optOutRecord = await this.fetchOptOutState(tenantId, recipientEmail, channel);
        }
        catch (err) {
            this.logger.warn(`Opt-out fetch failed for ${recipientEmail}: ${err.message}`);
            if (FAIL_CLOSED) {
                const result = {
                    decision: 'block',
                    reasonCode: compliance_events_1.COMPLIANCE_REASON_CODES.BLOCK.FAIL_CLOSED_MISSING_DATA,
                    explanation: `Opt-out state could not be verified. Blocked per fail-closed policy. Error: ${err.message}`,
                    correlationId,
                };
                await this.writeAudit(tenantId, dto, result, null);
                return result;
            }
        }
        const suppression = await this.eprivacyRepo.checkSuppression(tenantId, recipientEmail);
        if (suppression) {
            const result = {
                decision: 'block',
                reasonCode: compliance_events_1.COMPLIANCE_REASON_CODES.BLOCK.SUPPRESSED,
                explanation: `Contact is on the suppression list (reason: ${suppression.reason}).`,
                correlationId,
            };
            await this.writeAudit(tenantId, dto, result, null);
            return result;
        }
        const activeErasure = await this.gdprRepo.getActiveErasureRequest(tenantId, recipientEmail);
        if (activeErasure) {
            const result = {
                decision: 'block',
                reasonCode: compliance_events_1.COMPLIANCE_REASON_CODES.BLOCK.GDPR_ERASURE_IN_PROGRESS,
                explanation: `Contact has an active Right to Erasure (DSAR) request pending.`,
                correlationId,
            };
            await this.writeAudit(tenantId, dto, result, null);
            return result;
        }
        if (optOutRecord?.isOptedOut === true) {
            const result = {
                decision: 'block',
                reasonCode: compliance_events_1.COMPLIANCE_REASON_CODES.BLOCK.CRM_OPTED_OUT,
                explanation: `Contact ${recipientEmail} has opted out of ${channel} communications.`,
                correlationId,
            };
            await this.writeAudit(tenantId, dto, result, null);
            return result;
        }
        const policies = await this.repo.findActivePoliciesForChannel(tenantId, channel);
        if (policies.length === 0 && DEFAULT_ACTION === 'block') {
            const result = {
                decision: 'block',
                reasonCode: compliance_events_1.COMPLIANCE_REASON_CODES.BLOCK.NO_ACTIVE_POLICY,
                explanation: `No active compliance policies configured for channel=${channel}. Default action is 'block'.`,
                correlationId,
            };
            await this.writeAudit(tenantId, dto, result, null);
            return result;
        }
        if (GDPR_ENABLED && GDPR_JURISDICTIONS.has(jurisdiction)) {
            const consentLog = await this.repo.findLatestConsentForContact(tenantId, recipientEmail, 'email_marketing');
            if (!consentLog || consentLog.status !== 'granted') {
                const result = {
                    decision: 'block',
                    reasonCode: compliance_events_1.COMPLIANCE_REASON_CODES.BLOCK.GDPR_CONSENT_REQUIRED,
                    explanation: `Contact resides in ${jurisdiction} (EU/GDPR). No active explicit consent record found.`,
                    correlationId,
                };
                await this.writeAudit(tenantId, dto, result, null);
                return result;
            }
        }
        if (CCPA_ENABLED && CCPA_JURISDICTIONS.has(jurisdiction)) {
            const optOut = await this.repo.findOptOut(tenantId, recipientEmail, channel);
            if (optOut?.isOptedOut) {
                const result = {
                    decision: 'block',
                    reasonCode: compliance_events_1.COMPLIANCE_REASON_CODES.BLOCK.CCPA_RESTRICTED,
                    explanation: `Contact is in California (CCPA). Contact has opted out of the sale/sharing of personal information.`,
                    correlationId,
                };
                await this.writeAudit(tenantId, dto, result, null);
                return result;
            }
        }
        if (GDPR_JURISDICTIONS.has(jurisdiction) && (channel === 'email' || channel === 'sms')) {
            const eprivacyConsent = await this.eprivacyRepo.getConsentStatus(tenantId, recipientEmail, channel, 'marketing');
            if (!eprivacyConsent || eprivacyConsent.status !== 'granted') {
                const result = {
                    decision: 'block',
                    reasonCode: compliance_events_1.COMPLIANCE_REASON_CODES.BLOCK.EPRIVACY_CONSENT_REQUIRED,
                    explanation: `Contact resides in ${jurisdiction} (EU). Explicit ePrivacy consent required for ${channel} marketing.`,
                    correlationId,
                };
                await this.writeAudit(tenantId, dto, result, null);
                return result;
            }
        }
        for (const policy of policies) {
            const ruleDef = policy.ruleDefinition;
            if (ruleDef.requireExplicitConsent) {
                const consentLog = await this.repo.findLatestConsentForContact(tenantId, recipientEmail, 'email_marketing');
                if (!consentLog || consentLog.status !== 'granted') {
                    const result = {
                        decision: 'block',
                        reasonCode: compliance_events_1.COMPLIANCE_REASON_CODES.BLOCK.GDPR_CONSENT_REQUIRED,
                        explanation: `Policy "${policy.name}" requires explicit consent. None found for ${recipientEmail}.`,
                        correlationId,
                        triggeredPolicyId: policy.id,
                    };
                    await this.writeAudit(tenantId, dto, result, policy.id);
                    return result;
                }
            }
        }
        const result = {
            decision: 'allow',
            reasonCode: compliance_events_1.COMPLIANCE_REASON_CODES.ALLOW.POLICY_PASSED,
            explanation: 'All compliance checks passed.',
            correlationId,
        };
        await this.writeAudit(tenantId, dto, result, null);
        return result;
    }
    async fetchOptOutState(tenantId, contactEmail, channel) {
        const cached = await this.repo.findOptOut(tenantId, contactEmail, channel);
        if (cached)
            return cached;
        const url = `${CRM_OPTOUT_API_BASE}/api/v1/crm/optout?email=${encodeURIComponent(contactEmail)}&channel=${channel}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), OPTOUT_API_TIMEOUT_MS);
        try {
            const response = await fetch(url, {
                headers: { 'x-api-key': CRM_OPTOUT_API_KEY, 'x-tenant-id': tenantId },
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!response.ok) {
                throw new Error(`CRM opt-out API returned HTTP ${response.status}`);
            }
            const data = (await response.json());
            await this.repo.upsertOptOut(tenantId, { contactEmail, channel: channel, isOptedOut: data.isOptedOut });
            return data;
        }
        catch (err) {
            clearTimeout(timeout);
            throw err;
        }
    }
    async writeAudit(tenantId, dto, result, triggeredPolicyId) {
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
                    jurisdiction: dto.context.jurisdiction ?? 'GLOBAL',
                    outboundType: dto.context.outboundType ?? null,
                    senderId: dto.context.senderId ?? null,
                    contactId: dto.context.contactId ?? null,
                    enforcementEnabled: ENFORCEMENT_ENABLED,
                    gdprEnabled: GDPR_ENABLED,
                    ccpaEnabled: CCPA_ENABLED,
                },
            });
        }
        catch (auditErr) {
            this.logger.error(`Failed to write audit entry for correlationId=${dto.correlationId}: ${auditErr.message}`);
        }
    }
};
exports.ComplianceEvaluateService = ComplianceEvaluateService;
exports.ComplianceEvaluateService = ComplianceEvaluateService = ComplianceEvaluateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [compliance_repository_1.ComplianceRepository,
        eprivacy_repository_1.EPrivacyRepository,
        gdpr_repository_1.GdprRepository])
], ComplianceEvaluateService);
//# sourceMappingURL=compliance-evaluate.service.js.map