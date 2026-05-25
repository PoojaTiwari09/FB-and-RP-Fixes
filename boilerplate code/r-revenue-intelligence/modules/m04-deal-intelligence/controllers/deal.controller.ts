import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
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
import { DealService } from '@/services/deal.service';
import { AuthGuard } from '@/guards/auth.guard';
import { RolesGuard } from '@/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '@/interfaces/user-role.enum';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
import {
  QueryDealDto,
  UpdateDealDto,
  DealResponseDto,
  DealListResponseDto,
  DealStatsResponseDto,
} from '@/schemas/deal.dto';

@ApiTags('Deals')
@ApiBearerAuth()
@Controller('deals')
@UseGuards(AuthGuard, RolesGuard)
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Get all deals with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deals retrieved successfully',
    type: DealListResponseDto,
  })
  async findAll(
    @Query() query: QueryDealDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<DealListResponseDto> {
    const { page = 1, limit = 25, ...filters } = query;

    const result = await this.dealService.findAll(filters, page, limit);

    return {
      deals: result.deals as any,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get deal statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: DealStatsResponseDto,
  })
  async getStats(@Req() req: AuthenticatedRequest): Promise<DealStatsResponseDto> {
    const [totalValue, countByStage, highRiskDeals, closingSoon] = await Promise.all([
      this.dealService.calculateTotalValue({}),
      this.dealService.countByStage(),
      this.dealService.getHighRiskDeals(),
      this.dealService.getDealsClosingSoon(30),
    ]);

    return {
      totalValue,
      countByStage,
      highRiskCount: highRiskDeals.length,
      closingSoonCount: closingSoon.length,
    };
  }

  @Get('high-risk')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get high risk deals' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'High risk deals retrieved successfully',
    type: [DealResponseDto],
  })
  async getHighRiskDeals(@Req() req: AuthenticatedRequest): Promise<DealResponseDto[]> {
    const deals = await this.dealService.getHighRiskDeals(10);
    return deals as any;
  }

  @Get('closing-soon')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Get deals closing soon (next 30 days)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deals closing soon retrieved successfully',
    type: [DealResponseDto],
  })
  async getDealsClosingSoon(@Req() req: AuthenticatedRequest): Promise<DealResponseDto[]> {
    const deals = await this.dealService.getDealsClosingSoon(30);
    return deals as any;
  }

  @Get('my-deals')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Get deals for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deals retrieved successfully',
    type: [DealResponseDto],
  })
  async getMyDeals(@Req() req: AuthenticatedRequest): Promise<DealResponseDto[]> {
    const deals = await this.dealService.getDealsForOwner(req.user.id, 100);
    return deals as any;
  }

  @Get('notifications/recent')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Get recent deal updates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
  })
  async getRecentNotifications(@Req() req: AuthenticatedRequest) {
    return this.dealService.getRecentNotifications(req.user.id, req.user.role);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Get deal by ID' })
  @ApiParam({ name: 'id', description: 'Deal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deal retrieved successfully',
    type: DealResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Deal not found',
  })
  async findById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DealResponseDto> {
    const deal = await this.dealService.findById(id, req.user.id);
    return deal as any;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Update deal' })
  @ApiParam({ name: 'id', description: 'Deal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deal updated successfully',
    type: DealResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Deal not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDealDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<DealResponseDto> {
    const deal = await this.dealService.update(id, updateDto, req.user.id);
    return deal as any;
  }
}
