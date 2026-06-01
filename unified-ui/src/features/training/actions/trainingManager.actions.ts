'use server';

import { reassignTraining as reassignTrainingService } from '../services/trainingManager.service';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { ReassignResponse } from '../types/trainingManager.types';

export async function reassignTrainingAction(
  trainingId: string,
  repId: string,
): Promise<ReassignResponse> {
  const result = await reassignTrainingService(trainingId, repId);
  
  // Also store it in a cookie so the rep dashboard can read it reliably in dev mode
  // This bypasses Next.js dev server worker isolation for in-memory variables
  const cookieStore = await cookies();
  
  // Add to reassigned_trainings
  const existing = cookieStore.get('reassigned_trainings')?.value;
  const reassigned = existing ? JSON.parse(existing) : [];
  if (!reassigned.includes(trainingId)) {
    reassigned.push(trainingId);
    cookieStore.set('reassigned_trainings', JSON.stringify(reassigned), { path: '/' });
  }

  // Remove from completed_trainings so it goes back to "In Progress"
  const completedStr = cookieStore.get('completed_trainings')?.value;
  if (completedStr) {
    let completedMap = JSON.parse(decodeURIComponent(completedStr));
    if (Array.isArray(completedMap)) {
      completedMap = completedMap.reduce((acc: any, id: string) => ({ ...acc, [id]: 'mock-session-id' }), {});
    }
    const targetId = `reassigned-${trainingId}`;
    if (completedMap[targetId]) {
      delete completedMap[targetId];
      cookieStore.set('completed_trainings', encodeURIComponent(JSON.stringify(completedMap)), { path: '/' });
    }
  }

  // Revalidate the rep dashboard so it fetches the new reassigned training
  revalidatePath('/training');
  return result;
}
