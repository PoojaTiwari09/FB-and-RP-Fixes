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
  mapAiReviewerCallRow,
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

    if (rawQuery.view === 'ai-reviewer' || rawQuery.format === 'ai-reviewer') {
      const offset = (q.page - 1) * q.size;
      const extra: Record<string, unknown> = {};
      const andClauses: Record<string, unknown>[] = [];
      if (q.search?.trim()) {
        const needle = q.search.trim();
        andClauses.push({
          OR: [
            { title: { contains: needle, mode: 'insensitive' } },
            { callOwner: { contains: needle, mode: 'insensitive' } },
            { accountId: { contains: needle, mode: 'insensitive' } },
          ],
        });
      }
      if (rawQuery.type && rawQuery.type !== 'All Types') {
        const typeNeedle = String(rawQuery.type).replace(/-/g, ' ');
        andClauses.push({
          OR: [
            { title: { contains: typeNeedle, mode: 'insensitive' } },
            { callType: { contains: typeNeedle, mode: 'insensitive' } },
          ],
        });
      }
      if (andClauses.length > 0) extra.AND = andClauses;
      const { records, total } = await this.callRepo.findAll(
        tenantId,
        { sortBy: 'callDate', order: 'desc', limit: q.size, offset },
        extra,
      );
      const calls = records.map((r: any) => mapAiReviewerCallRow(r));
      return {
        data: {
          calls,
          pagination: {
            page: q.page,
            size: q.size,
            total,
            totalPages: Math.max(1, Math.ceil(total / q.size)),
          },
        },
        totalCount: total,
        page: q.page,
        size: q.size,
        calls,
      };
    }

    const offset = (q.page - 1) * q.size;

    // We'll build an array of AND conditions for maximum flexibility and correctness
    const andConditions: any[] = [{ tenantId }];

    // 1. Calls List UI default filters: only show review-ready rows
    const isCallsList =
      !rawQuery.view &&
      rawQuery.format !== 'ai-reviewer' &&
      rawQuery.view !== 'ai-reviewer';
    
    if (isCallsList && (!q.status || q.status === 'all')) {
      andConditions.push({ transcriptStatus: 'completed' });
      andConditions.push({ audioUrl: { not: null } });
      andConditions.push({ transcript: { isNot: null } });
    }

    // 2. Status Filter
    if (q.status && q.status !== 'all') {
      if (q.status === 'processing') {
        andConditions.push({ transcriptStatus: { in: ['processing', 'pending'] } });
      } else {
        andConditions.push({ transcriptStatus: q.status });
      }
    }

    // 3. Deal Type (mapped to callType in DB)
    if (q.dealType) {
      const types = q.dealType.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      if (types.length > 0) {
        andConditions.push({ callType: { in: types } });
      }
    }

    // 4. Owner Filter (mapped to callOwner name in DB)
    if (q.ownerId) {
      const owners = q.ownerId.split(',').map(o => o.trim()).filter(Boolean);
      if (owners.length > 0) {
        andConditions.push({ callOwner: { in: owners } });
      }
    }

    // 5. Account Filter (matches accountId OR title)
    if (q.account) {
      const accounts = q.account.split(',').map(a => a.trim()).filter(Boolean);
      if (accounts.length > 0) {
        andConditions.push({
          OR: [
            { accountId: { in: accounts } },
            { title: { in: accounts } },
          ],
        });
      }
    }

    // 6. Participants Filter
    if (q.participantId) {
      const participants = q.participantId.split(',').map(p => p.trim()).filter(Boolean);
      if (participants.length > 0) {
        andConditions.push({ participants: { hasSome: participants } });
      }
    }

    // 7. Search Query
    if (q.search?.trim()) {
      const needle = q.search.trim();
      andConditions.push({
        OR: [
          { title: { contains: needle, mode: 'insensitive' } },
          { callOwner: { contains: needle, mode: 'insensitive' } },
          { accountId: { contains: needle, mode: 'insensitive' } },
        ],
      });
    }

    // 8. Duration Filter
    if (q.duration && q.duration !== 'all') {
      if (q.duration === 'lt2') andConditions.push({ durationSeconds: { lt: 120 } });
      else if (q.duration === '2to10') andConditions.push({ durationSeconds: { gte: 120, lte: 600 } });
      else if (q.duration === 'gt10') andConditions.push({ durationSeconds: { gt: 600 } });
    }

    // 9. Date Range Filter
    if (q.dateRange && q.dateRange !== 'all' && q.dateRange !== 'custom') {
      const days = q.dateRange === 'last7days' ? 7 : 30;
      andConditions.push({ callDate: { gte: new Date(Date.now() - days * 86400000) } });
    } else if (q.dateRange === 'custom' && (q.startDate || q.endDate)) {
      andConditions.push({
        callDate: {
          ...(q.startDate ? { gte: new Date(q.startDate) } : {}),
          ...(q.endDate ? { lte: new Date(q.endDate) } : {}),
        },
      });
    }

    // Construct final where clause
    const extra: Record<string, any> = { AND: andConditions };

    const { records, total } = await this.callRepo.findAll(
      tenantId,
      {
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

  async getCall(callId: string, tenantId: string, rawQuery: Record<string, string> = {}) {
    const record = await this.calls.getCallDetail(callId, tenantId);
    if (rawQuery.view === 'ai-reviewer' || rawQuery.format === 'ai-reviewer') {
      const row = mapAiReviewerCallRow(record);
      const participants = Array.isArray(record.participants)
        ? record.participants.map((p: string, i: number) => ({
            name: p,
            role: i === 0 ? 'Rep' : 'Buyer',
          }))
        : [
            { name: record.callOwner || 'Rep', role: 'Rep' },
            { name: 'Buyer', role: 'Buyer' },
          ];
      return { data: { ...row, participants } };
    }
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
