import { NextRequest, NextResponse } from 'next/server';
import { resolveGroqKey } from '../resolve-keys';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const groqKey = resolveGroqKey(req);
  if (!groqKey) {
    return NextResponse.json(
      { error: 'Groq API key required — add it in Smart Call settings or set GROQ_API_KEY on the server' },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = form.get('file') as Blob | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size < 3000) {
    return NextResponse.json({ text: '' });
  }

  try {
    const localForm = new FormData();
    localForm.append('file', file, 'audio.webm');
    const localRes = await fetch('http://127.0.0.1:8787/transcribe', {
      method: 'POST',
      body: localForm,
      signal: AbortSignal.timeout(8000),
    });
    if (localRes.ok) {
      const local = await localRes.json() as { text?: string };
      const text = (local.text ?? '')
        .replace(/<\|.*?\|>/g, '')
        .replace(/\[(?:inaudible|crosstalk|silence)\]/gi, '')
        .trim();
      if (text) return NextResponse.json({ text });
    }
  } catch {
    /* fall through to Groq */
  }

  const body = new FormData();
  body.append('file', file, 'audio.webm');
  body.append('model', 'whisper-large-v3');
  body.append('language', 'en');
  body.append('response_format', 'json');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${groqKey}` },
    body,
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Groq error: ${res.status}` }, { status: res.status });
  }

  const json = await res.json() as { text: string };
  return NextResponse.json({ text: json.text ?? '' });
}
