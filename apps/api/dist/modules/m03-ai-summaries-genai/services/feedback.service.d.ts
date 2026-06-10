export declare class FeedbackService {
    submitFeedback(params: {
        orgId: string;
        userId: string;
        reportId: string;
        type: string;
        sectionId?: string;
        bulletId?: string;
        note?: string;
    }): Promise<{
        status: string;
    }>;
}
