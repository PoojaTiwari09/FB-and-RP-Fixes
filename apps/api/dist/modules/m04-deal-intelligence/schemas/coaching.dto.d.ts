export declare class GenerateCoachingPromptsDto {
    dealId: string;
    repId?: string;
}
export declare class CoachingPromptDto {
    question: string;
    context: string;
    category: string;
}
export declare class CoachingPromptsResponseDto {
    dealId: string;
    dealName: string;
    repName: string;
    stage: string;
    prompts: CoachingPromptDto[];
    focusAreas: string[];
    generatedAt: Date;
}
export declare class CoachingSessionDto {
    id: string;
    dealId: string;
    managerId: string;
    repId: string;
    notes: string;
    actionItems: string[];
    sessionDate: Date;
    createdAt: Date;
}
