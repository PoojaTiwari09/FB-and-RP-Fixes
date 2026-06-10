import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class M01FrontendSmartCallPersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async startPersistedSession(body: {
    externalSessionId: string;
    contactId?: string;
    dealCompany?: string;
    clientName?: string;
    sessionName?: string;
  }) {
    const row = await this.prisma.liveCallSession.upsert({
      where: { id: body.externalSessionId },
      create: {
        id: body.externalSessionId,
        tenantId: TENANT_ID,
        sessionName: body.sessionName ?? 'Live Call',
        clientName: body.clientName ?? 'Client',
        contactId: body.contactId,
        dealCompany: body.dealCompany,
        status: 'active',
      },
      update: {
        status: 'active',
        sessionName: body.sessionName,
        clientName: body.clientName,
        dealCompany: body.dealCompany,
      },
    });
    return { dbSessionId: row.id };
  }

  async insertChunk(
    sessionId: string,
    chunk: {
      chunk_index: number;
      time_start: string;
      time_end: string;
      summary_text: string;
      key_topics?: string[];
      sentiment?: string;
      competitors_mentioned?: string[];
      raw_transcript?: string;
    },
  ) {
    const session = await this.prisma.liveCallSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    await this.prisma.liveCallSummary.create({
      data: {
        sessionId,
        chunkIndex: chunk.chunk_index,
        timeStart: chunk.time_start,
        timeEnd: chunk.time_end,
        summaryText: chunk.summary_text,
        keyTopics: chunk.key_topics ?? [],
        sentiment: chunk.sentiment ?? 'neutral',
        competitorsMentioned: chunk.competitors_mentioned ?? [],
        rawTranscript: chunk.raw_transcript ?? '',
      },
    });
    return { ok: true };
  }

  async listChunks(sessionId: string) {
    const session = await this.prisma.liveCallSession.findUnique({
      where: { id: sessionId },
      include: {
        summaries: { orderBy: { chunkIndex: 'asc' } },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session.summaries.map((s) => ({
      chunk_index: s.chunkIndex,
      time_start: s.timeStart,
      time_end: s.timeEnd,
      summary_text: s.summaryText,
      key_topics: s.keyTopics,
      sentiment: s.sentiment,
      competitors_mentioned: s.competitorsMentioned,
      raw_transcript: s.rawTranscript ?? '',
    }));
  }

  async completeSession(
    sessionId: string,
    body: {
      finalSummary?: string;
      totalSegments?: number;
      salesRepName?: string;
      clientName?: string;
      transcript?: unknown[];
    },
  ) {
    const session = await this.prisma.liveCallSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    await this.prisma.liveCallSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        endedAt: new Date(),
        finalSummary: body.finalSummary,
        totalSegments: body.totalSegments ?? session.totalSegments,
        salesRepName: body.salesRepName ?? session.salesRepName,
        clientName: body.clientName ?? session.clientName,
        transcript: (body.transcript as any) ?? session.transcript,
      },
    });
    return { ok: true };
  }
}
