import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ShareCallDto }  from '../schemas/m01.schema';
import { Prisma } from '@rri/database';

// ── Extended search query schema (US-22) ──────────────────────────────────────
export const ExtendedSearchQuerySchema = z.object({
  q:        z.string().min(1).max(200),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
  offset:   z.coerce.number().int().min(0).default(0),
  // US-22 extended filters
  dateFrom: z.coerce.date().optional(),
  dateTo:   z.coerce.date().optional(),
  ownerId:  z.string().optional(),            // filter by call owner (rep)
  callType: z.enum(['inbound', 'outbound', 'meeting']).optional(),
});
export interface ExtendedSearchQueryDto extends z.infer<typeof ExtendedSearchQuerySchema> {}

// Result shape returned by searchAcrossOrg
export interface OrgSearchResult {
  utteranceId: string;
  callId:      string;
  callTitle:   string;
  callDate:    Date;
  speaker:     string;
  excerpt:     string;
  startMs:     number;
}

export interface OrgSearchResponse {
  results:     OrgSearchResult[];
  total:       number;        // US-19: total match count
  matchCount:  number;        // US-19: number of results in this page
}

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Full-text search across all transcripts in the org.
   * US-22: Extended with dateFrom, dateTo, ownerId, callType filters.
   * US-19: Returns total match count alongside results.
   *
   * Uses PostgreSQL tsvector for GIN-accelerated full-text search.
   * tenantId is always the first WHERE condition (Golden Rule #9 + RLS).
   */
  async searchAcrossOrg(
    tenantId: string,
    dto:      ExtendedSearchQueryDto,
  ): Promise<OrgSearchResponse> {
    const {
      q, limit, offset,
      dateFrom, dateTo, ownerId, callType,
    } = dto;

    const sqlParts: Prisma.Sql[] = [];
    if (dateFrom) sqlParts.push(Prisma.sql`AND cr."callDate" >= ${dateFrom}`);
    if (dateTo) sqlParts.push(Prisma.sql`AND cr."callDate" <= ${dateTo}`);
    if (ownerId) sqlParts.push(Prisma.sql`AND cr."callOwner" = ${ownerId}`);
    if (callType) sqlParts.push(Prisma.sql`AND cr."callType" = ${callType}`);

    const filterSQLPart = sqlParts.length > 0 ? Prisma.join(sqlParts, ' ') : Prisma.empty;
    const limitOffsetSQL = Prisma.raw(`LIMIT ${Number(limit)} OFFSET ${Number(offset)}`);

    const results = await this.prisma.$queryRaw<OrgSearchResult[]>`
      SELECT
        u.id              AS "utteranceId",
        t."callId"        AS "callId",
        cr.title          AS "callTitle",
        cr."callDate"     AS "callDate",
        u.speaker         AS "speaker",
        u.text            AS "excerpt",
        u."startMs"       AS "startMs"
      FROM ingestion.utterances u
      JOIN ingestion.transcripts   t  ON t.id = u."transcriptId"
      JOIN ingestion.call_records  cr ON cr.id = t."callId"
      WHERE cr."tenantid" = ${tenantId}::uuid
        AND to_tsvector('english', u.text) @@ plainto_tsquery('english', ${q})
        ${filterSQLPart}
      ORDER BY cr."callDate" DESC
      ${limitOffsetSQL}
    `;

    // Count query for US-19 matchCount
    const countResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) AS count
      FROM ingestion.utterances u
      JOIN ingestion.transcripts   t  ON t.id = u."transcriptId"
      JOIN ingestion.call_records  cr ON cr.id = t."callId"
      WHERE cr."tenantid" = ${tenantId}::uuid
        AND to_tsvector('english', u.text) @@ plainto_tsquery('english', ${q})
        ${filterSQLPart}
    `;

    const total = Number(countResult[0]?.count ?? 0);

    return {
      results,
      total,
      matchCount: results.length,       // US-19: count of results on this page
    };
  }

  // ── CT-21: Search within a specific call transcript (US-19) ────────────────
  async searchWithinCall(
    callId:   string,
    tenantId: string,
    q:        string,
  ) {
    const utterances = await this.prisma.utterance.findMany({
      where: {
        transcript: { callId, tenantid: tenantId },
        text:       { contains: q, mode: 'insensitive' },
      },
      orderBy: { sequenceIndex: 'asc' },
    });

    return {
      results:    utterances,
      matchCount: utterances.length,    // US-19: total match count
    };
  }
}

// ── CT-23: Share repository ───────────────────────────────────────────────────
@Injectable()
export class ShareRepository {
  constructor(private readonly prisma: PrismaService) {}

  async share(
    callId:          string,
    tenantId:        string,
    sharedByUserId:  string,
    dto:             ShareCallDto,
  ) {
    // US-21: Verify sharedWithId belongs to same tenant before creating share
    // In a full auth system this would validate against the users table.
    // For now we store tenantId on the share record for RLS enforcement.
    return this.prisma.callShare.upsert({
      where: {
        callId_sharedWithId_sharedWithType: {
          callId,
          sharedWithId:   dto.sharedWithId,
          sharedWithType: dto.sharedWithType,
        },
      },
      update:  {},
      create: { callId, tenantid: tenantId, sharedByUserId, ...dto } as any,
    });
  }

  async findByCallId(callId: string, tenantId: string) {
    return this.prisma.callShare.findMany({ where: { callId, tenantid: tenantId } });
  }
}
