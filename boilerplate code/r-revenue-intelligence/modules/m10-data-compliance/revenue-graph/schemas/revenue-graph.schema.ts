// M10 Revenue Graph — Zod Validation Schemas
// Owned by: modules/m10-data-compliance/ (TDD Doc #11a v3.0)
// Pattern: Zod schema defines shape → TypeScript type inferred from it.
// Architecture rule: ALL API and event boundaries use Zod for runtime validation.

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────
// ENTITY LINKING STATUS LIFECYCLE
// received → normalized → mapping_in_progress →
//   linked | linked_low_confidence | unresolved | failed | dead_lettered
// ─────────────────────────────────────────────────────────────────
export const LinkingStatusSchema = z.enum([
  'received',
  'normalized',
  'mapping_in_progress',
  'linked',
  'linked_low_confidence',
  'unresolved',
  'replay_pending',
  'failed',
  'dead_lettered',
]);
export type LinkingStatus = z.infer<typeof LinkingStatusSchema>;

export const ConfidenceLevelSchema = z.enum(['high', 'medium', 'low']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const EntityTypeSchema = z.enum(['account', 'contact', 'deal']);
export type EntityType = z.infer<typeof EntityTypeSchema>;

// ─────────────────────────────────────────────────────────────────
// INTAKE INTERACTION SCHEMA
// The normalized canonical shape of a captured interaction.
// M1 Capture & Transcription publishes this as call.transcription.completed.
// ─────────────────────────────────────────────────────────────────
export const ParticipantSchema = z.object({
  email: z.string().email(),
  role: z.enum(['internal', 'external']).default('external'),
  name: z.string().optional(),
});
export type Participant = z.infer<typeof ParticipantSchema>;

export const CrmHintsSchema = z.object({
  accountId: z.string().nullable().optional(),
  dealId: z.string().nullable().optional(),
  contactIds: z.array(z.string()).default([]),
});
export type CrmHints = z.infer<typeof CrmHintsSchema>;

export const ArtifactsSchema = z.object({
  transcriptId: z.string().optional(),
  calendarEventId: z.string().optional(),
  emailThreadId: z.string().optional(),
  recordingUrl: z.string().url().optional(),
});
export type Artifacts = z.infer<typeof ArtifactsSchema>;

export const NormalizedIntakeSchema = z.object({
  eventId: z.string().uuid(),
  tenantId: z.string().uuid(),
  sourceType: z.enum(['call', 'email', 'meeting', 'crm_task', 'crm_note']),
  sourcePlatform: z
    .enum(['zoom', 'google_meet', 'teams', 'email', 'salesforce', 'hubspot'])
    .optional(),
  sourceRecordId: z.string(),
  occurredAt: z.string().datetime(),
  participants: z.array(ParticipantSchema).min(1),
  crmHints: CrmHintsSchema.default({}),
  artifacts: ArtifactsSchema.default({}),
});
export type NormalizedIntake = z.infer<typeof NormalizedIntakeSchema>;

// ─────────────────────────────────────────────────────────────────
// call.transcription.completed EVENT PAYLOAD
// This is what M10 Revenue Graph consumes from M1.
// ─────────────────────────────────────────────────────────────────
export const TranscriptionCompletedEventSchema = z.object({
  eventId: z.string().uuid(),
  version: z.string().default('1.0'),
  tenantId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  correlationId: z.string().optional(),
  sourceRecordId: z.string(),
  sourceType: z.enum(['call', 'email', 'meeting', 'crm_task', 'crm_note']),
  sourcePlatform: z.string().optional(),
  participants: z.array(ParticipantSchema),
  crmHints: CrmHintsSchema.optional(),
  artifacts: ArtifactsSchema.optional(),
});
export type TranscriptionCompletedEvent = z.infer<typeof TranscriptionCompletedEventSchema>;

// ─────────────────────────────────────────────────────────────────
// ENTITY LINK RESULT — Internal shape of one resolved entity link
// ─────────────────────────────────────────────────────────────────
export const EntityLinkResultSchema = z.object({
  entityType: EntityTypeSchema,
  entityId: z.string().uuid(),
  confidence: ConfidenceLevelSchema,
  signals: z.array(z.string()).default([]),
  aiAssisted: z.boolean().default(false),
});
export type EntityLinkResult = z.infer<typeof EntityLinkResultSchema>;

// ─────────────────────────────────────────────────────────────────
// revenue_graph.entity.linked EVENT PAYLOAD
// Published AFTER successful durable write to m10_data_compliance tables.
// Downstream consumers (M2, M3, M4, M5, M6, M7, M9) depend on this.
// ─────────────────────────────────────────────────────────────────
export const EntityLinkedEventSchema = z.object({
  eventId: z.string().uuid(),
  version: z.string().default('1.0'),
  tenantId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  correlationId: z.string().optional(),
  activityId: z.string().uuid(),
  sourceType: z.string(),
  sourceRecordId: z.string(),
  accountId: z.string().uuid().nullable().optional(),
  dealId: z.string().uuid().nullable().optional(),
  contactIds: z.array(z.string().uuid()).default([]),
  confidence: ConfidenceLevelSchema,
  linkedAt: z.string().datetime(),
  explanation: z.object({
    signals: z.array(z.string()),
    aiAssisted: z.boolean(),
  }),
});
export type EntityLinkedEvent = z.infer<typeof EntityLinkedEventSchema>;

// ─────────────────────────────────────────────────────────────────
// AI ENTITY RESOLUTION — Request/Response between TypeScript and Python
// Architecture rule: Only structured JSON crosses the TS ↔ Python boundary.
// Python AI service endpoint: M10_AI_SERVICE_BASE_URL/v1/resolve-entities
// ─────────────────────────────────────────────────────────────────
export const AiResolutionRequestSchema = z.object({
  tenantId: z.string().uuid(),
  activityId: z.string().uuid(),
  transcriptId: z.string().optional(),
  participants: z.array(ParticipantSchema),
  candidateAccounts: z.array(
    z.object({ id: z.string(), name: z.string(), domain: z.string().optional() }),
  ),
  candidateDeals: z.array(
    z.object({ id: z.string(), name: z.string(), stage: z.string().optional() }),
  ),
  candidateContacts: z.array(
    z.object({ id: z.string(), email: z.string(), name: z.string().optional() }),
  ),
});
export type AiResolutionRequest = z.infer<typeof AiResolutionRequestSchema>;

export const AiResolutionResponseSchema = z.object({
  accountId: z.string().uuid().nullable(),
  dealId: z.string().uuid().nullable(),
  contactIds: z.array(z.string().uuid()),
  confidence: ConfidenceLevelSchema,
  signals: z.array(z.string()),
});
export type AiResolutionResponse = z.infer<typeof AiResolutionResponseSchema>;

// ─────────────────────────────────────────────────────────────────
// CRM SYNC REQUEST SCHEMA (API input body)
// POST /api/v1/m10-data-compliance/revenue-graph/crm-sync
// ─────────────────────────────────────────────────────────────────
export const TriggerCrmSyncSchema = z.object({
  crmSource: z.enum(['salesforce', 'hubspot', 'dynamics365']),
  entityTypes: z
    .array(z.enum(['accounts', 'contacts', 'deals']))
    .default(['accounts', 'contacts', 'deals']),
  fullSync: z.boolean().default(false),
});
export type TriggerCrmSyncDto = z.infer<typeof TriggerCrmSyncSchema>;
