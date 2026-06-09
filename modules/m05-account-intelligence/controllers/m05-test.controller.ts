import { Controller, Get, Post, HttpCode } from '@nestjs/common';
import { m05DataStore, m05SeedManifest } from '../database/m05-data.store';
import { M05_VERIFICATION_MATRIX } from '../database/m05-verification.matrix';

@Controller('api/v1/account-intelligence/test')
export class M05TestController {
  @Get('health')
  health() {
    return {
      success: true,
      module: 'm05-account-intelligence',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('smoke')
  @HttpCode(200)
  smoke() {
    return {
      success: true,
      module: 'm05-account-intelligence',
      checks: ['health', 'accounts_route', 'webhook_env'],
      webhookSecretConfigured: Boolean(
        process.env.M05_HUBSPOT_WEBHOOK_SECRET || process.env.HUBSPOT_WEBHOOK_SECRET,
      ),
      hubspotTokenConfigured: Boolean(process.env.HUBSPOT_ACCESS_TOKEN),
      hubspotPortalId: process.env.HUBSPOT_PORTAL_ID || null,
    };
  }

  /** Feature ↔ seed verification matrix (see M05-VERIFICATION.md). */
  @Get('verification')
  verification() {
    return {
      success: true,
      module: 'm05-account-intelligence',
      count: M05_VERIFICATION_MATRIX.length,
      matrix: M05_VERIFICATION_MATRIX,
      manifest: m05SeedManifest(),
      stats: m05DataStore.stats(),
      reload_seed: 'POST /api/v1/account-intelligence/test/seed',
    };
  }

  /** Reload in-memory demo CRM + boards (demo + commercial slugs). */
  @Post('seed')
  @HttpCode(200)
  seed() {
    m05DataStore.reset();
    return {
      success: true,
      module: 'm05-account-intelligence',
      message: 'Demo seed loaded (in-memory). Boards: demo (4 accounts), commercial (1).',
      stats: m05DataStore.stats(),
      manifest: m05SeedManifest(),
      verification: 'GET /api/v1/account-intelligence/test/verification',
      urls: {
        demo: 'http://localhost:5179/board/demo',
        commercial: 'http://localhost:5179/board/commercial',
      },
    };
  }
}
