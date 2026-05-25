'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useToast } from '@/modules/m05-account-intelligence/components/ui/ToastContainer';

interface InlineEditProps {
  value: string;
  fieldKey: string;
  options?: { label: string; value: string }[];
  onSave: (newValue: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  displayFormatter?: (value: string) => string;
  placeholder?: string;
}

export default function InlineEdit({
  value,
  fieldKey,
  options,
  onSave,
  disabled = false,
  className = '',
  displayFormatter,
  placeholder = '—',
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const toast = useToast();

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const startEdit = () => {
    if (disabled) return;
    setDraft(value);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const commit = async () => {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save edit.');
      setDraft(value);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  };

  const displayValue = displayFormatter ? displayFormatter(value) : value;

  if (!editing) {
    return (
      <span
        className={`inline-edit ${disabled ? '' : 'editable'} ${className}`}
        onClick={startEdit}
        title={disabled ? undefined : `Click to edit ${fieldKey}`}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
      >
        <span>{displayValue || placeholder}</span>
        {!disabled && <span className="edit-icon">✏</span>}
      </span>
    );
  }

  return (
    <span className={`inline-edit ${className}`} style={{ padding: 0 }}>
      {options ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          disabled={saving}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          disabled={saving}
          style={{ width: Math.max(120, draft.length * 8) }}
        />
      )}
      {saving && (
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 4 }}>
          saving…
        </span>
      )}
    </span>
  );
}
