'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Utterance, updateUtterance } from '../api/calls.api';
import TranscriptSearch from './TranscriptSearch';
import styles from './TranscriptViewer.module.css';

interface Props {
  utterances:       Utterance[];
  currentMs:        number;
  onUtteranceClick: (startMs: number) => void;
  onUtteranceEdit?: (id: string, newText: string) => void; // optional refresh callback
}

const SPEAKER_COLORS: Record<string, string> = {
  // Legacy raw labels (before US-03 normalization)
  A: '#6ee7f7', B: '#f9a8d4', C: '#86efac', D: '#fcd34d',
  E: '#c4b5fd', F: '#fb923c',
  // US-03 normalized labels
  'Speaker 1': '#6ee7f7',
  'Speaker 2': '#f9a8d4',
  'Speaker 3': '#86efac',
  'Speaker 4': '#fcd34d',
  'Speaker 5': '#c4b5fd',
  'Speaker 6': '#fb923c',
};

// PII redaction tokens (BF-01 visual indicators)
const PII_TOKENS = [
  '[CREDIT CARD REDACTED]',
  '[EMAIL REDACTED]',
  '[PHONE REDACTED]',
  '[SSN REDACTED]',
];

function speakerColor(speaker: string) {
  return SPEAKER_COLORS[speaker] ?? SPEAKER_COLORS[speaker.toUpperCase()] ?? '#94a3b8';
}

function formatMs(ms: number) {
  const s   = Math.floor(ms / 1000);
  const m   = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function TranscriptViewer({
  utterances,
  currentMs,
  onUtteranceClick,
  onUtteranceEdit,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  // Track which utterance is being edited and its draft text
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [draftText,   setDraftText]   = useState('');
  const [savingId,    setSavingId]    = useState<string | null>(null);
  const [saveError,   setSaveError]   = useState<string | null>(null);

  // Local overrides so edits appear instantly without a refetch
  const [localEdits, setLocalEdits] = useState<Record<string, string>>({});

  const activeRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to active utterance
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentMs]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (editingId) textareaRef.current?.focus();
  }, [editingId]);

  const startEdit = (u: Utterance, e: React.MouseEvent) => {
    e.stopPropagation(); // don't trigger seek
    setEditingId(u.id);
    setDraftText(localEdits[u.id] ?? u.text);
    setSaveError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftText('');
    setSaveError(null);
  };

  const saveEdit = useCallback(async (utteranceId: string) => {
    if (!draftText.trim()) return;
    setSavingId(utteranceId);
    setSaveError(null);
    try {
      await updateUtterance(utteranceId, draftText.trim());
      setLocalEdits((prev) => ({ ...prev, [utteranceId]: draftText.trim() }));
      onUtteranceEdit?.(utteranceId, draftText.trim());
      setEditingId(null);
    } catch (err: any) {
      setSaveError(err.message ?? 'Save failed');
    } finally {
      setSavingId(null);
    }
  }, [draftText, onUtteranceEdit]);

  // Highlight search matches AND PII redaction tokens
  const highlight = (text: string, query: string) => {
    // Build a combined regex: search query matches + PII tokens
    const piiPattern = PII_TOKENS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const patterns: string[] = [piiPattern];
    if (query.trim()) patterns.push(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    const combinedRegex = new RegExp(`(${patterns.join('|')})`, 'gi');
    const parts = text.split(combinedRegex);

    return (
      <>
        {parts.map((p, i) => {
          // Check if this part is a PII token
          if (PII_TOKENS.some(t => t.toLowerCase() === p.toLowerCase())) {
            return (
              <span key={i} className={styles.piiToken} title="Sensitive data automatically redacted">
                🔒 {p}
              </span>
            );
          }
          // Check if this part matches search query
          if (query.trim() && p.toLowerCase() === query.toLowerCase()) {
            return <mark key={i} className={styles.searchMatch}>{p}</mark>;
          }
          return p;
        })}
      </>
    );
  };

  const isActive = (u: Utterance) => currentMs >= u.startMs && currentMs <= u.endMs;

  const filtered = searchQuery
    ? utterances.filter((u) => {
        const text = localEdits[u.id] ?? u.text;
        return text.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : utterances;

  return (
    <div className={styles.container}>
      <TranscriptSearch value={searchQuery} onChange={setSearchQuery} />

      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>No matches found for &quot;{searchQuery}&quot;</div>
        )}

        {filtered.map((u) => {
          const displayText = localEdits[u.id] ?? u.text;
          const active      = isActive(u);
          const editing     = editingId === u.id;
          const saving      = savingId  === u.id;

          return (
            <div
              key={u.id}
              ref={active ? activeRef : null}
              className={[
                styles.utterance,
                active           ? styles.active       : '',
                u.isLowConfidence ? styles.lowConfidence : '',
                editing          ? styles.editing       : '',
              ].join(' ')}
              role={editing ? undefined : 'button'}
              tabIndex={editing ? undefined : 0}
              onClick={editing ? undefined : () => onUtteranceClick(u.startMs)}
              onKeyDown={editing ? undefined : (e) => e.key === 'Enter' && onUtteranceClick(u.startMs)}
              aria-label={editing ? undefined : `${u.speaker} at ${formatMs(u.startMs)}: ${displayText}`}
            >
              {/* ── Header row ─────────────────────────────────────── */}
              <div className={styles.meta}>
                {/* Speaker badge */}
                <span
                  className={styles.speaker}
                  style={{ background: speakerColor(u.speaker), color: '#0f172a' }}
                >
                  {u.speaker}
                </span>

                {/* Timestamp — click to seek */}
                <button
                  className={styles.timestampBtn}
                  onClick={(e) => { e.stopPropagation(); onUtteranceClick(u.startMs); }}
                  title={`Seek to ${formatMs(u.startMs)}`}
                  aria-label={`Seek audio to ${formatMs(u.startMs)}`}
                >
                  ▶ {formatMs(u.startMs)}
                </button>

                {/* Low confidence badge */}
                {u.isLowConfidence && (
                  <span className={styles.lowConfBadge} title={`Confidence: ${Math.round(u.confidence * 100)}%`}>
                    ⚠ Low
                  </span>
                )}

                {/* Edit / Save / Cancel controls */}
                <div className={styles.editControls} onClick={(e) => e.stopPropagation()}>
                  {!editing ? (
                    <button
                      className={styles.editBtn}
                      onClick={(e) => startEdit(u, e)}
                      title="Edit this line"
                      aria-label="Edit utterance"
                    >
                      ✏️
                    </button>
                  ) : (
                    <>
                      <button
                        className={styles.saveBtn}
                        onClick={() => saveEdit(u.id)}
                        disabled={saving}
                        aria-label="Save edit"
                      >
                        {saving ? '…' : '✓ Save'}
                      </button>
                      <button
                        className={styles.cancelBtn}
                        onClick={cancelEdit}
                        disabled={saving}
                        aria-label="Cancel edit"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ── Text body ──────────────────────────────────────── */}
              {editing ? (
                <div className={styles.editArea} onClick={(e) => e.stopPropagation()}>
                  <textarea
                    ref={textareaRef}
                    className={styles.textarea}
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit(u.id);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    rows={Math.max(2, Math.ceil(draftText.length / 80))}
                    aria-label="Edit transcript text"
                  />
                  {saveError && <p className={styles.saveError}>⚠ {saveError}</p>}
                  <p className={styles.editHint}>Ctrl+Enter to save · Esc to cancel</p>
                </div>
              ) : (
                <p className={styles.text}>
                  {highlight(displayText, searchQuery)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
