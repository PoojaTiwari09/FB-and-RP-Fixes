import { M07RevenueDashboardsRepository } from '../repositories/m07.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
export declare class M07RevenueDashboardsService {
    private readonly repo;
    private readonly events;
    constructor(repo: M07RevenueDashboardsRepository, events: EventPublisherService);
    findAll(tenantId: string): Promise<{
        message: string;
    }[]>;
    create(dto: any, tenantId: string): Promise<any>;
}
