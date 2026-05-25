import { M08SalesEngagementRepository } from '../repositories/m08.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
export declare class M08SalesEngagementService {
    private readonly repo;
    private readonly events;
    constructor(repo: M08SalesEngagementRepository, events: EventPublisherService);
    findAll(tenantId: string): Promise<{
        message: string;
    }[]>;
    create(dto: any, tenantId: string): Promise<any>;
}
