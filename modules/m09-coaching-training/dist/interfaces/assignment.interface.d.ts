import { IScenario } from './scenario.interface';
export interface IAssignment {
    id: string;
    rep_id: string;
    scenario_id: string;
    manager_id: string;
    session_id?: string | null;
    status: 'Pending' | 'In Progress' | 'Completed';
    priority: 'Low' | 'Medium' | 'High';
    deadline: string;
    assigned_at: string;
    completed_at?: string | null;
    attempt_count?: number;
    best_score?: number;
    best_session_id?: string | null;
    created_at: string;
}
export interface IAssignmentWithDetails extends IAssignment {
    scenario?: IScenario | null;
    rep?: {
        id: string;
        name: string;
        email: string;
    } | null;
    manager?: {
        name: string;
    } | null;
    is_overdue?: boolean;
}
