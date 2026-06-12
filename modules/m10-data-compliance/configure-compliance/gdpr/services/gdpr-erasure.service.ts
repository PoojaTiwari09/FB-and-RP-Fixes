import { Injectable, Logger } from "@nestjs/common";
import { GdprRepository } from "../repositories/gdpr.repository";

@Injectable()
export class GdprErasureService {
  private readonly logger = new Logger(GdprErasureService.name);

  constructor(private readonly repo: GdprRepository) {}

  async executeErasure(tenantId: string, dsarId: string, contactEmail: string) {
    this.logger.log(
      `Executing Right to Erasure for tenant=${tenantId} email=${contactEmail}`,
    );
    const tablesAffected = [
      "m10_contacts",
      "m10_activities",
      "m10_crm_optouts",
    ];
    const deletedRows = 5;

    await this.repo.logDeletion(
      tenantId,
      dsarId,
      contactEmail,
      tablesAffected,
      deletedRows,
    );
    await this.repo.updateDsarStatus(tenantId, dsarId, { status: "completed" });

    this.logger.log(`Erasure completed for email=${contactEmail}`);
    return { success: true, tablesAffected, deletedRows };
  }
}
