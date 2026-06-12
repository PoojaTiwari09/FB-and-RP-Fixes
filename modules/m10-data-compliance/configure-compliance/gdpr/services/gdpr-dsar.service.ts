import { Injectable, Logger } from "@nestjs/common";
import { GdprRepository } from "../repositories/gdpr.repository";
import type {
  CreateDsarDto,
  UpdateDsarStatusDto,
} from "../schemas/gdpr.schema";

@Injectable()
export class GdprDsarService {
  private readonly logger = new Logger(GdprDsarService.name);

  constructor(private readonly repo: GdprRepository) {}

  async createDsar(tenantId: string, dto: CreateDsarDto) {
    this.logger.log(
      `Creating DSAR for tenant=${tenantId} email=${dto.contactEmail} type=${dto.requestType}`,
    );
    return this.repo.createDsar(tenantId, dto);
  }

  async updateDsarStatus(
    tenantId: string,
    id: string,
    dto: UpdateDsarStatusDto,
  ) {
    this.logger.log(`Updating DSAR status for id=${id} to ${dto.status}`);
    return this.repo.updateDsarStatus(tenantId, id, dto);
  }

  async getDsars(tenantId: string, contactEmail?: string) {
    return this.repo.getDsars(tenantId, contactEmail);
  }
}
