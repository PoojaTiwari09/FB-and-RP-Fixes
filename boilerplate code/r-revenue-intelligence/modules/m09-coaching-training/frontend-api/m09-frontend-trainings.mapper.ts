const VOICES = [
  { id: 'voice_1', label: 'Voice 1', description: 'Professional Female - Warm & Engaging' },
  { id: 'voice_2', label: 'Voice 2', description: 'Professional Male - Calm & Analytical' },
  { id: 'voice_3', label: 'Voice 3', description: 'Friendly Female - Conversational' },
  { id: 'voice_4', label: 'Voice 4', description: 'Authoritative Male - Direct' },
];

export function defaultVoices() {
  return VOICES;
}

export function mapTrainingListItem(scenario: any, assignment?: any) {
  const completed = assignment?.status === 'Completed' || !!assignment?.completed_at;
  return {
    id: scenario.id,
    title: scenario.persona_name || scenario.scenario_name || 'Sales Training',
    dueDate: assignment?.deadline?.toISOString?.()?.slice(0, 10) || null,
    status: completed ? 'completed' : 'in-progress',
    progressPercent: completed ? 100 : assignment?.best_score ?? 65,
  };
}

export function mapTrainingSetup(scenario: any) {
  const raw = scenario.context_text?.replace(/\[SCENARIO_METADATA:.*?\]/s, '').trim() || '';
  return {
    id: scenario.id,
    title: scenario.persona_name || 'Training',
    contactPersona: {
      name: scenario.persona_name,
      title: scenario.persona_type || 'Decision Maker',
      company: 'Prospect Corp',
      motivationsAndPriorities: raw.slice(0, 400) || 'Growth and efficiency.',
      communicationStyle: scenario.difficulty || 'professional',
    },
    voices: defaultVoices(),
    meetingContext: {
      meetingScenario: 'Discovery Call - Initial Meeting',
      repObjective: 'Understand pain points and qualify the opportunity.',
      backgroundForTrainee: raw.slice(0, 600) || 'Review persona and practice discovery questions.',
    },
    coachingPlaybook: [
      {
        categoryName: 'Discovery',
        questions: [
          { id: 'q1', text: 'What challenges are you facing today?', highImpact: true, missedInLastAttempt: false, whyItMatters: 'Opens discovery.' },
        ],
      },
    ],
  };
}

export function mapMessages(messages: any[]) {
  return (messages || []).map((m: any, i: number) => ({
    role: m.role === 'assistant' ? 'ai' : 'user',
    text: m.content || m.text || '',
    timestamp: i * 30,
  }));
}
