import { DealActivityService } from '@/services/deal-activity.service';
import { CreateActivityDto, UpdateActivityDto, ActivityResponseDto, ActivityQueryDto, ActivityTimelineDto } from '@/schemas/activity.dto';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
export declare class DealActivityController {
    private readonly activityService;
    constructor(activityService: DealActivityService);
    getTimeline(dealId: string, query: ActivityQueryDto): Promise<ActivityTimelineDto>;
    getActivities(dealId: string, query: ActivityQueryDto): Promise<ActivityResponseDto[]>;
    getActivity(dealId: string, activityId: string): Promise<ActivityResponseDto>;
    createActivity(dealId: string, dto: CreateActivityDto, req: AuthenticatedRequest): Promise<ActivityResponseDto>;
    updateActivity(dealId: string, activityId: string, dto: UpdateActivityDto): Promise<ActivityResponseDto>;
    deleteActivity(dealId: string, activityId: string): Promise<{
        message: string;
    }>;
}
