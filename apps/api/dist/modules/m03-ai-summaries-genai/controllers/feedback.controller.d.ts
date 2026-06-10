import { FeedbackService } from '../services/feedback.service';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    submitReportFeedback(reportId: string, body: {
        type: string;
        sectionId?: string;
        bulletId?: string;
        note?: string;
    }, req: any): Promise<{
        status: string;
    }>;
}
