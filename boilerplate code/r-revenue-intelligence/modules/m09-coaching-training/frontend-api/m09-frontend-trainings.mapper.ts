const VOICES = [
  { id: 'voice_1', label: 'Voice 1', description: 'Professional Female - Warm & Engaging', previewText: 'Hello, thanks for joining.' },
  { id: 'voice_2', label: 'Voice 2', description: 'Professional Male - Calm & Analytical', previewText: 'Let us begin the session.' },
  { id: 'voice_3', label: 'Voice 3', description: 'Friendly Female - Conversational', previewText: 'Hi there, ready to practice?' },
  { id: 'voice_4', label: 'Voice 4', description: 'Authoritative Male - Direct', previewText: 'Good morning.' },
];

export function defaultVoices() {
  return VOICES;
}

export function mapTrainingListItem(scenario: any, assignment?: any) {
  const completed = assignment?.status === 'Completed' || !!assignment?.completed_at;
  return {
    id: scenario.id,
    title: scenario.persona_name || scenario.scenario_name || 'Sales Training',
    dueDateIso: assignment?.deadline?.toISOString?.() || null,
    status: completed ? 'completed' : 'in-progress',
    progressPercent: completed ? 100 : assignment?.best_score ?? 65,
    lastSessionId: assignment?.last_session_id || null,
  };
}

export function mapTrainingSetup(scenario: any) {
  const raw = scenario.context_text?.replace(/\[SCENARIO_METADATA:.*?\]/s, '').trim() || '';
  return {
    id: scenario.id,
    title: scenario.persona_name || 'Training',
    contactPersona: {
      name: scenario.persona_name,
      jobTitle: scenario.persona_type || 'Decision Maker',
      company: 'Prospect Corp',
      motivations: raw.slice(0, 400) || 'Growth and efficiency.',
      communicationStyle: scenario.difficulty || 'professional',
    },
    meetingContext: {
      scenario: 'Discovery Call - Initial Meeting',
      objective: 'Understand pain points and qualify the opportunity.',
      backgroundForTrainee: raw.slice(0, 600) || 'Review persona and practice discovery questions.',
    },
    playbookSections: [
      {
        id: 'pb_01',
        title: 'Discovery',
        questions: [
          {
            id: 'q1',
            text: 'What challenges are you facing today?',
            tags: ['high-impact'],
            whyItMatters: 'Opens discovery.',
          },
        ],
      },
    ],
    voices: defaultVoices(),
  };
}

export function mapMessages(messages: any[]) {
  return (messages || []).map((m: any, i: number) => ({
    id: m.id || `msg_${i}`,
    sender: m.role === 'assistant' ? 'ai' : 'user',
    text: m.content || m.text || '',
    timestampSeconds: m.timestampSeconds ?? i * 30,
  }));
}

export function mapSessionState(session: any, scenario: any, messages: any[]) {
  return {
    sessionId: session.id,
    status: session.lifecycle_status || (session.completed_at ? 'completed' : 'active'),
    elapsedSeconds: session.elapsed_seconds ?? 0,
    messageCount: messages.length,
    selectedVoiceId: session.selected_voice_id,
    messages: mapMessages(messages),
    context: mapTrainingSetup(scenario),
  };
}

export function mapResults(session: any, feedback: any) {
  if (!feedback) {
    return {
      trainingId: session.scenario_id,
      trainingTitle: session.scenario?.persona_name || 'Training',
      resultsReady: false,
      status: 'processing',
    };
  }
  const score = feedback.overall_score ?? 85;
  return {
    trainingId: session.scenario_id,
    trainingTitle: session.scenario?.persona_name || 'Training',
    overallScore: score,
    maxScore: 100,
    performanceTier: score >= 80 ? 'excellent' : score >= 65 ? 'good' : 'needs-improvement',
    tierLabel: score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : 'Needs Practice',
    summaryText: feedback.evaluation_summary || '',
    performanceTags: (feedback.strengths || []).slice(0, 3).map((s: string, i: number) => ({
      id: `tag_${i}`,
      label: s,
      type: 'positive',
    })),
    scoredSections: [],
    performanceBreakdown: [],
    transcript: mapMessages(
      typeof session.messages_json === 'string'
        ? JSON.parse(session.messages_json)
        : session.messages_json,
    ),
    resultsReady: true,
  };
}
