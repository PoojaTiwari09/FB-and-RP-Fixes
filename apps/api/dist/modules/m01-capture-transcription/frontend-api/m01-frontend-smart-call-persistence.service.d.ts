import { PrismaService } from '../database/prisma.service';
export declare class M01FrontendSmartCallPersistenceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    startPersistedSession(body: {
        externalSessionId: string;
        contactId?: string;
        dealCompany?: string;
        clientName?: string;
        sessionName?: string;
    }): Promise<{
        dbSessionId: string;
    }>;
    insertChunk(sessionId: string, chunk: {
        chunk_index: number;
        time_start: string;
        time_end: string;
        summary_text: string;
        key_topics?: string[];
        sentiment?: string;
        competitors_mentioned?: string[];
        raw_transcript?: string;
    }): Promise<{
        ok: boolean;
    }>;
    listChunks(sessionId: string): Promise<{
        chunk_index: number;
        time_start: string;
        time_end: string;
        summary_text: string;
        key_topics: string[];
        sentiment: string;
        competitors_mentioned: string[];
        raw_transcript: string;
    }[]>;
    completeSession(sessionId: string, body: {
        finalSummary?: string;
        totalSegments?: number;
        salesRepName?: string;
        clientName?: string;
        transcript?: unknown[];
    }): Promise<{
        ok: boolean;
    }>;
}
