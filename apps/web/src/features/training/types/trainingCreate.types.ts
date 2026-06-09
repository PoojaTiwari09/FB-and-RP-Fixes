// src/types/trainingCreate.types.ts
import { ContactPersona } from '@shared/types/shared.types';

export interface CreateTrainingRequest {
  trainingTitle: string;
  dueDateIso: string;
  repId: string;
  persona: ContactPersona;
}

export interface CreateTrainingResponse {
  success: boolean;
  trainingId: string;
}

export interface ManagerActiveTraining {
  id: string;
  repId: string;
  repName: string;
  trainingTitle: string;
  dueDateIso: string;
  status: 'in-progress';
  persona?: ContactPersona;
}
