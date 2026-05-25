import { M10DataComplianceRepository } from '../repositories/m10.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
export declare class M10DataComplianceService {
    private readonly repo;
    private readonly events;
    constructor(repo: M10DataComplianceRepository, events: EventPublisherService);
    findAll(tenantId: string): Promise<{
        message: string;
    }[]>;
    create(dto: any, tenantId: string): Promise<any>;
}
