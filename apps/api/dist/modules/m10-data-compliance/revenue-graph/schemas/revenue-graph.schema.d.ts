import { z } from 'zod';
export declare const LinkingStatusSchema: z.ZodEnum<["received", "normalized", "mapping_in_progress", "linked", "linked_low_confidence", "unresolved", "replay_pending", "failed", "dead_lettered"]>;
export type LinkingStatus = z.infer<typeof LinkingStatusSchema>;
export declare const ConfidenceLevelSchema: z.ZodEnum<["high", "medium", "low"]>;
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;
export declare const EntityTypeSchema: z.ZodEnum<["account", "contact", "deal"]>;
export type EntityType = z.infer<typeof EntityTypeSchema>;
export declare const ParticipantSchema: z.ZodObject<{
    email: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["internal", "external"]>>;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    name?: string;
    role?: "internal" | "external";
}, {
    email?: string;
    name?: string;
    role?: "internal" | "external";
}>;
export type Participant = z.infer<typeof ParticipantSchema>;
export declare const CrmHintsSchema: z.ZodObject<{
    accountId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    dealId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contactIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    accountId?: string;
    dealId?: string;
    contactIds?: string[];
}, {
    accountId?: string;
    dealId?: string;
    contactIds?: string[];
}>;
export type CrmHints = z.infer<typeof CrmHintsSchema>;
export declare const ArtifactsSchema: z.ZodObject<{
    transcriptId: z.ZodOptional<z.ZodString>;
    calendarEventId: z.ZodOptional<z.ZodString>;
    emailThreadId: z.ZodOptional<z.ZodString>;
    recordingUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    transcriptId?: string;
    calendarEventId?: string;
    emailThreadId?: string;
    recordingUrl?: string;
}, {
    transcriptId?: string;
    calendarEventId?: string;
    emailThreadId?: string;
    recordingUrl?: string;
}>;
export type Artifacts = z.infer<typeof ArtifactsSchema>;
export declare const NormalizedIntakeSchema: z.ZodObject<{
    eventId: z.ZodString;
    tenantId: z.ZodString;
    sourceType: z.ZodEnum<["call", "email", "meeting", "crm_task", "crm_note"]>;
    sourcePlatform: z.ZodOptional<z.ZodEnum<["zoom", "google_meet", "teams", "email", "salesforce", "hubspot"]>>;
    sourceRecordId: z.ZodString;
    occurredAt: z.ZodString;
    participants: z.ZodArray<z.ZodObject<{
        email: z.ZodString;
        role: z.ZodDefault<z.ZodEnum<["internal", "external"]>>;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email?: string;
        name?: string;
        role?: "internal" | "external";
    }, {
        email?: string;
        name?: string;
        role?: "internal" | "external";
    }>, "many">;
    crmHints: z.ZodDefault<z.ZodObject<{
        accountId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        dealId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        contactIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        accountId?: string;
        dealId?: string;
        contactIds?: string[];
    }, {
        accountId?: string;
        dealId?: string;
        contactIds?: string[];
    }>>;
    artifacts: z.ZodDefault<z.ZodObject<{
        transcriptId: z.ZodOptional<z.ZodString>;
        calendarEventId: z.ZodOptional<z.ZodString>;
        emailThreadId: z.ZodOptional<z.ZodString>;
        recordingUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        transcriptId?: string;
        calendarEventId?: string;
        emailThreadId?: string;
        recordingUrl?: string;
    }, {
        transcriptId?: string;
        calendarEventId?: string;
        emailThreadId?: string;
        recordingUrl?: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    tenantId?: string;
    participants?: {
        email?: string;
        name?: string;
        role?: "internal" | "external";
    }[];
    occurredAt?: string;
    sourceType?: "email" | "call" | "meeting" | "crm_task" | "crm_note";
    sourcePlatform?: "email" | "salesforce" | "hubspot" | "teams" | "zoom" | "google_meet";
    sourceRecordId?: string;
    eventId?: string;
    crmHints?: {
        accountId?: string;
        dealId?: string;
        contactIds?: string[];
    };
    artifacts?: {
        transcriptId?: string;
        calendarEventId?: string;
        emailThreadId?: string;
        recordingUrl?: string;
    };
}, {
    tenantId?: string;
    participants?: {
        email?: string;
        name?: string;
        role?: "internal" | "external";
    }[];
    occurredAt?: string;
    sourceType?: "email" | "call" | "meeting" | "crm_task" | "crm_note";
    sourcePlatform?: "email" | "salesforce" | "hubspot" | "teams" | "zoom" | "google_meet";
    sourceRecordId?: string;
    eventId?: string;
    crmHints?: {
        accountId?: string;
        dealId?: string;
        contactIds?: string[];
    };
    artifacts?: {
        transcriptId?: string;
        calendarEventId?: string;
        emailThreadId?: string;
        recordingUrl?: string;
    };
}>;
export type NormalizedIntake = z.infer<typeof NormalizedIntakeSchema>;
export declare const TranscriptionCompletedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    tenantId: z.ZodString;
    occurredAt: z.ZodString;
    correlationId: z.ZodOptional<z.ZodString>;
    sourceRecordId: z.ZodString;
    sourceType: z.ZodEnum<["call", "email", "meeting", "crm_task", "crm_note"]>;
    sourcePlatform: z.ZodOptional<z.ZodString>;
    participants: z.ZodArray<z.ZodObject<{
        email: z.ZodString;
        role: z.ZodDefault<z.ZodEnum<["internal", "external"]>>;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email?: string;
        name?: string;
        role?: "internal" | "external";
    }, {
        email?: string;
        name?: string;
        role?: "internal" | "external";
    }>, "many">;
    crmHints: z.ZodOptional<z.ZodObject<{
        accountId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        dealId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        contactIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        accountId?: string;
        dealId?: string;
        contactIds?: string[];
    }, {
        accountId?: string;
        dealId?: string;
        contactIds?: string[];
    }>>;
    artifacts: z.ZodOptional<z.ZodObject<{
        transcriptId: z.ZodOptional<z.ZodString>;
        calendarEventId: z.ZodOptional<z.ZodString>;
        emailThreadId: z.ZodOptional<z.ZodString>;
        recordingUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        transcriptId?: string;
        calendarEventId?: string;
        emailThreadId?: string;
        recordingUrl?: string;
    }, {
        transcriptId?: string;
        calendarEventId?: string;
        emailThreadId?: string;
        recordingUrl?: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    tenantId?: string;
    participants?: {
        email?: string;
        name?: string;
        role?: "internal" | "external";
    }[];
    occurredAt?: string;
    version?: string;
    sourceType?: "email" | "call" | "meeting" | "crm_task" | "crm_note";
    sourcePlatform?: string;
    sourceRecordId?: string;
    eventId?: string;
    correlationId?: string;
    crmHints?: {
        accountId?: string;
        dealId?: string;
        contactIds?: string[];
    };
    artifacts?: {
        transcriptId?: string;
        calendarEventId?: string;
        emailThreadId?: string;
        recordingUrl?: string;
    };
}, {
    tenantId?: string;
    participants?: {
        email?: string;
        name?: string;
        role?: "internal" | "external";
    }[];
    occurredAt?: string;
    version?: string;
    sourceType?: "email" | "call" | "meeting" | "crm_task" | "crm_note";
    sourcePlatform?: string;
    sourceRecordId?: string;
    eventId?: string;
    correlationId?: string;
    crmHints?: {
        accountId?: string;
        dealId?: string;
        contactIds?: string[];
    };
    artifacts?: {
        transcriptId?: string;
        calendarEventId?: string;
        emailThreadId?: string;
        recordingUrl?: string;
    };
}>;
export type TranscriptionCompletedEvent = z.infer<typeof TranscriptionCompletedEventSchema>;
export declare const EntityLinkResultSchema: z.ZodObject<{
    entityType: z.ZodEnum<["account", "contact", "deal"]>;
    entityId: z.ZodString;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    signals: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    aiAssisted: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    entityType?: "account" | "deal" | "contact";
    entityId?: string;
    confidence?: "high" | "medium" | "low";
    signals?: string[];
    aiAssisted?: boolean;
}, {
    entityType?: "account" | "deal" | "contact";
    entityId?: string;
    confidence?: "high" | "medium" | "low";
    signals?: string[];
    aiAssisted?: boolean;
}>;
export type EntityLinkResult = z.infer<typeof EntityLinkResultSchema>;
export declare const EntityLinkedEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    tenantId: z.ZodString;
    occurredAt: z.ZodString;
    correlationId: z.ZodOptional<z.ZodString>;
    activityId: z.ZodString;
    sourceType: z.ZodString;
    sourceRecordId: z.ZodString;
    accountId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    dealId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contactIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    linkedAt: z.ZodString;
    explanation: z.ZodObject<{
        signals: z.ZodArray<z.ZodString, "many">;
        aiAssisted: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        signals?: string[];
        aiAssisted?: boolean;
    }, {
        signals?: string[];
        aiAssisted?: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    tenantId?: string;
    accountId?: string;
    activityId?: string;
    occurredAt?: string;
    version?: string;
    dealId?: string;
    confidence?: "high" | "medium" | "low";
    sourceType?: string;
    sourceRecordId?: string;
    eventId?: string;
    correlationId?: string;
    contactIds?: string[];
    linkedAt?: string;
    explanation?: {
        signals?: string[];
        aiAssisted?: boolean;
    };
}, {
    tenantId?: string;
    accountId?: string;
    activityId?: string;
    occurredAt?: string;
    version?: string;
    dealId?: string;
    confidence?: "high" | "medium" | "low";
    sourceType?: string;
    sourceRecordId?: string;
    eventId?: string;
    correlationId?: string;
    contactIds?: string[];
    linkedAt?: string;
    explanation?: {
        signals?: string[];
        aiAssisted?: boolean;
    };
}>;
export type EntityLinkedEvent = z.infer<typeof EntityLinkedEventSchema>;
export declare const AiResolutionRequestSchema: z.ZodObject<{
    tenantId: z.ZodString;
    activityId: z.ZodString;
    transcriptId: z.ZodOptional<z.ZodString>;
    participants: z.ZodArray<z.ZodObject<{
        email: z.ZodString;
        role: z.ZodDefault<z.ZodEnum<["internal", "external"]>>;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email?: string;
        name?: string;
        role?: "internal" | "external";
    }, {
        email?: string;
        name?: string;
        role?: "internal" | "external";
    }>, "many">;
    candidateAccounts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        domain: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        name?: string;
        domain?: string;
    }, {
        id?: string;
        name?: string;
        domain?: string;
    }>, "many">;
    candidateDeals: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        stage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        name?: string;
        stage?: string;
    }, {
        id?: string;
        name?: string;
        stage?: string;
    }>, "many">;
    candidateContacts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        email?: string;
        name?: string;
    }, {
        id?: string;
        email?: string;
        name?: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    tenantId?: string;
    participants?: {
        email?: string;
        name?: string;
        role?: "internal" | "external";
    }[];
    activityId?: string;
    transcriptId?: string;
    candidateAccounts?: {
        id?: string;
        name?: string;
        domain?: string;
    }[];
    candidateDeals?: {
        id?: string;
        name?: string;
        stage?: string;
    }[];
    candidateContacts?: {
        id?: string;
        email?: string;
        name?: string;
    }[];
}, {
    tenantId?: string;
    participants?: {
        email?: string;
        name?: string;
        role?: "internal" | "external";
    }[];
    activityId?: string;
    transcriptId?: string;
    candidateAccounts?: {
        id?: string;
        name?: string;
        domain?: string;
    }[];
    candidateDeals?: {
        id?: string;
        name?: string;
        stage?: string;
    }[];
    candidateContacts?: {
        id?: string;
        email?: string;
        name?: string;
    }[];
}>;
export type AiResolutionRequest = z.infer<typeof AiResolutionRequestSchema>;
export declare const AiResolutionResponseSchema: z.ZodObject<{
    accountId: z.ZodNullable<z.ZodString>;
    dealId: z.ZodNullable<z.ZodString>;
    contactIds: z.ZodArray<z.ZodString, "many">;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    signals: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    accountId?: string;
    dealId?: string;
    confidence?: "high" | "medium" | "low";
    contactIds?: string[];
    signals?: string[];
}, {
    accountId?: string;
    dealId?: string;
    confidence?: "high" | "medium" | "low";
    contactIds?: string[];
    signals?: string[];
}>;
export type AiResolutionResponse = z.infer<typeof AiResolutionResponseSchema>;
export declare const TriggerCrmSyncSchema: z.ZodObject<{
    crmSource: z.ZodEnum<["salesforce", "hubspot", "dynamics365"]>;
    entityTypes: z.ZodDefault<z.ZodArray<z.ZodEnum<["accounts", "contacts", "deals"]>, "many">>;
    fullSync: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    crmSource?: "salesforce" | "hubspot" | "dynamics365";
    entityTypes?: ("deals" | "accounts" | "contacts")[];
    fullSync?: boolean;
}, {
    crmSource?: "salesforce" | "hubspot" | "dynamics365";
    entityTypes?: ("deals" | "accounts" | "contacts")[];
    fullSync?: boolean;
}>;
export type TriggerCrmSyncDto = z.infer<typeof TriggerCrmSyncSchema>;
