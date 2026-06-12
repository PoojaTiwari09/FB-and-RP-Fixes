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
  ApiQuery,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { DealTaskService } from '@m04/services/deal-task.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskStatus,
  GenerateNextStepsDto,
} from '@m04/schemas/task.dto';
import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { AuthenticatedRequest } from '@m04/interfaces/authenticated-request.interface';

@ApiTags('Deal Tasks')
@Controller('deals/:dealId/tasks')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiCookieAuth()
export class DealTaskController {
  constructor(private readonly taskService: DealTaskService) {}

  @Get()
  @ApiOperation({
    summary: 'Get tasks for a deal',
    description: 'Retrieve all tasks associated with a deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by task status',
    enum: TaskStatus,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Tasks retrieved successfully',
    type: [TaskResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async getTasksForDeal(
    @Param('dealId') dealId: string,
    @Query('status') status?: TaskStatus,
  ): Promise<TaskResponseDto[]> {
    return this.taskService.getTasksForDeal(dealId, status);
  }

  @Get(':taskId')
  @ApiOperation({
    summary: 'Get a single task',
    description: 'Retrieve details of a specific task',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'taskId',
    description: 'Task ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Task retrieved successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
  })
  async getTask(
    @Param('dealId') dealId: string,
    @Param('taskId') taskId: string,
  ): Promise<TaskResponseDto> {
    return this.taskService.getTask(dealId, taskId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a task',
    description: 'Create a new task for a deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async createTask(
    @Param('dealId') dealId: string,
    @Body() dto: CreateTaskDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<TaskResponseDto> {
    return this.taskService.createTask(
      dealId,
      dto,
      req.user?.id,
      `${req.user?.firstName} ${req.user?.lastName}`,
    );
  }

  @Patch(':taskId')
  @ApiOperation({
    summary: 'Update a task',
    description: 'Update task details or status',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'taskId',
    description: 'Task ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Task updated successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
  })
  async updateTask(
    @Param('dealId') dealId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<TaskResponseDto> {
    return this.taskService.updateTask(dealId, taskId, dto, req.user?.id);
  }

  @Delete(':taskId')
  @ApiOperation({
    summary: 'Delete a task',
    description: 'Remove a task from the deal',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'taskId',
    description: 'Task ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Task deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
  })
  async deleteTask(
    @Param('dealId') dealId: string,
    @Param('taskId') taskId: string,
  ): Promise<{ message: string }> {
    await this.taskService.deleteTask(dealId, taskId);
    return { message: 'Task deleted successfully' };
  }

  @Post('generate-next-steps')
  @ApiOperation({
    summary: 'Generate AI next steps',
    description: 'Generate AI-suggested next steps as tasks',
  })
  @ApiParam({
    name: 'dealId',
    description: 'Deal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Next steps generated successfully',
    type: [TaskResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async generateNextSteps(
    @Param('dealId') dealId: string,
    @Body() dto: GenerateNextStepsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<TaskResponseDto[]> {
    return this.taskService.generateNextSteps(
      dealId,
      dto.count || 3,
      req.user?.id,
      `${req.user?.firstName} ${req.user?.lastName}`,
    );
  }
}

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiCookieAuth()
export class TaskManagementController {
  constructor(private readonly taskService: DealTaskService) {}

  @Get('my-tasks')
  @ApiOperation({
    summary: 'Get my tasks',
    description: 'Retrieve all tasks assigned to the current user',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by task status',
    enum: TaskStatus,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Tasks retrieved successfully',
    type: [TaskResponseDto],
  })
  async getMyTasks(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: TaskStatus,
  ): Promise<TaskResponseDto[]> {
    return this.taskService.getTasksForUser(req.user.id, status);
  }

  @Get('overdue')
  @ApiOperation({
    summary: 'Get overdue tasks',
    description: 'Retrieve all overdue tasks for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Overdue tasks retrieved successfully',
    type: [TaskResponseDto],
  })
  async getOverdueTasks(@Req() req: AuthenticatedRequest): Promise<TaskResponseDto[]> {
    return this.taskService.getOverdueTasks(req.user.id);
  }
}
