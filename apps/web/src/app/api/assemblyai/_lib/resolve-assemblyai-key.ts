import type { NextRequest } from 'next/server';
import { ASSEMBLYAI_KEY_HEADER } from '@calls/lib/assemblyai-key.storage';

export { ASSEMBLYAI_KEY_HEADER };

/** User-provided key (header/body) takes precedence over server .env.local. */
export function resolveAssemblyAIKey(
  req: NextRequest,
  body?: { api_key?: string },
): string | null {
  const fromHeader = req.headers.get(ASSEMBLYAI_KEY_HEADER)?.trim();
  if (fromHeader) return fromHeader;

  const fromBody = body?.api_key?.trim();
  if (fromBody) return fromBody;

  const fromEnv = process.env.ASSEMBLYAI_API_KEY?.trim();
  return fromEnv || null;
}
