import { M05AccountIntelligenceRepository } from '../repositories/m05.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
export declare class M05AccountIntelligenceService {
    private readonly repo;
    private readonly events;
    constructor(repo: M05AccountIntelligenceRepository, events: EventPublisherService);
    findAll(tenantId: string): Promise<{
        message: string;
    }[]>;
    create(dto: any, tenantId: string): Promise<any>;
}
