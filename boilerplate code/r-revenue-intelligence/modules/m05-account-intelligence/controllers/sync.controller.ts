import { Controller, Post, Get, Body, Logger } from '@nestjs/common';
import { SyncService } from '../services/sync.service';

@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(private readonly syncService: SyncService) {}

  /**
   * POST /sync/trigger
   * Manually kick off a full HubSpot → Supabase sync.
   * Body: { role: string }  (only admin allowed)
   */
  @Post('trigger')
  async triggerSync(@Body() body: { role: string }) {
    if (body.role !== 'admin') {
      return { success: false, error: 'Only admin role can trigger sync' };
    }

    this.logger.log(`[SYNC] Manual trigger by admin at ${new Date().toISOString()}`);
    const result = await this.syncService.runFullSync();
    return result;
  }

  /**
   * GET /sync/status
   * Returns last sync result + is_syncing flag + seconds until next scheduled sync.
   */
  @Get('status')
  getStatus() {
    return this.syncService.getStatus();
  }
}
