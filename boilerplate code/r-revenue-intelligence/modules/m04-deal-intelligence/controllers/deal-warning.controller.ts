import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DealWarningService } from '@/services/deal-warning.service';
import { AuthGuard } from '@/guards/auth.guard';
import { RolesGuard } from '@/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '@/interfaces/user-role.enum';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
import {
  DealWarningResponseDto,
  WarningListResponseDto,
  QueryWarningDto,
} from '@/schemas/deal-warning.dto';

@ApiTags('Deal Warnings')
@ApiBearerAuth()
@Controller('deals/:dealId/warnings')
@UseGuards(AuthGuard, RolesGuard)
export class DealWarningController {
  constructor(private readonly warningService: DealWarningService) {}

  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Generate AI warnings for deal' })
  @ApiParam({ name: 'dealId', description: 'Deal ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Warnings generated successfully',
    type: [DealWarningResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Deal not found',
  })
  async generateWarnings(
    @Param('dealId') dealId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DealWarningResponseDto[]> {
    const warnings = await this.warningService.generateWarnings(dealId, req.user.id);
    return warnings as any;
  }

  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Get active warnings for deal' })
  @ApiParam({ name: 'dealId', description: 'Deal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active warnings retrieved successfully',
    type: [DealWarningResponseDto],
  })
  async getActiveWarnings(
    @Param('dealId') dealId: string,
  ): Promise<DealWarningResponseDto[]> {
    const warnings = await this.warningService.getActiveWarnings(dealId);
    return warnings as any;
  }

  @Get('history')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Get warning history for deal' })
  @ApiParam({ name: 'dealId', description: 'Deal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warning history retrieved successfully',
    type: WarningListResponseDto,
  })
  async getWarningHistory(
    @Param('dealId') dealId: string,
    @Query() query: QueryWarningDto,
  ): Promise<WarningListResponseDto> {
    const warnings = await this.warningService.getWarningHistory(
      dealId,
      query.limit || 50,
    );

    return {
      warnings: warnings as any,
      total: warnings.length,
    };
  }

  @Patch(':warningId/resolve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Resolve a warning' })
  @ApiParam({ name: 'dealId', description: 'Deal ID' })
  @ApiParam({ name: 'warningId', description: 'Warning ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warning resolved successfully',
    type: DealWarningResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Warning not found',
  })
  async resolveWarning(
    @Param('warningId') warningId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DealWarningResponseDto> {
    const warning = await this.warningService.resolveWarning(warningId, req.user.id);
    return warning as any;
  }
}

@ApiTags('Deal Warnings')
@ApiBearerAuth()
@Controller('warnings')
@UseGuards(AuthGuard, RolesGuard)
export class WarningManagementController {
  constructor(private readonly warningService: DealWarningService) {}

  @Get('critical')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all critical warnings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Critical warnings retrieved successfully',
    type: [DealWarningResponseDto],
  })
  async getCriticalWarnings(
    @Query() query: QueryWarningDto,
  ): Promise<DealWarningResponseDto[]> {
    const warnings = await this.warningService.getCriticalWarnings(query.limit || 20);
    return warnings as any;
  }

  @Get('by-type')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get warnings by type' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warnings retrieved successfully',
    type: [DealWarningResponseDto],
  })
  async getWarningsByType(
    @Query() query: QueryWarningDto,
  ): Promise<DealWarningResponseDto[]> {
    if (!query.type) {
      return [];
    }
    const warnings = await this.warningService.getWarningsByType(
      query.type,
      query.limit || 50,
    );
    return warnings as any;
  }

  @Get('by-severity')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get warnings by severity' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warnings retrieved successfully',
    type: [DealWarningResponseDto],
  })
  async getWarningsBySeverity(
    @Query() query: QueryWarningDto,
  ): Promise<DealWarningResponseDto[]> {
    if (!query.severity) {
      return [];
    }
    const warnings = await this.warningService.getWarningsBySeverity(
      query.severity,
      query.limit || 50,
    );
    return warnings as any;
  }
}
