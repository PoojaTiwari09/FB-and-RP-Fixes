// src/types/trainingManager.types.ts

export interface ManagedRepTraining {
  id: string;                  // training ID
  repId: string;               // the sales rep who did it
  repName: string;             // display name
  trainingTitle: string;
  completedDate: string;       // ISO date
  overallScore: number;        // 0–100
  overallRating: string;       // "Good", "Needs Practice", etc.
  lastSessionId: string;       // for navigating to results
  isReassigned: boolean;       // true if manager already reassigned
}

export interface ManagerDashboardPage {
  trainings: ManagedRepTraining[];
  activeTrainings: import('./trainingCreate.types').ManagerActiveTraining[];
}

export interface ReassignResponse {
  success: boolean;
  newTrainingId: string;       // the newly created training row ID on rep side
}
