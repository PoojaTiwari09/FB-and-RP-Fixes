/**
 * AI_CONFIG — single source of truth for all AI service settings.
 * Never inline these values in components or service logic.
 * All keys come from NEXT_PUBLIC_ env vars (set in .env).
 * 
 * Backend approach: GROQ_API_KEY (server-side, private)
 * Client fallback: NEXT_PUBLIC_GROQ_API_KEY (client-side, public)
 */
export const AI_CONFIG = {
  // ── Groq ────────────────────────────────────────────────────────────────
  // Server-side Groq key (not exposed to browser)
  GROQ_API_KEY: process.env.GROQ_API_KEY ?? '',
  // Client-side Groq key for fallback (public, safe to expose)
  NEXT_PUBLIC_GROQ_API_KEY: process.env.NEXT_PUBLIC_GROQ_API_KEY ?? '',
  // For backward compatibility, try both
  get GROQ_API_KEY_FOR_CLIENT(): string {
    return process.env.NEXT_PUBLIC_GROQ_API_KEY ?? '';
  },
  GROQ_CHAT_URL: 'https://api.groq.com/openai/v1/chat/completions',
  /** llama-3.3-70b-versatile — current fast model on Groq */
  GROQ_MODEL: 'llama-3.3-70b-versatile',

  // ── ElevenLabs ──────────────────────────────────────────────────────────
  ELEVENLABS_API_KEY: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ?? '',
  ELEVENLABS_VOICES_URL: 'https://api.elevenlabs.io/v1/voices',
  ELEVENLABS_TTS_URL: 'https://api.elevenlabs.io/v1/text-to-speech',
  /** Model that produces the best natural speech on free tier */
  ELEVENLABS_MODEL: 'eleven_multilingual_v2',

  // ── Session ─────────────────────────────────────────────────────────────
  /** Default max turns before the session auto-ends. Overridable per training. */
  DEFAULT_TURN_LIMIT: 10,

  // ── Voice selection heuristics (for gender-balanced ElevenLabs picker) ─
  FEMALE_NAME_HINTS: [
    'rachel', 'bella', 'elli', 'domi', 'grace', 'sarah', 'aria',
    'charlotte', 'emily', 'jessica', 'lily', 'sophia', 'female',
  ],
  MALE_NAME_HINTS: [
    'adam', 'sam', 'daniel', 'josh', 'ryan', 'charlie', 'clyde',
    'michael', 'ethan', 'james', 'male',
  ],
} as const;
