export declare class CreateAssignmentDto {
    repIds: string[];
    scenarioId: string;
    deadline: string;
    priority?: string;
}
export declare class UpdateAssignmentDto {
    status?: string;
    priority?: string;
    deadline?: string;
}
