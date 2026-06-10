export declare class CreateScenarioDto {
    persona_name: string;
    persona_type: string;
    difficulty: string;
    context_text?: string;
    custom_prompt?: string;
    voice_id?: string;
    personality_traits?: string;
    evaluation_focus?: string;
    objection_style?: string;
    conversation_expectations?: string;
    target_skills?: string[];
    decision_drivers?: string;
    communication_style?: string;
}
export declare class UpdateScenarioDto {
    persona_name?: string;
    persona_type?: string;
    difficulty?: string;
    context_text?: string;
    custom_prompt?: string;
    voice_id?: string;
    personality_traits?: string;
    evaluation_focus?: string;
    objection_style?: string;
    conversation_expectations?: string;
    target_skills?: string[];
    decision_drivers?: string;
    communication_style?: string;
}
