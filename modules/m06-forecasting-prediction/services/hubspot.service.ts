import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HubSpotClientService } from '../../platform-core/integrations/hubspot-client.service';

const HUBSPOT_AUTH_URL = 'https://app.hubspot.com/oauth/authorize';
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';
const HUBSPOT_DEALS_URL = 'https://api.hubapi.com/crm/v3/objects/deals';

const CLIENT_ID = process.env.HUBSPOT_CLIENT_ID!;
const CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET!;
const REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3001/api/v1/hubspot/callback';
const SCOPES = 'crm.objects.deals.read oauth';

// In-memory token store (keyed by tenantId). Fine for demo; replace with DB for prod.
const tokenStore = new Map<string, { accessToken: string; refreshToken: string; expiresAt: number }>();

// HubSpot deal stage → M6 stage
const STAGE_MAP: Record<string, string> = {
  appointmentscheduled:   'Discovery',
  qualifiedtobuy:         'Discovery',
  presentationscheduled:  'Proposal',
  decisionmakerboughtin:  'Proposal',
  contractsent:           'Negotiation',
  closedwon:              'Closed Won',
  closedlost:             'Closed Lost',
};

function mapStage(hubspotStage: string): string {
  const key = hubspotStage?.toLowerCase().replace(/[_\- ]/g, '') || '';
  return STAGE_MAP[key] ?? 'Discovery';
}

@Injectable()
export class HubSpotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hubspotClient: HubSpotClientService,
  ) {}

  // ── 1. Generate OAuth redirect URL ────────────────────────────────────────
  getAuthUrl(tenantId: string): string {
    const params = new URLSearchParams({
      client_id:     CLIENT_ID,
      redirect_uri:  REDIRECT_URI,
      scope:         SCOPES,
      state:         tenantId, // pass tenantId through state so callback knows who connected
    });
    return `${HUBSPOT_AUTH_URL}?${params.toString()}`;
  }

  // ── 2. Exchange authorization code for tokens ──────────────────────────────
  async handleCallback(code: string, state: string): Promise<{ tenantId: string; connected: boolean }> {
    if (!code) throw new BadRequestException('Missing authorization code');
    const tenantId = state || 'demo-tenant-01';

    const body = new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      code,
    });

    const res = await fetch(HUBSPOT_TOKEN_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new UnauthorizedException(`HubSpot token exchange failed: ${err}`);
    }

    const data = await res.json() as {
      access_token: string; refresh_token: string; expires_in: number;
    };

    tokenStore.set(tenantId, {
      accessToken:  data.access_token,
      refreshToken: data.refresh_token,
      expiresAt:    Date.now() + data.expires_in * 1000,
    });

    return { tenantId, connected: true };
  }

  // ── 3. Check connection status ─────────────────────────────────────────────
  isConnected(tenantId: string): boolean {
    const token = tokenStore.get(tenantId);
    return !!token && Date.now() < token.expiresAt;
  }

  // ── 4. Refresh token if expired ───────────────────────────────────────────
  private async ensureFreshToken(tenantId: string): Promise<string> {
    const token = tokenStore.get(tenantId);
    if (!token) throw new UnauthorizedException('HubSpot not connected. Please re-authenticate.');

    if (Date.now() >= token.expiresAt - 60_000) {
      const body = new URLSearchParams({
        grant_type:    'refresh_token',
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: token.refreshToken,
      });

      const res = await fetch(HUBSPOT_TOKEN_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    body.toString(),
      });

      if (!res.ok) throw new UnauthorizedException('HubSpot token refresh failed. Please reconnect.');

      const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
      const updated = { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + data.expires_in * 1000 };
      tokenStore.set(tenantId, updated);
      return updated.accessToken;
    }

    return token.accessToken;
  }

  // ── 5. Fetch & sync deals from HubSpot ────────────────────────────────────
  async syncDeals(tenantId: string): Promise<{
    imported: number;
    deals: any[];
    message: string;
  }> {
    const accessToken = await this.ensureFreshToken(tenantId);

    // Fetch open deals: properties we need to map to M6 format
    const properties = [
      'dealname', 'amount', 'dealstage', 'closedate',
      'hs_deal_stage_probability', 'description', 'hubspot_owner_id', 'hs_object_id',
    ].join(',');

    const data = await this.hubspotClient.getCrmDealsPage(accessToken, properties.split(','), '50');
    const hsDeals = data.results ?? [];

    // Resolve open period
    const period = await this.prisma.forecastPeriod.findFirst({ where: { tenantid: tenantId, status: 'open' } });

    const imported: any[] = [];

    for (const hsDeal of hsDeals) {
      const props = hsDeal.properties ?? {};
      const mappedStage = mapStage(props.dealstage ?? '');

      // Skip closed lost deals
      if (mappedStage === 'Closed Lost') continue;

      const dealName   = props.dealname ?? `HubSpot Deal ${hsDeal.id}`;
      const amount     = parseFloat(props.amount ?? '0') || 0;
      const probability = parseFloat(props.hs_deal_stage_probability ?? '0') / 100;

      let closeDate: Date;
      if (props.closedate) {
        closeDate = new Date(props.closedate);
      } else {
        // Default to end of current period or 45 days out
        closeDate = period?.endDate ?? new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
      }

      const isClosedWon = mappedStage === 'Closed Won';
      const isClosedLost = false;

      // Upsert to avoid duplicate imports (keyed by dealname+tenantId)
      const existing = await this.prisma.crmDeal.findFirst({
        where: { tenantid: tenantId, dealName, hubspotId: hsDeal.id },
      }).catch(() => null);

      if (existing) {
        // Update in place
        const updated = await this.prisma.crmDeal.update({
          where: { id: existing.id },
          data: { stage: mappedStage, amount, closeDate, probability, isClosedWon, isClosedLost },
        });
        imported.push(updated);
      } else {
        const created = await this.prisma.crmDeal.create({
          data: {
            tenantid: tenantId,
            dealName,
            stage:       mappedStage,
            amount,
            closeDate,
            probability,
            isClosedWon,
            isClosedLost,
            hubspotId:   hsDeal.id,
            // Region defaults to Americas; CRO can override per-deal later
            region:      'Americas',
          },
        });
        imported.push(created);
      }
    }

    return {
      imported: imported.length,
      deals:    imported,
      message:  `Successfully synced ${imported.length} deal(s) from HubSpot.`,
    };
  }

  // ── 6. Disconnect (revoke) ────────────────────────────────────────────────
  disconnect(tenantId: string): { disconnected: boolean } {
    tokenStore.delete(tenantId);
    return { disconnected: true };
  }
}
