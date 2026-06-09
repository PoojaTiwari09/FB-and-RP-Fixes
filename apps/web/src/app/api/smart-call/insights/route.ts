import { NextRequest, NextResponse } from 'next/server';
import { generateLiveAssistInsights } from '@smart-call/server/live-assist-bridge';
import { resolveGroqKey, resolveOpenRouterKey } from '../resolve-keys';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as Record<string, unknown> & {
    groqApiKey?: string;
    openRouterApiKey?: string;
  };
  const groqKey = resolveGroqKey(req, payload);
  if (!groqKey) {
    return NextResponse.json(
      { error: 'Groq API key required — add it in Smart Call settings or set GROQ_API_KEY on the server' },
      { status: 503 },
    );
  }

  const { groqApiKey: _g, openRouterApiKey: _o, ...insightPayload } = payload;

  try {
    const data = await generateLiveAssistInsights(
      { groq: groqKey, openrouter: resolveOpenRouterKey(payload) ?? undefined },
      insightPayload,
    );
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
