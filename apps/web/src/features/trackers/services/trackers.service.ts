import { resolveApiBase } from '@shared/config/module-api';
import { ENV } from '@shared/config/env';
import { getBridgeHeaders } from '@shared/lib/backend-headers';
import type { Filters, Tracker, TrackerDetail } from '../types/tracker.types';

function apiBase(): string {
  const root = ENV.M02_API_BASE_URL;
  return root ? `${root}/api/v1/conversation-intelligence/trackers` : '/api/v1/conversation-intelligence/trackers';
}

function unwrap<T>(json: Record<string, unknown>): T {
  if (json.data !== undefined) return json.data as T;
  return json as T;
}

export async function fetchTrackers(filters: Filters): Promise<Tracker[]> {
  const qs = new URLSearchParams();
  if (filters.search) qs.set('search', filters.search);
  if (filters.teamId) qs.set('teamId', filters.teamId);
  if (filters.dateRange) qs.set('dateRange', filters.dateRange);
  if (filters.interactionType) qs.set('interactionType', filters.interactionType);

  const url = `${apiBase()}?${qs.toString()}`;
  const res = await fetch(url, { cache: 'no-store', headers: getBridgeHeaders() });
  if (!res.ok) throw new Error(`Failed to load trackers: ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
  const unwrapped = unwrap<any>(json);
  
  // Handle backend paginated structure { data: [...], totalCount: number, page: number }
  if (unwrapped && Array.isArray(unwrapped.data)) {
    return unwrapped.data as Tracker[];
  }
  
  return Array.isArray(unwrapped) ? unwrapped : [];
}

export async function fetchTrackerDetail(trackerId: string): Promise<TrackerDetail> {
  const res = await fetch(`${apiBase()}/${encodeURIComponent(trackerId)}/detail`, {
    cache: 'no-store',
    headers: getBridgeHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load tracker detail: ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
  const unwrapped = unwrap<any>(json);
  
  if (unwrapped && unwrapped.data && unwrapped.percentage === undefined) {
    return unwrapped.data as TrackerDetail;
  }
  
  return unwrapped as TrackerDetail;
}

export async function postTrackerQuestion(trackerId: string, question: string): Promise<string> {
  const res = await fetch(`${apiBase()}/${encodeURIComponent(trackerId)}/ask`, {
    method: 'POST',
    headers: getBridgeHeaders(),
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`Failed to ask tracker question: ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
  const data = unwrap<{ answer: string }>(json);
  return data.answer;
}
