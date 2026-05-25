export type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type AssignmentDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type AssignmentPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Assignment {
  id: string;
  scenarioTitle: string;
  personaName: string;
  difficulty: AssignmentDifficulty;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  attempts: number;
  maxAttempts: number;
  dueDate: string;
  assignedAt: string;
  estimatedDuration: number;
}
