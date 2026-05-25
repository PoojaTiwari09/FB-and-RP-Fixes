'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  listFields,
  getCallExtractionResults,
  testExtraction,
  runExtraction,
  AiExtractionField,
  AiExtractionResult,
} from '../api/ai-extractor.api';
import styles from './AiInsightsPanel.module.css';

interface Props {
  callId: string;
  transcriptStatus: string;
  onSeek?: (ms: number) => void;
}

interface FieldRow {
  field: AiExtractionField;
  result: AiExtractionResult | null;
}

export default function AiInsightsPanel({ callId, transcriptStatus, onSeek }: Props) {
  const [rows,       setRows]       = useState<FieldRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [running,    setRunning]    = useState<Set<string>>(new Set()); // fieldIds currently running
  const [runningAll, setRunningAll] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // ── Load all active fields + existing results for this call ──────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fields, results] = await Promise.all([
        listFields(),
        getCallExtractionResults(callId),
      ]);

      const activeFields = fields.filter(f => f.isActive);
      const resultMap = new Map<string, AiExtractionResult>(
        results.map(r => [r.fieldId, r])
      );

      setRows(activeFields.map(field => ({
        field,
        result: resultMap.get(field.id) ?? null,
      })));
    } catch (e: any) {
      setError(e.message || 'Failed to load AI fields');
    } finally {
      setLoading(false);
    }
  }, [callId]);

  useEffect(() => { load(); }, [load]);

  // ── Toggle selection ─────────────────────────────────────────────────────
  const toggleSelect = (fieldId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(fieldId) ? next.delete(fieldId) : next.add(fieldId);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(rows.map(r => r.field.id)));
  const clearAll  = () => setSelected(new Set());

  // ── Run a single field for this call ────────────────────────────────────
  const runField = async (fieldId: string) => {
    setRunning(prev => new Set(prev).add(fieldId));
    setError(null);
    try {
      const result = await testExtraction(fieldId, callId);
      setRows(prev => prev.map(row =>
        row.field.id === fieldId
          ? { ...row, result: { ...result, fieldId, callId, isManualOverride: false, extractedAt: new Date().toISOString() } as any }
          : row
      ));
    } catch (e: any) {
      setError(`Failed to extract "${fieldId}": ${e.message}`);
    } finally {
      setRunning(prev => { const s = new Set(prev); s.delete(fieldId); return s; });
    }
  };

  // ── Run all selected fields ──────────────────────────────────────────────
  const runSelected = async () => {
    if (selected.size === 0) return;
    setError(null);
    for (const fieldId of Array.from(selected)) {
      await runField(fieldId);
    }
    setSelected(new Set());
  };

  // ── Run ALL active fields (existing button behavior) ─────────────────────
  const runAll = async () => {
    setRunningAll(true);
    setError(null);
    try {
      const data = await runExtraction(callId);
      const resultMap = new Map<string, AiExtractionResult>(data.map(r => [r.fieldId, r]));
      setRows(prev => prev.map(row => ({
        ...row,
        result: resultMap.get(row.field.id) ?? row.result,
      })));
    } catch (e: any) {
      setError(e.message || 'Extraction failed');
    } finally {
      setRunningAll(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const confColor = (score: number | null) => {
    if (score == null) return '#475569';
    if (score >= 0.8) return '#10b981';
    if (score >= 0.5) return '#f59e0b';
    return '#ef4444';
  };

  const confLabel = (score: number | null) => {
    if (score == null) return null;
    return `${Math.round(score * 100)}%`;
  };

  const formatValue = (row: FieldRow) => {
    if (!row.result || row.result.extractedValue == null) return null;
    if (row.field.dataType === 'boolean') {
      return row.result.extractedValue === 'true' ? '✅ Yes' : '❌ No';
    }
    return row.result.extractedValue;
  };

  const isTranscriptReady = transcriptStatus === 'completed';
  const anyRunning = running.size > 0 || runningAll;

  return (
    <div className={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>🧠</span>
          <h3 className={styles.headerTitle}>AI-Extracted Insights</h3>
          {rows.length > 0 && (
            <span className={styles.badge}>{rows.length} fields</span>
          )}
        </div>
        <div className={styles.headerActions}>
          {isTranscriptReady && selected.size > 0 && (
            <button
              className={styles.runSelectedBtn}
              onClick={runSelected}
              disabled={anyRunning}
            >
              {anyRunning ? '⏳' : '▶'} Run Selected ({selected.size})
            </button>
          )}
          {isTranscriptReady && rows.length > 0 && (
            <button
              className={styles.extractBtn}
              onClick={runAll}
              disabled={anyRunning}
            >
              {runningAll ? '⏳ Running All…' : '🔄 Run All'}
            </button>
          )}
          <Link href="/extraction-library" className={styles.libraryLink}>
            ⚙️ Manage Fields
          </Link>
        </div>
      </div>

      {error && <div className={styles.error}>⚠️ {error}</div>}

      {loading ? (
        <div className={styles.loadingState}>Loading AI fields…</div>
      ) : rows.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🧠</div>
          <div className={styles.emptyText}>
            No active extraction fields yet.{' '}
            <Link href="/extraction-library" className={styles.inlineLink}>
              Go to Extraction Library
            </Link>{' '}
            to create fields — they will automatically appear here for every call.
          </div>
        </div>
      ) : (
        <>
          {/* ── Select-all bar ──────────────────────────────────────────── */}
          {isTranscriptReady && (
            <div className={styles.selectBar}>
              <button className={styles.selectAllBtn} onClick={selectAll}>Select All</button>
              <button className={styles.selectAllBtn} onClick={clearAll}>Clear</button>
              <span className={styles.selectHint}>
                Check fields below and click &quot;Run Selected&quot; to extract
              </span>
            </div>
          )}

          {/* ── Field rows ─────────────────────────────────────────────── */}
          <div className={styles.resultsList}>
            {rows.map(row => {
              const isRunning   = running.has(row.field.id);
              const isSelected  = selected.has(row.field.id);
              const extracted   = formatValue(row);
              const hasResult   = row.result != null && row.result.extractedValue != null;
              const conf        = row.result?.confidenceScore ?? null;

              return (
                <div
                  key={row.field.id}
                  className={`${styles.resultCard} ${isSelected ? styles.cardSelected : ''}`}
                >
                  {/* Checkbox + label */}
                  <div className={styles.resultHeader}>
                    {isTranscriptReady && (
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={isSelected}
                        onChange={() => toggleSelect(row.field.id)}
                        disabled={anyRunning}
                      />
                    )}
                    <span className={styles.resultLabel}>
                      {row.field.fieldLabel}
                    </span>
                    <div className={styles.rightMeta}>
                      {hasResult && conf != null && (
                        <span
                          className={styles.confidenceBadge}
                          style={{ background: `${confColor(conf)}20`, color: confColor(conf) }}
                        >
                          {confLabel(conf)}
                        </span>
                      )}
                      {row.result?.isManualOverride && (
                        <span className={styles.overrideBadge}>✏️ Override</span>
                      )}
                      {isTranscriptReady && (
                        <button
                          className={styles.runOneBtn}
                          onClick={() => runField(row.field.id)}
                          disabled={anyRunning}
                          title="Run extraction for this field"
                        >
                          {isRunning ? '⏳' : '▶'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Extracted value */}
                  <div className={`${styles.resultValue} ${!hasResult ? styles.empty : ''}`}>
                    {isRunning
                      ? <span className={styles.runningText}>⏳ Extracting…</span>
                      : extracted != null
                        ? extracted
                        : <span className={styles.notExtracted}>Not yet extracted — check & run to populate</span>
                    }
                  </div>

                  {/* Evidence quote + timestamp seek */}
                  {row.result?.rawEvidence && (
                    <div
                      className={styles.evidence}
                      onClick={() => row.result?.evidenceTimestampMs != null && onSeek && onSeek(row.result.evidenceTimestampMs)}
                      role={row.result.evidenceTimestampMs != null ? 'button' : undefined}
                      tabIndex={row.result.evidenceTimestampMs != null ? 0 : undefined}
                    >
                      <span className={styles.evidenceQuote}>"{row.result.rawEvidence}"</span>
                      {row.result.evidenceTimestampMs != null && (
                        <span className={styles.evidenceTime}>
                          🔊 {Math.floor(row.result.evidenceTimestampMs / 60000)}:
                          {String(Math.floor((row.result.evidenceTimestampMs % 60000) / 1000)).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer meta */}
                  <div className={styles.resultMeta}>
                    <span className={styles.dataType}>{row.field.dataType}</span>
                    {row.field.crmObject && row.field.crmField && (
                      <span className={styles.crmTag}>
                        → {row.field.crmObject}.{row.field.crmField}
                      </span>
                    )}
                    {row.result?.extractedAt && (
                      <span className={styles.timestamp}>
                        {new Date(row.result.extractedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
