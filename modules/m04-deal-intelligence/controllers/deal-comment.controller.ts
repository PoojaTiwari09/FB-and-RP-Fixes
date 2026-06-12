import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { DealCommentService } from '@m04/services/deal-comment.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto,
} from '@m04/schemas/comment.dto';
import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { AuthenticatedRequest } from '@m04/interfaces/authenticated-request.interface';

@ApiTags('Deal Comments')
@Controller('deals/:dealId/comments')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiCookieAuth()
export class DealCommentController {
  constructor(private readonly commentService: DealCommentService) {}

  @Get()
  @ApiOperation({
    summary: 'Get comments for a deal',
    description: 'Retrieve all comments for a deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'coachingOnly',
    description: 'Filter to show only coaching comments',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
    type: [CommentResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async getCommentsForDeal(
    @Param('dealId') dealId: string,
    @Query('coachingOnly', new ParseBoolPipe({ optional: true })) coachingOnly?: boolean,
  ): Promise<CommentResponseDto[]> {
    return this.commentService.getCommentsForDeal(dealId, coachingOnly);
  }

  @Get('coaching')
  @ApiOperation({
    summary: 'Get coaching comments',
    description: 'Retrieve only coaching comments for a deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Coaching comments retrieved successfully',
    type: [CommentResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async getCoachingComments(@Param('dealId') dealId: string): Promise<CommentResponseDto[]> {
    return this.commentService.getCoachingComments(dealId);
  }

  @Get(':commentId')
  @ApiOperation({
    summary: 'Get a single comment',
    description: 'Retrieve details of a specific comment',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'commentId',
    description: 'Comment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment retrieved successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found',
  })
  async getComment(
    @Param('dealId') dealId: string,
    @Param('commentId') commentId: string,
  ): Promise<CommentResponseDto> {
    return this.commentService.getComment(dealId, commentId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a comment',
    description: 'Add a new comment to a deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async createComment(
    @Param('dealId') dealId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CommentResponseDto> {
    return this.commentService.createComment(
      dealId,
      dto,
      req.user.id,
      `${req.user.firstName} ${req.user.lastName}`,
      req.user.role,
    );
  }

  @Patch(':commentId')
  @ApiOperation({
    summary: 'Update a comment',
    description: 'Edit a comment (only by the author)',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'commentId',
    description: 'Comment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'You can only edit your own comments',
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found',
  })
  async updateComment(
    @Param('dealId') dealId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CommentResponseDto> {
    return this.commentService.updateComment(dealId, commentId, dto, req.user.id);
  }

  @Delete(':commentId')
  @ApiOperation({
    summary: 'Delete a comment',
    description: 'Remove a comment (only by the author)',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'commentId',
    description: 'Comment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only delete your own comments',
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found',
  })
  async deleteComment(
    @Param('dealId') dealId: string,
    @Param('commentId') commentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    await this.commentService.deleteComment(dealId, commentId, req.user.id);
    return { message: 'Comment deleted successfully' };
  }
}
