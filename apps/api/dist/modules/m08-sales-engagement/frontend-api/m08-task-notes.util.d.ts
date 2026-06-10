export interface EngageTaskNoteRecord {
    noteId: string;
    note: string;
    createdAt: string;
    authorName: string;
}
export declare function parseEngageTaskNotes(raw: string | null | undefined): EngageTaskNoteRecord[];
export declare function appendEngageTaskNote(raw: string | null | undefined, noteText: string, authorName?: string): string;
export declare function latestEngageTaskNote(raw: string | null | undefined): string | undefined;
