'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, KeyRound, Check, X } from 'lucide-react';
import {
  ASSEMBLYAI_KEY_CHANGED_EVENT,
  clearStoredAssemblyAIKey,
  getStoredAssemblyAIKey,
  setStoredAssemblyAIKey,
} from '@calls/lib/assemblyai-key.storage';

type KeySource = 'browser' | 'server' | 'none';

export default function AssemblyAIKeySettings({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);
  const [source, setSource] = useState<KeySource>('none');

  const refreshStatus = useCallback(() => {
    const stored = getStoredAssemblyAIKey();
    if (stored) {
      setSource('browser');
      return;
    }
    fetch('/api/assemblyai/status', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: { hasServerKey?: boolean }) => {
        setSource(data.hasServerKey ? 'server' : 'none');
      })
      .catch(() => setSource('none'));
  }, []);

  useEffect(() => {
    refreshStatus();
    const onChange = () => refreshStatus();
    window.addEventListener(ASSEMBLYAI_KEY_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(ASSEMBLYAI_KEY_CHANGED_EVENT, onChange);
  }, [refreshStatus]);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setStoredAssemblyAIKey(trimmed);
    setDraft('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refreshStatus();
  };

  const handleClear = () => {
    clearStoredAssemblyAIKey();
    setDraft('');
    refreshStatus();
  };

  const statusLabel =
    source === 'browser'
      ? 'Using your API key'
      : source === 'server'
        ? 'Using server .env key'
        : 'No API key set';

  const statusColor =
    source === 'none' ? 'bg-amber-400' : 'bg-green-500';

  return (
    <div className={compact ? 'relative' : 'px-6 py-3 bg-white border-b border-gray-100'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          compact
            ? 'inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700'
            : 'w-full flex items-center justify-between gap-2 text-left'
        }
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
          <KeyRound size={16} className="text-gray-500" />
          AssemblyAI API Key
          <span className={`inline-block w-2 h-2 rounded-full ${statusColor}`} title={statusLabel} />
          {!open && (
            <span className="text-xs font-normal text-gray-500">{statusLabel}</span>
          )}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div
          className={
            compact
              ? 'absolute right-0 top-full mt-2 z-20 w-[min(420px,calc(100vw-2rem))] p-4 bg-white border border-gray-200 rounded-lg shadow-lg'
              : 'mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50'
          }
        >
          <p className="text-xs text-gray-500 mb-3">
            Stored in your browser only. Sent to local Next.js routes when transcribing calls.
            Overrides <code className="text-gray-600">.env.local</code> when set.
          </p>
          <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="assemblyai-api-key">
            API key
          </label>
          <input
            id="assemblyai-api-key"
            type="password"
            autoComplete="off"
            placeholder="Paste AssemblyAI API key"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!draft.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saved ? <Check size={14} /> : null}
              Save key
            </button>
            {source === 'browser' && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-white"
              >
                <X size={14} />
                Remove saved key
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">{statusLabel}</p>
        </div>
      )}
    </div>
  );
}
