import { apiClient } from '@/lib/api';
import { EndSessionResponse, SendMessageResponse, Session, StartSessionResponse } from '@/types/session.types';
import { Assignment } from '@/types/assignment.types';

const unwrapArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const firstArray = Object.values(value as Record<string, unknown>).find(Array.isArray);
    return (firstArray ?? []) as T[];
  }
  return [];
};

async function resolveAssignmentId(sessionId: string): Promise<string | null> {
  try {
    const { data: session } = await apiClient.get<{ assignment_id?: string | null }>(`/sessions/${sessionId}`);
    if (session?.assignment_id) return session.assignment_id;
  } catch {
    /* fall through */
  }

  try {
    const { data } = await apiClient.get<Assignment[] | Record<string, unknown>>('/analytics/my-assignments');
    const list = unwrapArray<Assignment>(data);
    const match = list.find((a) => a.session_id === sessionId || a.best_session_id === sessionId);
    if (match?.id) return match.id;
  } catch {
    /* fall through */
  }

  try {
    const { data } = await apiClient.get<Assignment[] | Record<string, unknown>>('/training/assignments');
    const list = unwrapArray<Assignment>(data);
    const match = list.find((a) => a.session_id === sessionId || a.best_session_id === sessionId);
    return match?.id ?? null;
  } catch {
    return null;
  }
}

export const sessionsService = {
  async getMySessions() {
    const { data } = await apiClient.get<Session[] | Record<string, unknown>>('/sessions/my');
    return unwrapArray<Session>(data);
  },
  async startSession(payload: { scenarioId: string; assignmentId?: string; voiceId?: string }) {
    const { data } = await apiClient.post<StartSessionResponse>('/sessions/start', payload);
    return data;
  },
  async sendMessage(payload: { sessionId: string; message: string }) {
    const { data } = await apiClient.post<SendMessageResponse>('/sessions/send-message', payload);
    return data;
  },
  async endSession(sessionId: string) {
    const { data } = await apiClient.post<EndSessionResponse>('/sessions/end', { sessionId });
    return data;
  },
  async pauseSession(sessionId: string) {
    const { data } = await apiClient.patch(`/sessions/${sessionId}`, {
      status: 'in_progress',
    });
    return data;
  },
  async submitFinalToManager(sessionId: string) {
    const postPaths = [
      '/training/submit-session',
      '/sessions/submit-to-manager',
    ] as const;

    for (const path of postPaths) {
      try {
        const { data } = await apiClient.post(path, { sessionId });
        return data;
      } catch (err) {
        const message = (err as Error).message || '';
        if (!message.includes('Cannot POST')) throw err;
      }
    }

    const assignmentId = await resolveAssignmentId(sessionId);
    if (!assignmentId) {
      throw new Error(
        'No training assignment found for this session. Start the scenario from Assignments, then submit again.',
      );
    }

    const { data } = await apiClient.patch(`/training/assignments/${assignmentId}`, {
      status: 'Completed',
      best_session_id: sessionId,
    });
    return data;
  },
  async retrySession(sessionId: string) {
    const { data } = await apiClient.post<unknown>('/sessions/retry', { sessionId });
    return data;
  },
  async getHint(sessionId: string) {
    const { data } = await apiClient.get<{ hint: string; hints_used: number; max_hints: number | null }>(`/sessions/${sessionId}/hint?t=${Date.now()}`);
    return data;
  },
  async getVoices() {
    const { data } = await apiClient.get<unknown[]>('/sessions/voices');
    return data;
  },
};
