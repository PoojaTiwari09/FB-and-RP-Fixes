'use client';
import React, { useState } from 'react';
import { CallNote, createNote, updateNote, deleteNote } from '../api/calls.api';
import styles from './CallNotes.module.css';

interface Props {
  callId:    string;
  notes:     CallNote[];
  onRefresh: () => void;
}

export default function CallNotes({ callId, notes, onRefresh }: Props) {
  const [draft,    setDraft]    = useState('');
  const [editId,   setEditId]   = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving,   setSaving]   = useState(false);

  const handleCreate = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await createNote(callId, draft.trim());
      setDraft('');
      onRefresh();
    } finally { setSaving(false); }
  };

  const handleUpdate = async (noteId: string) => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await updateNote(callId, noteId, editText.trim());
      setEditId(null);
      onRefresh();
    } finally { setSaving(false); }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    await deleteNote(callId, noteId);
    onRefresh();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>📝 Notes</div>

      {/* New note input */}
      <div className={styles.inputRow}>
        <textarea
          id={`note-input-${callId}`}
          className={styles.textarea}
          placeholder="Add a note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
        />
        <button
          className={styles.saveBtn}
          onClick={handleCreate}
          disabled={saving || !draft.trim()}
        >
          {saving ? '…' : 'Save'}
        </button>
      </div>

      {/* Existing notes */}
      <div className={styles.list}>
        {notes.length === 0 && (
          <div className={styles.empty}>No notes yet. Be the first!</div>
        )}
        {notes.map((note) => (
          <div key={note.id} className={styles.noteCard}>
            {editId === note.id ? (
              <div className={styles.editRow}>
                <textarea
                  className={styles.textarea}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                  autoFocus
                />
                <div className={styles.editActions}>
                  <button className={styles.saveBtn}  onClick={() => handleUpdate(note.id)} disabled={saving}>Save</button>
                  <button className={styles.cancelBtn} onClick={() => setEditId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <p className={styles.noteText}>{note.content}</p>
                <div className={styles.noteMeta}>
                  <span>{new Date(note.updatedAt).toLocaleString()}</span>
                  <div className={styles.noteActions}>
                    <button className={styles.actionBtn} onClick={() => { setEditId(note.id); setEditText(note.content); }}>Edit</button>
                    <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(note.id)}>Delete</button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
