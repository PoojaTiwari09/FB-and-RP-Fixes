import { z } from 'zod';
export declare const CreateCallSchema: z.ZodObject<{
    title: z.ZodString;
    callDate: z.ZodDate;
    durationSeconds: z.ZodDefault<z.ZodNumber>;
    callType: z.ZodEnum<["inbound", "outbound", "meeting"]>;
    callSource: z.ZodEnum<["zoom", "teams", "meet", "dialer", "manual"]>;
    participants: z.ZodArray<z.ZodString, "many">;
    callOwner: z.ZodString;
    accountId: z.ZodOptional<z.ZodString>;
    opportunityId: z.ZodOptional<z.ZodString>;
    audioUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    callDate: Date;
    durationSeconds: number;
    callType: "inbound" | "outbound" | "meeting";
    callSource: "zoom" | "teams" | "meet" | "dialer" | "manual";
    participants: string[];
    callOwner: string;
    accountId?: string | undefined;
    opportunityId?: string | undefined;
    audioUrl?: string | undefined;
}, {
    title: string;
    callDate: Date;
    callType: "inbound" | "outbound" | "meeting";
    callSource: "zoom" | "teams" | "meet" | "dialer" | "manual";
    participants: string[];
    callOwner: string;
    durationSeconds?: number | undefined;
    accountId?: string | undefined;
    opportunityId?: string | undefined;
    audioUrl?: string | undefined;
}>;
export type CreateCallDto = z.infer<typeof CreateCallSchema>;
export declare const CreateNoteSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export type CreateNoteDto = z.infer<typeof CreateNoteSchema>;
export declare const UpdateNoteSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export type UpdateNoteDto = z.infer<typeof UpdateNoteSchema>;
export declare const ShareCallSchema: z.ZodObject<{
    sharedWithId: z.ZodString;
    sharedWithType: z.ZodEnum<["user", "team"]>;
}, "strip", z.ZodTypeAny, {
    sharedWithId: string;
    sharedWithType: "user" | "team";
}, {
    sharedWithId: string;
    sharedWithType: "user" | "team";
}>;
export type ShareCallDto = z.infer<typeof ShareCallSchema>;
export declare const SearchQuerySchema: z.ZodObject<{
    q: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    q: string;
    limit: number;
    offset: number;
}, {
    q: string;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type SearchQueryDto = z.infer<typeof SearchQuerySchema>;
export declare const ListCallsQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed"]>>;
    source: z.ZodOptional<z.ZodEnum<["zoom", "teams", "meet", "dialer", "manual"]>>;
    sortBy: z.ZodDefault<z.ZodEnum<["callDate", "title", "durationSeconds", "transcriptStatus"]>>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    sortBy: "title" | "callDate" | "durationSeconds" | "transcriptStatus";
    order: "asc" | "desc";
    status?: "pending" | "processing" | "completed" | "failed" | undefined;
    source?: "zoom" | "teams" | "meet" | "dialer" | "manual" | undefined;
}, {
    status?: "pending" | "processing" | "completed" | "failed" | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    source?: "zoom" | "teams" | "meet" | "dialer" | "manual" | undefined;
    sortBy?: "title" | "callDate" | "durationSeconds" | "transcriptStatus" | undefined;
    order?: "asc" | "desc" | undefined;
}>;
export type ListCallsQueryDto = z.infer<typeof ListCallsQuerySchema>;
export declare const UpdateAdminSettingsSchema: z.ZodObject<{
    transcriptionEnabled: z.ZodOptional<z.ZodBoolean>;
    minCallDurationSeconds: z.ZodOptional<z.ZodNumber>;
    piiRedactionEnabled: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    transcriptionEnabled?: boolean | undefined;
    minCallDurationSeconds?: number | undefined;
    piiRedactionEnabled?: boolean | undefined;
}, {
    transcriptionEnabled?: boolean | undefined;
    minCallDurationSeconds?: number | undefined;
    piiRedactionEnabled?: boolean | undefined;
}>;
export type UpdateAdminSettingsDto = z.infer<typeof UpdateAdminSettingsSchema>;
