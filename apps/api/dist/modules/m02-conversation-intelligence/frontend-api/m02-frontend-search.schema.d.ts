import { z } from 'zod';
export declare const M02SearchCallsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    size: z.ZodDefault<z.ZodNumber>;
    tab: z.ZodDefault<z.ZodEnum<["all", "calls", "emails"]>>;
    team: z.ZodOptional<z.ZodString>;
    rep: z.ZodOptional<z.ZodString>;
    stage: z.ZodOptional<z.ZodString>;
    participants: z.ZodOptional<z.ZodString>;
    wordsOrPhrases: z.ZodOptional<z.ZodString>;
    phraseMatchType: z.ZodOptional<z.ZodEnum<["contains", "mentioned_by_any", "said_anytime"]>>;
    topics: z.ZodOptional<z.ZodString>;
    trackers: z.ZodOptional<z.ZodString>;
    scorecardResult: z.ZodOptional<z.ZodString>;
    callTitle: z.ZodOptional<z.ZodString>;
    callType: z.ZodOptional<z.ZodEnum<["all", "internal", "customer"]>>;
    sortBy: z.ZodDefault<z.ZodEnum<["date", "call_duration", "deal"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    chartGranularity: z.ZodDefault<z.ZodEnum<["days", "weeks", "months", "quarters"]>>;
}, "strip", z.ZodTypeAny, {
    callType?: "all" | "internal" | "customer";
    participants?: string;
    rep?: string;
    stage?: string;
    sortOrder?: "asc" | "desc";
    team?: string;
    page?: number;
    size?: number;
    topics?: string;
    tab?: "all" | "calls" | "emails";
    wordsOrPhrases?: string;
    phraseMatchType?: "contains" | "mentioned_by_any" | "said_anytime";
    trackers?: string;
    scorecardResult?: string;
    callTitle?: string;
    sortBy?: "deal" | "date" | "call_duration";
    dateFrom?: string;
    dateTo?: string;
    chartGranularity?: "months" | "days" | "weeks" | "quarters";
}, {
    callType?: "all" | "internal" | "customer";
    participants?: string;
    rep?: string;
    stage?: string;
    sortOrder?: "asc" | "desc";
    team?: string;
    page?: number;
    size?: number;
    topics?: string;
    tab?: "all" | "calls" | "emails";
    wordsOrPhrases?: string;
    phraseMatchType?: "contains" | "mentioned_by_any" | "said_anytime";
    trackers?: string;
    scorecardResult?: string;
    callTitle?: string;
    sortBy?: "deal" | "date" | "call_duration";
    dateFrom?: string;
    dateTo?: string;
    chartGranularity?: "months" | "days" | "weeks" | "quarters";
}>;
export declare const M02AiAskBodySchema: z.ZodObject<{
    callId: z.ZodString;
    question: z.ZodString;
}, "strip", z.ZodTypeAny, {
    callId?: string;
    question?: string;
}, {
    callId?: string;
    question?: string;
}>;
export declare const M02ExportBodySchema: z.ZodObject<{
    filters: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    fields: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    filters?: Record<string, unknown>;
    fields?: Record<string, unknown>;
}, {
    filters?: Record<string, unknown>;
    fields?: Record<string, unknown>;
}>;
export declare const M02CreateStreamBodySchema: z.ZodObject<{
    name: z.ZodString;
    filters: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    notifications: z.ZodOptional<z.ZodObject<{
        inApp: z.ZodOptional<z.ZodBoolean>;
        slack: z.ZodOptional<z.ZodBoolean>;
        emailDigest: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        inApp?: boolean;
        slack?: boolean;
        emailDigest?: boolean;
    }, {
        inApp?: boolean;
        slack?: boolean;
        emailDigest?: boolean;
    }>>;
    shareWithTeam: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    filters?: Record<string, unknown>;
    notifications?: {
        inApp?: boolean;
        slack?: boolean;
        emailDigest?: boolean;
    };
    shareWithTeam?: boolean;
}, {
    name?: string;
    filters?: Record<string, unknown>;
    notifications?: {
        inApp?: boolean;
        slack?: boolean;
        emailDigest?: boolean;
    };
    shareWithTeam?: boolean;
}>;
