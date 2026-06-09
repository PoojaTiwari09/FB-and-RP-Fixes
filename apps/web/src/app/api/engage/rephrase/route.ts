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

  // ── Try Groq first ──────────────────────────────────────────────
  const groqKey = resolveGroqKey();
  if (groqKey) {
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

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const rephrasedBody = stripAiMeta(data.choices?.[0]?.message?.content?.trim() || '');

        if (rephrasedBody) {
          return NextResponse.json({
            status: 'success',
            data: { rephrasedBody },
            rephrasedBody,
          });
        }
      } else {
        const errText = await res.text();
        console.warn(`[Rephrase] Groq API error ${res.status}: ${errText}. Falling back to local rephrase.`);
      }
    } catch (err) {
      console.warn(`[Rephrase] Groq fetch failed: ${err}. Falling back to local rephrase.`);
    }
  }

  // ── Fallback: local deterministic rephrase ──────────────────────
  const rephrasedBody = localRephrase(originalBody, payload.tone || 'formal', payload.contactName);

  return NextResponse.json({
    status: 'success',
    data: { rephrasedBody },
    rephrasedBody,
  });
}

/**
 * Simple local rephrase — applies tone adjustments without an LLM.
 * Good-enough fallback when the Groq API key is missing or expired.
 */
function localRephrase(text: string, tone: string, contactName?: string): string {
  const lines = text.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    let modified = line;

    if (tone === 'casual') {
      // Make greetings casual
      modified = modified.replace(/^Dear\s+/i, 'Hey ');
      modified = modified.replace(/^Hello\s+/i, 'Hi ');
      modified = modified.replace(/\bI would like to\b/gi, "I'd love to");
      modified = modified.replace(/\bPlease do not hesitate\b/gi, "Feel free");
      modified = modified.replace(/\bI wanted to follow up\b/gi, "Just following up");
      modified = modified.replace(/\bRegards\b/gi, 'Cheers');
      modified = modified.replace(/\bBest regards\b/gi, 'Best');
      modified = modified.replace(/\bSincerely\b/gi, 'Thanks');
      modified = modified.replace(/\bPlease let me know\b/gi, 'Let me know');
      modified = modified.replace(/\bI would appreciate\b/gi, "I'd appreciate");
      modified = modified.replace(/\bWould you be open to\b/gi, "How about");
      modified = modified.replace(/\bwalk through\b/gi, "go over");
    } else if (tone === 'demanding') {
      modified = modified.replace(/^Hi\s+/i, 'Hello ');
      modified = modified.replace(/^Hey\s+/i, 'Hello ');
      modified = modified.replace(/\bWould you be open to\b/gi, "I need us to schedule");
      modified = modified.replace(/\bI wanted to follow up\b/gi, "This requires immediate attention");
      modified = modified.replace(/\bPlease let me know\b/gi, 'Please respond by end of day');
      modified = modified.replace(/\bBest\b/gi, 'Regards');
      modified = modified.replace(/\bCheers\b/gi, 'Regards');
      modified = modified.replace(/\bwalk through\b/gi, "review urgently");
      modified = modified.replace(/\bI'd love to\b/gi, "We need to");
    } else {
      // formal (default)
      modified = modified.replace(/^Hey\s+/i, 'Dear ');
      modified = modified.replace(/^Hi\s+/i, 'Hello ');
      modified = modified.replace(/\bI'd love to\b/gi, "I would like to");
      modified = modified.replace(/\bjust following up\b/gi, "I am following up");
      modified = modified.replace(/\bCheers\b/gi, 'Best regards');
      modified = modified.replace(/\bThanks\b/gi, 'Thank you');
      modified = modified.replace(/\bLet me know\b/gi, 'Please let me know at your earliest convenience');
      modified = modified.replace(/\bHow about\b/gi, "Would you be open to");
      modified = modified.replace(/\bgo over\b/gi, "walk through");
    }

    result.push(modified);
  }

  return result.join('\n');
}
