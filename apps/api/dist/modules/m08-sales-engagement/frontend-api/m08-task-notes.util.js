"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEngageTaskNotes = parseEngageTaskNotes;
exports.appendEngageTaskNote = appendEngageTaskNote;
exports.latestEngageTaskNote = latestEngageTaskNote;
function parseEngageTaskNotes(raw) {
    if (!raw?.trim())
        return [];
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
    }
    catch {
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
function appendEngageTaskNote(raw, noteText, authorName = 'Alex Morgan') {
    const trimmed = noteText.trim();
    if (!trimmed)
        return raw?.trim() || '';
    const existing = parseEngageTaskNotes(raw);
    const entry = {
        noteId: `note_${Date.now()}`,
        note: trimmed,
        createdAt: new Date().toISOString(),
        authorName,
    };
    return JSON.stringify([entry, ...existing]);
}
function latestEngageTaskNote(raw) {
    return parseEngageTaskNotes(raw)[0]?.note;
}
//# sourceMappingURL=m08-task-notes.util.js.map