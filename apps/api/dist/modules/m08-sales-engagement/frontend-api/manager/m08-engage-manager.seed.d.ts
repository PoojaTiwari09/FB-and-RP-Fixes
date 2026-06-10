export declare const MOCK_TEAM_MEMBERS: {
    id: string;
    name: string;
    role: string;
}[];
export declare const MOCK_RECENT_ACTIVITY: ({
    id: string;
    contactName: string;
    companyName: string;
    activityType: "call";
    description: string;
    timeAgo: string;
} | {
    id: string;
    contactName: string;
    companyName: string;
    activityType: "email";
    description: string;
    timeAgo: string;
} | {
    id: string;
    contactName: string;
    companyName: string;
    activityType: "linkedin_profile_viewed";
    description: string;
    timeAgo: string;
})[];
export declare const MOCK_EMAIL_TEMPLATES: {
    id: string;
    name: string;
    subject: string;
    body: string;
}[];
export declare const INITIAL_MOCK_TASKS: () => ({
    id: string;
    title: string;
    contactName: string;
    companyName: string;
    channel: string;
    scheduledTime: string;
    dueDateTime: string;
    isOverdue: boolean;
    interactionCount: number;
    priority: string;
    status: string;
    dueDate: string;
    dueTime: string;
    assigneeId: string;
    assigneeName: string;
    assigneeRole: string;
    arr: string;
    todoType: string;
    entityType: string;
    workflowName: string;
    workflowStep: number;
    totalWorkflowSteps: number;
    aiSignal: string;
    aiSignalType: string;
    aiInsight: string;
    recommendedNextSteps: string[];
    recentActivity: {
        date: string;
        activityType: string;
        description: string;
    }[];
    notes: string;
    emailDraft?: undefined;
    mutualConnections?: undefined;
    linkedinScript?: undefined;
} | {
    id: string;
    title: string;
    contactName: string;
    companyName: string;
    channel: string;
    scheduledTime: string;
    dueDateTime: string;
    isOverdue: boolean;
    interactionCount: number;
    priority: string;
    status: string;
    dueDate: string;
    dueTime: string;
    assigneeId: string;
    assigneeName: string;
    assigneeRole: string;
    arr: string;
    todoType: string;
    entityType: string;
    workflowName: string;
    workflowStep: number;
    totalWorkflowSteps: number;
    aiSignal: string;
    aiSignalType: string;
    emailDraft: {
        to: string;
        fromOptions: string[];
        subject: string;
        body: string;
    };
    aiInsight?: undefined;
    recommendedNextSteps?: undefined;
    recentActivity?: undefined;
    notes?: undefined;
    mutualConnections?: undefined;
    linkedinScript?: undefined;
} | {
    id: string;
    title: string;
    contactName: string;
    companyName: string;
    channel: string;
    scheduledTime: string;
    dueDateTime: string;
    isOverdue: boolean;
    interactionCount: number;
    priority: string;
    status: string;
    dueDate: string;
    dueTime: string;
    assigneeId: string;
    assigneeName: string;
    assigneeRole: string;
    arr: string;
    todoType: string;
    entityType: string;
    aiSignal: string;
    aiSignalType: string;
    aiInsight: string;
    recommendedNextSteps: string[];
    recentActivity: {
        date: string;
        activityType: string;
        description: string;
    }[];
    notes: string;
    workflowName?: undefined;
    workflowStep?: undefined;
    totalWorkflowSteps?: undefined;
    emailDraft?: undefined;
    mutualConnections?: undefined;
    linkedinScript?: undefined;
} | {
    id: string;
    title: string;
    contactName: string;
    companyName: string;
    channel: string;
    scheduledTime: string;
    dueDateTime: string;
    isOverdue: boolean;
    interactionCount: number;
    priority: string;
    status: string;
    dueDate: string;
    dueTime: string;
    assigneeId: string;
    assigneeName: string;
    assigneeRole: string;
    arr: string;
    todoType: string;
    entityType: string;
    workflowName: string;
    workflowStep: number;
    totalWorkflowSteps: number;
    aiSignal: string;
    aiSignalType: string;
    aiInsight?: undefined;
    recommendedNextSteps?: undefined;
    recentActivity?: undefined;
    notes?: undefined;
    emailDraft?: undefined;
    mutualConnections?: undefined;
    linkedinScript?: undefined;
} | {
    id: string;
    title: string;
    contactName: string;
    companyName: string;
    channel: string;
    scheduledTime: string;
    dueDateTime: string;
    isOverdue: boolean;
    interactionCount: number;
    priority: string;
    status: string;
    dueDate: string;
    dueTime: string;
    assigneeId: string;
    assigneeName: string;
    assigneeRole: string;
    arr: string;
    todoType: string;
    entityType: string;
    aiSignal: string;
    aiSignalType: string;
    mutualConnections: number;
    linkedinScript: {
        messageScript: string;
    };
    workflowName?: undefined;
    workflowStep?: undefined;
    totalWorkflowSteps?: undefined;
    aiInsight?: undefined;
    recommendedNextSteps?: undefined;
    recentActivity?: undefined;
    notes?: undefined;
    emailDraft?: undefined;
} | {
    id: string;
    title: string;
    contactName: string;
    companyName: string;
    channel: string;
    scheduledTime: string;
    dueDateTime: string;
    isOverdue: boolean;
    interactionCount: number;
    priority: string;
    status: string;
    dueDate: string;
    dueTime: string;
    assigneeId: string;
    assigneeName: string;
    assigneeRole: string;
    arr: string;
    todoType: string;
    entityType: string;
    aiSignal: string;
    aiSignalType: string;
    workflowName?: undefined;
    workflowStep?: undefined;
    totalWorkflowSteps?: undefined;
    aiInsight?: undefined;
    recommendedNextSteps?: undefined;
    recentActivity?: undefined;
    notes?: undefined;
    emailDraft?: undefined;
    mutualConnections?: undefined;
    linkedinScript?: undefined;
} | {
    id: string;
    title: string;
    contactName: string;
    companyName: string;
    channel: string;
    scheduledTime: string;
    dueDateTime: string;
    isOverdue: boolean;
    interactionCount: number;
    priority: string;
    status: string;
    dueDate: string;
    dueTime: string;
    assigneeId: string;
    assigneeName: string;
    assigneeRole: string;
    arr: string;
    todoType: string;
    entityType: string;
    aiSignal: string;
    aiSignalType: string;
    emailDraft: {
        to: string;
        fromOptions: string[];
        subject: string;
        body: string;
    };
    workflowName?: undefined;
    workflowStep?: undefined;
    totalWorkflowSteps?: undefined;
    aiInsight?: undefined;
    recommendedNextSteps?: undefined;
    recentActivity?: undefined;
    notes?: undefined;
    mutualConnections?: undefined;
    linkedinScript?: undefined;
})[];
export declare function mockFetchTasksResponse(groups: {
    groupLabel: string;
    count: number;
    tasks: Record<string, unknown>[];
}[], tabCounts: Record<string, number>, statusPills: {
    atRisk: number;
    dueToday: number;
}, pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
}): {
    status: string;
    data: {
        groups: {
            groupLabel: string;
            count: number;
            tasks: Record<string, unknown>[];
        }[];
        tabCounts: Record<string, number>;
        statusPills: {
            atRisk: number;
            dueToday: number;
        };
        pagination: {
            page: number;
            size: number;
            total: number;
            totalPages: number;
        };
    };
};
export declare function mockFetchSummaryResponse(summary: any): {
    status: string;
    data: any;
};
export declare function mockFetchTaskDetailResponse(task: Record<string, unknown>): {
    status: string;
    data: Record<string, unknown>;
};
export declare function mockFetchRecentActivityResponse(activities: any[]): {
    status: string;
    data: any[];
};
export declare function mockCreateTaskApiResponse(task: Record<string, unknown>): {
    status: string;
    data: {
        taskId: unknown;
        status: unknown;
        createdAt: unknown;
    };
};
export declare function mockReassignTaskApiResponse(task: Record<string, unknown>): {
    status: string;
    data: {
        taskId: unknown;
        assigneeId: unknown;
        assigneeName: unknown;
        assigneeRole: unknown;
        updatedAt: unknown;
    };
};
export declare function mockSkipTaskResponse(taskId: string): {
    status: string;
    data: {
        taskId: string;
        status: string;
        action: string;
        updatedAt: string;
    };
};
export declare function mockDismissTaskResponse(taskId: string): {
    status: string;
    data: {
        taskId: string;
        status: string;
        action: string;
        updatedAt: string;
    };
};
export declare function mockActionResponse(taskId: string, action: string): {
    status: string;
    data: {
        taskId: string;
        action: string;
        loggedAt: string;
    };
};
export declare function mockSearchLinkedEntitiesResponse(results: any[]): {
    status: string;
    data: {
        results: any[];
    };
};
export declare function mockFetchEmailDraftResponse(emailDraft: any): {
    status: string;
    data: any;
};
export declare function mockFetchLinkedInScriptResponse(script: any): {
    status: string;
    data: any;
};
export declare function mockFetchContactDetailResponse(contact: any): {
    status: string;
    data: any;
};
export declare function mockFetchTeamMembersResponse(members: any[]): {
    status: string;
    data: any[];
};
export declare function mockFetchFiltersConfigResponse(config: any): {
    status: string;
    data: any;
};
