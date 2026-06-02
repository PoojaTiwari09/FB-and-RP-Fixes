// src/services/trainingSetup.service.ts
import { TrainingSetupPage } from '@training/types/trainingSetup.types';
import { ENV } from '@shared/config/env';
import type { QuestionTag } from '@shared/types/shared.types';
import { getVoices } from '@training/services/ai/elevenLabs.service';

/**
 * Adapts raw API response to our typed shape.
 */
function adaptTrainingSetup(raw: Record<string, unknown>, trainingId: string): TrainingSetupPage {
  const persona = (raw['contactPersona'] ?? raw['persona'] ?? raw['contact_persona'] ?? {}) as Record<string, unknown>;
  const meetingCtx = (raw['meetingContext'] ?? raw['meeting_context'] ?? {}) as Record<string, unknown>;
  const sections = (raw['coachingPlaybook'] ?? raw['playbookSections'] ?? raw['playbook_sections'] ?? []) as Record<string, unknown>[];
  const voicesRaw = (raw['voices'] ?? []) as Record<string, unknown>[];

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
    voices: voicesRaw.map((v, i) => ({
      id: String(v['id'] ?? `voice-${i + 1}`),
      label: String(v['label'] ?? `Voice ${i + 1}`),
      description: String(v['description'] ?? ''),
      previewText: String(v['previewText'] ?? ''),
    })),
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
 * Fetch training setup data.
 * Voices are ALWAYS fetched from ElevenLabs (not from backend or mock static data).
 */
export async function fetchTrainingSetup(trainingId: string, createdTrainingsStr?: string): Promise<TrainingSetupPage> {
  const [res, liveVoices] = await Promise.all([
    fetch(`${ENV.M09_API_BASE_URL}/api/trainings/${trainingId}/setup`, { next: { revalidate: 60 } }),
    getVoices(),
  ]);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const raw = await res.json();
  const setup = adaptTrainingSetup(raw as Record<string, unknown>, trainingId);
  // Override voices from backend with live ElevenLabs voices
  return { ...setup, voices: liveVoices };
}

export interface CreateSessionResponse {
  sessionId: string;
  status: string;
  startedAt: string;
}

export async function createTrainingSession(
  trainingId: string,
  selectedVoiceId?: string
): Promise<CreateSessionResponse> {
  const res = await fetch(`${ENV.M09_API_BASE_URL}/api/trainings/${trainingId}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
