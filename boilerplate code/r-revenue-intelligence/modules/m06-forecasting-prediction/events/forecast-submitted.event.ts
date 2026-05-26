export interface ForecastSubmittedEvent {
  eventId: string;
  tenantId: string;
  correlationId: string;
  occurredAt: string;
  payload: {
    submissionId: string;
    periodId: string;
    userId: string;
    submittedAmount: number;
    version: number;
    lob: string;
  };
}
