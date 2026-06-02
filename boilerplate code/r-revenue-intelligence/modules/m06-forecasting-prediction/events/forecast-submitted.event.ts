/**
 * TDD §7 — forecast.submitted platform event (camelCase envelope)
 */
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
