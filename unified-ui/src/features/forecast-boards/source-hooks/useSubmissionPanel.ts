'use client';

import { useState, useCallback, useEffect } from 'react';
import { submitForecast } from '../source-services/repBoard.service';
import { getErrorMessage, parseCurrencyInput } from '../source-utils/format';

interface UseSubmissionPanelOptions {
  boardId: string;
  columnId: string;
  repUserId: string;
  initialValue: number | null;
  initialNote: string | null;
  isManagerView?: boolean;
  dealId?: string;
  onSaveSuccess: (newValue: number, note: string) => void;
  existingStatus?: string | null;
}

export function useSubmissionPanel({
  boardId, columnId, repUserId, initialValue, initialNote, isManagerView = false, dealId, onSaveSuccess, existingStatus,
}: UseSubmissionPanelOptions) {
  const [value, setValue] = useState<string>(initialValue !== null ? String(initialValue) : '');
  const [note, setNote] = useState<string>(initialNote ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setValue(initialValue !== null ? String(initialValue) : '');
      setNote(initialNote ?? '');
    });
  }, [initialValue, initialNote]);

  const onSave = useCallback(async () => {
    const numericValue = parseCurrencyInput(value);
    if (numericValue === null || numericValue < 0) {
      setSaveError('Please enter a valid amount.');
      return;
    }
    if (note.length > 2000) {
      setSaveError('Notes cannot exceed 2000 characters.');
      return;
    }
    if (isManagerView && !note.trim()) {
      setSaveError('Manager changes require a note for the rep.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const isRepLocked = !isManagerView && (existingStatus === 'submitted' || existingStatus === 'approved');
      await submitForecast(boardId, {
        columnId,
        repUserId,
        value: numericValue,
        note: note || undefined,
        dealId,
        status: isManagerView ? 'overridden' : (isRepLocked ? 'change_request' : 'draft'),
      });
      setSaveSuccess(true);
      onSaveSuccess(numericValue, note);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e: unknown) {
      setSaveError(getErrorMessage(e, 'Failed to save forecast.'));
    } finally {
      setIsSaving(false);
    }
  }, [boardId, columnId, repUserId, value, note, isManagerView, dealId, onSaveSuccess, existingStatus]);

  return { value, setValue, note, setNote, onSave, isSaving, saveError, saveSuccess };
}
