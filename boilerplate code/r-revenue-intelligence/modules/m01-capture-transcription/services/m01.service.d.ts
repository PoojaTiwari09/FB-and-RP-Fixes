import { M01CaptureTranscriptionRepository } from '../repositories/m01.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
export declare class M01CaptureTranscriptionService {
    private readonly repo;
    private readonly events;
    constructor(repo: M01CaptureTranscriptionRepository, events: EventPublisherService);
    findAll(tenantId: string): Promise<{
        message: string;
    }[]>;
    create(dto: any, tenantId: string): Promise<any>;
}
