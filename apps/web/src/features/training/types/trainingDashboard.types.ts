// src/types/trainingDashboard.types.ts

export type TrainingStatus = 'in-progress' | 'completed';

export type TrainingFilter = 'all' | 'in-progress' | 'completed';

export interface TrainingItem {
  id: string;
  title: string;
  progressPercent: number; // TODO: confirm field name with backend
  dueDateIso: string; // TODO: confirm field name with backend (ISO date string)
  status: TrainingStatus; // TODO: confirm field name with backend
  lastSessionId: string | null; // Most recent session ID — used for Review navigation
}

export interface TrainingDashboardPage {
  trainings: TrainingItem[];
}
