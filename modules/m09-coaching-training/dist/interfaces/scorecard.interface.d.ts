export interface IScores {
    opening: number;
    discovery: number;
    objection_handling: number;
    talk_ratio: number;
    closing: number;
}
export interface IObjectiveMetrics {
    talk_ratio_pct: number;
    questions_asked: number;
    closing_attempts: number;
    total_exchanges: number;
}
export interface IFeedbackJson {
    scores?: IScores;
    overall_score?: number | null;
    evaluation_summary?: string;
    strengths?: string[];
    improvements?: string[];
    objective_metrics?: IObjectiveMetrics;
    is_note?: boolean;
    is_agent_generated?: boolean;
    is_assignment?: boolean;
    assigned_by?: string;
    content?: string;
    priority?: string;
    agent_reasoning?: string;
    weakest_skill?: string;
    session_score?: number;
}
