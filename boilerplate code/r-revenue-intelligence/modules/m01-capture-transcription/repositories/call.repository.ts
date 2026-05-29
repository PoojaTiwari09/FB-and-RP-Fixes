import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCallDto, ListCallsQueryDto } from '../schemas/m01.schema';
import { Prisma } from '@prisma/client';

@Injectable()
export class CallRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── CT-01: create call record ─────────────────────────────────────────
  async create(data: CreateCallDto & { tenantId: string }) {
    return this.prisma.callRecord.create({ data });
  }

  // ── Sortable list with transcript status (CT sortable list) ──────────
  async findAll(
    tenantId: string,
    query: ListCallsQueryDto,
    extra?: Record<string, unknown>,
  ) {
    const { status, source, sortBy, order, limit, offset } = query;

    const where: Record<string, unknown> = {
      tenantId,
      ...(status ? { transcriptStatus: status } : {}),
      ...(source ? { callSource: source } : {}),
      ...extra,
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.callRecord.findMany({
        where,
        orderBy: { [sortBy]: order },
        take: limit,
        skip: offset,
        include: { transcript: { select: { id: true, summary: true } } },
      }),
      this.prisma.callRecord.count({ where }),
    ]);

    return { records, total };
  }

  // ── Full call detail (CT-13) ──────────────────────────────────────────
  async findById(id: string, tenantId: string) {
    return this.prisma.callRecord.findFirst({
      where: { id, tenantId },
      include: {
        transcript: {
          include: {
            utterances: { orderBy: { sequenceIndex: 'asc' } },
          },
        },
        notes:  { orderBy: { createdAt: 'desc' } },
        shares: true,
      },
    });
  }

  // ── Update status / failure ───────────────────────────────────────────
  // Golden Rule #9: tenantId always in where clause — prevent cross-tenant writes
  async updateStatus(
    id: string,
    tenantId: string,
    status: string,
    failureReason?: string,
  ) {
    return this.prisma.callRecord.updateMany({
      where: { id, tenantId },                   // ✅ tenantId scoped
      data:  { transcriptStatus: status, failureReason },
    });
  }

  // ── Mark call as skipped with a human-readable reason (US-09 / US-31) ─
  async updateSkipped(id: string, tenantId: string, skipReason: string) {
    return this.prisma.callRecord.updateMany({
      where: { id, tenantId },
      data:  { transcriptStatus: 'skipped', skipReason },
    });
  }

  // ── Hard delete a call + its transcripts/utterances/notes/shares (cascade) ──
  // Golden Rule #9: tenantId is part of the where clause to prevent cross-tenant delete.
  async deleteById(id: string, tenantId: string) {
    return this.prisma.callRecord.deleteMany({ where: { id, tenantId } });
  }
}
