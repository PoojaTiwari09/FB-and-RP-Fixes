'use client';

/**
 * SyncStatusBar
 * =============
 * Shows "Last synced: X min ago" in the board header.
 * Polls GET /sync/status every 60 seconds.
 * Shows spinner during active sync.
 * Admins get a "Sync Now" button.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchSyncStatus, triggerSync } from '@/lib/api';

interface SyncStatusBarProps {
  role: string;
  onSyncComplete?: () => void;
}

export default function SyncStatusBar({ role, onSyncComplete }: SyncStatusBarProps) {
  const [status, setStatus] = useState<{
    last_sync: {
      success: boolean;
      companies: number;
      contacts: number;
      deals: number;
      duration_ms: number;
      synced_at: string;
      error?: string;
    } | null;
    next_sync_in_seconds: number | null;
    is_syncing: boolean;
  } | null>(null);

  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const s = await fetchSyncStatus();
      setStatus(s);
    } catch {
      // API unreachable — silently ignore (handled by error boundary)
    }
  }, []);

  // Poll every 60 seconds
  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 60_000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  // Poll faster (every 3 s) while a sync is in progress
  useEffect(() => {
    if (!status?.is_syncing) return;
    const interval = setInterval(loadStatus, 3_000);
    return () => clearInterval(interval);
  }, [status?.is_syncing, loadStatus]);

  const handleSyncNow = async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const result = await triggerSync(role);
      if (result.success) {
        setTriggerResult(
          `✓ Synced — ${result.companies ?? 0} cos, ${result.contacts ?? 0} contacts, ${result.deals ?? 0} deals`,
        );
        onSyncComplete?.();
      } else {
        setTriggerResult(`✗ ${result.error || 'Sync failed'}`);
      }
      await loadStatus();
    } catch (err: any) {
      setTriggerResult(`✗ ${err?.message || 'Network error'}`);
    } finally {
      setTriggering(false);
      // Clear result after 6 seconds
      setTimeout(() => setTriggerResult(null), 6_000);
    }
  };

  // Format relative time
  function formatRelative(isoString: string): string {
    const diff = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  const isSyncing = triggering || status?.is_syncing;

  return (
    <div className="sync-status-bar">
      <div className="sync-status-left">
        {isSyncing ? (
          <>
            <span className="sync-spinner" aria-label="Syncing" />
            <span className="sync-label syncing">Syncing…</span>
          </>
        ) : status?.last_sync ? (
          <>
            <span className={`sync-dot ${status.last_sync.success ? 'ok' : 'error'}`} />
            <span className="sync-label">
              {status.last_sync.success
                ? `Last synced: ${formatRelative(status.last_sync.synced_at)}`
                : `Sync failed: ${status.last_sync.error || 'unknown error'}`}
            </span>
          </>
        ) : (
          <>
            <span className="sync-dot idle" />
            <span className="sync-label">Not yet synced</span>
          </>
        )}

        {triggerResult && (
          <span className={`sync-result ${triggerResult.startsWith('✓') ? 'ok' : 'error'}`}>
            {triggerResult}
          </span>
        )}
      </div>

      {role === 'admin' && (
        <button
          id="sync-now-btn"
          className="sync-now-btn"
          onClick={handleSyncNow}
          disabled={isSyncing}
          aria-label="Trigger manual HubSpot sync"
        >
          {isSyncing ? 'Syncing…' : 'Sync Now'}
        </button>
      )}
    </div>
  );
}
