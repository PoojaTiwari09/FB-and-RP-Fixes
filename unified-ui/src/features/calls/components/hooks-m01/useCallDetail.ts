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
import { fetchCallMetadata, fetchBriefsList, fetchBriefDetail } from '../services/calls.service';

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
    try {
      const [meta, briefsData] = await Promise.all([
        fetchCallMetadata(callId),
        fetchBriefsList(callId),
      ]);
      setMetadata(meta);
      setBriefs(briefsData);

      // Auto-load first brief
      if (briefsData.briefs.length > 0) {
        const detail = await fetchBriefDetail(callId, briefsData.briefs[0].briefId);
        setActiveBrief(detail);
      }
    } catch {
      setError('Failed to load call details.');
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
