import { NextRequest, NextResponse } from 'next/server';
import type { WSEvent } from '@smart-call/types/smart-call.types';

export const runtime = 'nodejs';

const COACHING_PROMPT = `You are a real-time AI sales co-pilot. Analyze the sales call transcript and return ONLY a JSON object with this exact structure — no markdown, no explanation:
{
  "currentStage": "string (e.g. Discovery, Objection Handling, Closing)",
  "nextSuggestion": "string",
  "contextSummary": "string (one sentence describing what is being discussed right now)",
  "confidenceScore": number (0-100, how confident and effective the rep sounds),
  "strategicTip": "string (one actionable coaching tip for the rep)",
  "strategicTipScript": "string (example phrase the rep can say right now)",
  "responses": ["string", "string", "string"],
  "competitors": [{ "competitorName": "string", "badgeColor": "blue|orange|green|pink|red", "insight": "string", "ourEdge": "string", "sayThis": "string" }],
  "signals": [{ "label": "string", "value": "string", "severity": "HIGH|MEDIUM|LOW|INFO", "color": "green|blue|yellow|purple|red" }],
  "repPercent": number,
  "customerPercent": number,
  "summarySegments": [{ "startTime": "MM:SS", "endTime": "MM:SS", "summary": "string (1-2 sentences for this topic)", "highlightedKeywords": [{ "word": "string", "color": "orange|blue" }], "tags": ["string (e.g. Objection, Discovery, Closing, Pricing)"] }]
}`;

export async function POST(req: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 503 });
  }

  const { transcript } = await req.json() as { transcript?: string };
  if (!transcript?.trim()) {
    return NextResponse.json({ events: [] });
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: COACHING_PROMPT },
        { role: 'user', content: `Transcript:\n${transcript}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Groq error: ${res.status}` }, { status: res.status });
  }

  const raw = await res.json() as { choices: { message: { content: string } }[] };
  const parsed = JSON.parse(raw.choices[0].message.content) as Record<string, unknown>;
  return NextResponse.json({ events: buildCoachingEvents(parsed) });
}

function buildCoachingEvents(p: Record<string, unknown>): WSEvent[] {
  const events: WSEvent[] = [];

  if (p.currentStage && p.nextSuggestion) {
    events.push({
      eventType: 'LIVE_GUIDANCE',
      currentStage: String(p.currentStage),
      nextSuggestion: String(p.nextSuggestion),
    });
  }

  if (Array.isArray(p.responses) && p.responses.length > 0) {
    events.push({ eventType: 'SUGGESTED_RESPONSES', responses: p.responses as string[] });
  }

  if (Array.isArray(p.competitors) && p.competitors.length > 0) {
    events.push({ eventType: 'COMPETITOR_INTELLIGENCE', competitors: p.competitors } as unknown as WSEvent);
  }

  if (Array.isArray(p.signals) && p.signals.length > 0) {
    events.push({ eventType: 'INTENT_SIGNALS', signals: p.signals } as WSEvent);
  }

  if (typeof p.repPercent === 'number') {
    events.push({
      eventType: 'TALK_RATIO',
      repPercent: p.repPercent,
      customerPercent: typeof p.customerPercent === 'number' ? p.customerPercent : 100 - p.repPercent,
    });
  }

  if (Array.isArray(p.summarySegments) && p.summarySegments.length > 0) {
    events.push({ eventType: 'CONVERSATION_SUMMARY', segments: p.summarySegments } as WSEvent);
  }

  const overlayCompetitors = Array.isArray(p.competitors)
    ? (p.competitors as Record<string, unknown>[]).map((c) => ({
        competitorName: String(c.competitorName ?? ''),
        ourEdge: String(c.ourEdge ?? ''),
        sayThis: String(c.sayThis ?? ''),
      }))
    : [];

  const firstResponse =
    Array.isArray(p.responses) && p.responses.length > 0 ? String(p.responses[0]) : '';

  events.push({
    eventType: 'OVERLAY_UPDATE',
    confidenceScore: typeof p.confidenceScore === 'number' ? p.confidenceScore : 75,
    contextSummary:
      typeof p.contextSummary === 'string'
        ? p.contextSummary
        : `Currently in ${String(p.currentStage ?? 'call')} stage`,
    actionSuggestion: typeof p.nextSuggestion === 'string' ? p.nextSuggestion : '',
    suggestedResponse: firstResponse,
    strategicTip:
      typeof p.strategicTip === 'string' ? p.strategicTip : 'Focus on building rapport.',
    strategicTipScript:
      typeof p.strategicTipScript === 'string' ? p.strategicTipScript : firstResponse,
    competitors: overlayCompetitors,
  });

  return events;
}
