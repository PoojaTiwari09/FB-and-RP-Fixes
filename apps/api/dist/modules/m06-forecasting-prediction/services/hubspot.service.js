"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubSpotService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const hubspot_client_service_1 = require("../../platform-core/integrations/hubspot-client.service");
const HUBSPOT_AUTH_URL = 'https://app.hubspot.com/oauth/authorize';
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';
const HUBSPOT_DEALS_URL = 'https://api.hubapi.com/crm/v3/objects/deals';
const CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3001/api/v1/hubspot/callback';
const SCOPES = 'crm.objects.deals.read oauth';
const tokenStore = new Map();
const STAGE_MAP = {
    appointmentscheduled: 'Discovery',
    qualifiedtobuy: 'Discovery',
    presentationscheduled: 'Proposal',
    decisionmakerboughtin: 'Proposal',
    contractsent: 'Negotiation',
    closedwon: 'Closed Won',
    closedlost: 'Closed Lost',
};
function mapStage(hubspotStage) {
    const key = hubspotStage?.toLowerCase().replace(/[_\- ]/g, '') || '';
    return STAGE_MAP[key] ?? 'Discovery';
}
let HubSpotService = class HubSpotService {
    prisma;
    hubspotClient;
    constructor(prisma, hubspotClient) {
        this.prisma = prisma;
        this.hubspotClient = hubspotClient;
    }
    getAuthUrl(tenantId) {
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            scope: SCOPES,
            state: tenantId,
        });
        return `${HUBSPOT_AUTH_URL}?${params.toString()}`;
    }
    async handleCallback(code, state) {
        if (!code)
            throw new common_1.BadRequestException('Missing authorization code');
        const tenantId = state || 'demo-tenant-01';
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code,
        });
        const res = await fetch(HUBSPOT_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new common_1.UnauthorizedException(`HubSpot token exchange failed: ${err}`);
        }
        const data = await res.json();
        tokenStore.set(tenantId, {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: Date.now() + data.expires_in * 1000,
        });
        return { tenantId, connected: true };
    }
    isConnected(tenantId) {
        const token = tokenStore.get(tenantId);
        return !!token && Date.now() < token.expiresAt;
    }
    async ensureFreshToken(tenantId) {
        const token = tokenStore.get(tenantId);
        if (!token)
            throw new common_1.UnauthorizedException('HubSpot not connected. Please re-authenticate.');
        if (Date.now() >= token.expiresAt - 60_000) {
            const body = new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token: token.refreshToken,
            });
            const res = await fetch(HUBSPOT_TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            });
            if (!res.ok)
                throw new common_1.UnauthorizedException('HubSpot token refresh failed. Please reconnect.');
            const data = await res.json();
            const updated = { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + data.expires_in * 1000 };
            tokenStore.set(tenantId, updated);
            return updated.accessToken;
        }
        return token.accessToken;
    }
    async syncDeals(tenantId) {
        const accessToken = await this.ensureFreshToken(tenantId);
        const properties = [
            'dealname', 'amount', 'dealstage', 'closedate',
            'hs_deal_stage_probability', 'description', 'hubspot_owner_id', 'hs_object_id',
        ].join(',');
        const data = await this.hubspotClient.getCrmDealsPage(accessToken, properties.split(','), '50');
        const hsDeals = data.results ?? [];
        const period = await this.prisma.forecastPeriod.findFirst({ where: { tenantId: tenantId, status: 'open' } });
        const imported = [];
        for (const hsDeal of hsDeals) {
            const props = hsDeal.properties ?? {};
            const mappedStage = mapStage(props.dealstage ?? '');
            if (mappedStage === 'Closed Lost')
                continue;
            const dealName = props.dealname ?? `HubSpot Deal ${hsDeal.id}`;
            const amount = parseFloat(props.amount ?? '0') || 0;
            const probability = parseFloat(props.hs_deal_stage_probability ?? '0') / 100;
            let closeDate;
            if (props.closedate) {
                closeDate = new Date(props.closedate);
            }
            else {
                closeDate = period?.endDate ?? new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
            }
            const isClosedWon = mappedStage === 'Closed Won';
            const isClosedLost = false;
            const existing = await this.prisma.crmDeal.findFirst({
                where: { tenantId: tenantId, dealName, hubspotId: hsDeal.id },
            }).catch(() => null);
            if (existing) {
                const updated = await this.prisma.crmDeal.update({
                    where: { id: existing.id },
                    data: { stage: mappedStage, amount, closeDate, probability, isClosedWon, isClosedLost },
                });
                imported.push(updated);
            }
            else {
                const created = await this.prisma.crmDeal.create({
                    data: {
                        tenantId: tenantId,
                        dealName,
                        stage: mappedStage,
                        amount,
                        closeDate,
                        probability,
                        isClosedWon,
                        isClosedLost,
                        hubspotId: hsDeal.id,
                        region: 'Americas',
                    },
                });
                imported.push(created);
            }
        }
        return {
            imported: imported.length,
            deals: imported,
            message: `Successfully synced ${imported.length} deal(s) from HubSpot.`,
        };
    }
    disconnect(tenantId) {
        tokenStore.delete(tenantId);
        return { disconnected: true };
    }
};
exports.HubSpotService = HubSpotService;
exports.HubSpotService = HubSpotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        hubspot_client_service_1.HubSpotClientService])
], HubSpotService);
//# sourceMappingURL=hubspot.service.js.map