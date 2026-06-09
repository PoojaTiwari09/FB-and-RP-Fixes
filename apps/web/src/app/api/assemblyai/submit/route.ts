import { NextRequest, NextResponse } from 'next/server';
import { toAssemblyAISafeUrl } from '@shared/lib/demo-recordings';
import { resolveAssemblyAIKey } from '../_lib/resolve-assemblyai-key';

function normalizeAssemblySourceUrl(raw: string, seed = 'fallback'): string {
  let url = raw.trim();
  if (url.includes('/api/calls/audio')) {
    try {
      const parsed = new URL(url, 'http://localhost');
      const src = parsed.searchParams.get('src');
      if (src) url = decodeURIComponent(src);
    } catch {
      url = '';
    }
  }
  return toAssemblyAISafeUrl(url, seed);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const apiKey = resolveAssemblyAIKey(req, body as { api_key?: string });
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'No AssemblyAI API key. Add one in AI Call Reviewer settings or set ASSEMBLYAI_API_KEY in .env.local.',
        },
        { status: 500 },
      );
    }

    const audio_url = normalizeAssemblySourceUrl(
      String((body as { audio_url?: string }).audio_url ?? ''),
      String((body as { seed?: string }).seed ?? 'fallback'),
    );

    if (!audio_url) {
      return NextResponse.json({ error: 'Missing audio_url' }, { status: 400 });
    }

    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url,
        speech_models: ['universal-3-pro'],
        speaker_labels: true,
        auto_highlights: true,
        sentiment_analysis: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error ?? 'Submit failed' }, { status: response.status });
    }

    return NextResponse.json({ id: data.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
