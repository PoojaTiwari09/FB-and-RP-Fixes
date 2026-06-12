import { Injectable, Logger } from "@nestjs/common";
import { GdprRepository } from "../repositories/gdpr.repository";
import type {
  CreateRopaDto,
  CreateDataBreachDto,
  UpdateDataBreachStatusDto,
} from "../schemas/gdpr.schema";

@Injectable()
export class GdprRopaService {
  private readonly logger = new Logger(GdprRopaService.name);

  constructor(private readonly repo: GdprRepository) {}

  async createRopa(tenantId: string, dto: CreateRopaDto) {
    return this.repo.createRopa(tenantId, dto);
  }

  async getRopas(tenantId: string) {
    return this.repo.getRopas(tenantId);
  }

  async createDataBreach(tenantId: string, dto: CreateDataBreachDto) {
    return this.repo.createDataBreach(tenantId, dto);
  }

  async updateDataBreachStatus(
    tenantId: string,
    id: string,
    dto: UpdateDataBreachStatusDto,
  ) {
    return this.repo.updateDataBreachStatus(tenantId, id, dto);
  }

  async getDataBreaches(tenantId: string) {
    return this.repo.getDataBreaches(tenantId);
  }
}
