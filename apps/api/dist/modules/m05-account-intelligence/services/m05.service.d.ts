import { M05AccountIntelligenceRepository } from '../repositories/m05.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
export declare class M05AccountIntelligenceService {
    private readonly repo;
    private readonly events;
    constructor(repo: M05AccountIntelligenceRepository, events: EventPublisherService);
    findAll(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        externalId: string | null;
        ownerName: string | null;
        industry: string | null;
        assignedRepId: string | null;
        hubspotOwnerId: string | null;
        ownerUserId: string | null;
        healthScore: number | null;
        crmRecordId: string | null;
    }[]>;
    create(dto: any, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        externalId: string | null;
        ownerName: string | null;
        industry: string | null;
        assignedRepId: string | null;
        hubspotOwnerId: string | null;
        ownerUserId: string | null;
        healthScore: number | null;
        crmRecordId: string | null;
    }>;
}
