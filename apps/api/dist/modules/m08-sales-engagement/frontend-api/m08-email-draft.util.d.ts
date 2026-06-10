type EngageTaskLike = {
    taskId: string;
    title?: string | null;
    contactId?: string | null;
    contactName: string;
    companyName: string;
    channel: string;
    sequenceName?: string | null;
    sequenceStep?: string | null;
    dueDateTime?: string | null;
    aiInsight?: string | null;
    recommendedNextSteps?: string[] | null;
    aiSignal?: string | null;
};
type EngageContactLike = {
    contactName: string;
    email?: string | null;
    company?: string | null;
} | null;
export declare function buildAutoEmailDraft(task: EngageTaskLike, contact: EngageContactLike): {
    taskId: string;
    contactName: string;
    contactEmail: string;
    fromEmail: string;
    fromLabel: string;
    subject: string;
    bodyHtml: string;
    sequenceName: string;
    sequenceStep: string;
    dueDateTime: string;
};
export {};
