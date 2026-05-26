import { M03AiSummariesGenaiRepository } from '../repositories/m03.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
export declare class M03AiSummariesGenaiService {
    private readonly repo;
    private readonly events;
    constructor(repo: M03AiSummariesGenaiRepository, events: EventPublisherService);
    findAll(tenantId: string): Promise<{
        message: string;
    }[]>;
    create(dto: any, tenantId: string): Promise<any>;
}
