export interface EngageTaskNoteRecord {
  noteId: string;
  note: string;
  createdAt: string;
  authorName: string;
}

export function parseEngageTaskNotes(raw: string | null | undefined): EngageTaskNoteRecord[] {
  if (!raw?.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((entry) => entry && typeof entry.note === 'string' && entry.note.trim())
        .map((entry, index) => ({
          noteId: entry.noteId || `note_${index}`,
          note: entry.note,
          createdAt: entry.createdAt || new Date().toISOString(),
          authorName: entry.authorName || 'Rep',
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch {
    // Legacy plain-text notes stored before note history was added.
  }

  return [
    {
      noteId: 'legacy',
      note: raw.trim(),
      createdAt: new Date().toISOString(),
      authorName: 'Rep',
    },
  ];
}

export function appendEngageTaskNote(
  raw: string | null | undefined,
  noteText: string,
  authorName = 'Alex Morgan',
): string {
  const trimmed = noteText.trim();
  if (!trimmed) return raw?.trim() || '';

  const existing = parseEngageTaskNotes(raw);
  const entry: EngageTaskNoteRecord = {
    noteId: `note_${Date.now()}`,
    note: trimmed,
    createdAt: new Date().toISOString(),
    authorName,
  };

  return JSON.stringify([entry, ...existing]);
}

export function latestEngageTaskNote(raw: string | null | undefined): string | undefined {
  return parseEngageTaskNotes(raw)[0]?.note;
}
