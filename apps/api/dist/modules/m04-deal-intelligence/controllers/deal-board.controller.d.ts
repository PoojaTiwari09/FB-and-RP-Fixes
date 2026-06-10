import { DealBoardService } from '@/services/deal-board.service';
import { CreateBoardDto, UpdateBoardDto, QueryBoardDto, BoardResponseDto, PaginatedBoardResponseDto } from '@/schemas';
export declare class DealBoardController {
    private readonly boardService;
    constructor(boardService: DealBoardService);
    createBoard(dto: CreateBoardDto, req: any): Promise<BoardResponseDto>;
    listBoards(query: QueryBoardDto, req: any): Promise<PaginatedBoardResponseDto>;
    getBoardById(id: string, req: any): Promise<BoardResponseDto>;
    updateBoard(id: string, dto: UpdateBoardDto, req: any): Promise<BoardResponseDto>;
    deleteBoard(id: string, req: any): Promise<void>;
    publishBoard(id: string, req: any): Promise<BoardResponseDto>;
    unpublishBoard(id: string, req: any): Promise<BoardResponseDto>;
}
