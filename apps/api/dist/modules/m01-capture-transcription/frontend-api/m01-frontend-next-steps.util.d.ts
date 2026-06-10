export type FrontendNextStep = {
    stepId: string;
    description: string;
    completed: boolean;
};
export declare function parseNextSteps(raw: string[] | null | undefined): FrontendNextStep[];
export declare function serializeNextSteps(steps: FrontendNextStep[]): string[];
export declare function newStepId(existing: FrontendNextStep[]): string;
