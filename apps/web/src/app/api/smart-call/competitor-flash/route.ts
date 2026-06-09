import { NextRequest, NextResponse } from 'next/server';
import { analyzeCompetitorThreat } from '@smart-call/server/live-assist-bridge';
import { resolveGroqKey } from '../resolve-keys';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    competitor?: string;
    transcriptContext?: string;
    groqApiKey?: string;
  };
  const groqKey = resolveGroqKey(req, body);
  if (!groqKey) {
    return NextResponse.json(
      { error: 'Groq API key required' },
      { status: 503 },
    );
  }

  if (!body.competitor?.trim()) {
    return NextResponse.json(null);
  }

  try {
    const result = await analyzeCompetitorThreat(
      groqKey,
      body.competitor,
      body.transcriptContext ?? '',
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
