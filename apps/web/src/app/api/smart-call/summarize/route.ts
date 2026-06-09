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

  if (!groqKey) {
    return NextResponse.json(
      { error: 'Groq API key required — add it in Smart Call settings or set GROQ_API_KEY on the server' },
      { status: 503 },
    );
  }

  const { transcript, sessionId, callType, duration } = body;
  const trimmed = transcript.trim()
    ? transcript.split(' ').slice(-800).join(' ')
    : 'No transcript available — generate a realistic mock summary.';

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
      // fall through to Groq
    }
  }

  try {
    const summary = await callLLM(
      'https://api.groq.com/openai/v1/chat/completions',
      'llama-3.1-8b-instant',
      { Authorization: `Bearer ${groqKey}` },
      trimmed,
      callType,
    );
    return NextResponse.json(buildSummary(summary, sessionId, callType, duration));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
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
