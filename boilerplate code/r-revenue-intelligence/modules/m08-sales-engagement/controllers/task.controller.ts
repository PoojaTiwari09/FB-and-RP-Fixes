import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { M08TaskService } from '../services/task.service';
import { CreateTaskSchema, UpdateTaskStatusSchema, ReassignTaskSchema } from '../schemas/task.schema';

// Simulated Platform AuthGuard for workspace compliance check
@Controller('api/v1/m08-sales-engagement/tasks')
export class M08TaskController {
  constructor(
    @Inject(M08TaskService) private readonly taskService: M08TaskService
  ) {}

  @Get()
  async getTasks(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('priority') priorityStr?: string,
    @Query('dueDateRange') dueDateRange?: 'today' | 'overdue' | 'week',
    @Query('type') type?: string,
    @Query('source') source?: string,
    @Query('search') search?: string,
    @Query('userId') queryUserId?: string
  ) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.headers['x-user-role'] || 'representative';
    const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';

    const filters: any = {};
    if (status) filters.status = status;
    if (priorityStr) filters.priority = parseInt(priorityStr);
    if (dueDateRange) filters.dueDateRange = dueDateRange;
    if (type) filters.type = type;
    if (source) filters.source = source;
    if (search) filters.search = search;

    // RBAC: Representative can only fetch their own tasks
    if (userRole === 'representative') {
      filters.userId = currentUserId;
    } else {
      // Manager/Admin can view all team tasks, or filter by a specific rep ID
      if (queryUserId) {
        filters.userId = queryUserId;
      }
    }

    return this.taskService.getTasks(tenantId, filters);
  }

  @Get(':id')
  async getTaskById(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.headers['x-user-role'] || 'representative';
    const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';

    const task = await this.taskService.getTaskById(tenantId, id);

    // RBAC check
    if (userRole === 'representative' && task.userId !== currentUserId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  @Post()
  async createTask(@Body() body: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';

    const result = CreateTaskSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.errors,
      });
    }

    return this.taskService.createTask(result.data, tenantId, currentUserId);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.headers['x-user-role'] || 'representative';
    const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';

    const result = UpdateTaskStatusSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.errors,
      });
    }

    const task = await this.taskService.getTaskById(tenantId, id);

    // RBAC: Manager cannot complete tasks on behalf of a Rep (unless Admin)
    if (userRole === 'manager') {
      throw new ForbiddenException('Managers do not have permission to update task status directly');
    }

    if (userRole === 'representative' && task.userId !== currentUserId) {
      throw new ForbiddenException('You cannot update status on other representatives tasks');
    }

    return this.taskService.updateTaskStatus(id, result.data.status, tenantId);
  }

  @Patch(':id/reassign')
  async reassignTask(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const userRole = req.headers['x-user-role'] || 'representative';
    const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';

    const result = ReassignTaskSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.errors,
      });
    }

    // RBAC: Representatives cannot reassign tasks
    if (userRole === 'representative') {
      throw new ForbiddenException('Only managers and administrators can reassign tasks');
    }

    return this.taskService.reassignTask(id, result.data.userId, tenantId, currentUserId);
  }
}
