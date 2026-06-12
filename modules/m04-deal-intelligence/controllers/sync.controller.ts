import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DealSyncService } from '@m04/services/deal-sync.service';
import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { RolesGuard } from '../../platform-core/guards/roles.guard';
import { Roles } from '../../platform-core/decorators/roles.decorator';
import { UserRole } from '@rri/database';
import { SyncLog, SyncType } from '@m04/entities';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class SyncController {
  constructor(private readonly syncService: DealSyncService) {}

  @Post('deals/full')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Trigger full deal sync from HubSpot' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Full sync started successfully',
  })
  async triggerFullSync(): Promise<SyncLog> {
    return this.syncService.syncDeals(SyncType.FULL);
  }

  @Post('deals/incremental')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Trigger incremental deal sync from HubSpot' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Incremental sync started successfully',
  })
  async triggerIncrementalSync(): Promise<SyncLog> {
    return this.syncService.syncDeals(SyncType.INCREMENTAL);
  }

  @Get('logs')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get sync logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sync logs retrieved successfully',
  })
  async getSyncLogs(
    @Query('limit') limit?: number,
  ): Promise<SyncLog[]> {
    return this.syncService.getSyncLogs(limit || 50);
  }

  @Get('status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get last sync status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sync status retrieved successfully',
  })
  async getSyncStatus(): Promise<{
    lastSync: SyncLog | null;
    isSyncing: boolean;
  }> {
    const lastSync = await this.syncService.getLastSuccessfulSync('DEAL' as any);
    return {
      lastSync,
      isSyncing: false, // TODO: Add actual sync status tracking
    };
  }
}
