import { Scenario } from './session.types';

export type AssignmentStatus = 'Pending' | 'In Progress' | 'Completed' | 'completed' | 'in_progress' | 'overdue' | 'not_started';

export interface Assignment {
  id: string;
  rep_id?: string;
  scenario_id?: string;
  session_id?: string | null;
  status: AssignmentStatus;
  priority?: 'Low' | 'Medium' | 'High' | string;
  deadline?: string;
  assigned_at?: string;
  completed_at?: string | null;
  attempt_count?: number;
  max_attempts?: number;
  max_hints?: number;
  best_score?: number | null;
  best_session_id?: string | null;
  progress?: number;
  is_overdue?: boolean;
  scenario?: Scenario | null;
  rep?: { id: string; name: string; email: string } | null;
  rep_name?: string;
  manager?: { name: string } | null;
  manager_score?: number | null;
  manager_note?: string | null;
}

export interface CreateAssignmentDto {
  repIds: string[];
  scenarioId: string;
  deadline?: string;
  priority?: string;
}

export interface UpdateAssignmentDto {
  status?: string;
  deadline?: string;
  priority?: string;
  best_session_id?: string;
  manager_score?: number;
  manager_note?: string;
}
