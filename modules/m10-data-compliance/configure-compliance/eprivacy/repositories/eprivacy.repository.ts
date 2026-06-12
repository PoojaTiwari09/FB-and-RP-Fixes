import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import type {
  UpdateEPrivacyConsentDto,
  AddSuppressionDto,
} from "../schemas/eprivacy.schema";

@Injectable()
export class EPrivacyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updateConsent(tenantId: string, dto: UpdateEPrivacyConsentDto) {
    return this.prisma.m10EPrivacyConsent.create({
      data: {
        tenantid: tenantId,
        contactEmail: dto.contactEmail,
        channel: dto.channel,
        purpose: dto.purpose,
        status: dto.status,
        source: dto.source,
      },
    });
  }

  async getConsentStatus(
    tenantId: string,
    contactEmail: string,
    channel: string,
    purpose: string,
  ) {
    return this.prisma.m10EPrivacyConsent.findFirst({
      where: { tenantid: tenantId, contactEmail, channel, purpose },
      orderBy: { loggedAt: "desc" },
    });
  }

  async addSuppression(tenantId: string, dto: AddSuppressionDto) {
    return this.prisma.m10SuppressionEntry.upsert({
      where: {
        tenantid_contactEmail: {
          tenantid: tenantId,
          contactEmail: dto.contactEmail,
        },
      },
      update: { reason: dto.reason, addedAt: new Date() },
      create: {
        tenantid: tenantId,
        contactEmail: dto.contactEmail,
        reason: dto.reason,
      },
    });
  }

  async checkSuppression(tenantId: string, contactEmail: string) {
    return this.prisma.m10SuppressionEntry.findUnique({
      where: { tenantid_contactEmail: { tenantid: tenantId, contactEmail } },
    });
  }
}
