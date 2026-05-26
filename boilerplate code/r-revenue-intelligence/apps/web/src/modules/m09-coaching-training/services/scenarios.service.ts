import { apiClient } from '@/lib/api';
import { enrichPersonaDraft } from '@/lib/enrichPersona';
import {
  AudioAnalysisResult,
  CreateScenarioDto,
  PersonaDraft,
  Scenario,
  UpdateScenarioDto,
} from '@/types/scenarios.types';

const AUDIO_TIMEOUT_MS = 120000;

export const scenariosService = {
  async findAll() {
    const { data } = await apiClient.get<Scenario[]>('/scenarios');
    return data;
  },
  async findOne(id: string) {
    const { data } = await apiClient.get<Scenario>(`/scenarios/${id}`);
    return data;
  },
  async create(payload: CreateScenarioDto) {
    const { data } = await apiClient.post<Scenario>('/scenarios', payload);
    return data;
  },
  async update(id: string, payload: UpdateScenarioDto) {
    const { data } = await apiClient.patch<Scenario>(`/scenarios/${id}`, payload);
    return data;
  },
  async delete(id: string) {
    const { data } = await apiClient.delete(`/scenarios/${id}`);
    return data;
  },
  async transcribeAudio(file: File) {
    const formData = new FormData();
    formData.append('audio', file);
    const { data } = await apiClient.post<{ transcript: string }>('/scenarios/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: AUDIO_TIMEOUT_MS,
    });
    return data;
  },
  async analyzeAudio(file: File) {
    const formData = new FormData();
    formData.append('audio', file);
    const paths = ['/scenarios/analyze-audio', '/scenarios/transcribe'] as const;

    for (const path of paths) {
      try {
        if (path.endsWith('analyze-audio')) {
          const { data } = await apiClient.post<AudioAnalysisResult>(path, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: AUDIO_TIMEOUT_MS,
          });
          return {
            ...data,
            persona: enrichPersonaDraft(data.persona, data.transcript),
          };
        }
      } catch (err) {
        const message = (err as Error).message || '';
        if (!message.includes('Cannot POST')) throw err;
      }
    }

    const { data: legacy } = await apiClient.post<{ transcript: string }>('/scenarios/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: AUDIO_TIMEOUT_MS,
    });
    const persona = await scenariosService.generatePersona(legacy.transcript);
    return {
      raw_transcript: legacy.transcript,
      transcript: legacy.transcript,
      persona,
      turn_count: legacy.transcript.split('\n').filter(Boolean).length,
    } satisfies AudioAnalysisResult;
  },
  async generatePersona(transcript: string) {
    const { data } = await apiClient.post<PersonaDraft>('/scenarios/generate-persona', { transcript }, {
      timeout: 60000,
    });
    return enrichPersonaDraft(
      {
        ...data,
        objectives: data.objectives || '',
        goals: data.goals || '',
        evaluation_focus: data.evaluation_focus || '',
        target_skills: data.target_skills || [],
        objection_style: data.objection_style || '',
        personality_traits: data.personality_traits || '',
      },
      transcript,
    );
  },
};

export function normalizePersonaFromAnalysis(
  persona: Partial<PersonaDraft>,
  transcript: string,
): PersonaDraft {
  return enrichPersonaDraft(persona, transcript);
}
