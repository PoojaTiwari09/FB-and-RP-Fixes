import { DealBoardRepository } from '@/repositories/deal-board.repository';
import { AuditLogService } from './audit-log.service';
import { CreateBoardDto, UpdateBoardDto, QueryBoardDto, BoardResponseDto, PaginatedBoardResponseDto } from '@/schemas';
export declare class DealBoardService {
    private readonly boardRepository;
    private readonly auditLogService;
    constructor(boardRepository: DealBoardRepository, auditLogService: AuditLogService);
    createBoard(dto: CreateBoardDto, userId: string, userRole?: string): Promise<BoardResponseDto>;
    getBoardById(id: string, userId: string, userRole?: string): Promise<BoardResponseDto>;
    listBoards(query: QueryBoardDto, userId: string, userRole?: string): Promise<PaginatedBoardResponseDto>;
    updateBoard(id: string, dto: UpdateBoardDto, userId: string, userRole?: string): Promise<BoardResponseDto>;
    deleteBoard(id: string, userId: string, userRole?: string): Promise<void>;
    publishBoard(id: string, userId: string, userRole?: string): Promise<BoardResponseDto>;
    unpublishBoard(id: string, userId: string, userRole?: string): Promise<BoardResponseDto>;
    private mapToResponseDto;
    private mapToListItemDto;
}
