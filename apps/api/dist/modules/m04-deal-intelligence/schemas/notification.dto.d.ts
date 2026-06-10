export declare enum NotificationType {
    DEAL_STAGE_CHANGE = "DEAL_STAGE_CHANGE",
    DEAL_WARNING = "DEAL_WARNING",
    TASK_ASSIGNED = "TASK_ASSIGNED",
    TASK_DUE_SOON = "TASK_DUE_SOON",
    TASK_OVERDUE = "TASK_OVERDUE",
    COMMENT_MENTION = "COMMENT_MENTION",
    RISK_ESCALATION = "RISK_ESCALATION",
    PLAYBOOK_COMPLETED = "PLAYBOOK_COMPLETED",
    DEAL_CLOSING_SOON = "DEAL_CLOSING_SOON",
    AI_SCORE_CHANGE = "AI_SCORE_CHANGE"
}
export declare enum NotificationPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare class NotificationResponseDto {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    priority: NotificationPriority;
    dealId?: string;
    entityId?: string;
    actionUrl?: string;
    isRead: boolean;
    createdAt: Date;
    readAt?: Date;
}
export declare class NotificationQueryDto {
    type?: NotificationType;
    isRead?: boolean;
    page?: number;
    limit?: number;
}
export declare class NotificationStatsDto {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
}
export declare class MarkAsReadDto {
    notificationIds: string[];
}
