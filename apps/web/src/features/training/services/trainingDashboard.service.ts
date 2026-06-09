// src/services/trainingDashboard.service.ts
import { TrainingDashboardPage } from '@training/types/trainingDashboard.types';
import { ENV } from '@shared/config/env';

/**
 * Adapts raw API response to our typed shape.
 * Isolates field-name uncertainty.
 */
function adaptTrainingDashboard(raw: Record<string, unknown>): TrainingDashboardPage {
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

export async function fetchTrainingDashboard(): Promise<TrainingDashboardPage> {
  const res = await fetch(`${ENV.M09_API_BASE_URL}/api/trainings`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const raw = await res.json();
  return adaptTrainingDashboard(raw as Record<string, unknown>);
}
