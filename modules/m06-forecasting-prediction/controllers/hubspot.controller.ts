import { Controller, Get, Query, Headers, Post, ForbiddenException, Redirect } from '@nestjs/common';
import { HubSpotService } from '../services/hubspot.service';

const TenantHeader = 'x-tenant-id';
const FRONTEND_URL = 'http://localhost:3000';

@Controller('api/v1/hubspot')
export class HubSpotController {
  constructor(private readonly hubspotService: HubSpotService) {}

  // ── GET /api/v1/hubspot/auth-url ──────────────────────────────────────────
  @Get('auth-url')
  getAuthUrl(@Headers(TenantHeader) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return { url: this.hubspotService.getAuthUrl(tenantId) };
  }

  // ── GET /api/v1/hubspot/callback ──────────────────────────────────────────
  // HubSpot redirects here with ?code=&state= — we redirect back to the frontend
  @Get('callback')
  @Redirect('', 302)
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    try {
      await this.hubspotService.handleCallback(code, state);
      return { url: `${FRONTEND_URL}?hubspot=connected` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { url: `${FRONTEND_URL}?hubspot=error&msg=${encodeURIComponent(msg)}` };
    }
  }

  // ── GET /api/v1/hubspot/status ────────────────────────────────────────────
  @Get('status')
  getStatus(@Headers(TenantHeader) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return { connected: this.hubspotService.isConnected(tenantId) };
  }

  // ── POST /api/v1/hubspot/sync ─────────────────────────────────────────────
  @Post('sync')
  async syncDeals(@Headers(TenantHeader) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.hubspotService.syncDeals(tenantId);
  }

  // ── POST /api/v1/hubspot/disconnect ──────────────────────────────────────
  @Post('disconnect')
  disconnect(@Headers(TenantHeader) tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant ID required');
    return this.hubspotService.disconnect(tenantId);
  }
}
