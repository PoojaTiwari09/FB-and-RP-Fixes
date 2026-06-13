// M10 Configure Compliance — Prisma Repository
// Owned by: modules/m10-data-compliance/ (TDD Doc #11b v3.0)

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type {
  CreatePolicyDto,
  UpdatePolicyDto,
  UpsertOptOutDto,
  CreateConsentLogDto,
} from "../schemas/compliance.schema";

@Injectable()
export class ComplianceRepository {
  private readonly logger = new Logger(ComplianceRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Compliance Policies ──────────────────────────────────────────────────

  async createPolicy(tenantId: string, dto: CreatePolicyDto) {
    return this.prisma.m10CompliancePolicy.create({
      data: {
        tenantid: tenantId,
        name: dto.name,
        description: dto.description,
        channel: dto.channel,
        regionFamily: dto.regionFamily,
        ruleDefinition: dto.ruleDefinition as object,
        isActive: true,
        version: 1,
      },
    });
  }

  async findAllPolicies(tenantId: string, activeOnly = false) {
    return this.prisma.m10CompliancePolicy.findMany({
      where: {
        tenantid: tenantId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findPolicyById(tenantId: string, id: string) {
    return this.prisma.m10CompliancePolicy.findFirst({
      where: { id, tenantid: tenantId },
    });
  }

  async findActivePoliciesForChannel(tenantId: string, channel: string) {
    return this.prisma.m10CompliancePolicy.findMany({
      where: { tenantid: tenantId, channel, isActive: true },
    });
  }

  async updatePolicy(tenantId: string, id: string, dto: UpdatePolicyDto) {
    const existing = await this.prisma.m10CompliancePolicy.findFirst({
      where: { id, tenantid: tenantId },
    });
    return this.prisma.m10CompliancePolicy.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.channel !== undefined && { channel: dto.channel }),
        ...(dto.regionFamily !== undefined && {
          regionFamily: dto.regionFamily,
        }),
        ...(dto.ruleDefinition !== undefined && {
          ruleDefinition: dto.ruleDefinition as object,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        version: (existing?.version ?? 1) + 1,
      },
    });
  }

  async deactivatePolicy(tenantId: string, id: string) {
    const existing = await this.prisma.m10CompliancePolicy.findFirst({
      where: { id, tenantid: tenantId },
    });
    return this.prisma.m10CompliancePolicy.update({
      where: { id },
      data: { isActive: false, version: (existing?.version ?? 1) + 1 },
    });
  }

  // ─── CRM Opt-Outs ─────────────────────────────────────────────────────────

  async upsertOptOut(tenantId: string, dto: UpsertOptOutDto) {
    return this.prisma.m10CrmOptOut.upsert({
      where: {
        tenantid_contactEmail_channel: {
          tenantid: tenantId,
          contactEmail: dto.contactEmail,
          channel: dto.channel,
        },
      },
      update: {
        isOptedOut: dto.isOptedOut,
        lastSyncedAt: new Date(),
      },
      create: {
        tenantid: tenantId,
        contactEmail: dto.contactEmail,
        channel: dto.channel,
        isOptedOut: dto.isOptedOut,
        lastSyncedAt: new Date(),
      },
    });
  }

  async findOptOut(tenantId: string, contactEmail: string, channel: string) {
    return this.prisma.m10CrmOptOut.findUnique({
      where: {
        tenantid_contactEmail_channel: {
          tenantid: tenantId,
          contactEmail,
          channel,
        },
      },
    });
  }

  async findAllOptOuts(tenantId: string, contactEmail?: string) {
    return this.prisma.m10CrmOptOut.findMany({
      where: {
        tenantid: tenantId,
        ...(contactEmail ? { contactEmail } : {}),
      },
    });
  }

  // ─── Consent Logs ─────────────────────────────────────────────────────────

  async createConsentLog(tenantId: string, dto: CreateConsentLogDto) {
    return this.prisma.m10ConsentLog.create({
      data: {
        tenantid: tenantId,
        contactEmail: dto.contactEmail,
        consentType: dto.consentType,
        status: dto.status,
        source: dto.source,
      },
    });
  }

  async findLatestConsentForContact(
    tenantId: string,
    contactEmail: string,
    consentType: string,
  ) {
    return this.prisma.m10ConsentLog.findFirst({
      where: { tenantid: tenantId, contactEmail, consentType },
      orderBy: { loggedAt: "desc" },
    });
  }

  async findAllConsentLogs(tenantId: string, contactEmail?: string) {
    return this.prisma.m10ConsentLog.findMany({
      where: {
        tenantid: tenantId,
        ...(contactEmail ? { contactEmail } : {}),
      },
      orderBy: { loggedAt: "desc" },
    });
  }

  // ─── Audit Entries ─────────────────────────────────────────────────────────

  async createAuditEntry(data: {
    tenantId: string;
    correlationId: string;
    recipientEmail: string;
    channel: string;
    decision: "allow" | "block";
    reasonCode: string;
    explanation?: string;
    triggeredPolicyId?: string;
    evaluationMetadata?: object;
  }) {
    return this.prisma.m10ComplianceAuditEntry.create({
      data: {
        tenantid: data.tenantId,
        correlationId: data.correlationId,
        recipientEmail: data.recipientEmail,
        channel: data.channel,
        decision: data.decision,
        reasonCode: data.reasonCode,
        explanation: data.explanation,
        triggeredPolicyId: data.triggeredPolicyId,
        evaluationMetadata: (data.evaluationMetadata ?? {}) as object,
      },
    });
  }

  async findAuditEntries(
    tenantId: string,
    opts?: {
      recipientEmail?: string;
      decision?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const { recipientEmail, decision, limit = 50, offset = 0 } = opts ?? {};
    return this.prisma.m10ComplianceAuditEntry.findMany({
      where: {
        tenantid: tenantId,
        ...(recipientEmail ? { recipientEmail } : {}),
        ...(decision ? { decision } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }
}
