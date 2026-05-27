import { Controller, Get, Post, HttpCode } from '@nestjs/common';

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
    };
  }
}
