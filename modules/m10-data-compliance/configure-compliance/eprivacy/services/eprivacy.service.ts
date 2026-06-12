import { Injectable, Logger } from "@nestjs/common";
import { EPrivacyRepository } from "../repositories/eprivacy.repository";
import type {
  UpdateEPrivacyConsentDto,
  AddSuppressionDto,
} from "../schemas/eprivacy.schema";

@Injectable()
export class EPrivacyService {
  private readonly logger = new Logger(EPrivacyService.name);

  constructor(private readonly repo: EPrivacyRepository) {}

  async updateConsent(tenantId: string, dto: UpdateEPrivacyConsentDto) {
    this.logger.log(
      `Updating ePrivacy consent for ${dto.contactEmail} channel=${dto.channel} purpose=${dto.purpose} status=${dto.status}`,
    );
    return this.repo.updateConsent(tenantId, dto);
  }

  async checkConsent(
    tenantId: string,
    contactEmail: string,
    channel: string,
    purpose: string,
  ) {
    return this.repo.getConsentStatus(tenantId, contactEmail, channel, purpose);
  }

  async addSuppression(tenantId: string, dto: AddSuppressionDto) {
    this.logger.log(
      `Adding suppression for ${dto.contactEmail} reason=${dto.reason}`,
    );
    return this.repo.addSuppression(tenantId, dto);
  }

  async checkSuppression(tenantId: string, contactEmail: string) {
    return this.repo.checkSuppression(tenantId, contactEmail);
  }
}
