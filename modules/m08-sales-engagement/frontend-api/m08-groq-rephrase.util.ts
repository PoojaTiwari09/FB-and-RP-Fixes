const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

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

export async function rephraseEmailWithGroq(input: {
  subject?: string;
  body?: string;
  bodyHtml?: string;
  contactName?: string;
  company?: string;
  tone?: string;
}): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (!groqKey) {
    throw new Error('GROQ_API_KEY is not configured on the API server');
  }

  const originalBody = stripAiMeta((input.body || htmlToPlainText(input.bodyHtml || '')).trim());
  if (!originalBody) {
    throw new Error('Email body is required');
  }

  const contextLines = [
    input.contactName ? `Recipient: ${input.contactName}` : null,
    input.company ? `Company: ${input.company}` : null,
    input.subject ? `Subject: ${input.subject}` : null,
    input.tone ? `Preferred tone: ${input.tone}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const res = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert B2B sales email assistant. Rephrase sales outreach emails in fresh wording while keeping the same meaning. Preserve all facts, names, dates, numbers, and the call-to-action. Return ONLY the rephrased email body as plain text. No markdown or meta commentary.',
        },
        {
          role: 'user',
          content: `${contextLines ? `${contextLines}\n\n` : ''}Rephrase this email:\n\n${originalBody}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const rephrased = stripAiMeta(data.choices?.[0]?.message?.content?.trim() || '');
  if (!rephrased) {
    throw new Error('Groq returned an empty response');
  }
  return rephrased;
}
