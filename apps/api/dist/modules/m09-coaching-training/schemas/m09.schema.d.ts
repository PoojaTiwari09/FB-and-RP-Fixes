export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    role: string;
    org_id: string;
    manager_id?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class StartSessionDto {
    scenarioId: string;
    voiceId?: string;
    selectedVoiceId?: string;
    assignmentId?: string;
}
export declare class SendMessageDto {
    sessionId: string;
    message?: string;
    text?: string;
}
export declare class EndSessionDto {
    sessionId: string;
}
export declare class CreateScenarioDto {
    persona_name: string;
    persona_type: string;
    difficulty: string;
    context_text: string;
    custom_prompt?: string;
    voice_id?: string;
    target_skills?: string[];
    evaluation_focus?: string;
    objection_style?: string;
    personality_traits?: string;
    objectives?: string;
    goals?: string;
    source_transcript?: string;
}
export declare class UpdateScenarioDto {
    persona_name?: string;
    persona_type?: string;
    difficulty?: string;
    context_text?: string;
    custom_prompt?: string;
    voice_id?: string;
    target_skills?: string[];
    evaluation_focus?: string;
    objection_style?: string;
    personality_traits?: string;
    objectives?: string;
    goals?: string;
    source_transcript?: string;
}
export declare class CreateNoteDto {
    repId: string;
    content: string;
    priority: string;
}
export declare class CreateAssignmentDto {
    repIds: string[];
    scenarioId: string;
    deadline: string;
    priority?: string;
    maxAttempts?: number;
    maxHints?: number;
}
export declare class UpdateAssignmentDto {
    status?: 'Pending' | 'In Progress' | 'Completed';
    priority?: 'Low' | 'Medium' | 'High';
    deadline?: string;
    best_session_id?: string;
    manager_score?: number;
    manager_note?: string;
}
export declare class ExportQueryDto {
    format?: 'csv' | 'json';
    dateRange?: string;
    type?: string;
    filters?: string;
}
export declare class PaginationQueryDto {
    page?: number;
    limit?: number;
}
