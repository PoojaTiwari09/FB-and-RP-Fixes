export interface Scenario {
  id: string;
  org_id: string;
  manager_id: string;
  persona_name: string;
  persona_type: string;
  difficulty: string;
  context_text: string;
  custom_prompt: string;
  voice_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface PersonaDraft {
  persona_name: string;
  persona_type: string;
  difficulty: string;
  context_text: string;
  objectives: string;
  goals: string;
  custom_prompt: string;
  evaluation_focus: string;
  target_skills: string[];
  objection_style: string;
  personality_traits: string;
}

export interface AudioAnalysisResult {
  raw_transcript: string;
  transcript: string;
  persona: PersonaDraft;
  turn_count: number;
}

export interface CreateScenarioDto {
  persona_name: string;
  persona_type: string;
  difficulty: string;
  context_text: string;
  custom_prompt: string;
  voice_id: string;
  objectives?: string;
  goals?: string;
  source_transcript?: string;
  evaluation_focus?: string;
  objection_style?: string;
  personality_traits?: string;
  target_skills?: string[];
}

export type UpdateScenarioDto = Partial<CreateScenarioDto>;
