import { M06ForecastingPredictionRepository } from '../repositories/m06.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
export declare class M06ForecastingPredictionService {
    private readonly repo;
    private readonly events;
    constructor(repo: M06ForecastingPredictionRepository, events: EventPublisherService);
    findAll(tenantId: string): Promise<{
        message: string;
    }[]>;
    create(dto: any, tenantId: string): Promise<any>;
}
