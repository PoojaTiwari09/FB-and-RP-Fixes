import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Req, 
  BadRequestException, 
  ForbiddenException 
} from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M08SalesEngagementService } from '../services/m08.service';
import { 
  CreatePlaySchema, 
  UpdatePlaySchema, 
  ClonePlaySchema, 
  DeactivatePlaySchema, 
  EnrollPlaySchema, 
  CompleteStepSchema, 
  SkipStepSchema, 
  CreateNoteSchema 
} from '../schemas/m08.schema';

@Controller('api/v1/m08-sales-engagement')
@UseGuards(TenantGuard)
export class M08SalesEngagementController {
  constructor(
    private readonly service: M08SalesEngagementService
  ) {}

  // --- PLAY lifecycle & MANAGEMENT ---

  @Get('plays')
  async getPlays(@Req() req: any) {
    return this.service.getPlays(req.tenantId);
  }

  @Get('plays/:id')
  async getPlayById(@Param('id') id: string, @Req() req: any) {
    return this.service.getPlayById(req.tenantId, id);
  }

  @Post('plays')
  async createPlay(@Body() body: any, @Req() req: any) {
    this.enforceRole(req, ['admin']);
    const result = CreatePlaySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    return this.service.createPlay(result.data, req.tenantId, userId);
  }

  @Patch('plays/:id')
  async updatePlay(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    this.enforceRole(req, ['admin']);
    const result = UpdatePlaySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    return this.service.updatePlay(id, result.data, req.tenantId);
  }

  @Post('plays/clone')
  async clonePlay(@Body() body: any, @Req() req: any) {
    this.enforceRole(req, ['admin']);
    const result = ClonePlaySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    return this.service.clonePlay(result.data.playId, req.tenantId, userId);
  }

  @Post('plays/deactivate')
  async deactivatePlay(@Body() body: any, @Req() req: any) {
    this.enforceRole(req, ['admin']);
    const result = DeactivatePlaySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    return this.service.deactivatePlay(result.data.playId, req.tenantId);
  }

  // --- PLAY ENROLLMENT ENGINE ---

  @Post('enrollments')
  async enrollOpportunity(@Body() body: any, @Req() req: any) {
    const result = EnrollPlaySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    return this.service.enrollOpportunity(result.data, req.tenantId);
  }

  @Get('enrollments')
  async getEnrollments(@Query() query: any, @Req() req: any) {
    const filters = {
      userId: query.userId,
      dealId: query.dealId,
      status: query.status,
    };
    return this.service.getEnrollments(req.tenantId, filters);
  }

  @Get('enrollments/:id')
  async getEnrollmentById(@Param('id') id: string, @Req() req: any) {
    return this.service.getEnrollmentById(req.tenantId, id);
  }

  // --- PLAY STEP ACTIONS ---

  @Patch('enrollments/:id/step')
  async completeStep(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const result = CompleteStepSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    return this.service.completeStep(id, result.data, req.tenantId, userId);
  }

  @Post('enrollments/:id/skip')
  async skipStep(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const result = SkipStepSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    return this.service.skipStep(id, result.data, req.tenantId, userId);
  }

  @Post('enrollments/:id/note')
  async addNote(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const result = CreateNoteSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    return this.service.addNote(id, result.data, req.tenantId, userId);
  }

  // --- ANALYTICS DASHBOARDS ---

  @Get('dashboard/adoption')
  async getAdoptionDashboard(@Req() req: any) {
    this.enforceRole(req, ['manager', 'admin']);
    return this.service.getAdoptionDashboard(req.tenantId);
  }

  @Get('dashboard/rep')
  async getRepDashboard(@Req() req: any) {
    this.enforceRole(req, ['manager', 'admin']);
    return this.service.getRepDashboard(req.tenantId);
  }

  @Get('dashboard/play')
  async getPlayDashboard(@Req() req: any) {
    this.enforceRole(req, ['manager', 'admin']);
    return this.service.getPlayDashboard(req.tenantId);
  }

  private enforceRole(req: any, allowedRoles: string[]) {
    const role = req.headers['x-user-role'] || 'representative';
    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException(`Access denied. Role '${role}' does not have sufficient permissions to perform this action.`);
    }
  }
}
