import { z } from 'zod';
export declare const CreateBoardSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    scope: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
    periodType: z.ZodEnum<["Monthly", "Quarterly", "monthly", "quarterly"]>;
    activePeriod: z.ZodOptional<z.ZodString>;
    periodId: z.ZodOptional<z.ZodString>;
    periodStartDate: z.ZodOptional<z.ZodString>;
    periodEndDate: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    periodId?: string;
    startDate?: string;
    endDate?: string;
    scope?: string;
    periodType?: "Monthly" | "Quarterly" | "monthly" | "quarterly";
    activePeriod?: string;
    periodStartDate?: string;
    periodEndDate?: string;
    teamId?: string;
}, {
    name?: string;
    description?: string;
    periodId?: string;
    startDate?: string;
    endDate?: string;
    scope?: string;
    periodType?: "Monthly" | "Quarterly" | "monthly" | "quarterly";
    activePeriod?: string;
    periodStartDate?: string;
    periodEndDate?: string;
    teamId?: string;
}>, {
    name?: string;
    description?: string;
    periodId?: string;
    startDate?: string;
    endDate?: string;
    scope?: string;
    periodType?: "Monthly" | "Quarterly" | "monthly" | "quarterly";
    activePeriod?: string;
    periodStartDate?: string;
    periodEndDate?: string;
    teamId?: string;
}, {
    name?: string;
    description?: string;
    periodId?: string;
    startDate?: string;
    endDate?: string;
    scope?: string;
    periodType?: "Monthly" | "Quarterly" | "monthly" | "quarterly";
    activePeriod?: string;
    periodStartDate?: string;
    periodEndDate?: string;
    teamId?: string;
}>;
export type CreateBoardDto = z.infer<typeof CreateBoardSchema>;
export declare const UpdateBoardSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
    periodType: z.ZodOptional<z.ZodEnum<["Monthly", "Quarterly", "monthly", "quarterly"]>>;
    activePeriod: z.ZodOptional<z.ZodString>;
    periodId: z.ZodOptional<z.ZodString>;
    periodStartDate: z.ZodOptional<z.ZodString>;
    periodEndDate: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    status?: string;
    description?: string;
    periodId?: string;
    startDate?: string;
    endDate?: string;
    scope?: string;
    periodType?: "Monthly" | "Quarterly" | "monthly" | "quarterly";
    activePeriod?: string;
    periodStartDate?: string;
    periodEndDate?: string;
    teamId?: string;
}, {
    name?: string;
    status?: string;
    description?: string;
    periodId?: string;
    startDate?: string;
    endDate?: string;
    scope?: string;
    periodType?: "Monthly" | "Quarterly" | "monthly" | "quarterly";
    activePeriod?: string;
    periodStartDate?: string;
    periodEndDate?: string;
    teamId?: string;
}>;
export type UpdateBoardDto = z.infer<typeof UpdateBoardSchema>;
export declare const ReorderColumnsSchema: z.ZodObject<{
    columnIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    columnIds?: string[];
}, {
    columnIds?: string[];
}>;
export type ReorderColumnsDto = z.infer<typeof ReorderColumnsSchema>;
export declare const UpdateColumnsSchema: z.ZodObject<{
    columns: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        label: z.ZodString;
        type: z.ZodOptional<z.ZodEnum<["Metric", "Submission", "Target"]>>;
        columnType: z.ZodOptional<z.ZodEnum<["Metric", "Submission", "Target"]>>;
        submissionMode: z.ZodEnum<["N/A", "Auto", "Manual"]>;
        isVisible: z.ZodBoolean;
        sortOrder: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        type?: "Metric" | "Submission" | "Target";
        label?: string;
        sortOrder?: number;
        submissionMode?: "N/A" | "Auto" | "Manual";
        isVisible?: boolean;
        columnType?: "Metric" | "Submission" | "Target";
    }, {
        id?: string;
        type?: "Metric" | "Submission" | "Target";
        label?: string;
        sortOrder?: number;
        submissionMode?: "N/A" | "Auto" | "Manual";
        isVisible?: boolean;
        columnType?: "Metric" | "Submission" | "Target";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    columns?: {
        id?: string;
        type?: "Metric" | "Submission" | "Target";
        label?: string;
        sortOrder?: number;
        submissionMode?: "N/A" | "Auto" | "Manual";
        isVisible?: boolean;
        columnType?: "Metric" | "Submission" | "Target";
    }[];
}, {
    columns?: {
        id?: string;
        type?: "Metric" | "Submission" | "Target";
        label?: string;
        sortOrder?: number;
        submissionMode?: "N/A" | "Auto" | "Manual";
        isVisible?: boolean;
        columnType?: "Metric" | "Submission" | "Target";
    }[];
}>;
export type UpdateColumnsDto = z.infer<typeof UpdateColumnsSchema>;
export declare const FromCrmFieldSchema: z.ZodObject<{
    crmObject: z.ZodEnum<["Opportunity", "Account", "Contact"]>;
    crmField: z.ZodString;
    label: z.ZodString;
    columnType: z.ZodEnum<["Metric", "Submission", "Target"]>;
    submissionMode: z.ZodEnum<["N/A", "Auto", "Manual"]>;
}, "strip", z.ZodTypeAny, {
    label?: string;
    submissionMode?: "N/A" | "Auto" | "Manual";
    columnType?: "Metric" | "Submission" | "Target";
    crmObject?: "Account" | "Opportunity" | "Contact";
    crmField?: string;
}, {
    label?: string;
    submissionMode?: "N/A" | "Auto" | "Manual";
    columnType?: "Metric" | "Submission" | "Target";
    crmObject?: "Account" | "Opportunity" | "Contact";
    crmField?: string;
}>;
export declare const CreateColumnsFromCrmSchema: z.ZodObject<{
    fields: z.ZodArray<z.ZodObject<{
        crmObject: z.ZodEnum<["Opportunity", "Account", "Contact"]>;
        crmField: z.ZodString;
        label: z.ZodString;
        columnType: z.ZodEnum<["Metric", "Submission", "Target"]>;
        submissionMode: z.ZodEnum<["N/A", "Auto", "Manual"]>;
    }, "strip", z.ZodTypeAny, {
        label?: string;
        submissionMode?: "N/A" | "Auto" | "Manual";
        columnType?: "Metric" | "Submission" | "Target";
        crmObject?: "Account" | "Opportunity" | "Contact";
        crmField?: string;
    }, {
        label?: string;
        submissionMode?: "N/A" | "Auto" | "Manual";
        columnType?: "Metric" | "Submission" | "Target";
        crmObject?: "Account" | "Opportunity" | "Contact";
        crmField?: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    fields?: {
        label?: string;
        submissionMode?: "N/A" | "Auto" | "Manual";
        columnType?: "Metric" | "Submission" | "Target";
        crmObject?: "Account" | "Opportunity" | "Contact";
        crmField?: string;
    }[];
}, {
    fields?: {
        label?: string;
        submissionMode?: "N/A" | "Auto" | "Manual";
        columnType?: "Metric" | "Submission" | "Target";
        crmObject?: "Account" | "Opportunity" | "Contact";
        crmField?: string;
    }[];
}>;
export type CreateColumnsFromCrmDto = z.infer<typeof CreateColumnsFromCrmSchema>;
export declare const UpdateColumnSchema: z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["Metric", "Submission", "Target"]>>;
    columnType: z.ZodOptional<z.ZodEnum<["Metric", "Submission", "Target"]>>;
    submissionMode: z.ZodOptional<z.ZodEnum<["N/A", "Auto", "Manual"]>>;
    isVisible: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type?: "Metric" | "Submission" | "Target";
    label?: string;
    submissionMode?: "N/A" | "Auto" | "Manual";
    isVisible?: boolean;
    columnType?: "Metric" | "Submission" | "Target";
}, {
    type?: "Metric" | "Submission" | "Target";
    label?: string;
    submissionMode?: "N/A" | "Auto" | "Manual";
    isVisible?: boolean;
    columnType?: "Metric" | "Submission" | "Target";
}>;
export type UpdateColumnDto = z.infer<typeof UpdateColumnSchema>;
export declare const UpdateColumnVisibilitySchema: z.ZodObject<{
    isVisible: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isVisible?: boolean;
}, {
    isVisible?: boolean;
}>;
export type UpdateColumnVisibilityDto = z.infer<typeof UpdateColumnVisibilitySchema>;
export declare const UpdateStageMappingSchema: z.ZodObject<{
    stageMappings: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    stageMappings?: Record<string, any>;
}, {
    stageMappings?: Record<string, any>;
}>;
export type UpdateStageMappingDto = z.infer<typeof UpdateStageMappingSchema>;
export declare const UpdateCrmMappingSchema: z.ZodObject<{
    crmConnection: z.ZodEnum<["salesforce", "hubspot", "dynamics"]>;
    forecastCategoryField: z.ZodOptional<z.ZodString>;
    pipelineSource: z.ZodOptional<z.ZodString>;
    closedSource: z.ZodOptional<z.ZodString>;
    closeDateField: z.ZodOptional<z.ZodString>;
    amountField: z.ZodOptional<z.ZodString>;
    columnMappings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    stageMappings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    crmConnection?: "salesforce" | "hubspot" | "dynamics";
    forecastCategoryField?: string;
    pipelineSource?: string;
    closedSource?: string;
    closeDateField?: string;
    amountField?: string;
    columnMappings?: Record<string, any>;
    stageMappings?: Record<string, any>;
}, {
    crmConnection?: "salesforce" | "hubspot" | "dynamics";
    forecastCategoryField?: string;
    pipelineSource?: string;
    closedSource?: string;
    closeDateField?: string;
    amountField?: string;
    columnMappings?: Record<string, any>;
    stageMappings?: Record<string, any>;
}>;
export type UpdateCrmMappingDto = z.infer<typeof UpdateCrmMappingSchema>;
export declare const UpdateReminderConfigSchema: z.ZodObject<{
    frequency: z.ZodString;
    sendDay: z.ZodString;
    sendTime: z.ZodString;
    timezoneBehavior: z.ZodString;
    inAppEnabled: z.ZodBoolean;
    slackEnabled: z.ZodBoolean;
    autoDismiss: z.ZodBoolean;
    messageTemplate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    frequency?: string;
    sendDay?: string;
    sendTime?: string;
    timezoneBehavior?: string;
    inAppEnabled?: boolean;
    slackEnabled?: boolean;
    autoDismiss?: boolean;
    messageTemplate?: string;
}, {
    frequency?: string;
    sendDay?: string;
    sendTime?: string;
    timezoneBehavior?: string;
    inAppEnabled?: boolean;
    slackEnabled?: boolean;
    autoDismiss?: boolean;
    messageTemplate?: string;
}>;
export type UpdateReminderConfigDto = z.infer<typeof UpdateReminderConfigSchema>;
export declare const UpdateQuotasSchema: z.ZodObject<{
    periodId: z.ZodString;
    quotas: z.ZodArray<z.ZodObject<{
        repUserId: z.ZodString;
        amount: z.ZodNumber;
        aprTarget: z.ZodOptional<z.ZodNumber>;
        mayTarget: z.ZodOptional<z.ZodNumber>;
        junTarget: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        repUserId?: string;
        aprTarget?: number;
        mayTarget?: number;
        junTarget?: number;
    }, {
        amount?: number;
        repUserId?: string;
        aprTarget?: number;
        mayTarget?: number;
        junTarget?: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    periodId?: string;
    quotas?: {
        amount?: number;
        repUserId?: string;
        aprTarget?: number;
        mayTarget?: number;
        junTarget?: number;
    }[];
}, {
    periodId?: string;
    quotas?: {
        amount?: number;
        repUserId?: string;
        aprTarget?: number;
        mayTarget?: number;
        junTarget?: number;
    }[];
}>;
export type UpdateQuotasDto = z.infer<typeof UpdateQuotasSchema>;
