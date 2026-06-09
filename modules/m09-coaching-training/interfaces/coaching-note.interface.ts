export interface ICoachingNote {
  id: string;
  rep_id: string;
  rep_name: string;
  rep_email?: string;
  manager_name?: string;
  content: string;
  priority: string;
  created_at: string;
  is_agent_generated?: boolean;
  weakest_skill?: string;
  session_score?: number;
}

export interface IRecommendation {
  id: string;
  rep_id: string;
  focus_area: string;
  weakest_skill: string;
  recommendation_text: string;
  suggested_action: string;
  priority: 'Low' | 'Medium' | 'High';
  status: string;
  generated_at: string;
}
