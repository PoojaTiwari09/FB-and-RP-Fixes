import { BoardsService } from '../services/boards.service';
export declare class BoardsController {
    private readonly boardsService;
    constructor(boardsService: BoardsService);
    getAllBoards(): Promise<{
        boards: any;
    }>;
    getTeam(): Promise<{
        team: {
            id: string;
            name: string;
            role: string;
            title: string;
        }[];
    }>;
    getPermissions(role: string): Promise<{
        permissions: any;
    }>;
    getBoardBySlug(slug: string): Promise<{
        error: string;
        board?: undefined;
    } | {
        board: any;
        error?: undefined;
    }>;
    createBoard(body: {
        step: number;
        data: any;
    }): Promise<any>;
    updateBoard(slug: string, body: any): Promise<{
        board: any;
    }>;
    duplicateBoard(slug: string): Promise<{
        board: any;
    }>;
    deleteBoard(slug: string): Promise<{
        success: boolean;
        deleted_slug: string;
    }>;
    addColumn(slug: string, body: any): Promise<{
        column: {
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
        };
    }>;
    updateColumn(slug: string, colId: string, body: any): Promise<{
        column: {
            col_id: string;
        };
    }>;
    deleteColumn(slug: string, colId: string): Promise<{
        success: boolean;
        deleted_col_id: string;
    }>;
    updateBriefConfig(slug: string, body: any): Promise<{
        board: any;
    }>;
}
