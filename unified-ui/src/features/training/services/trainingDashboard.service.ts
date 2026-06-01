// src/services/trainingDashboard.service.ts
import { cookies } from 'next/headers';
import { TRAINING_DASHBOARD_MOCK } from '@training/mocks/trainingDashboard.mock';
import { MANAGER_DASHBOARD_MOCK } from '@training/mocks/trainingManager.mock';
import { TrainingDashboardPage, TrainingItem } from '@training/types/trainingDashboard.types';
import { ENV } from '@shared/config/env';

/**
 * Adapts raw API response to our typed shape.
 * Isolates field-name uncertainty — update this when backend schema is finalized.
 */
function adaptTrainingDashboard(raw: Record<string, unknown>): TrainingDashboardPage {
  // TODO: confirm field names with backend
  const trainings = (raw['trainings'] as Record<string, unknown>[]) ?? [];
  return {
    trainings: trainings.map((t) => ({
      id: String(t['id'] ?? ''),
      title: String(t['title'] ?? ''),
      progressPercent: Number(t['progressPercent'] ?? t['progress_percent'] ?? 0),
      dueDateIso: String(t['dueDateIso'] ?? t['due_date'] ?? ''),
      status: (t['status'] as 'in-progress' | 'completed') ?? 'in-progress',
      lastSessionId: (t['lastSessionId'] ?? t['last_session_id'] ?? null) as string | null,
    })),
  };
}

async function getMockDashboardWithCookies(): Promise<TrainingDashboardPage> {
  const cookieStore = await cookies();
  
  // Completed trainings (map of trainingId -> sessionId)
  const completedStr = cookieStore.get('completed_trainings')?.value;
  const parsedCompleted = completedStr ? JSON.parse(decodeURIComponent(completedStr)) : {};
  const completedMap = Array.isArray(parsedCompleted) 
    ? parsedCompleted.reduce((acc: any, id: string) => ({ ...acc, [id]: 'mock-session-id' }), {})
    : parsedCompleted;
  
  // Newly created trainings
  const createdStr = cookieStore.get('created_trainings')?.value;
  const createdObjects = createdStr ? JSON.parse(createdStr) : [];

  // Reassigned trainings
  const reassignedStr = cookieStore.get('reassigned_trainings')?.value;
  const reassignedIds = reassignedStr ? JSON.parse(reassignedStr) : [];
  
  const reassigned: TrainingItem[] = reassignedIds.map((id: string) => {
     let title = 'Reassigned Training';
     const originalMock = MANAGER_DASHBOARD_MOCK.trainings.find((t) => t.id === id);
     if (originalMock) {
       title = `${originalMock.trainingTitle} (Reassigned)`;
     } else {
       const originalCustom = createdObjects.find((t: any) => t.id === id);
       if (originalCustom) {
         title = `${originalCustom.trainingTitle} (Reassigned)`;
       }
     }

     return {
        id: `reassigned-${id}`,
        title,
        progressPercent: completedMap[`reassigned-${id}`] ? 100 : 0,
        dueDateIso: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: completedMap[`reassigned-${id}`] ? 'completed' : 'in-progress',
        lastSessionId: completedMap[`reassigned-${id}`] || null,
     };
  });

  // For the demo, we show all created trainings regardless of repId. In reality, we'd filter by logged-in repId.
  const created: TrainingItem[] = createdObjects.map((obj: any) => ({
    id: obj.id,
    title: obj.trainingTitle,
    progressPercent: completedMap[obj.id] ? 100 : 0,
    dueDateIso: obj.dueDateIso,
    status: completedMap[obj.id] ? 'completed' : 'in-progress',
    lastSessionId: completedMap[obj.id] || null,
  }));

  // Map MOCK trainings to apply completed state
  const mockTrainings = TRAINING_DASHBOARD_MOCK.trainings.map((t) => ({
    ...t,
    progressPercent: completedMap[t.id] ? 100 : t.progressPercent,
    status: completedMap[t.id] ? 'completed' : t.status,
    lastSessionId: completedMap[t.id] || t.lastSessionId,
  }));

  return {
    trainings: [...mockTrainings, ...reassigned, ...created],
  };
}

export async function fetchTrainingDashboard(): Promise<TrainingDashboardPage> {
  // Fast path: skip backend entirely when mocking
  if (ENV.USE_MOCK_DATA) {
    return getMockDashboardWithCookies();
  }

  try {
    const res = await fetch(`${ENV.M09_API_BASE_URL}/api/trainings`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const raw = await res.json();
    return adaptTrainingDashboard(raw as Record<string, unknown>);
  } catch (error) {
    console.warn('[TrainingDashboardService] API failed, falling back to mock:', error);
    return getMockDashboardWithCookies();
  }
}
