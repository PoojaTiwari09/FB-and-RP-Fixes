import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ShareCallDto }  from '../schemas/m01.schema';

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
export type ExtendedSearchQueryDto = z.infer<typeof ExtendedSearchQuerySchema>;

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

    // Build dynamic filter clauses for the raw SQL
    const dateClauses: string[] = [];
    const params: unknown[]     = [tenantId, q, limit, offset];
    let   paramIdx              = 5;               // $1–$4 are already taken

    if (dateFrom) {
      dateClauses.push(`AND cr."callDate" >= $${paramIdx}`);
      params.push(dateFrom);
      paramIdx++;
    }
    if (dateTo) {
      dateClauses.push(`AND cr."callDate" <= $${paramIdx}`);
      params.push(dateTo);
      paramIdx++;
    }
    if (ownerId) {
      dateClauses.push(`AND cr."callOwner" = $${paramIdx}`);
      params.push(ownerId);
      paramIdx++;
    }
    if (callType) {
      dateClauses.push(`AND cr."callType" = $${paramIdx}`);
      params.push(callType);
      paramIdx++;
    }

    const filterSQL = dateClauses.join('\n        ');

    // Main search query — GIN-accelerated via to_tsvector (US-06 GIN index)
    const results = await this.prisma.$queryRawUnsafe<OrgSearchResult[]>(
      `
      SELECT
        u.id              AS "utteranceId",
        t."callId"        AS "callId",
        cr.title          AS "callTitle",
        cr."callDate"     AS "callDate",
        u.speaker         AS "speaker",
        u.text            AS "excerpt",
        u."startMs"       AS "startMs"
      FROM utterances u
      JOIN transcripts   t  ON t.id = u."transcriptId"
      JOIN call_records  cr ON cr.id = t."callId"
      WHERE cr."tenantId" = $1
        AND to_tsvector('english', u.text) @@ plainto_tsquery('english', $2)
        ${filterSQL}
      ORDER BY cr."callDate" DESC
      LIMIT $3 OFFSET $4
      `,
      ...params,
    );

    // Count query for US-19 matchCount
    const countResult = await this.prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `
      SELECT COUNT(*) AS count
      FROM utterances u
      JOIN transcripts   t  ON t.id = u."transcriptId"
      JOIN call_records  cr ON cr.id = t."callId"
      WHERE cr."tenantId" = $1
        AND to_tsvector('english', u.text) @@ plainto_tsquery('english', $2)
        ${filterSQL}
      `,
      ...params.slice(0, paramIdx - 1),  // same params minus limit/offset
    );

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
        transcript: { callId, tenantId },
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
      create: { callId, tenantId, sharedByUserId, ...dto },
    });
  }

  async findByCallId(callId: string, tenantId: string) {
    return this.prisma.callShare.findMany({ where: { callId, tenantId } });
  }
}
