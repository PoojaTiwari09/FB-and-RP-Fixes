import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface RephraseBody {
  taskId?: string;
  subject?: string;
  body?: string;
  bodyHtml?: string;
  contactName?: string;
  company?: string;
  tone?: string;
}

function resolveGroqKey(): string | null {
  return (
    process.env.GROQ_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GROQ_API_KEY?.trim() ||
    null
  );
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]*>/g, '')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

function stripAiMeta(text: string): string {
  return text
    .replace(/\n*\[AI Rephrased:[^\]]*\]\s*/gi, '')
    .replace(/^Here(?:'s| is) (?:the )?rephrased email:?\s*/i, '')
    .trim();
}

export async function POST(req: NextRequest) {
  const groqKey = resolveGroqKey();
  if (!groqKey) {
    return NextResponse.json(
      {
        error:
          'Groq API key required. Set GROQ_API_KEY or NEXT_PUBLIC_GROQ_API_KEY in unified-ui/.env.local',
      },
      { status: 503 },
    );
  }

  let payload: RephraseBody;
  try {
    payload = (await req.json()) as RephraseBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const originalBody = stripAiMeta(
    (payload.body || htmlToPlainText(payload.bodyHtml || '')).trim(),
  );

  if (!originalBody) {
    return NextResponse.json({ error: 'Email body is required' }, { status: 400 });
  }

  const contextLines = [
    payload.contactName ? `Recipient: ${payload.contactName}` : null,
    payload.company ? `Company: ${payload.company}` : null,
    payload.subject ? `Subject: ${payload.subject}` : null,
    payload.tone ? `Preferred tone: ${payload.tone}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const systemPrompt = `You are an expert B2B sales email assistant. Rephrase the provided text in a ${payload.tone || 'formal'} tone while keeping the same meaning.

Rules:
- Preserve ALL facts: names, companies, dates, numbers, product details, and the call-to-action.
- If the input is a full email, maintain the structure (greeting, body, sign-off).
- If the input is just a sentence or fragment, rephrase only that fragment.
- Match the requested tone:
  * casual: friendly, conversational, less formal, use contractions.
  * formal: professional, respectful, standard business English.
  * demanding: firm, urgent, authoritative, clear expectations.
- Match roughly the same length.
- Return ONLY the rephrased text — no titles, labels, markdown, or meta commentary.`;

  const userPrompt = `${contextLines ? `${contextLines}\n\n` : ''}Rephrase this email:\n\n${originalBody}`;

  try {
    const res = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Groq API error ${res.status}: ${errText}` },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const rephrasedBody = stripAiMeta(data.choices?.[0]?.message?.content?.trim() || '');

    if (!rephrasedBody) {
      return NextResponse.json({ error: 'Groq returned an empty response' }, { status: 502 });
    }

    return NextResponse.json({
      status: 'success',
      data: { rephrasedBody },
      rephrasedBody,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
