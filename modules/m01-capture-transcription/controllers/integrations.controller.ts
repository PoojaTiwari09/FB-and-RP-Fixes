import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';

const PROVIDERS = [
  { provider: 'zoom', name: 'Zoom', icon: '🎥', color: '#2D8CFF' },
  { provider: 'teams', name: 'Microsoft Teams', icon: '💬', color: '#6264A7' },
  { provider: 'meet', name: 'Google Meet', icon: '📹', color: '#00897B' },
  { provider: 'salesforce', name: 'Salesforce', icon: '☁️', color: '#00A1E0' },
  { provider: 'hubspot', name: 'HubSpot', icon: '🟠', color: '#FF7A59' },
];

/**
 * CRM / dialer connector status for M01 call detail UI (ConnectorCards).
 */
@Controller('api/v1/integrations')
@UseGuards(TenantGuard)
export class IntegrationsController {
  @Get()
  list(@Req() req: Record<string, string>) {
    const tenantId = req.tenantId;
    return PROVIDERS.map((p, i) => ({
      ...p,
      status: i % 2 === 0 ? 'connected' : 'disconnected',
      accountEmail: i % 2 === 0 ? `demo+${p.provider}@${tenantId.slice(0, 8)}.local` : null,
      accountName: i % 2 === 0 ? `${p.name} Demo` : null,
      connectedAt: i % 2 === 0 ? new Date().toISOString() : null,
      hasCredentials: i % 2 === 0,
    }));
  }

  @Post(':provider/connect')
  connect(@Param('provider') provider: string) {
    const meta = PROVIDERS.find((p) => p.provider === provider);
    return {
      status: 'connected',
      message: `${meta?.name ?? provider} connected (demo mode)`,
      accountEmail: `demo@${provider}.local`,
      accountName: `${meta?.name ?? provider} Workspace`,
    };
  }

  @Post(':provider/disconnect')
  disconnect(@Param('provider') provider: string) {
    return {
      status: 'disconnected',
      message: `${provider} disconnected`,
    };
  }
}
