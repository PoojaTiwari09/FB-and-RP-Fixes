import { DatabaseService } from '../database/database.service';
declare class AddBoardWarningDto {
    warningId: string;
    sortOrder: number;
}
declare class UpdateBoardWarningDto {
    sortOrder?: number;
    isEnabled?: boolean;
}
export declare class BoardWarningConfigController {
    private readonly db;
    constructor(db: DatabaseService);
    listBoardWarnings(boardId: string): Promise<Record<string, unknown>[]>;
    addWarningToBoard(boardId: string, body: AddBoardWarningDto, req: any): Promise<Record<string, unknown>>;
    updateBoardWarning(boardId: string, warningConfigId: string, body: UpdateBoardWarningDto, req: any): Promise<Record<string, unknown>>;
    removeWarningFromBoard(boardId: string, warningConfigId: string, req: any): Promise<{
        deleted: boolean;
        id: string;
    }>;
    private assertBoardExists;
    private writeAuditLog;
}
export {};
