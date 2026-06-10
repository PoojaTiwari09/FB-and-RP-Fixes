export interface ForecastSubmittedEventPayload {
    submissionId: string;
    periodId: string;
    userId: string;
    submittedAmount: number;
    version: number;
    submittedAt: string;
}
export interface ForecastSubmittedEvent {
    eventId: string;
    tenantId: string;
    correlationId: string;
    occurredAt: string;
    publishedAt: string;
    payload: ForecastSubmittedEventPayload;
}
