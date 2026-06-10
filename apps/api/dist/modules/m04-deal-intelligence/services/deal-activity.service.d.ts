import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { DealActivity } from '@/entities/deal-activity.entity';
import { Deal } from '@/entities/deal.entity';
import { CreateActivityDto, UpdateActivityDto, ActivityResponseDto, ActivityQueryDto, ActivityTimelineDto } from '@/schemas/activity.dto';
export declare class DealActivityService {
    private readonly activityRepository;
    private readonly dealRepository;
    constructor(activityRepository: Repository<DealActivity>, dealRepository: Repository<Deal>);
    getTimeline(dealId: string, query: ActivityQueryDto): Promise<ActivityTimelineDto>;
    getActivities(dealId: string, query: ActivityQueryDto): Promise<ActivityResponseDto[]>;
    getActivity(dealId: string, activityId: string): Promise<ActivityResponseDto>;
    createActivity(dealId: string, dto: CreateActivityDto, userId?: string, userName?: string): Promise<ActivityResponseDto>;
    updateActivity(dealId: string, activityId: string, dto: UpdateActivityDto): Promise<ActivityResponseDto>;
    deleteActivity(dealId: string, activityId: string): Promise<void>;
    syncFromHubSpot(dealId: string, hubspotActivities: any[]): Promise<number>;
    private mapHubSpotActivityType;
    private toResponseDto;
}
