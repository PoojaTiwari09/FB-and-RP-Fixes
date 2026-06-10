export declare const MOCK_TASKS: {
    taskId: string;
    contactId: string;
    contactName: string;
    company: string;
    channelType: string;
    sequenceName: string;
    sequenceStep: string;
    scheduledTime: string;
    dueDateTime: string;
    interactionCount: number;
    priority: string;
    status: string;
    isOverdue: boolean;
    isAtRisk: boolean;
}[];
export declare const MOCK_TASK_SUMMARY: {
    totalTasksToday: number;
    completedCount: number;
    inProgressCount: number;
    upcomingCount: number;
    atRiskCount: number;
    dueTodayCount: number;
    highPriorityCount: number;
    progressPercent: number;
};
export declare const MOCK_RECENT_ACTIVITY: {
    activityId: string;
    contactId: string;
    contactName: string;
    company: string;
    channelType: string;
    summary: string;
    occurredAt: string;
    timeAgoLabel: string;
}[];
export declare const MOCK_TASK_DETAILS: Record<string, Record<string, unknown>>;
export declare const MOCK_LOOKUP_RESULTS: {
    id: string;
    type: string;
    displayName: string;
    subLabel: string;
}[];
export declare const MOCK_ASSIGNABLE_USERS: {
    userId: string;
    displayName: string;
    role: string;
    isCurrentUser: boolean;
}[];
export declare const MOCK_EMAIL_DRAFTS: Record<string, Record<string, unknown>>;
export declare const MOCK_EMAIL_TEMPLATES: {
    templateId: string;
    templateName: string;
    subject: string;
    bodyHtml: string;
    category: string;
}[];
export declare const MOCK_LINKEDIN_DRAFTS: Record<string, Record<string, unknown>>;
export declare const MOCK_CONTACT_DETAILS: Record<string, Record<string, unknown>>;
export declare const MOCK_ENGAGEMENT_TIMELINES: Record<string, unknown[]>;
export declare const MOCK_CRM_FIELDS: Record<string, Record<string, unknown>>;
export declare const MOCK_FILTER_OPTIONS: {
    flowNames: {
        flowId: string;
        flowName: string;
    }[];
    crmFields: {
        account: ({
            fieldId: string;
            fieldLabel: string;
            fieldType: string;
            options: string[];
        } | {
            fieldId: string;
            fieldLabel: string;
            fieldType: string;
            options?: undefined;
        })[];
        contact: ({
            fieldId: string;
            fieldLabel: string;
            fieldType: string;
            options?: undefined;
        } | {
            fieldId: string;
            fieldLabel: string;
            fieldType: string;
            options: string[];
        })[];
        lead: ({
            fieldId: string;
            fieldLabel: string;
            fieldType: string;
            options: string[];
        } | {
            fieldId: string;
            fieldLabel: string;
            fieldType: string;
            options?: undefined;
        })[];
        opportunity: ({
            fieldId: string;
            fieldLabel: string;
            fieldType: string;
            options: string[];
        } | {
            fieldId: string;
            fieldLabel: string;
            fieldType: string;
            options?: undefined;
        })[];
    };
};
export declare const MOCK_SMART_CALL_INITS: Record<string, Record<string, unknown>>;
export declare const MOCK_LIVE_SESSION_DATA: {
    currentStage: string;
    nextSuggestion: string;
    suggestedResponses: string[];
    competitorIntelligence: {
        competitorName: string;
        insight: string;
        ourEdge: string;
        sayThis: string;
    };
    intentSignals: {
        label: string;
        value: string;
        severity: string;
        color: string;
    }[];
    talkRatio: {
        repPercent: number;
        customerPercent: number;
    };
    conversationMetrics: {
        interruptions: number;
        speakingPace: string;
        wordsPerMinute: number;
        questionsAsked: number;
    };
    conversationSummary: string;
};
export declare const MOCK_CALL_SUMMARY: {
    sessionId: string;
    callSummaryId: string;
    duration: string;
    callType: string;
    signalLabel: string;
    signalType: string;
    overallScore: number;
    dimensionScores: {
        dimension: string;
        score: number;
        maxScore: number;
    }[];
    aiSummary: string;
    keyMoments: {
        timestamp: string;
        type: string;
        description: string;
    }[];
    improvementSuggestions: string[];
    conversationTimeline: {
        startTime: string;
        endTime: string;
        topic: string;
    }[];
    transcriptUrl: string;
};
