import { M04DealIntelligenceRepository } from '../repositories/m04.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
export declare class M04DealIntelligenceService {
    private readonly repo;
    private readonly events;
    constructor(repo: M04DealIntelligenceRepository, events: EventPublisherService);
    findAll(tenantId: string): Promise<{
        message: string;
    }[]>;
    create(dto: any, tenantId: string): Promise<any>;
}
