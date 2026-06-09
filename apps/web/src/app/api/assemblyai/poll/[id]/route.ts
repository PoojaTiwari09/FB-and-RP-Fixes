import { NextRequest, NextResponse } from 'next/server';
import { resolveAssemblyAIKey } from '../../_lib/resolve-assemblyai-key';

export async function GET(req: NextRequest) {
  const apiKey = resolveAssemblyAIKey(req);
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'No AssemblyAI API key. Add one in AI Call Reviewer settings or set ASSEMBLYAI_API_KEY in .env.local.',
      },
      { status: 500 },
    );
  }

  try {
    const pathname = req.nextUrl.pathname;
    const id = pathname.split('/').pop();

    if (!id || id === 'poll') {
      return NextResponse.json({ error: 'Missing transcript ID' }, { status: 400 });
    }

    const response = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { authorization: apiKey },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error ?? 'Poll failed' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
