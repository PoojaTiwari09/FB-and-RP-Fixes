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
  let raw: Record<string, unknown> | null = null;
  let liveVoices: any[] = [];

  try {
    liveVoices = await getVoices();
  } catch (e) {
    console.error('ElevenLabs voices fetch failed:', e);
  }

  try {
    const res = await fetch(`${ENV.M09_API_BASE_URL}/api/trainings/${trainingId}/setup`, { next: { revalidate: 60 } });
    if (res.ok) {
      raw = await res.json();
    } else {
      console.warn(`Backend returned non-OK status: ${res.status}`);
    }
  } catch (e) {
    console.error(`Backend fetch failed for training ${trainingId}:`, e);
  }

  if (raw) {
    const setup = adaptTrainingSetup(raw, trainingId);
    return { ...setup, voices: liveVoices.length ? liveVoices : setup.voices };
  }

  // Fallback to cookie / created training
  if (createdTrainingsStr) {
    try {
      const created: any[] = JSON.parse(createdTrainingsStr);
      const found = created.find((t: any) => t.id === trainingId);
      if (found) {
        const p = found.persona || {};
        return {
          trainingId,
          trainingTitle: found.trainingTitle || 'Custom Practice Session',
          persona: {
            name: p.name || 'Custom Persona',
            jobTitle: p.jobTitle || p.job_title || p.title || 'Executive',
            company: p.company || 'Acme Corp',
            motivations: p.motivations || p.motivationsAndPriorities || 'Wants to improve efficiency and reduce costs.',
            communicationStyle: p.communicationStyle || p.communication_style || 'Direct and data-oriented.',
          },
          meetingContext: {
            scenario: 'Practice Call - Roleplay Session',
            objective: 'Build rapport, identify pain points, and align on next steps.',
            backgroundForTrainee: `You are practice calling ${p.name || 'Custom Persona'} at ${p.company || 'Acme Corp'}.`,
          },
          voices: liveVoices.length ? liveVoices : [
            { id: 'voice-1', label: 'Voice 1', description: 'Professional Female', previewText: '' },
            { id: 'voice-2', label: 'Voice 2', description: 'Professional Male', previewText: '' },
          ],
          playbookSections: [
            {
              id: 'sec-1',
              title: 'Discovery & Need Identification',
              questions: [
                { id: 'q1', text: 'What are the main priorities for your team this quarter?', tags: ['high-impact'], whyItMatters: 'Reveals priority pain points.' },
                { id: 'q2', text: 'How are you measuring success in this area currently?', tags: ['high-impact'], whyItMatters: 'Quantifies impact.' },
                { id: 'q3', text: 'Who else would be key to involve in evaluating solutions?', tags: [], whyItMatters: null }
              ]
            },
            {
              id: 'sec-2',
              title: 'Value Alignment & Next Steps',
              questions: [
                { id: 'q4', text: 'What is your timeline for implementing a new solution?', tags: ['missed-last-attempt'], whyItMatters: 'Establishes deal urgency.' },
                { id: 'q5', text: 'Are there any potential obstacles to moving forward?', tags: [], whyItMatters: null }
              ]
            }
          ]
        };
      }
    } catch (e) {
      console.error('Error parsing created_trainings cookie:', e);
    }
  }

  // Final fallback to mock if no cookie or backend
  return {
    trainingId,
    trainingTitle: 'Discovery Call Practice',
    persona: {
      name: 'Sarah Johnson',
      jobTitle: 'VP of Sales Operations',
      company: 'TechFlow Inc',
      motivations: 'Looking to streamline sales processes and improve team productivity.',
      communicationStyle: 'Direct and analytical. Prefers data-driven conversations.',
    },
    meetingContext: {
      scenario: 'Discovery Call - Initial Meeting',
      objective: 'Build rapport with Sarah and understand her team productivity issues.',
      backgroundForTrainee: 'TechFlow Inc is exploring alternatives to Salesforce.',
    },
    voices: liveVoices.length ? liveVoices : [
      { id: 'voice-1', label: 'Voice 1', description: 'Professional Female', previewText: '' },
      { id: 'voice-2', label: 'Voice 2', description: 'Professional Male', previewText: '' },
    ],
    playbookSections: [
      {
        id: 'sec-1',
        title: 'Discovery & Need Identification',
        questions: [
          { id: 'q1', text: 'What does your current workflow look like from lead to close?', tags: ['high-impact'], whyItMatters: 'Reveals inefficiencies.' },
          { id: 'q2', text: 'Who else is involved in the decision-making process?', tags: ['high-impact'], whyItMatters: 'Identifies stakeholders early.' }
        ]
      }
    ]
  };
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
