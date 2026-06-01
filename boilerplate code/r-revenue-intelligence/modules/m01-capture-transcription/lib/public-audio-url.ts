import { S3_RECORDINGS_CATALOG } from './s3-recordings-catalog';

/** Hosts/paths AssemblyAI and other cloud transcribers often cannot fetch. */
const UNRELIABLE_URL = /github\.com|raw\.githubusercontent|localhost|127\.0\.0\.1|\/uploads\/audio\//i;

export function pickS3RecordingBySeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % S3_RECORDINGS_CATALOG.length;
  }
  return S3_RECORDINGS_CATALOG[hash]?.sourceUrl ?? S3_RECORDINGS_CATALOG[0].sourceUrl;
}

/** HTTPS URL safe for AssemblyAI download (S3 demo catalog as fallback). */
export function resolvePublicTranscriptionUrl(
  raw: string | null | undefined,
  seed: string,
): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed || UNRELIABLE_URL.test(trimmed)) {
    return pickS3RecordingBySeed(seed);
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return pickS3RecordingBySeed(seed);
    }
  } catch {
    return pickS3RecordingBySeed(seed);
  }
  return trimmed;
}
