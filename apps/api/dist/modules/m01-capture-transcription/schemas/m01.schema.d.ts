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
    title?: string;
    callDate?: Date;
    durationSeconds?: number;
    callType?: "inbound" | "outbound" | "meeting";
    callSource?: "manual" | "teams" | "zoom" | "meet" | "dialer";
    participants?: string[];
    callOwner?: string;
    accountId?: string;
    opportunityId?: string;
    audioUrl?: string;
}, {
    title?: string;
    callDate?: Date;
    durationSeconds?: number;
    callType?: "inbound" | "outbound" | "meeting";
    callSource?: "manual" | "teams" | "zoom" | "meet" | "dialer";
    participants?: string[];
    callOwner?: string;
    accountId?: string;
    opportunityId?: string;
    audioUrl?: string;
}>;
export type CreateCallDto = z.infer<typeof CreateCallSchema>;
export declare const UploadFromS3Schema: z.ZodObject<{
    recordingId: z.ZodEnum<["2min_sales", "3mins_sales"]>;
}, "strip", z.ZodTypeAny, {
    recordingId?: "2min_sales" | "3mins_sales";
}, {
    recordingId?: "2min_sales" | "3mins_sales";
}>;
export type UploadFromS3Dto = z.infer<typeof UploadFromS3Schema>;
export declare const CreateNoteSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content?: string;
}, {
    content?: string;
}>;
export type CreateNoteDto = z.infer<typeof CreateNoteSchema>;
export declare const UpdateNoteSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content?: string;
}, {
    content?: string;
}>;
export type UpdateNoteDto = z.infer<typeof UpdateNoteSchema>;
export declare const ShareCallSchema: z.ZodObject<{
    sharedWithId: z.ZodString;
    sharedWithType: z.ZodEnum<["user", "team"]>;
}, "strip", z.ZodTypeAny, {
    sharedWithId?: string;
    sharedWithType?: "user" | "team";
}, {
    sharedWithId?: string;
    sharedWithType?: "user" | "team";
}>;
export type ShareCallDto = z.infer<typeof ShareCallSchema>;
export declare const SearchQuerySchema: z.ZodObject<{
    q: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    offset?: number;
    limit?: number;
    q?: string;
}, {
    offset?: number;
    limit?: number;
    q?: string;
}>;
export type SearchQueryDto = z.infer<typeof SearchQuerySchema>;
export declare const ListCallsQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "skipped"]>>;
    source: z.ZodOptional<z.ZodEnum<["zoom", "teams", "meet", "dialer", "manual"]>>;
    sortBy: z.ZodDefault<z.ZodEnum<["callDate", "title", "durationSeconds", "transcriptStatus", "createdAt"]>>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: "failed" | "completed" | "skipped" | "processing" | "pending";
    source?: "manual" | "teams" | "zoom" | "meet" | "dialer";
    offset?: number;
    order?: "asc" | "desc";
    sortBy?: "title" | "callDate" | "durationSeconds" | "transcriptStatus" | "createdAt";
    limit?: number;
}, {
    status?: "failed" | "completed" | "skipped" | "processing" | "pending";
    source?: "manual" | "teams" | "zoom" | "meet" | "dialer";
    offset?: number;
    order?: "asc" | "desc";
    sortBy?: "title" | "callDate" | "durationSeconds" | "transcriptStatus" | "createdAt";
    limit?: number;
}>;
export type ListCallsQueryDto = z.infer<typeof ListCallsQuerySchema>;
export declare const UpdateAdminSettingsSchema: z.ZodObject<{
    transcriptionEnabled: z.ZodOptional<z.ZodBoolean>;
    minCallDurationSeconds: z.ZodOptional<z.ZodNumber>;
    piiRedactionEnabled: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    transcriptionEnabled?: boolean;
    minCallDurationSeconds?: number;
    piiRedactionEnabled?: boolean;
}, {
    transcriptionEnabled?: boolean;
    minCallDurationSeconds?: number;
    piiRedactionEnabled?: boolean;
}>;
export type UpdateAdminSettingsDto = z.infer<typeof UpdateAdminSettingsSchema>;
export declare const AddNextStepSchema: z.ZodObject<{
    step: z.ZodString;
}, "strip", z.ZodTypeAny, {
    step?: string;
}, {
    step?: string;
}>;
export type AddNextStepDto = z.infer<typeof AddNextStepSchema>;
export declare const UpdateNextStepSchema: z.ZodObject<{
    step: z.ZodString;
    index: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    step?: string;
    index?: number;
}, {
    step?: string;
    index?: number;
}>;
export type UpdateNextStepDto = z.infer<typeof UpdateNextStepSchema>;
export declare const DeleteNextStepSchema: z.ZodObject<{
    index: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    index?: number;
}, {
    index?: number;
}>;
export type DeleteNextStepDto = z.infer<typeof DeleteNextStepSchema>;
export declare const UpdateUtteranceSchema: z.ZodObject<{
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    text?: string;
}, {
    text?: string;
}>;
export type UpdateUtteranceDto = z.infer<typeof UpdateUtteranceSchema>;
