// src/services/trainingDashboard.service.ts
import { TrainingDashboardPage } from '@training/types/trainingDashboard.types';
import { ENV } from '@shared/config/env';
import { getServerBackendHeaders } from '@shared/lib/backend-api.server';

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
  const headers = await getServerBackendHeaders();
  const res = await fetch(`${ENV.M09_API_BASE_URL}/api/trainings`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const raw = await res.json();
  const payload = raw?.data ?? raw;
  return adaptTrainingDashboard(payload as Record<string, unknown>);
}
