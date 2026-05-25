'use client';
import React, { useState } from 'react';
import {
  addNextStep,
  updateNextStep,
  deleteNextStep,
} from '../api/calls.api';
import styles from './NextSteps.module.css';

interface Props {
  callId:    string;
  steps:     string[];
  onRefresh: () => void;
}

export default function NextSteps({ callId, steps, onRefresh }: Props) {
  const [localSteps, setLocalSteps]   = useState<string[]>(steps);
  const [newStep,    setNewStep]      = useState('');
  const [editIdx,    setEditIdx]      = useState<number | null>(null);
  const [editText,   setEditText]     = useState('');
  const [saving,     setSaving]       = useState(false);
  const [error,      setError]        = useState('');

  // ── Add ────────────────────────────────────────────────────
  const handleAdd = async () => {
    const text = newStep.trim();
    if (!text || saving) return;
    setSaving(true);
    setError('');
    try {
      const updated = await addNextStep(callId, text);
      setLocalSteps(updated);
      setNewStep('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  // ── Update ────────────────────────────────────────────────
  const handleSave = async (index: number) => {
    const text = editText.trim();
    if (!text || saving) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateNextStep(callId, index, text);
      setLocalSteps(updated);
      setEditIdx(null);
      setEditText('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (index: number) => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const updated = await deleteNextStep(callId, index);
      setLocalSteps(updated);
      if (editIdx === index) { setEditIdx(null); setEditText(''); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (index: number) => {
    setEditIdx(index);
    setEditText(localSteps[index]);
    setError('');
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setEditText('');
    setError('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>✅ Next Steps</span>
        <span className={styles.count}>{localSteps.length} item{localSteps.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Step list ─────────────────────────────────────── */}
      {localSteps.length === 0 && (
        <div className={styles.empty}>No next steps yet — add one below</div>
      )}

      <ul className={styles.list}>
        {localSteps.map((step, i) => (
          <li key={i} className={styles.item}>
            {editIdx === i ? (
              <div className={styles.editRow}>
                <input
                  className={styles.editInput}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave(i);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  autoFocus
                  disabled={saving}
                />
                <button className={styles.saveBtn} onClick={() => handleSave(i)} disabled={saving}>
                  {saving ? '…' : '✓'}
                </button>
                <button className={styles.cancelBtn} onClick={cancelEdit} disabled={saving}>
                  ✕
                </button>
              </div>
            ) : (
              <div className={styles.stepRow}>
                <span className={styles.arrow}>→</span>
                <span className={styles.stepText}>{step}</span>
                <div className={styles.actions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => startEdit(i)}
                    title="Edit this step"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleDelete(i)}
                    title="Delete this step"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* ── Add new step ─────────────────────────────────── */}
      <div className={styles.addRow}>
        <input
          id="add-next-step-input"
          className={styles.addInput}
          placeholder="Add a follow-up action item…"
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          disabled={saving}
        />
        <button
          id="add-next-step-btn"
          className={styles.addBtn}
          onClick={handleAdd}
          disabled={saving || !newStep.trim()}
        >
          {saving ? '…' : '+ Add'}
        </button>
      </div>

      {error && <div className={styles.error}>⚠ {error}</div>}
    </div>
  );
}
