// src/services/trainingSession.service.ts
import {
  SessionContext,
  SessionData,
  TranscriptMessage,
  SendMessageResponse,
  InputType,
  ScorecardSectionStatus,
} from '@training/types/trainingSession.types';
import { ENV } from '@shared/config/env';
import type { QuestionTag } from '@shared/types/shared.types';
import { sendChatMessage } from '@training/services/ai/groq.service';
import type { ManagerActiveTraining } from '@training/types/trainingCreate.types';
import { SESSION_CONTEXT_MOCK, MOCK_AI_REPLIES } from '@training/mocks/trainingSession.mock';

/**
 * Adapts raw API response to our typed SessionContext shape.
 * Handles both spec field names and snake_case variants.
 */
function adaptSessionContext(raw: Record<string, unknown>, trainingId: string): SessionContext {
  const persona = (raw['contactPersona'] ?? raw['persona'] ?? {}) as Record<string, unknown>;
  const meetingCtx = (raw['meetingContext'] ?? raw['meeting_context'] ?? {}) as Record<string, unknown>;
  const sections = (raw['coachingPlaybook'] ?? raw['playbookSections'] ?? raw['playbook_sections'] ?? []) as Record<string, unknown>[];

  return {
    trainingId,
    trainingTitle: String(raw['title'] ?? raw['trainingTitle'] ?? raw['training_title'] ?? ''),
    persona: {
      name: String(persona['name'] ?? ''),
      jobTitle: String(persona['title'] ?? persona['jobTitle'] ?? persona['job_title'] ?? ''),
      company: String(persona['company'] ?? ''),
      motivations: String(persona['motivationsAndPriorities'] ?? persona['motivations'] ?? ''),
      communicationStyle: String(persona['communicationStyle'] ?? persona['communication_style'] ?? ''),
    },
    meetingContext: {
      scenario: String(meetingCtx['meetingScenario'] ?? meetingCtx['scenario'] ?? ''),
      objective: String(meetingCtx['repObjective'] ?? meetingCtx['objective'] ?? ''),
      backgroundForTrainee: String(meetingCtx['backgroundForTrainee'] ?? meetingCtx['background_for_trainee'] ?? ''),
    },
    playbookSections: sections.map((s) => ({
      id: String(s['id'] ?? ''),
      title: String(s['categoryName'] ?? s['title'] ?? ''),
      questions: ((s['questions'] ?? []) as Record<string, unknown>[]).map((q) => {
        const tags: QuestionTag[] = q['tags']
          ? (q['tags'] as QuestionTag[])
          : [
              ...(q['highImpact'] ? (['high-impact'] as QuestionTag[]) : []),
              ...(q['missedInLastAttempt'] || q['missed_in_last_attempt'] ? (['missed-last-attempt'] as QuestionTag[]) : []),
            ];
        return {
          id: String(q['id'] ?? ''),
          text: String(q['text'] ?? ''),
          tags,
          whyItMatters: (q['whyItMatters'] ?? q['why_it_matters'] ?? null) as string | null,
        };
      }),
    })),
  };
}

/**
 * Adapts raw API response messages to TranscriptMessage[].
 */
function adaptMessages(rawMessages: Record<string, unknown>[]): TranscriptMessage[] {
  return rawMessages.map((m, i) => ({
    id: String(m['id'] ?? `msg-restored-${i}`),
    sender: (m['role'] ?? m['sender'] ?? 'user') as 'user' | 'ai',
    text: String(m['text'] ?? ''),
    timestampSeconds: Number(m['timestamp'] ?? m['timestampSeconds'] ?? 0),
  }));
}

/**
 * Get mock session data with support for cookie-based custom trainings.
 * Used when backend is unavailable or in mock mode.
 */
function getMockSessionWithCookies(trainingId: string, sessionId: string): SessionData {
  const baseMock: SessionData = {
    context: { ...SESSION_CONTEXT_MOCK, trainingId },
    sessionId,
    status: 'active',
    elapsedSeconds: 0,
    messageCount: 0,
    selectedVoiceId: '',
    messages: [],
  };

  const isReassigned = trainingId.startsWith('reassigned-');
  const actualId = trainingId.replace('reassigned-', '');

  // Get created trainings from cookie
  let createdTrainingsStr = '';
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^| )created_trainings=([^;]+)'));
    if (match) createdTrainingsStr = decodeURIComponent(match[2]);
  }

  const created: ManagerActiveTraining[] = createdTrainingsStr ? JSON.parse(createdTrainingsStr) : [];
  const customTraining = created.find(t => t.id === actualId);
  
  if (isReassigned) {
    baseMock.context.trainingTitle += ' (Reassigned)';
  }

  if (customTraining) {
    baseMock.context.trainingTitle = customTraining.trainingTitle + (isReassigned ? ' (Reassigned)' : '');
    baseMock.context.persona = customTraining.persona || baseMock.context.persona;
  }

  return baseMock;
}

/**
 * GET session data — tries backend first, falls back to mock if unavailable.
 * Supports cookie-based custom trainings for reassignment scenarios.
 */
export async function fetchSessionData(trainingId: string, sessionId: string): Promise<SessionData> {
  // Try backend first
  try {
    const res = await fetch(`${ENV.M09_API_BASE_URL}/api/trainings/${trainingId}/sessions/${sessionId}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const raw = (await res.json()) as Record<string, unknown>;

    // The backend wraps contactPersona/meetingContext inside a "context" object.
    // adaptSessionContext expects a flat shape, so we unwrap it first.
    const contextPayload = (raw['context'] ?? raw) as Record<string, unknown>;
    const context = adaptSessionContext(contextPayload, trainingId);
    const rawMessages = (raw['messages'] ?? []) as Record<string, unknown>[];

    return {
      context,
      sessionId: String(raw['sessionId'] ?? raw['session_id'] ?? sessionId),
      status: (raw['status'] as SessionData['status']) ?? 'active',
      elapsedSeconds: Number(raw['elapsedSeconds'] ?? raw['elapsed_seconds'] ?? 0),
      messageCount: Number(raw['messageCount'] ?? raw['message_count'] ?? 0),
      selectedVoiceId: String(raw['selectedVoiceId'] ?? raw['selected_voice_id'] ?? ''),
      messages: adaptMessages(rawMessages),
    };
  } catch (error) {
    console.warn('[TrainingSessionService] Backend API failed, falling back to mock:', error);
    return getMockSessionWithCookies(trainingId, sessionId);
  }
}

/** @deprecated Use fetchSessionData instead. */
export async function fetchSessionContext(trainingId: string, sessionId: string): Promise<SessionContext> {
  const data = await fetchSessionData(trainingId, sessionId);
  return data.context;
}

/**
 * Send a message — tries backend first, falls back to client-side Groq.
 * 
 * The backend approach routes through M09 API using server-side LLM.
 * If backend unavailable, falls back to client-side Groq call.
 * Always includes full transcript + session context for Groq.
 */
export async function sendSessionMessage(
  trainingId: string,
  sessionId: string,
  messageText: string,
  messageIndex: number,
  inputType: InputType = 'text',
  transcript: TranscriptMessage[] = [],
  ctx: SessionContext | null = null
): Promise<SendMessageResponse> {
  // Try backend API first
  try {
    const res = await fetch(
      `${ENV.M09_API_BASE_URL}/api/trainings/${trainingId}/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText, inputType }),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`API error: ${res.status} ${errText}`);
    }

    const data = (await res.json()) as Record<string, unknown>;
    const aiResponse = (data['aiResponse'] ?? {}) as Record<string, unknown>;

    return {
      aiReplyText: String(aiResponse['text'] ?? ''),
      aiReplyId: String(aiResponse['id'] ?? `ai-${Date.now()}`),
      aiReplyTimestamp: Number(aiResponse['timestampSeconds'] ?? 0),
      audioUrl: String(aiResponse['audioUrl'] ?? ''),
      scorecardUpdate: (data['scorecardUpdate'] as Record<string, ScorecardSectionStatus> | null) ?? null,
    };
  } catch (backendError) {
    console.warn('[TrainingSessionService] Backend API failed, falling back to Groq:', backendError);
  }

  // Fallback: Use client-side Groq if backend is unavailable
  try {
    if (!ctx) throw new Error('Session context required for Groq fallback');

    // Include the user's latest message in history before sending to Groq
    const fullHistory: TranscriptMessage[] = [
      ...transcript,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: messageText,
        timestampSeconds: 0,
      },
    ];

    const aiReplyText = await sendChatMessage(fullHistory, ctx);

    return {
      aiReplyText,
      aiReplyId: `ai-${Date.now()}`,
      aiReplyTimestamp: 0,
      audioUrl: '', // TTS is handled separately in the hook via elevenLabs.service
      scorecardUpdate: null,
    };
  } catch (groqError) {
    console.warn('[TrainingSessionService] Groq fallback also failed, using mock reply:', groqError);
    // Last resort: use mock reply
    return {
      aiReplyText: MOCK_AI_REPLIES[messageIndex % MOCK_AI_REPLIES.length],
      aiReplyId: `mock-ai-${Date.now()}`,
      aiReplyTimestamp: 0,
      audioUrl: '',
      scorecardUpdate: null,
    };
  }
}

/** Pause session */
export async function pauseSession(
  trainingId: string,
  sessionId: string
): Promise<{ message: string; status: string; elapsedSeconds: number; messageCount: number }> {
  try {
    const res = await fetch(`${ENV.M09_API_BASE_URL}/api/trainings/${trainingId}/sessions/${sessionId}/pause`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    return {
      message: String(data['message'] ?? ''),
      status: String(data['status'] ?? 'paused'),
      elapsedSeconds: Number(data['elapsedSeconds'] ?? data['elapsed_seconds'] ?? 0),
      messageCount: Number(data['messageCount'] ?? data['message_count'] ?? 0),
    };
  } catch (error) {
    console.warn('[TrainingSessionService] pauseSession failed:', error);
    // Return fallback response
    return {
      message: 'Session paused',
      status: 'paused',
      elapsedSeconds: 0,
      messageCount: 0,
    };
  }
}

/** Resume session */
export async function resumeSession(
  trainingId: string,
  sessionId: string
): Promise<{ message: string; status: string }> {
  try {
    const res = await fetch(`${ENV.M09_API_BASE_URL}/api/trainings/${trainingId}/sessions/${sessionId}/resume`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    return {
      message: String(data['message'] ?? ''),
      status: String(data['status'] ?? 'active'),
    };
  } catch (error) {
    console.warn('[TrainingSessionService] resumeSession failed:', error);
    // Return fallback response
    return {
      message: 'Session resumed',
      status: 'active',
    };
  }
}

/** End session */
export async function endSession(
  trainingId: string,
  sessionId: string
): Promise<{ message: string; status: string; resultsReady: boolean }> {
  try {
    const res = await fetch(`${ENV.M09_API_BASE_URL}/api/trainings/${trainingId}/sessions/${sessionId}/end`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    return {
      message: String(data['message'] ?? ''),
      status: String(data['status'] ?? 'completed'),
      resultsReady: Boolean(data['resultsReady'] ?? data['results_ready'] ?? false),
    };
  } catch (error) {
    console.warn('[TrainingSessionService] endSession failed:', error);
    // Return fallback response
    return {
      message: 'Session ended',
      status: 'completed',
      resultsReady: false,
    };
  }
}

/** WebSocket stub — TODO when backend is ready */
export function connectToSession(
  _trainingId: string,
  _sessionId: string
): { disconnect: () => void } {
  if (ENV.IS_DEV) {
    console.info('[connectToSession] WebSocket not yet implemented — using HTTP polling fallback');
  }
  return { disconnect: () => {} };
}
