import { Injectable } from '@nestjs/common';
import { CallService } from '../services/call.service';
import { CallRepository } from '../repositories/call.repository';
import { PrismaService } from '../database/prisma.service';
import {
  FrontendFilterSearchSchema,
  FrontendListCallsQuery,
  FrontendListCallsQuerySchema,
  FrontendSearchCallsQuerySchema,
} from './m01-frontend-calls.schema';
import {
  mapCallDetail,
  mapCallListItem,
  mapCallMetadata,
  mapCallSearchHit,
} from './m01-frontend.mapper';

@Injectable()
export class M01FrontendCallsService {
  constructor(
    private readonly calls: CallService,
    private readonly callRepo: CallRepository,
    private readonly prisma: PrismaService,
  ) {}

  async listCalls(tenantId: string, rawQuery: Record<string, string>) {
    const q = FrontendListCallsQuerySchema.parse(rawQuery);
    const offset = (q.page - 1) * q.size;

    const extra: Record<string, unknown> = {};

    if (q.status && q.status !== 'all') {
      extra.transcriptStatus =
        q.status === 'processing' ? { in: ['processing', 'pending'] } : q.status;
    }
    if (q.dealType) extra.callType = q.dealType;
    if (q.ownerId) extra.callOwner = q.ownerId;
    if (q.account) {
      extra.OR = [
        { accountId: { contains: q.account, mode: 'insensitive' } },
        { title: { contains: q.account, mode: 'insensitive' } },
      ];
    }
    if (q.participantId) {
      extra.participants = { has: q.participantId };
    }
    if (q.search?.trim()) {
      const needle = q.search.trim();
      extra.OR = [
        ...(extra.OR as any[] || []),
        { title: { contains: needle, mode: 'insensitive' } },
        { callOwner: { contains: needle, mode: 'insensitive' } },
        { accountId: { contains: needle, mode: 'insensitive' } },
      ];
    }
    if (q.duration && q.duration !== 'all') {
      if (q.duration === 'lt2') extra.durationSeconds = { lt: 120 };
      else if (q.duration === '2to10') extra.durationSeconds = { gte: 120, lte: 600 };
      else if (q.duration === 'gt10') extra.durationSeconds = { gt: 600 };
    }
    if (q.dateRange && q.dateRange !== 'custom') {
      const days = q.dateRange === 'last7days' ? 7 : 30;
      extra.callDate = { gte: new Date(Date.now() - days * 86400000) };
    } else if (q.startDate || q.endDate) {
      extra.callDate = {
        ...(q.startDate ? { gte: new Date(q.startDate) } : {}),
        ...(q.endDate ? { lte: new Date(q.endDate) } : {}),
      };
    }

    let listStatus: string | undefined;
    if (q.status && q.status !== 'all' && q.status !== 'processing') {
      listStatus = q.status;
    }

    const { records, total } = await this.callRepo.findAll(
      tenantId,
      {
        status: listStatus as any,
        sortBy: 'callDate',
        order: 'desc',
        limit: q.size,
        offset,
      },
      extra,
    );

    return {
      totalCount: total,
      page: q.page,
      size: q.size,
      calls: records.map(mapCallListItem),
    };
  }

  async getCall(callId: string, tenantId: string) {
    const record = await this.calls.getCallDetail(callId, tenantId);
    return mapCallDetail(record);
  }

  async getCallMetadata(callId: string, tenantId: string) {
    const record = await this.calls.getCallDetail(callId, tenantId);
    return mapCallMetadata(record);
  }

  async searchCalls(tenantId: string, rawQuery: Record<string, string>) {
    const q = FrontendSearchCallsQuerySchema.parse(rawQuery);
    const offset = (q.page - 1) * q.size;

    const hits = await this.calls.searchTranscripts(tenantId, {
      q: q.q,
      limit: q.size,
      offset,
    });

    const calls = (Array.isArray(hits) ? hits : []).map(mapCallSearchHit);

    return {
      totalCount: calls.length,
      calls,
    };
  }

  async listAccounts(tenantId: string, rawQuery: Record<string, string>) {
    const { search } = FrontendFilterSearchSchema.parse(rawQuery);
    const rows = await this.prisma.callRecord.findMany({
      where: { tenantId },
      select: { accountId: true, title: true },
      take: 500,
    });

    const seen = new Map<string, string>();
    for (const r of rows) {
      const id = r.accountId || 'unknown';
      const name = r.accountId || r.title || 'Unknown account';
      if (!seen.has(id)) seen.set(id, name);
    }

    let accounts = [...seen.entries()].map(([accountId, accountName]) => ({
      accountId,
      accountName,
    }));

    if (search?.trim()) {
      const needle = search.trim().toLowerCase();
      accounts = accounts.filter(
        (a) =>
          a.accountName.toLowerCase().includes(needle) ||
          a.accountId.toLowerCase().includes(needle),
      );
    }

    return { accounts };
  }

  async listParticipants(tenantId: string, rawQuery: Record<string, string>) {
    const { search, accountId } = FrontendFilterSearchSchema.parse(rawQuery);
    const where: any = { tenantId };
    if (accountId) where.accountId = accountId;

    const rows = await this.prisma.callRecord.findMany({
      where,
      select: { participants: true },
      take: 500,
    });

    const seen = new Map<string, string>();
    for (const r of rows) {
      for (const p of r.participants ?? []) {
        if (!seen.has(p)) seen.set(p, p);
      }
    }

    let participants = [...seen.entries()].map(([participantId, name]) => ({
      participantId,
      name,
    }));

    if (search?.trim()) {
      const needle = search.trim().toLowerCase();
      participants = participants.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.participantId.toLowerCase().includes(needle),
      );
    }

    return { participants };
  }
}
