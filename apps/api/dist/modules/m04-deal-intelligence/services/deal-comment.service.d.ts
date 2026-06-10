import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { DealComment } from '@/entities/deal-comment.entity';
import { Deal } from '@/entities/deal.entity';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto } from '@/schemas/comment.dto';
export declare class DealCommentService {
    private readonly commentRepository;
    private readonly dealRepository;
    constructor(commentRepository: Repository<DealComment>, dealRepository: Repository<Deal>);
    getCommentsForDeal(dealId: string, coachingOnly?: boolean): Promise<CommentResponseDto[]>;
    getComment(dealId: string, commentId: string): Promise<CommentResponseDto>;
    createComment(dealId: string, dto: CreateCommentDto, authorId: string, authorName: string, authorRole: string): Promise<CommentResponseDto>;
    updateComment(dealId: string, commentId: string, dto: UpdateCommentDto, userId: string): Promise<CommentResponseDto>;
    deleteComment(dealId: string, commentId: string, userId: string): Promise<void>;
    getCoachingComments(dealId: string): Promise<CommentResponseDto[]>;
    private toResponseDto;
}
