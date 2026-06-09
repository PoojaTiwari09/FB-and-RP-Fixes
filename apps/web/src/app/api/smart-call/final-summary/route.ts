import { NextRequest, NextResponse } from 'next/server';
import { generateStrategicSummary } from '@smart-call/server/live-assist-bridge';
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
      { error: 'Groq API key required' },
      { status: 503 },
    );
  }

  try {
    const result = await generateStrategicSummary(
      { groq: groqKey, openrouter: resolveOpenRouterKey(payload) ?? undefined },
      payload,
    );
    return NextResponse.json({ summary: result.text, provider: result.provider });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
