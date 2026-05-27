import { Controller, Get } from '@nestjs/common';
import { getM05Enabled } from '../config/m05-env';

/**
 * Module metadata only — account CRUD/list lives under AccountsController (/accounts).
 */
@Controller('api/v1/account-intelligence')
export class M05AccountIntelligenceController {
  @Get()
  getModuleInfo() {
    return {
      module: 'm05-account-intelligence',
      enabled: getM05Enabled(),
      version: '1.0.0',
      routes: {
        accounts: '/api/v1/account-intelligence/accounts',
        boards: '/api/v1/account-intelligence/boards',
        webhooks: '/api/v1/account-intelligence/webhooks/hubspot',
        health: '/api/v1/account-intelligence/test/health',
      },
    };
  }
}
