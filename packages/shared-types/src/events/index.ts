import { z } from "zod";

// Canonical Event Envelope Schema
export const EventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  eventName: z.string(),
  eventVersion: z.string(),
  schemaId: z.string(),
  tenantId: z.string(),
  producer: z.string(),
  occurredAt: z.string(),
  publishedAt: z.string(),
  correlationId: z.string().optional(),
  traceId: z.string().optional(),
  payload: z.record(z.any()),
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

// call.transcription.completed@v1
export const CallTranscriptionCompletedPayloadSchema_v1 = z.object({
  callId: z.string(),
  transcriptId: z.string().optional(),
  sourceType: z.string().optional(),
  sourcePlatform: z.string().optional(),
  sourceRecordId: z.string().optional(),
  participants: z.array(z.string()).optional(),
  crmHints: z.record(z.any()).optional(),
  artifacts: z.object({
    transcriptId: z.string().optional(),
    assemblyAiJobId: z.string().optional(),
    manualReplay: z.boolean().optional(),
  }).optional(),
});

export const CallTranscriptionCompleted_v1 = EventEnvelopeSchema.extend({
  eventName: z.literal("call.transcription.completed"),
  eventVersion: z.literal("v1"),
  schemaId: z.literal("call.transcription.completed@v1"),
  payload: CallTranscriptionCompletedPayloadSchema_v1,
});

export type CallTranscriptionCompleted_v1 = z.infer<typeof CallTranscriptionCompleted_v1>;

// call.transcription.failed@v1
export const CallTranscriptionFailedPayloadSchema_v1 = z.object({
  callId: z.string(),
  reason: z.string(),
});

export const CallTranscriptionFailed_v1 = EventEnvelopeSchema.extend({
  eventName: z.literal("call.transcription.failed"),
  eventVersion: z.literal("v1"),
  schemaId: z.literal("call.transcription.failed@v1"),
  payload: CallTranscriptionFailedPayloadSchema_v1,
});

export type CallTranscriptionFailed_v1 = z.infer<typeof CallTranscriptionFailed_v1>;

// notification.alert.requested@v1
export const NotificationAlertRequestedPayloadSchema_v1 = z.object({
  channel: z.enum(["slack", "email", "in_app"]),
  recipient: z.string().optional(),
  body: z.string(),
  title: z.string().optional(),
});

export const NotificationAlertRequested_v1 = EventEnvelopeSchema.extend({
  eventName: z.literal("notification.alert.requested"),
  eventVersion: z.literal("v1"),
  schemaId: z.literal("notification.alert.requested@v1"),
  payload: NotificationAlertRequestedPayloadSchema_v1,
});

export type NotificationAlertRequested_v1 = z.infer<typeof NotificationAlertRequested_v1>;

// forecast.submitted@v1
export const ForecastSubmittedPayloadSchema_v1 = z.object({
  submissionId: z.string(),
  periodId: z.string(),
  userId: z.string(),
  submittedAmount: z.number(),
  version: z.number(),
  lob: z.string().optional(),
});

export const ForecastSubmitted_v1 = EventEnvelopeSchema.extend({
  eventName: z.literal("forecast.submitted"),
  eventVersion: z.literal("v1"),
  schemaId: z.literal("forecast.submitted@v1"),
  payload: ForecastSubmittedPayloadSchema_v1,
});

export type ForecastSubmitted_v1 = z.infer<typeof ForecastSubmitted_v1>;

// crm.ingested@v1
export const CrmIngestedPayloadSchema_v1 = z.object({
  source: z.literal("hubspot"),
  records: z.number().int().nonnegative(),
});

export const CrmIngestedEvent_v1 = EventEnvelopeSchema.extend({
  eventName: z.literal("crm.ingested"),
  eventVersion: z.literal("v1"),
  schemaId: z.literal("crm.ingested@v1"),
  payload: CrmIngestedPayloadSchema_v1,
});

export type CrmIngestedEvent_v1 = z.infer<typeof CrmIngestedEvent_v1>;
