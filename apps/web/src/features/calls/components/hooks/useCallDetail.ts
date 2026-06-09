// ============================================================
// useCallDetail — hook for the Call Detail page
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type {
  CallMetadata,
  BriefDetail,
  BriefsListResponse,
  CallDetailTab,
} from '../types/calls.types';
import { fetchCallMetadata, fetchBriefsList, fetchBriefDetail } from '../services/calls-list.service';

interface UseCallDetailReturn {
  metadata: CallMetadata | null;
  briefs: BriefsListResponse | null;
  activeBrief: BriefDetail | null;
  activeTab: CallDetailTab;
  setActiveTab: (tab: CallDetailTab) => void;
  isLoading: boolean;
  error: string | null;
  loadBrief: (briefId: string) => void;
  reload: () => void;
}

export function useCallDetail(callId: string | null): UseCallDetailReturn {
  const [metadata, setMetadata] = useState<CallMetadata | null>(null);
  const [briefs, setBriefs] = useState<BriefsListResponse | null>(null);
  const [activeBrief, setActiveBrief] = useState<BriefDetail | null>(null);
  const [activeTab, setActiveTab] = useState<CallDetailTab>('briefs');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!callId) return;
    setIsLoading(true);
    setError(null);
    setMetadata(null);
    setBriefs(null);
    setActiveBrief(null);
    try {
      const [meta, briefsData] = await Promise.all([
        fetchCallMetadata(callId),
        fetchBriefsList(callId),
      ]);
      setMetadata(meta);
      setBriefs(briefsData);

      if (briefsData.briefs.length > 0) {
        const analyzedId = `analyzed-${callId}`;
        const autoId = `auto-${callId}`;
        const preferred =
          briefsData.briefs.find((b) => b.briefId === analyzedId) ??
          briefsData.briefs.find((b) => b.briefId === autoId) ??
          briefsData.briefs[0];
        const detail = await fetchBriefDetail(callId, preferred.briefId);
        setActiveBrief(detail);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load call details.';
      setError(msg.includes('404') ? 'Call not found on API — use seeded demo calls or check the API is running.' : `Failed to load call details: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [callId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadBrief = useCallback(
    async (briefId: string) => {
      if (!callId) return;
      try {
        const detail = await fetchBriefDetail(callId, briefId);
        setActiveBrief(detail);
      } catch {
        setError('Failed to load brief.');
      }
    },
    [callId],
  );

  return {
    metadata,
    briefs,
    activeBrief,
    activeTab,
    setActiveTab,
    isLoading,
    error,
    loadBrief,
    reload: load,
  };
}
