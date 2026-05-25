import { M09CoachingTrainingRepository } from '../repositories/m09.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
export declare class M09CoachingTrainingService {
    private readonly repo;
    private readonly events;
    constructor(repo: M09CoachingTrainingRepository, events: EventPublisherService);
    findAll(tenantId: string): Promise<{
        message: string;
    }[]>;
    create(dto: any, tenantId: string): Promise<any>;
}
