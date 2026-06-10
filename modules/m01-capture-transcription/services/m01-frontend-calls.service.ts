import { Injectable } from '@nestjs/common';
import { CallService } from './call.service';
import { CallRepository } from '../repositories/call.repository';
import { PrismaService } from '../database/prisma.service';
import {
  FrontendFilterSearchSchema,
  FrontendListCallsQuery,
  FrontendListCallsQuerySchema,
  FrontendSearchCallsQuerySchema,
} from '../schemas/m01-frontend-calls.schema';
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

  async listCalls(tenantId: string, rawQuery: Record<string, string>, userId?: string, userRole?: string) {
    const q = FrontendListCallsQuerySchema.parse(rawQuery);

    if (rawQuery.view === 'ai-reviewer' || rawQuery.format === 'ai-reviewer') {
      const offset = (q.page - 1) * q.size;
      const extra: Record<string, unknown> = {};
      const andClauses: Record<string, unknown>[] = [];

      // Data Isolation: Sales Reps can only see their own calls
      if (userRole === 'sales_rep' && userId) {
        andClauses.push({ callOwner: userId });
      }

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

      const callReviews = await this.prisma.callReview.findMany({
        where: { tenantid: tenantId },
      });
      const reviewMap = new Map(callReviews.map((cr) => [cr.callTitle, cr]));

      const calls = records.map((r: any) => mapAiReviewerCallRow(r, reviewMap.get(r.title)));
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

    const extra: Record<string, any> = {};
    const andClauses: any[] = [];

    // Data Isolation: Sales Reps can only see their own calls
    if (userRole === 'sales_rep' && userId) {
      andClauses.push({ callOwner: userId });
    }

    // Calls List UI: only show review-ready rows (recording + completed transcript).
    const isCallsList =
      !rawQuery.view &&
      rawQuery.format !== 'ai-reviewer' &&
      rawQuery.view !== 'ai-reviewer';
    if (isCallsList && (!q.status || q.status === 'all')) {
      andClauses.push({ transcriptStatus: 'completed' });
      andClauses.push({ audioUrl: { not: null } });
      andClauses.push({ transcript: { isNot: null } });
    }

    if (q.status && q.status !== 'all') {
      const statusClause = q.status === 'processing' ? { in: ['processing', 'pending'] } : q.status;
      andClauses.push({ transcriptStatus: statusClause });
    }

    if (q.dealType) {
      const types = q.dealType.split(',').filter(Boolean).map((t) => t.toLowerCase());
      if (types.length > 0) {
        andClauses.push({ callType: { in: types } });
      }
    }

    if (q.ownerId) {
      andClauses.push({ callOwner: q.ownerId });
    }

    if (q.account) {
      const accounts = q.account.split(',').filter(Boolean);
      if (accounts.length > 0) {
        andClauses.push({
          OR: [
            ...accounts.map((acc) => ({ accountId: { contains: acc, mode: 'insensitive' as const } })),
            ...accounts.map((acc) => ({ title: { contains: acc, mode: 'insensitive' as const } })),
          ],
        });
      }
    }

    if (q.participantId) {
      const parts = q.participantId.split(',').filter(Boolean);
      if (parts.length > 0) {
        andClauses.push({
          participants: { hasSome: parts },
        });
      }
    }

    if (q.search?.trim()) {
      const needle = q.search.trim();
      andClauses.push({
        OR: [
          { title: { contains: needle, mode: 'insensitive' as const } },
          { callOwner: { contains: needle, mode: 'insensitive' as const } },
          { accountId: { contains: needle, mode: 'insensitive' as const } },
        ],
      });
    }

    if (q.duration && q.duration !== 'all') {
      if (q.duration === 'lt2') {
        andClauses.push({ durationSeconds: { lt: 120 } });
      } else if (q.duration === '2to10') {
        andClauses.push({ durationSeconds: { gte: 120, lte: 600 } });
      } else if (q.duration === 'gt10') {
        andClauses.push({ durationSeconds: { gt: 600 } });
      }
    }

    if (q.dateRange && q.dateRange !== 'all' && q.dateRange !== 'custom') {
      const days = q.dateRange === 'last7days' ? 7 : 30;
      andClauses.push({ callDate: { gte: new Date(Date.now() - days * 86400000) } });
    } else if (q.dateRange === 'custom' && (q.startDate || q.endDate)) {
      andClauses.push({
        callDate: {
          ...(q.startDate ? { gte: new Date(q.startDate) } : {}),
          ...(q.endDate ? { lte: new Date(q.endDate) } : {}),
        },
      });
    }

    if (andClauses.length > 0) {
      extra.AND = andClauses;
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

  async getCall(callId: string, tenantId: string, rawQuery: Record<string, string> = {}, userId?: string, userRole?: string) {
    const record = await this.calls.getCallDetail(callId, tenantId);

    // Data Isolation: Sales Reps can only see their own calls
    if (userRole === 'sales_rep' && userId && record.callOwner !== userId) {
      throw new Error('Access denied');
    }

    if (rawQuery.view === 'ai-reviewer' || rawQuery.format === 'ai-reviewer') {
      const matchingReview = await this.prisma.callReview.findFirst({
        where: { callTitle: record.title, tenantid: tenantId },
      });
      const row = mapAiReviewerCallRow(record, matchingReview);
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

  async getCallMetadata(callId: string, tenantId: string, userId?: string, userRole?: string) {
    const record = await this.calls.getCallDetail(callId, tenantId);

    // Data Isolation: Sales Reps can only see their own calls
    if (userRole === 'sales_rep' && userId && record.callOwner !== userId) {
      throw new Error('Access denied');
    }

    return mapCallMetadata(record);
  }

  async searchCalls(tenantId: string, rawQuery: Record<string, string>, userId?: string, userRole?: string) {
    const q = FrontendSearchCallsQuerySchema.parse(rawQuery);
    const offset = (q.page - 1) * q.size;

    const hits = await this.calls.searchTranscripts(tenantId, {
      q: q.q,
      limit: q.size,
      offset,
    });

    let calls = (Array.isArray(hits) ? hits : []).map(mapCallSearchHit);

    // Data Isolation: Sales Reps can only see their own calls
    if (userRole === 'sales_rep' && userId) {
      calls = calls.filter((c) => c.callOwner === userId);
    }

    return {
      totalCount: calls.length,
      calls,
    };
  }

  async listAccounts(tenantId: string, rawQuery: Record<string, string>, userId?: string, userRole?: string) {
    const { search } = FrontendFilterSearchSchema.parse(rawQuery);
    const where: any = { tenantid: tenantId };

    // Data Isolation: Sales Reps can only see accounts for their own calls
    if (userRole === 'sales_rep' && userId) {
      where.callOwner = userId;
    }

    const rows = await this.prisma.callRecord.findMany({
      where,
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

  async listParticipants(tenantId: string, rawQuery: Record<string, string>, userId?: string, userRole?: string) {
    const { search, accountId } = FrontendFilterSearchSchema.parse(rawQuery);
    const where: any = { tenantid: tenantId };
    if (accountId) where.accountId = accountId;

    // Data Isolation: Sales Reps can only see participants for their own calls
    if (userRole === 'sales_rep' && userId) {
      where.callOwner = userId;
    }

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
