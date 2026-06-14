"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerCrmSyncSchema = exports.AiResolutionResponseSchema = exports.AiResolutionRequestSchema = exports.EntityLinkedEventSchema = exports.EntityLinkResultSchema = exports.TranscriptionCompletedEventSchema = exports.NormalizedIntakeSchema = exports.ArtifactsSchema = exports.CrmHintsSchema = exports.ParticipantSchema = exports.EntityTypeSchema = exports.ConfidenceLevelSchema = exports.LinkingStatusSchema = void 0;
const zod_1 = require("zod");
exports.LinkingStatusSchema = zod_1.z.enum([
    "received",
    "normalized",
    "mapping_in_progress",
    "linked",
    "linked_low_confidence",
    "unresolved",
    "replay_pending",
    "failed",
    "dead_lettered",
]);
exports.ConfidenceLevelSchema = zod_1.z.enum(["high", "medium", "low"]);
exports.EntityTypeSchema = zod_1.z.enum(["account", "contact", "deal"]);
exports.ParticipantSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    role: zod_1.z.enum(["internal", "external"]).default("external"),
    name: zod_1.z.string().optional(),
});
exports.CrmHintsSchema = zod_1.z.object({
    accountId: zod_1.z.string().nullable().optional(),
    dealId: zod_1.z.string().nullable().optional(),
    contactIds: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.ArtifactsSchema = zod_1.z.object({
    transcriptId: zod_1.z.string().optional(),
    calendarEventId: zod_1.z.string().optional(),
    emailThreadId: zod_1.z.string().optional(),
    recordingUrl: zod_1.z.string().url().optional(),
});
exports.NormalizedIntakeSchema = zod_1.z.object({
    eventId: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    sourceType: zod_1.z.enum(["call", "email", "meeting", "crm_task", "crm_note"]),
    sourcePlatform: zod_1.z
        .enum(["zoom", "google_meet", "teams", "email", "salesforce", "hubspot"])
        .optional(),
    sourceRecordId: zod_1.z.string(),
    occurredAt: zod_1.z.string().datetime(),
    participants: zod_1.z.array(exports.ParticipantSchema).min(1),
    crmHints: exports.CrmHintsSchema.default({}),
    artifacts: exports.ArtifactsSchema.default({}),
});
exports.TranscriptionCompletedEventSchema = zod_1.z.object({
    eventId: zod_1.z.string().uuid(),
    version: zod_1.z.string().default("1.0"),
    tenantId: zod_1.z.string().uuid(),
    occurredAt: zod_1.z.string().datetime(),
    correlationId: zod_1.z.string().optional(),
    sourceRecordId: zod_1.z.string(),
    sourceType: zod_1.z.enum(["call", "email", "meeting", "crm_task", "crm_note"]),
    sourcePlatform: zod_1.z.string().optional(),
    participants: zod_1.z.array(exports.ParticipantSchema),
    crmHints: exports.CrmHintsSchema.optional(),
    artifacts: exports.ArtifactsSchema.optional(),
});
exports.EntityLinkResultSchema = zod_1.z.object({
    entityType: exports.EntityTypeSchema,
    entityId: zod_1.z.string().uuid(),
    confidence: exports.ConfidenceLevelSchema,
    signals: zod_1.z.array(zod_1.z.string()).default([]),
    aiAssisted: zod_1.z.boolean().default(false),
});
exports.EntityLinkedEventSchema = zod_1.z.object({
    eventId: zod_1.z.string().uuid(),
    version: zod_1.z.string().default("1.0"),
    tenantId: zod_1.z.string().uuid(),
    occurredAt: zod_1.z.string().datetime(),
    correlationId: zod_1.z.string().optional(),
    activityId: zod_1.z.string().uuid(),
    sourceType: zod_1.z.string(),
    sourceRecordId: zod_1.z.string(),
    accountId: zod_1.z.string().uuid().nullable().optional(),
    dealId: zod_1.z.string().uuid().nullable().optional(),
    contactIds: zod_1.z.array(zod_1.z.string().uuid()).default([]),
    confidence: exports.ConfidenceLevelSchema,
    linkedAt: zod_1.z.string().datetime(),
    explanation: zod_1.z.object({
        signals: zod_1.z.array(zod_1.z.string()),
        aiAssisted: zod_1.z.boolean(),
    }),
});
exports.AiResolutionRequestSchema = zod_1.z.object({
    tenantId: zod_1.z.string().uuid(),
    activityId: zod_1.z.string().uuid(),
    transcriptId: zod_1.z.string().optional(),
    participants: zod_1.z.array(exports.ParticipantSchema),
    candidateAccounts: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        domain: zod_1.z.string().optional(),
    })),
    candidateDeals: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        stage: zod_1.z.string().optional(),
    })),
    candidateContacts: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        email: zod_1.z.string(),
        name: zod_1.z.string().optional(),
    })),
});
exports.AiResolutionResponseSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid().nullable(),
    dealId: zod_1.z.string().uuid().nullable(),
    contactIds: zod_1.z.array(zod_1.z.string().uuid()),
    confidence: exports.ConfidenceLevelSchema,
    signals: zod_1.z.array(zod_1.z.string()),
});
exports.TriggerCrmSyncSchema = zod_1.z.object({
    crmSource: zod_1.z.enum(["salesforce", "hubspot", "dynamics365"]),
    entityTypes: zod_1.z
        .array(zod_1.z.enum(["accounts", "contacts", "deals"]))
        .default(["accounts", "contacts", "deals"]),
    fullSync: zod_1.z.boolean().default(false),
});
//# sourceMappingURL=revenue-graph.schema.js.map