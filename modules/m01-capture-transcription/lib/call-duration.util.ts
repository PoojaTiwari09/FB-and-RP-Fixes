/** Duration helpers — always prefer recording/transcript truth over stale DB zeros. */

export function durationSecondsFromUtterances(
  utterances: Array<{ endMs?: number; startMs?: number }> | null | undefined,
): number {
  if (!utterances?.length) return 0;
  const maxEndMs = Math.max(
    ...utterances.map((u) => u.endMs ?? u.startMs ?? 0),
  );
  return maxEndMs > 0 ? Math.ceil(maxEndMs / 1000) : 0;
}

export function resolveDurationSeconds(record: {
  durationSeconds?: number | null;
  transcript?: { utterances?: Array<{ endMs?: number; startMs?: number }> } | null;
}): number {
  const stored = record.durationSeconds ?? 0;
  if (stored > 0) return stored;
  return durationSecondsFromUtterances(record.transcript?.utterances);
}

export function uniqueSpeakersFromUtterances(
  utterances: Array<{ speaker?: string }> | null | undefined,
): string[] {
  if (!utterances?.length) return [];
  const seen = new Set<string>();
  const names: string[] = [];
  for (const u of utterances) {
    const name = (u.speaker || '').trim();
    if (!name || /^speaker\s*\d+$/i.test(name) || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}
