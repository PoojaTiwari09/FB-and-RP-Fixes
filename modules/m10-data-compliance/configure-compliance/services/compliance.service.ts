// M10 Configure Compliance — Policy Management Service
// Owned by: modules/m10-data-compliance/ (TDD Doc #11b v3.0)

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { ComplianceRepository } from "../repositories/compliance.repository";
import type {
  CreatePolicyDto,
  UpdatePolicyDto,
  UpsertOptOutDto,
  CreateConsentLogDto,
} from "../schemas/compliance.schema";

const COMPLIANCE_ENABLED = process.env.M10_COMPLIANCE_ENABLED !== "false";
const POLICY_WRITE_ENABLED =
  process.env.M10_COMPLIANCE_POLICY_WRITE_ENABLED !== "false";

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly repo: ComplianceRepository) {}

  // ─── Policy CRUD (TDD §7.1, §7.2) ────────────────────────────────────────

  async createPolicy(
    tenantId: string,
    dto: CreatePolicyDto,
    createdBy?: string,
  ) {
    if (!COMPLIANCE_ENABLED) {
      throw new ForbiddenException(
        "M10 Compliance is disabled — set M10_COMPLIANCE_ENABLED=true",
      );
    }
    if (!POLICY_WRITE_ENABLED) {
      throw new ForbiddenException(
        "Policy writes are disabled — set M10_COMPLIANCE_POLICY_WRITE_ENABLED=true",
      );
    }
    this.logger.log(
      `Creating compliance policy for tenant=${tenantId} channel=${dto.channel} region=${dto.regionFamily}`,
    );
    const policy = await this.repo.createPolicy(tenantId, dto);
    this.logger.log(`Policy created id=${policy.id} version=${policy.version}`);
    return this.formatPolicy(policy);
  }

  async getPolicies(tenantId: string, activeOnly = false) {
    const policies = await this.repo.findAllPolicies(tenantId, activeOnly);
    return policies.map((p) => this.formatPolicy(p));
  }

  async getPolicyById(tenantId: string, id: string) {
    const policy = await this.repo.findPolicyById(tenantId, id);
    if (!policy)
      throw new NotFoundException(`Compliance policy ${id} not found`);
    return this.formatPolicy(policy);
  }

  async updatePolicy(tenantId: string, id: string, dto: UpdatePolicyDto) {
    if (!POLICY_WRITE_ENABLED) {
      throw new ForbiddenException(
        "Policy writes are disabled — set M10_COMPLIANCE_POLICY_WRITE_ENABLED=true",
      );
    }
    const existing = await this.repo.findPolicyById(tenantId, id);
    if (!existing)
      throw new NotFoundException(`Compliance policy ${id} not found`);
    this.logger.log(
      `Updating compliance policy id=${id} tenant=${tenantId} (prev version=${existing.version})`,
    );
    const updated = await this.repo.updatePolicy(tenantId, id, dto);
    return this.formatPolicy(updated);
  }

  async deactivatePolicy(tenantId: string, id: string) {
    if (!POLICY_WRITE_ENABLED) {
      throw new ForbiddenException("Policy writes are disabled");
    }
    const existing = await this.repo.findPolicyById(tenantId, id);
    if (!existing)
      throw new NotFoundException(`Compliance policy ${id} not found`);
    const updated = await this.repo.deactivatePolicy(tenantId, id);
    this.logger.log(
      `Deactivated compliance policy id=${id} tenant=${tenantId}`,
    );
    return this.formatPolicy(updated);
  }

  // ─── Opt-Out Management ──────────────────────────────────────────────────

  async upsertOptOut(tenantId: string, dto: UpsertOptOutDto) {
    return this.repo.upsertOptOut(tenantId, dto);
  }

  async getOptOutsForContact(tenantId: string, contactEmail: string) {
    return this.repo.findAllOptOuts(tenantId, contactEmail);
  }

  // ─── Consent Logs ────────────────────────────────────────────────────────

  async createConsentLog(tenantId: string, dto: CreateConsentLogDto) {
    return this.repo.createConsentLog(tenantId, dto);
  }

  async getConsentLogsForContact(tenantId: string, contactEmail: string) {
    return this.repo.findAllConsentLogs(tenantId, contactEmail);
  }

  // ─── Audit Log ───────────────────────────────────────────────────────────

  async getAuditLog(
    tenantId: string,
    opts?: {
      recipientEmail?: string;
      decision?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    return this.repo.findAuditEntries(tenantId, opts);
  }

  // ─── Formatter ───────────────────────────────────────────────────────────

  private formatPolicy(p: any) {
    return {
      id: p.id,
      policyId: p.id,
      name: p.name,
      description: p.description ?? null,
      channel: p.channel,
      regionFamily: p.regionFamily,
      ruleDefinition: p.ruleDefinition,
      isActive: p.isActive,
      version: p.version,
      createdBy: p.createdBy ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
