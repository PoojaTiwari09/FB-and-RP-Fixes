import { NextRequest, NextResponse } from 'next/server';
import type { CallSummary } from '@smart-call/types/smart-call.types';
import { resolveGroqKey, resolveOpenRouterKey } from '../resolve-keys';

export const runtime = 'nodejs';

const CALL_SUMMARY_PROMPT = `You are a sales performance analyst. Analyze the transcript and return ONLY a JSON object — no markdown, no explanation:
{
  "signalType": "POSITIVE|NEGATIVE|NEUTRAL",
  "signalLabel": "string (e.g. 'Positive Signal', 'Risk Detected', 'Neutral Outcome')",
  "overallScore": number (0-100),
  "dimensionScores": [
    { "dimension": "Discovery", "score": number, "maxScore": 100 },
    { "dimension": "Objection Handling", "score": number, "maxScore": 100 },
    { "dimension": "Closing", "score": number, "maxScore": 100 }
  ],
  "aiSummary": "string (3-5 sentences summarizing the call quality, outcomes, and rep performance)",
  "keyMoments": [
    { "timestamp": "M:SS", "type": "OBJECTION|INTEREST_SIGNAL|MISSED_OPPORTUNITY", "color": "yellow|green|red", "description": "string (one sentence)" }
  ],
  "missedOpportunities": {
    "title": "Missed Opportunities",
    "subLabel": "Key questions you could have asked:",
    "questions": ["string", "string", "string"]
  },
  "suggestedImprovements": ["string", "string", "string"],
  "conversationTimeline": [
    { "startTime": "M:SS", "endTime": "M:SS", "topic": "string (brief topic label)" }
  ]
}`;

interface SummarizeBody {
  transcript: string;
  sessionId: string;
  callType: string;
  duration: string;
  groqApiKey?: string;
  openRouterApiKey?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SummarizeBody;
  const groqKey = resolveGroqKey(req, body);
  const openRouterKey = resolveOpenRouterKey(body);

  const { transcript, sessionId, callType, duration } = body;
  const trimmed = transcript.trim()
    ? transcript.split(' ').slice(-800).join(' ')
    : 'No transcript available.';

  // Prefer OpenRouter (better quality); fall back to Groq
  if (openRouterKey) {
    try {
      const summary = await callLLM(
        'https://openrouter.ai/api/v1/chat/completions',
        'meta-llama/llama-3.3-70b-instruct:free',
        { Authorization: `Bearer ${openRouterKey}`, 'HTTP-Referer': 'https://revenue-intelligence.app', 'X-Title': 'Revenue Intelligence Smart Call' },
        trimmed,
        callType,
      );
      return NextResponse.json(buildSummary(summary, sessionId, callType, duration));
    } catch {
      // fall through
    }
  }

  if (groqKey) {
    try {
      const summary = await callLLM(
        'https://api.groq.com/openai/v1/chat/completions',
        'llama-3.1-8b-instant',
        { Authorization: `Bearer ${groqKey}` },
        trimmed,
        callType,
      );
      return NextResponse.json(buildSummary(summary, sessionId, callType, duration));
    } catch {
      // fall through
    }
  }

  // Dynamic Fallback Analysis based on transcript keywords
  const text = transcript.toLowerCase();
  
  // Keyword detection
  const hasPriceObjection = text.includes('expensive') || text.includes('price') || text.includes('budget') || text.includes('cost');
  const hasCompetitor = text.includes('competitor') || text.includes('other option') || text.includes('alternative');
  const hasInterest = text.includes('sounds good') || text.includes('interesting') || text.includes('next steps') || text.includes('timeline');
  const hasDiscovery = text.includes('challenge') || text.includes('problem') || text.includes('goal') || text.includes('pain');
  const hasClosing = text.includes('contract') || text.includes('sign') || text.includes('move forward');

  const discoveryScore = hasDiscovery ? 85 : 45;
  const objectionScore = (hasPriceObjection || hasCompetitor) ? 75 : (transcript.length > 50 ? 90 : 50);
  const closingScore = hasClosing ? 90 : (hasInterest ? 65 : 40);
  
  const overallScore = Math.round((discoveryScore + objectionScore + closingScore) / 3);

  let signalType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
  let signalLabel = 'Neutral Outcome';
  if (hasClosing || hasInterest) {
    signalType = 'POSITIVE';
    signalLabel = 'Positive Buying Signal';
  } else if (hasCompetitor || hasPriceObjection) {
    signalType = 'NEGATIVE';
    signalLabel = 'Risk Detected';
  }

  const keyMoments = [];
  if (hasPriceObjection) keyMoments.push({ timestamp: '0:30', type: 'OBJECTION', color: 'yellow', description: 'Price or budget concern raised' });
  if (hasCompetitor) keyMoments.push({ timestamp: '1:15', type: 'OBJECTION', color: 'yellow', description: 'Mentioned a competitor' });
  if (hasInterest) keyMoments.push({ timestamp: '2:45', type: 'INTEREST_SIGNAL', color: 'green', description: 'Expressed interest or asked for next steps' });
  
  let aiSummary = '';
  if (transcript.length < 20) {
    aiSummary = 'The session was too short to generate a meaningful analysis.';
  } else {
    aiSummary = `The call showed ${signalType.toLowerCase()} momentum. `;
    if (hasDiscovery) aiSummary += 'Good discovery questions uncovered pain points. ';
    if (hasPriceObjection) aiSummary += 'Price was brought up as a potential hurdle. ';
    if (hasInterest) aiSummary += 'The prospect showed clear interest in moving forward.';
    else aiSummary += 'Next steps were not clearly defined.';
  }

  const questions = [];
  if (!hasDiscovery) questions.push('What is the main challenge you are facing right now?');
  if (!hasClosing) questions.push('What does your timeline look like for making a decision?');
  if (!hasPriceObjection) questions.push('Is budget already allocated for this project?');

  return NextResponse.json(
    buildSummary(
      {
        signalType,
        signalLabel,
        overallScore,
        dimensionScores: [
          { dimension: 'Discovery', score: discoveryScore, maxScore: 100 },
          { dimension: 'Objection Handling', score: objectionScore, maxScore: 100 },
          { dimension: 'Closing', score: closingScore, maxScore: 100 },
        ],
        aiSummary,
        keyMoments,
        missedOpportunities: {
          title: 'Missed Opportunities',
          subLabel: 'Key questions you could have asked:',
          questions,
        },
        suggestedImprovements: questions.length > 0 ? ['Ask more probing questions', 'Secure clear next steps'] : ['Keep up the momentum'],
        conversationTimeline: [
          { startTime: '0:00', endTime: duration || '1:00', topic: 'Main Conversation' }
        ],
      },
      sessionId,
      callType,
      duration,
    ),
  );
}

async function callLLM(
  url: string,
  model: string,
  extraHeaders: Record<string, string>,
  transcript: string,
  callType: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: CALL_SUMMARY_PROMPT },
        { role: 'user', content: `Call type: ${callType}\nTranscript:\n${transcript}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) throw new Error(`LLM error: ${res.status}`);
  const raw = await res.json() as { choices: { message: { content: string } }[] };
  return JSON.parse(raw.choices[0].message.content) as Record<string, unknown>;
}

type KeyMomentType = CallSummary['keyMoments'][number]['type'];

function normalizeKeyMomentType(raw: string): KeyMomentType {
  const upper = raw.toUpperCase().replace(/[\s-]+/g, '_');
  if (upper.includes('OBJECTION')) return 'OBJECTION';
  if (upper.includes('MISSED') || upper.includes('RISK')) return 'MISSED_OPPORTUNITY';
  if (upper.includes('INTEREST') || upper.includes('SIGNAL') || upper.includes('POSITIVE')) {
    return 'INTEREST_SIGNAL';
  }
  return 'INTEREST_SIGNAL';
}

function normalizeKeyMoments(raw: unknown): CallSummary['keyMoments'] {
  if (!Array.isArray(raw)) return [];
  const colorByType: Record<KeyMomentType, string> = {
    OBJECTION: 'yellow',
    INTEREST_SIGNAL: 'green',
    MISSED_OPPORTUNITY: 'red',
  };
  return raw.map((item) => {
    const m = item as Record<string, unknown>;
    const type = normalizeKeyMomentType(String(m.type ?? ''));
    return {
      timestamp: String(m.timestamp ?? '0:00'),
      type,
      color: String(m.color ?? colorByType[type]),
      description: String(m.description ?? ''),
    };
  });
}

function buildSummary(
  p: Record<string, unknown>,
  sessionId: string,
  callType: string,
  duration: string,
): CallSummary {
  return {
    sessionId,
    callSummaryId: `summary_${sessionId}`,
    duration,
    callType,
    signalType: (p.signalType as CallSummary['signalType']) ?? 'NEUTRAL',
    signalLabel: (p.signalLabel as string) ?? 'Neutral Outcome',
    overallScore: (p.overallScore as number) ?? 70,
    dimensionScores: (p.dimensionScores as CallSummary['dimensionScores']) ?? [],
    aiSummary: (p.aiSummary as string) ?? '',
    keyMoments: normalizeKeyMoments(p.keyMoments),
    missedOpportunities: (p.missedOpportunities as CallSummary['missedOpportunities']) ?? {
      title: 'Missed Opportunities',
      subLabel: '',
      questions: [],
    },
    suggestedImprovements: (p.suggestedImprovements as string[]) ?? [],
    conversationTimeline: (p.conversationTimeline as CallSummary['conversationTimeline']) ?? [],
    transcriptUrl: '',
  };
}
