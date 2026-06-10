import { M02ConversationIntelligenceRepository } from '../repositories/m02.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
export interface TranscriptionIngestPayload {
    tenantId: string;
    callId: string;
    transcriptId?: string;
    sourcePlatform?: string;
    occurredAt?: string;
}
export declare class ConversationIngestService {
    private readonly repo;
    private readonly events;
    private readonly logger;
    constructor(repo: M02ConversationIntelligenceRepository, events: EventPublisherService);
    ingestFromTranscription(payload: TranscriptionIngestPayload): Promise<{
        accepted: boolean;
        callId: string;
        tenantId: string;
        conversation: import("../interfaces/search.interface").ConversationRecord;
        syncLog: import("../interfaces/search.interface").SearchSyncLog;
    }>;
}
