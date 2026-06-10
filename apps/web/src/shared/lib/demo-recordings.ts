export const DEMO_RECORDING_URLS = [
  'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3',
  'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
  'https://recordings-buttons.s3.eu-north-1.amazonaws.com/10mins_sales.wav',
  'https://recordings-buttons.s3.eu-north-1.amazonaws.com/resources_sample-calls.mp3',
] as const;

/** Map stable demo call IDs to their S3 recording URL. */
export const DEMO_CALL_RECORDING_BY_ID: Record<string, string> = {
  '11111111-1111-1111-1111-000000000001': DEMO_RECORDING_URLS[0],
  '11111111-1111-1111-1111-000000000002': DEMO_RECORDING_URLS[1],
  '11111111-1111-1111-1111-000000000003': DEMO_RECORDING_URLS[2],
  '11111111-1111-1111-1111-000000000004': DEMO_RECORDING_URLS[3],
};

export function pickDemoRecordingUrl(seed: string): string {
  const mapped = DEMO_CALL_RECORDING_BY_ID[seed];
  if (mapped) return mapped;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % DEMO_RECORDING_URLS.length;
  }
  return DEMO_RECORDING_URLS[hash];
}

export function toProxiedAudioUrl(remoteUrl: string): string {
  return `/api/v1/conversation-intelligence/calls/audio?src=${encodeURIComponent(remoteUrl)}`;
}

export function isLocalUploadUrl(url: string): boolean {
  return /\/uploads\/audio\//i.test(url);
}

/** GitHub raw links and local URLs fail AssemblyAI cloud download — use S3 demos instead. */
const UNRELIABLE_FOR_ASSEMBLYAI =
  /github\.com|raw\.githubusercontent|localhost|127\.0\.0\.1|\/uploads\/audio\//i;

export function toAssemblyAISafeUrl(raw: string, seed: string): string {
  const trimmed = raw.trim();
  if (!trimmed || UNRELIABLE_FOR_ASSEMBLYAI.test(trimmed)) {
    return pickDemoRecordingUrl(seed);
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return pickDemoRecordingUrl(seed);
    }
  } catch {
    return pickDemoRecordingUrl(seed);
  }
  return trimmed;
}
