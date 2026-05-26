export interface Scenario {
  id: string;
  persona_name?: string;
  persona_type?: string;
  context_text?: string;
  difficulty?: string;
  custom_prompt?: string | null;
  voice_id?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  live_coaching?: LiveCoachingEvaluation;
}

export type HighlightSeverity = 'red' | 'yellow' | 'green';

export interface HighlightedSegment {
  text: string;
  severity: HighlightSeverity;
  reason: string;
}

export interface LiveCoachingEvaluation {
  relevance_score: number;
  objection_score: number;
  confidence_score: number;
  discovery_score: number;
  continuity_score: number;
  communication_score: number;
  satisfaction_score?: number;
  talk_ratio_warning: boolean;
  detected_issues: string[];
  coaching_feedback: string[];
  highlighted_segments: HighlightedSegment[];
  suggested_response: string[];
  live_score: number;
}

export interface SessionFeedback {
  scores?: Record<string, number>;
  overall_score?: number | null;
  evaluation_summary?: string;
  strengths?: string[];
  improvements?: string[];
  coaching_tips?: string[];
  objective_metrics?: {
    talk_ratio_pct?: number;
    questions_asked?: number;
    closing_attempts?: number;
    total_exchanges?: number;
  };
}

export interface Session {
  id: string;
  scenario_id?: string;
  messages_json?: ChatMessage[];
  feedback_json?: SessionFeedback | null;
  completed_at?: string | null;
  created_at?: string;
  is_practice?: boolean;
  hints_used?: number;
  training_scenarios?: Scenario | null;
}

export interface StartSessionResponse {
  sessionId: string;
  persona?: Scenario;
  scenario?: Scenario;
}

export interface SendMessageResponse {
  reply: string;
  audio?: string | null;
  userText?: string;
  live_coaching?: LiveCoachingEvaluation;
  coachingTips?: string[];
  feedback?: string | SessionFeedback;
  score?: number;
}

export interface EndSessionResponse {
  finalScore?: number;
  overall_score?: number;
  summary?: string;
  evaluation_summary?: string;
}
