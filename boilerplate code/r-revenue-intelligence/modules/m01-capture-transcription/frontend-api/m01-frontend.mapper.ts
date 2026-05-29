/** Maps internal CallRecord shapes → new frontend API contract. */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function mapTranscriptStatus(status: string): string {
  if (status === 'completed') return 'completed';
  if (status === 'processing' || status === 'pending') return 'processing';
  if (status === 'failed') return 'failed';
  if (status === 'skipped') return 'skipped';
  return status;
}

function resolveAccount(record: any): string {
  if (record.accountName) return String(record.accountName);
  if (record.accountId) return String(record.accountId);
  return '—';
}

/** Locked contract: owner is always `{ id, name, avatarInitials }`. */
export function resolveOwner(record: any) {
  const name = record.callOwner || record.ownerName || 'Unknown';
  const id = record.ownerId || record.callOwner || 'owner-unknown';
  return {
    id,
    name,
    avatarInitials: initials(name),
  };
}

export function mapCallListItem(record: any) {
  const summary =
    record.transcript?.summary ||
    record.keyInsight ||
    null;

  return {
    callId: record.id,
    callTitle: record.title,
    dealType: record.dealType || record.callType || 'meeting',
    account: resolveAccount(record),
    owner: resolveOwner(record),
    dateTime: record.callDate instanceof Date
      ? record.callDate.toISOString()
      : new Date(record.callDate).toISOString(),
    duration: formatDuration(record.durationSeconds ?? 0),
    keyInsight: summary || '—',
    status: mapTranscriptStatus(record.transcriptStatus ?? 'pending'),
  };
}

export function mapCallDetail(record: any) {
  const d = record.callDate instanceof Date
    ? record.callDate
    : new Date(record.callDate);

  const participants = Array.isArray(record.participants)
    ? record.participants.map((p: string) => ({ name: p }))
    : [];

  const dateTime = d.toISOString();

  return {
    callId: record.id,
    callTitle: record.title,
    account: resolveAccount(record),
    type: record.callType === 'inbound' ? 'inbound' : 'outbound',
    dealType: record.dealType || record.callType || 'meeting',
    dateTime,
    date: dateTime.slice(0, 10),
    time: dateTime.slice(11, 19) + 'Z',
    duration: formatDuration(record.durationSeconds ?? 0),
    source: record.callSource || 'manual',
    participants,
    owner: resolveOwner(record),
    status: mapTranscriptStatus(record.transcriptStatus ?? 'pending'),
  };
}

/** Lightweight header for Briefs/Transcript tabs (no status). */
export function mapCallMetadata(record: any) {
  const detail = mapCallDetail(record);
  const { status: _s, ...meta } = detail;
  return meta;
}

export function mapCallSearchHit(hit: any) {
  const record = {
    id: hit.callId,
    title: hit.callTitle || hit.title,
    callOwner: hit.callOwner || hit.ownerName,
    ownerId: hit.ownerId,
    accountId: hit.account,
    callDate: hit.dateTime || hit.callDate,
    durationSeconds: hit.durationSeconds,
    transcriptStatus: hit.status || hit.transcriptStatus,
    transcript: hit.excerpt ? { summary: hit.excerpt } : undefined,
  };

  return {
    ...mapCallListItem(record),
    keyInsight: hit.excerpt || hit.keyInsight || record.transcript?.summary || '—',
  };
}
