import type { NextRequest } from 'next/server';

export function resolveGroqKey(
  req: NextRequest,
  body?: { groqApiKey?: string },
): string | null {
  const fromHeader = req.headers.get('x-groq-api-key')?.trim();
  const fromBody = body?.groqApiKey?.trim();
  return fromHeader || fromBody || process.env.GROQ_API_KEY?.trim() || null;
}

export function resolveOpenRouterKey(
  body?: { openRouterApiKey?: string },
): string | null {
  const fromBody = body?.openRouterApiKey?.trim();
  return fromBody || process.env.OPENROUTER_API_KEY?.trim() || null;
}
