import { ActivityType } from '@/entities/deal-activity.entity';
export declare class CreateActivityDto {
    type: ActivityType;
    subject?: string;
    summary?: string;
    contactId?: string;
    contactName?: string;
    activityDate?: string;
    durationMinutes?: number;
    crmActivityId?: string;
    crmData?: Record<string, any>;
}
export declare class UpdateActivityDto {
    subject?: string;
    summary?: string;
    contactId?: string;
    contactName?: string;
    activityDate?: string;
    durationMinutes?: number;
}
export declare class ActivityResponseDto {
    id: string;
    dealId: string;
    type: ActivityType;
    subject?: string;
    summary?: string;
    contactId?: string;
    contactName?: string;
    activityDate: Date;
    durationMinutes?: number;
    crmActivityId: string;
    crmData?: Record<string, any>;
    createdAt: Date;
}
export declare class ActivityQueryDto {
    type?: ActivityType;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
export declare class ActivityTimelineDto {
    total: number;
    byType: Record<ActivityType, number>;
    activities: ActivityResponseDto[];
    lastActivityDate?: Date;
}
