import { M06PredictionQueueService } from '../services/m06-prediction-queue.service';
export declare class ForecastSubmittedListener {
    private readonly predictionQueue;
    private readonly logger;
    constructor(predictionQueue: M06PredictionQueueService);
    handleForecastSubmitted(envelope: {
        tenantId: string;
        payload: {
            submissionId: string;
            periodId: string;
            userId: string;
            submittedAmount: number;
            version: number;
            submittedAt?: string;
        };
    }): Promise<void>;
}
