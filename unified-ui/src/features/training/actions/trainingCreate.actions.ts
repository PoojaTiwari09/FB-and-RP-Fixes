'use server';

import { createTraining as createTrainingService } from '../services/trainingManager.service';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { CreateTrainingRequest, CreateTrainingResponse, ManagerActiveTraining } from '../types/trainingCreate.types';

export async function createTrainingAction(
  data: CreateTrainingRequest,
): Promise<CreateTrainingResponse> {
  const result = await createTrainingService(data);
  
  // Store it in a cookie so both rep and manager dashboards can read it reliably in dev mode
  const cookieStore = await cookies();
  const existingStr = cookieStore.get('created_trainings')?.value;
  const created: ManagerActiveTraining[] = existingStr ? JSON.parse(existingStr) : [];
  
  // We need to look up rep name. In real app, backend does this.
  // We'll just hardcode some mappings for demo.
  const repNames: Record<string, string> = {
    'rep-001': 'Alex Chen',
    'rep-002': 'Jordan Lee',
    'rep-003': 'Sam Taylor',
  };

  const newActiveTraining: ManagerActiveTraining = {
    id: result.trainingId,
    repId: data.repId,
    repName: repNames[data.repId] || 'Assigned Rep',
    trainingTitle: data.trainingTitle,
    dueDateIso: data.dueDateIso,
    status: 'in-progress',
    persona: data.persona
  };

  created.push(newActiveTraining);
  cookieStore.set('created_trainings', JSON.stringify(created), { path: '/' });

  // Revalidate the dashboard so it fetches the new training
  revalidatePath('/training');
  revalidatePath('/training/manage');
  return result;
}
