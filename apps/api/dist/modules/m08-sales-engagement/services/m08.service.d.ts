import { M08SalesEngagementRepository } from '../repositories/m08.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import { Queue } from 'bullmq';
import { CreatePlayDto, UpdatePlayDto, EnrollPlayDto, CompleteStepDto, SkipStepDto, CreateNoteDto } from '../schemas/m08.schema';
export declare class M08SalesEngagementService {
    private readonly repo;
    private readonly events;
    private readonly queue;
    constructor(repo: M08SalesEngagementRepository, events: EventPublisherService, queue: Queue);
    getPlays(tenantId: string): Promise<any>;
    getPlayById(tenantId: string, playId: string): Promise<any>;
    createPlay(dto: CreatePlayDto, tenantId: string, userId: string): Promise<any>;
    updatePlay(playId: string, dto: UpdatePlayDto, tenantId: string): Promise<any>;
    clonePlay(playId: string, tenantId: string, userId: string): Promise<any>;
    deactivatePlay(playId: string, tenantId: string): Promise<any>;
    enrollOpportunity(dto: EnrollPlayDto, tenantId: string): Promise<any>;
    getEnrollments(tenantId: string, filters: any): Promise<any>;
    getEnrollmentById(tenantId: string, enrollmentId: string): Promise<any>;
    completeStep(enrollmentId: string, dto: CompleteStepDto, tenantId: string, userId: string): Promise<any>;
    skipStep(enrollmentId: string, dto: SkipStepDto, tenantId: string, userId: string): Promise<any>;
    addNote(enrollmentId: string, dto: CreateNoteDto, tenantId: string, userId: string): Promise<any>;
    getAdoptionDashboard(tenantId: string): Promise<any>;
    getRepDashboard(tenantId: string): Promise<any>;
    getPlayDashboard(tenantId: string): Promise<any>;
    evaluateTriggers(eventType: string, payload: any, tenantId: string): Promise<any>;
    private triggerOutreachAlerts;
}
