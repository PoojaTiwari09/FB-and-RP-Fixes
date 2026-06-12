import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import type {
  CreateDsarDto,
  UpdateDsarStatusDto,
  CreateRopaDto,
  CreateDataBreachDto,
  UpdateDataBreachStatusDto,
} from "../schemas/gdpr.schema";

@Injectable()
export class GdprRepository {
  private readonly logger = new Logger(GdprRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── DSAR ──────────────────────────────────────────────────────────────────

  async createDsar(tenantId: string, dto: CreateDsarDto) {
    return this.prisma.m10GdprDataSubjectRequest.create({
      data: {
        tenantid: tenantId,
        contactEmail: dto.contactEmail,
        requestType: dto.requestType,
        details: (dto.details ?? {}) as any,
      },
    });
  }

  async updateDsarStatus(
    tenantId: string,
    id: string,
    dto: UpdateDsarStatusDto,
  ) {
    return this.prisma.m10GdprDataSubjectRequest.update({
      where: { id },
      data: {
        status: dto.status,
        completionDate:
          dto.status === "completed" || dto.status === "rejected"
            ? new Date()
            : null,
      },
    });
  }

  async getDsars(tenantId: string, contactEmail?: string) {
    return this.prisma.m10GdprDataSubjectRequest.findMany({
      where: {
        tenantid: tenantId,
        ...(contactEmail ? { contactEmail } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getActiveErasureRequest(tenantId: string, contactEmail: string) {
    return this.prisma.m10GdprDataSubjectRequest.findFirst({
      where: {
        tenantid: tenantId,
        contactEmail,
        requestType: "erasure",
        status: { in: ["pending", "in_progress"] },
      },
    });
  }

  // ─── Deletion Log ───────────────────────────────────────────────────────────

  async logDeletion(
    tenantId: string,
    dsarId: string,
    contactEmail: string,
    tablesAffected: string[],
    deletedRows: number,
  ) {
    return this.prisma.m10GdprDeletion.create({
      data: {
        tenantid: tenantId,
        dsarId,
        contactEmail,
        tablesAffected,
        deletedRows,
      },
    });
  }

  // ─── RoPA ──────────────────────────────────────────────────────────────────

  async createRopa(tenantId: string, dto: CreateRopaDto) {
    return this.prisma.m10GdprProcessingRecord.create({
      data: {
        tenantid: tenantId,
        purpose: dto.purpose,
        dataCategories: dto.dataCategories,
        lawfulBasis: dto.lawfulBasis,
        retentionPeriod: dto.retentionPeriod,
      },
    });
  }

  async getRopas(tenantId: string) {
    return this.prisma.m10GdprProcessingRecord.findMany({
      where: { tenantid: tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ─── Data Breach ───────────────────────────────────────────────────────────

  async createDataBreach(tenantId: string, dto: CreateDataBreachDto) {
    return this.prisma.m10GdprDataBreachRecord.create({
      data: {
        tenantid: tenantId,
        incidentDate: new Date(dto.incidentDate),
        detectionDate: new Date(dto.detectionDate),
        description: dto.description,
        affectedData: dto.affectedData,
      },
    });
  }

  async updateDataBreachStatus(
    tenantId: string,
    id: string,
    dto: UpdateDataBreachStatusDto,
  ) {
    return this.prisma.m10GdprDataBreachRecord.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async getDataBreaches(tenantId: string) {
    return this.prisma.m10GdprDataBreachRecord.findMany({
      where: { tenantid: tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
}
