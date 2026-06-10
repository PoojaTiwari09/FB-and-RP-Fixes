import { BoardAudience, BoardStatus } from '@/entities';
export declare class QueryBoardDto {
    page?: number;
    limit?: number;
    audience?: BoardAudience;
    status?: BoardStatus;
    ownerId?: string;
    search?: string;
    accessibleOnly?: boolean;
}
