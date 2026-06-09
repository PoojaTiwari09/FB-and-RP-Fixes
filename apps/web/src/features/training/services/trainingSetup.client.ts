import { ENV } from '@shared/config/env';
import { backendFetch } from '@shared/lib/backend-api';

export interface CreateSessionResponse {
  sessionId: string;
  status: string;
  startedAt: string;
}

/** Start training session (Client Components). */
export async function createTrainingSession(
  trainingId: string,
  selectedVoiceId?: string,
): Promise<CreateSessionResponse> {
  const res = await backendFetch(`${ENV.M09_API_BASE_URL}/api/trainings/${trainingId}/sessions`, {
    method: 'POST',
    body: JSON.stringify({ selectedVoiceId, trainingId }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  return {
    sessionId: String(data['sessionId'] ?? data['session_id'] ?? ''),
    status: String(data['status'] ?? 'active'),
    startedAt: String(data['startedAt'] ?? data['started_at'] ?? ''),
  };
}
