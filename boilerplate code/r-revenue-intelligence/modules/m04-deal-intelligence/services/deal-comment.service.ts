import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DealComment } from '@/entities/deal-comment.entity';
import { Deal } from '@/entities/deal.entity';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto,
} from '@/schemas/comment.dto';

@Injectable()
export class DealCommentService {
  constructor(
    @InjectRepository(DealComment)
    private readonly commentRepository: Repository<DealComment>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
  ) {}

  /**
   * Get all comments for a deal
   */
  async getCommentsForDeal(dealId: string, coachingOnly?: boolean): Promise<CommentResponseDto[]> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .where('comment.dealId = :dealId', { dealId });

    if (coachingOnly) {
      queryBuilder.andWhere('comment.isCoaching = :isCoaching', { isCoaching: true });
    }

    const comments = await queryBuilder
      .orderBy('comment.createdAt', 'DESC')
      .getMany();

    return comments.map((comment) => this.toResponseDto(comment));
  }

  /**
   * Get a single comment
   */
  async getComment(dealId: string, commentId: string): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, dealId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.toResponseDto(comment);
  }

  /**
   * Create a comment
   */
  async createComment(
    dealId: string,
    dto: CreateCommentDto,
    authorId: string,
    authorName: string,
    authorRole: string,
  ): Promise<CommentResponseDto> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const comment = this.commentRepository.create({
      dealId,
      content: dto.content,
      authorId,
      authorName,
      authorRole,
      isCoaching: dto.isCoaching || false,
      isEdited: false,
    });

    const saved = await this.commentRepository.save(comment);
    return this.toResponseDto(saved);
  }

  /**
   * Update a comment
   */
  async updateComment(
    dealId: string,
    commentId: string,
    dto: UpdateCommentDto,
    userId: string,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, dealId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only the author can edit their comment
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = dto.content;
    comment.isEdited = true;
    comment.editedAt = new Date();

    const updated = await this.commentRepository.save(comment);
    return this.toResponseDto(updated);
  }

  /**
   * Delete a comment
   */
  async deleteComment(dealId: string, commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, dealId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only the author can delete their comment
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
  }

  /**
   * Get coaching comments for a deal
   */
  async getCoachingComments(dealId: string): Promise<CommentResponseDto[]> {
    return this.getCommentsForDeal(dealId, true);
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(comment: DealComment): CommentResponseDto {
    return {
      id: comment.id,
      dealId: comment.dealId,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.authorName,
      authorRole: comment.authorRole,
      isCoaching: comment.isCoaching,
      isEdited: comment.isEdited,
      editedAt: comment.editedAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
