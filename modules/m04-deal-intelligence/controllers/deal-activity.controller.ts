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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { DealActivityService } from '@/services/deal-activity.service';
import {
  CreateActivityDto,
  UpdateActivityDto,
  ActivityResponseDto,
  ActivityQueryDto,
  ActivityTimelineDto,
} from '@/schemas/activity.dto';
import { AuthGuard } from '@/guards/auth.guard';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';

@ApiTags('Deal Activities')
@Controller('deals/:dealId/activities')
@UseGuards(AuthGuard)
@ApiCookieAuth()
export class DealActivityController {
  constructor(private readonly activityService: DealActivityService) {}

  @Get('timeline')
  @ApiOperation({
    summary: 'Get activity timeline',
    description: 'Get activity timeline with statistics for a deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity timeline retrieved successfully',
    type: ActivityTimelineDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async getTimeline(
    @Param('dealId') dealId: string,
    @Query() query: ActivityQueryDto,
  ): Promise<ActivityTimelineDto> {
    return this.activityService.getTimeline(dealId, query);
  }

  @Get()
  @ApiOperation({
    summary: 'Get activities',
    description: 'Get all activities for a deal with optional filtering',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Activities retrieved successfully',
    type: [ActivityResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async getActivities(
    @Param('dealId') dealId: string,
    @Query() query: ActivityQueryDto,
  ): Promise<ActivityResponseDto[]> {
    return this.activityService.getActivities(dealId, query);
  }

  @Get(':activityId')
  @ApiOperation({
    summary: 'Get activity',
    description: 'Get a single activity by ID',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'activityId',
    description: 'Activity ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity retrieved successfully',
    type: ActivityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  async getActivity(
    @Param('dealId') dealId: string,
    @Param('activityId') activityId: string,
  ): Promise<ActivityResponseDto> {
    return this.activityService.getActivity(dealId, activityId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create activity',
    description: 'Create a new activity for a deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Activity created successfully',
    type: ActivityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async createActivity(
    @Param('dealId') dealId: string,
    @Body() dto: CreateActivityDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ActivityResponseDto> {
    return this.activityService.createActivity(
      dealId,
      dto,
      req.user?.id,
      req.user?.email,
    );
  }

  @Patch(':activityId')
  @ApiOperation({
    summary: 'Update activity',
    description: 'Update an existing activity',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'activityId',
    description: 'Activity ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity updated successfully',
    type: ActivityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  async updateActivity(
    @Param('dealId') dealId: string,
    @Param('activityId') activityId: string,
    @Body() dto: UpdateActivityDto,
  ): Promise<ActivityResponseDto> {
    return this.activityService.updateActivity(dealId, activityId, dto);
  }

  @Delete(':activityId')
  @ApiOperation({
    summary: 'Delete activity',
    description: 'Delete an activity',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'activityId',
    description: 'Activity ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  async deleteActivity(
    @Param('dealId') dealId: string,
    @Param('activityId') activityId: string,
  ): Promise<{ message: string }> {
    await this.activityService.deleteActivity(dealId, activityId);
    return { message: 'Activity deleted successfully' };
  }
}
