/**
 * groq.service.ts — All Groq API calls. No data persistence here.
 *
 * Exposes two functions:
 *  - sendChatMessage(history, systemPrompt) → AI reply text
 *  - evaluateSession(transcript, rubric)    → structured evaluation result
 */
import { AI_CONFIG } from './config';
import type { SessionContext, TranscriptMessage } from '@training/types/trainingSession.types';
import type { PlaybookSection } from '@shared/types/shared.types';

// ── Types ──────────────────────────────────────────────────────────────────

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface EvaluationResult {
  overallScore: number;          // 0–100
  performanceTier: 'excellent' | 'good' | 'needs-improvement';
  summaryText: string;
  sections: {
    id: string;
    title: string;
    score: number;               // 0–10
    comment: string;
  }[];
  perMessageQuality: {
    messageIndex: number;
    quality: 'good-example' | 'missed-opportunity' | null;
  }[];
}

// ── System prompt builder ─────────────────────────────────────────────────

/**
 * Builds the Groq system prompt that makes it behave as the AI persona.
 * Constructed from manager-defined persona + meeting context fields.
 */
export function buildSystemPrompt(ctx: SessionContext): string {
  const { persona, meetingContext, trainingTitle } = ctx;
  return `You are ${persona.name}, ${persona.jobTitle} at ${persona.company}.

PERSONALITY & COMMUNICATION STYLE:
${persona.communicationStyle}

YOUR MOTIVATIONS & PRIORITIES:
${persona.motivations}

MEETING CONTEXT:
Scenario: ${meetingContext.scenario}
What the sales rep needs to achieve: ${meetingContext.objective}

INSTRUCTIONS:
- Stay fully in character as ${persona.name} throughout the conversation.
- You are a realistic ${trainingTitle} prospect — not too easy, not impossibly difficult.
- Ask clarifying questions, raise realistic objections, and respond naturally.
- Keep your replies concise (2–4 sentences). Do not break character.
- Do not acknowledge you are an AI or that this is a training simulation.`;
}

// ── Groq API call ──────────────────────────────────────────────────────────

async function callGroq(messages: GroqMessage[], maxTokens = 2048): Promise<string> {
  if (!AI_CONFIG.GROQ_API_KEY) {
    throw new Error('[GroqService] NEXT_PUBLIC_GROQ_API_KEY is not set');
  }

  const res = await fetch(AI_CONFIG.GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_CONFIG.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[GroqService] API error ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content?.trim() ?? '';
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Send a chat message in the live training session.
 *
 * @param transcript - Full conversation so far (TranscriptMessage[])
 * @param ctx        - Session context (persona, meeting context, etc.)
 * @returns          - AI reply text
 */
export async function sendChatMessage(
  transcript: TranscriptMessage[],
  ctx: SessionContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx);

  const history: GroqMessage[] = transcript.map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text,
  }));

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
  ];

  return callGroq(messages);
}

/**
 * Analyze the current conversation and return updated scorecard section statuses.
 * Called after each message exchange (lightweight — low token count prompt).
 *
 * Returns a map of sectionId → 'not-started' | 'in-progress' | 'completed'
 */
export async function analyzeScorecardStatus(
  transcript: TranscriptMessage[],
  sections: PlaybookSection[]
): Promise<Record<string, 'not-started' | 'in-progress' | 'completed'>> {
  if (transcript.length < 2 || sections.length === 0) {
    // Not enough conversation yet — return defaults
    const defaults: Record<string, 'not-started' | 'in-progress' | 'completed'> = {};
    sections.forEach((s) => { defaults[s.id] = 'not-started'; });
    return defaults;
  }

  // Only use the last 6 messages to keep this fast and cheap
  const recentTranscript = transcript.slice(-6);
  const transcriptText = recentTranscript
    .map((m) => `${m.sender === 'user' ? 'REP' : 'CLIENT'}: ${m.text}`)
    .join('\n');

  const sectionsText = sections
    .map((s) => `- ID: "${s.id}", Title: "${s.title}", Questions: ${s.questions.map(q => `"${q.text}"`).join(', ')}`)
    .join('\n');

  const prompt = `You are a sales coaching assistant. Review this conversation excerpt and classify each coaching section.

PLAYBOOK SECTIONS:
${sectionsText}

RECENT CONVERSATION:
${transcriptText}

For each section ID, determine:
- "not-started": Rep has not addressed this topic at all
- "in-progress": Rep has started but hasn't fully covered the questions
- "completed": Rep has adequately covered the key questions in this section

Return ONLY a valid JSON object mapping section IDs to status values. Example:
{"section-1": "in-progress", "section-2": "not-started"}`;

  try {
    const raw = await callGroq([
      {
        role: 'system',
        content: 'You are a sales coaching evaluator. Respond with valid JSON only. No markdown.',
      },
      { role: 'user', content: prompt },
    ]);

    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, string>;

    // Validate and type-narrow the values
    const result: Record<string, 'not-started' | 'in-progress' | 'completed'> = {};
    const validStatuses = ['not-started', 'in-progress', 'completed'] as const;
    sections.forEach((s) => {
      const val = parsed[s.id];
      result[s.id] = validStatuses.includes(val as typeof validStatuses[number])
        ? (val as typeof validStatuses[number])
        : 'not-started';
    });
    return result;
  } catch {
    // If Groq fails, return unchanged defaults (don't break the session)
    const fallback: Record<string, 'not-started' | 'in-progress' | 'completed'> = {};
    sections.forEach((s) => { fallback[s.id] = 'not-started'; });
    return fallback;
  }
}

/**
 * Evaluate a completed session against the manager-defined scoring rubric.
 * This is a SEPARATE Groq call — not part of the live conversation.
 *
 * @param transcript  - Full conversation transcript
 * @param rubric      - Playbook sections (the scoring parameters)
 * @param ctx         - Session context (for training title etc.)
 * @returns           - Structured evaluation result
 */
export async function evaluateSession(
  transcript: TranscriptMessage[],
  rubric: PlaybookSection[],
  ctx: SessionContext
): Promise<EvaluationResult> {
  const transcriptText = transcript
    .map((m) => `${m.sender === 'user' ? 'REP' : 'CLIENT'}: ${m.text}`)
    .join('\n');

  const rubricText = rubric
    .map((s, i) => `${i + 1}. ${s.title} (ID: ${s.id})`)
    .join('\n');

  const evalPrompt = `You are an expert sales coach evaluating a training session.

TRAINING: ${ctx.trainingTitle}
CLIENT PERSONA: ${ctx.persona.name}, ${ctx.persona.jobTitle} at ${ctx.persona.company}

SCORING RUBRIC (evaluate the rep against each of these):
${rubricText}

CONVERSATION TRANSCRIPT:
${transcriptText}

Evaluate the sales rep's performance. Return ONLY a valid JSON object with this exact shape:
{
  "overallScore": <number 0-100>,
  "performanceTier": <"excellent" | "good" | "needs-improvement">,
  "summaryText": <2-3 sentence overall assessment>,
  "sections": [
    {
      "id": <section id from rubric>,
      "title": <section title>,
      "score": <number 0-10>,
      "comment": <1-2 sentence specific feedback>
    }
  ],
  "perMessageQuality": [
    {
      "messageIndex": <index of rep message in transcript, 0-based>,
      "quality": <"good-example" | "missed-opportunity" | null>
    }
  ]
}

Be specific and fair. Score based solely on what the rep said in the transcript.`;

  const raw = await callGroq([
    {
      role: 'system',
      content: 'You are a sales training evaluator. Always respond with valid JSON only. No markdown, no explanation outside the JSON.',
    },
    { role: 'user', content: evalPrompt },
  ]);

  try {
    // Strip any markdown fences if model adds them
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as EvaluationResult;
  } catch {
    console.error('[GroqService] Failed to parse evaluation JSON:', raw);
    // Return a safe fallback so the results page still loads
    return {
      overallScore: 0,
      performanceTier: 'needs-improvement',
      summaryText: 'Evaluation could not be parsed. Please retry.',
      sections: rubric.map((s) => ({ id: s.id, title: s.title, score: 0, comment: 'Not evaluated.' })),
      perMessageQuality: [],
    };
  }
}
