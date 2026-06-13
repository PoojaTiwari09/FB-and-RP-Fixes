import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AIScoreService } from '@m04/services/ai-score.service';
import {
  AIScoreResponseDto,
  ScoreHistoryResponseDto,
} from '@m04/schemas/ai-score.dto';
import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';

@ApiTags('AI Score')
@Controller('deals/:dealId/score')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiCookieAuth()
export class AIScoreController {
  constructor(private readonly scoreService: AIScoreService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate AI score',
    description: 'Generate a new AI score for the deal with explanation and recommendations',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'AI score generated successfully',
    type: AIScoreResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async generateScore(@Param('dealId') dealId: string): Promise<AIScoreResponseDto> {
    return this.scoreService.generateScore(dealId);
  }

  @Get('current')
  @ApiOperation({
    summary: 'Get current AI score',
    description: 'Retrieve the current AI score for the deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Current AI score retrieved successfully',
    type: AIScoreResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async getCurrentScore(@Param('dealId') dealId: string): Promise<AIScoreResponseDto> {
    return this.scoreService.getCurrentScore(dealId);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get score history',
    description: 'Retrieve the AI score history for the deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Score history retrieved successfully',
    type: ScoreHistoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async getScoreHistory(@Param('dealId') dealId: string): Promise<ScoreHistoryResponseDto> {
    return this.scoreService.getScoreHistory(dealId);
  }
}
