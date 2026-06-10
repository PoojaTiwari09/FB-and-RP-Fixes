import { DealCommentService } from '@/services/deal-comment.service';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto } from '@/schemas/comment.dto';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
export declare class DealCommentController {
    private readonly commentService;
    constructor(commentService: DealCommentService);
    getCommentsForDeal(dealId: string, coachingOnly?: boolean): Promise<CommentResponseDto[]>;
    getCoachingComments(dealId: string): Promise<CommentResponseDto[]>;
    getComment(dealId: string, commentId: string): Promise<CommentResponseDto>;
    createComment(dealId: string, dto: CreateCommentDto, req: AuthenticatedRequest): Promise<CommentResponseDto>;
    updateComment(dealId: string, commentId: string, dto: UpdateCommentDto, req: AuthenticatedRequest): Promise<CommentResponseDto>;
    deleteComment(dealId: string, commentId: string, req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
}
