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
  const rawCtx = scenario.context_text?.replace(/\[SCENARIO_METADATA:.*?\]/s, '').trim() || '';
  
  // Try extracting metadata JSON if present
  let metadata: any = {};
  const jsonMatch = scenario.context_text?.match(/\[SCENARIO_METADATA:\s*({.*?})\]/s);
  if (jsonMatch) {
    try { metadata = JSON.parse(jsonMatch[1]); } catch {}
  }

  // Build scenario-aware descriptions
  const personaName = scenario.persona_name || 'Training Prospect';
  const personaType = scenario.persona_type || 'Decision Maker';
  const difficulty = scenario.difficulty || 'intermediate';
  const contextSummary = rawCtx.slice(0, 400) || `${personaName} is a ${personaType} evaluating your solution.`;

  // Map difficulty to communication style
  const commStyles: Record<string, string> = {
    beginner: 'Open and curious. Willing to listen but needs clear explanations. Responds well to patient, structured conversations.',
    easy: 'Open and curious. Willing to listen but needs clear explanations. Responds well to patient, structured conversations.',
    intermediate: 'Professional and skeptical. Asks pointed questions and expects data-backed answers. Won\'t commit without proof.',
    medium: 'Professional and skeptical. Asks pointed questions and expects data-backed answers. Won\'t commit without proof.',
    advanced: 'Direct and challenging. Time-pressured, has seen many pitches, and pushes back hard. Only responds to concrete evidence.',
    hard: 'Direct and challenging. Time-pressured, has seen many pitches, and pushes back hard. Only responds to concrete evidence.',
  };

  // Detect scenario topic for tailored playbook
  const ctxLower = rawCtx.toLowerCase();
  let topic = 'your solution';
  if (ctxLower.includes('cloud') || ctxLower.includes('migration')) topic = 'cloud migration';
  else if (ctxLower.includes('sales') || ctxLower.includes('crm')) topic = 'sales platform';
  else if (ctxLower.includes('security') || ctxLower.includes('compliance')) topic = 'security solution';
  else if (ctxLower.includes('automat')) topic = 'automation platform';

  return {
    id: scenario.id,
    title: personaName,
    contactPersona: {
      name: personaName,
      jobTitle: personaType,
      company: metadata.company || 'Prospect Corp',
      motivations: metadata.objectives || contextSummary,
      communicationStyle: commStyles[difficulty] || commStyles.intermediate,
    },
    meetingContext: {
      scenario: metadata.scenario_name || `Discovery Call — ${topic} Evaluation`,
      objective: metadata.goals || `Understand ${personaName}'s pain points around ${topic}, handle objections effectively, and secure a clear next step.`,
      backgroundForTrainee: rawCtx.slice(0, 600) || `${personaName} is a ${personaType} who is evaluating ${topic} solutions. Prepare discovery questions, anticipate objections around ROI, timeline, and adoption risk.`,
    },
    playbookSections: [
      {
        id: 'pb_01',
        title: 'Opening & Rapport',
        questions: [
          { id: 'q1', text: 'Introduce yourself and establish credibility quickly.', tags: ['high-impact'], whyItMatters: 'First impressions set the tone.' },
          { id: 'q2', text: `What do you know about the prospect's current ${topic} situation?`, tags: [], whyItMatters: 'Shows preparation and earns trust.' },
        ],
      },
      {
        id: 'pb_02',
        title: 'Discovery',
        questions: [
          { id: 'q3', text: `What challenges are you currently facing with ${topic}?`, tags: ['high-impact'], whyItMatters: 'Opens discovery and uncovers pain.' },
          { id: 'q4', text: 'What does your current process look like today?', tags: [], whyItMatters: 'Establishes baseline for improvement.' },
          { id: 'q5', text: 'What would success look like for you in 12 months?', tags: ['high-impact'], whyItMatters: 'Aligns on desired outcomes.' },
        ],
      },
      {
        id: 'pb_03',
        title: 'Objection Handling',
        questions: [
          { id: 'q6', text: 'Address ROI and business value concerns with specifics.', tags: ['high-impact'], whyItMatters: 'ROI is the #1 buyer concern.' },
          { id: 'q7', text: 'Handle timeline and implementation risk objections.', tags: [], whyItMatters: 'Reduces perceived risk.' },
          { id: 'q8', text: 'Address team adoption and change management worries.', tags: ['missed-last-attempt'], whyItMatters: 'Adoption kills most deals.' },
        ],
      },
      {
        id: 'pb_04',
        title: 'Closing & Next Steps',
        questions: [
          { id: 'q9', text: 'Propose a clear, specific next step.', tags: ['high-impact'], whyItMatters: 'Every meeting needs a next step.' },
          { id: 'q10', text: 'Confirm who else needs to be involved in the decision.', tags: [], whyItMatters: 'Identifies the buying committee.' },
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
    scoredSections: (session.scenario ? mapTrainingSetup(session.scenario).playbookSections : []).map(section => ({
      id: section.id,
      categoryName: section.title,
      score: feedback?.scores ? feedback.scores[section.title.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')] ?? 8 : 8,
      maxScore: 10,
      status: 'on-track',
      questions: section.questions
    })),
    performanceBreakdown: [
      {
        category: 'Opening & Rapport Building',
        score: feedback?.scores?.opening ?? 13,
        maxScore: 15,
        percentage: Math.round(((feedback?.scores?.opening ?? 13) / 15) * 100),
        description: 'Building early trust and setting the agenda.',
        strengths: feedback?.strengths?.length > 0 ? feedback.strengths : ['Strong introduction and clear agenda setting'],
        areasForImprovement: feedback?.improvements?.length > 0 ? feedback.improvements : ['Could build more rapport before jumping into business']
      },
      {
        category: 'Discovery Questions',
        score: feedback?.scores?.discovery ?? 26,
        maxScore: 35,
        percentage: Math.round(((feedback?.scores?.discovery ?? 26) / 35) * 100),
        description: 'Uncovering pain points and qualifying the prospect.',
        strengths: ['Consistently asked open-ended questions', 'Uncovered main pain points'],
        areasForImprovement: ['Probe deeper on the timeline', 'Clarify budget constraints']
      },
      {
        category: 'Objection Handling',
        score: feedback?.scores?.objection_handling ?? 20,
        maxScore: 25,
        percentage: Math.round(((feedback?.scores?.objection_handling ?? 20) / 25) * 100),
        description: 'Addressing concerns with empathy and proof.',
        strengths: feedback?.strengths?.length > 1 ? [feedback.strengths[0]] : ['Addressed pricing concerns directly'],
        areasForImprovement: feedback?.improvements?.length > 1 ? [feedback.improvements[0]] : ['Could use more customer references']
      },
      {
        category: 'Closing & Next Steps',
        score: feedback?.scores?.closing ?? 19,
        maxScore: 25,
        percentage: Math.round(((feedback?.scores?.closing ?? 19) / 25) * 100),
        description: 'Securing commitment for the next stage.',
        strengths: feedback?.strengths?.length > 2 ? [feedback.strengths[1]] : ['Clear action items proposed'],
        areasForImprovement: feedback?.improvements?.length > 2 ? [feedback.improvements[1]] : ['Did not confirm meeting time']
      }
    ],
    transcript: mapMessages(
      typeof session.messages_json === 'string'
        ? JSON.parse(session.messages_json)
        : session.messages_json,
    ),
    resultsReady: true,
  };
}
