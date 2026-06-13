import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { CoachingService } from '@m04/services/coaching.service';
import {
  GenerateCoachingPromptsDto,
  CoachingPromptsResponseDto,
} from '@m04/schemas/coaching.dto';
import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { RolesGuard } from '../../platform-core/guards/roles.guard';
import { Roles } from '../../platform-core/decorators/roles.decorator';
import { UserRole } from '@rri/database';
import { AuthenticatedRequest } from '@m04/interfaces/authenticated-request.interface';

@ApiTags('Coaching')
@Controller('coaching')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiCookieAuth()
export class CoachingController {
  constructor(private readonly coachingService: CoachingService) {}

  @Post('prompts')
  @ApiOperation({
    summary: 'Generate coaching prompts',
    description: 'Generate AI-powered coaching prompts for a deal',
  })
  @ApiResponse({
    status: 200,
    description: 'Coaching prompts generated successfully',
    type: CoachingPromptsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async generatePrompts(
    @Body() dto: GenerateCoachingPromptsDto,
  ): Promise<CoachingPromptsResponseDto> {
    return this.coachingService.generateCoachingPrompts(dto);
  }

  @Get('deals/:dealId/prompts')
  @ApiOperation({
    summary: 'Get coaching prompts for a deal',
    description: 'Get AI-powered coaching prompts for a specific deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Coaching prompts retrieved successfully',
    type: CoachingPromptsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async getPromptsForDeal(
    @Param('dealId') dealId: string,
  ): Promise<CoachingPromptsResponseDto> {
    return this.coachingService.generateCoachingPrompts({ dealId });
  }

  @Get('opportunities')
  @ApiOperation({
    summary: 'Get team coaching opportunities',
    description: 'Get coaching opportunities across all team deals',
  })
  @ApiResponse({
    status: 200,
    description: 'Coaching opportunities retrieved successfully',
    type: [CoachingPromptsResponseDto],
  })
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async getTeamOpportunities(
    @Req() req: AuthenticatedRequest,
  ): Promise<CoachingPromptsResponseDto[]> {
    return this.coachingService.getTeamCoachingOpportunities(req.user.id);
  }
}
