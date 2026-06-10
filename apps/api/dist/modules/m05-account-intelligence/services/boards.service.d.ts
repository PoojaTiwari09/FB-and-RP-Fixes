export declare class BoardsService {
    private supabase;
    private readonly COLUMN_TYPES;
    getAllBoards(): Promise<any>;
    getBoardBySlug(slug: string): Promise<any>;
    getPermissions(role: string): Promise<any>;
    getTeam(): Promise<{
        id: string;
        name: string;
        role: string;
        title: string;
    }[]>;
    updateBoard(slug: string, data: any): Promise<any>;
    duplicateBoard(slug: string): Promise<any>;
    deleteBoard(slug: string): Promise<{
        success: boolean;
        deleted_slug: string;
    }>;
    createBoard(step: number, data: any): Promise<any>;
    private validateStep1;
    private validateStep2;
    private validateStep3;
    private finalizeBoard;
    addColumn(slug: string, col: any): Promise<{
        col_id: string;
        board_id: any;
        field_key: any;
        label: any;
        order: any;
        width: any;
        sortable: any;
        editable: any;
        visible_to_roles: any;
        column_type: any;
    }>;
    updateColumn(slug: string, colId: string, updates: any): Promise<{
        col_id: string;
    }>;
    deleteColumn(slug: string, colId: string): Promise<{
        success: boolean;
        deleted_col_id: string;
    }>;
    updateBriefConfig(slug: string, config: {
        ai_briefs_enabled?: boolean;
        brief_type?: string;
        brief_period_days?: number;
    }): Promise<any>;
}
