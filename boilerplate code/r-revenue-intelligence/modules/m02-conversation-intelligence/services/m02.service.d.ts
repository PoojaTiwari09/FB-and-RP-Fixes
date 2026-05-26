import { M02ConversationIntelligenceRepository } from '../repositories/m02.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
export declare class M02ConversationIntelligenceService {
    private readonly repo;
    private readonly events;
    constructor(repo: M02ConversationIntelligenceRepository, events: EventPublisherService);
    findAll(tenantId: string): Promise<{
        message: string;
    }[]>;
    create(dto: any, tenantId: string): Promise<any>;
}
