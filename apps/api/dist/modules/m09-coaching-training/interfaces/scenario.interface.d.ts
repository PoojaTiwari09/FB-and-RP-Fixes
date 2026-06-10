export interface IScenarioMetadata {
    personality_traits?: string;
    evaluation_focus?: string;
    objection_style?: string;
    conversation_expectations?: string;
    target_skills?: string[];
    decision_drivers?: string;
    communication_style?: string;
}
export interface IScenario {
    id: string;
    org_id: string;
    persona_name: string;
    persona_type: string;
    context_text: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    custom_prompt?: string | null;
    voice_id?: string | null;
    manager_id?: string | null;
    created_at: string;
    updated_at?: string;
}
export interface IScenarioDetails extends IScenario, IScenarioMetadata {
    scenario_name: string;
    customer_info: {
        name: string;
        role: string;
        company: string;
        industry: string;
    };
}
export interface IDifficultyConfig {
    tone: string;
    objectionStrength: string;
    instructions: string;
}
