/**
 * POST   /api/dashboards/share  — generate (or regenerate) a share token for one dashboard
 * GET    /api/dashboards/share?token=xxx — return the shared dashboard (read-only)
 * DELETE /api/dashboards/share — revoke the share token for one dashboard
 *
 * Token storage: DashboardConfig.visibleWidgets is a JSON column repurposed to hold
 * a per-dashboard token map:
 *   { shareTokens: { [dashboardId]: { token, visibility, createdAt } } }
 *
 * This avoids a schema migration while keeping tokens properly scoped per-dashboard.
 */
import { NextResponse } from "next/server";
import { PrismaClient } from "@rri/database/node_modules/@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

const DEFAULT_TENANT = '11111111-1111-1111-1111-111111111111';
const DEFAULT_USER   = '22222222-2222-2222-2222-222222222222';

// ── Auth helper — same pattern as /api/dashboards/route.ts ────────────────────
function resolveUser(request: Request, body?: Record<string, any>) {
  const url = new URL(request.url);
  return {
    userId:   request.headers.get('x-user-id')   || body?.userId   || url.searchParams.get('userId')   || DEFAULT_USER,
    tenantId: request.headers.get('x-tenant-id') || body?.tenantId || url.searchParams.get('tenantId') || DEFAULT_TENANT,
  };
}

// ── Token store helpers ───────────────────────────────────────────────────────
type TokenEntry = { token: string; visibility: string; createdAt: string };
type TokenStore = { shareTokens: Record<string, TokenEntry> };

function readTokenStore(raw: any): TokenStore {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed.shareTokens === 'object') return parsed as TokenStore;
  } catch {}
  return { shareTokens: {} };
}

// ── Layout parsing (mirrors /api/dashboards/route.ts) ────────────────────────
function parseLayout(raw: any): any[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed && Array.isArray(parsed.dashboards)) return parsed.dashboards;
    if (parsed && Array.isArray(parsed.items))       return [{ id: 'main', items: parsed.items, target: parsed.target ?? 150000, access: 'PRIVATE' }];
    if (Array.isArray(parsed))                        return [{ id: 'main', items: parsed, target: 150000, access: 'PRIVATE' }];
  } catch {}
  return [];
}

// ── POST: create / regenerate share token for a specific dashboard ─────────────
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, tenantId } = resolveUser(request, body);

    const dashboardId = body.dashboardId as string | undefined;
    if (!dashboardId) {
      return NextResponse.json({ error: 'dashboardId is required' }, { status: 400 });
    }

    // Validate that this dashboard belongs to the requesting user
    const config = await prisma.dashboardConfig.findUnique({
      where: { tenantid_userid: { tenantid: tenantId, userid: userId } },
    });

    const dashboards = parseLayout(config?.layout);
    const dashboard  = dashboards.find((d: any) => d.id === dashboardId);
    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found or not owned by this user' }, { status: 404 });
    }

    // Reject share-link generation for PRIVATE dashboards
    const visibility = (body.visibility ?? dashboard.access ?? 'LINK') as string;
    if (visibility === 'PRIVATE') {
      return NextResponse.json({ error: 'Cannot create a share link for a PRIVATE dashboard. Change access to LINK first.' }, { status: 400 });
    }

    // Generate a cryptographically random URL-safe token
    const token = randomBytes(18).toString('base64url');

    // Read existing token store and upsert the entry for this dashboard
    const tokenStore = readTokenStore(config?.visibleWidgets);
    tokenStore.shareTokens[dashboardId] = { token, visibility, createdAt: new Date().toISOString() };

    await prisma.dashboardConfig.upsert({
      where:  { tenantid_userid: { tenantid: tenantId, userid: userId } },
      update: { visibleWidgets: tokenStore as any },
      create: {
        tenantId,
        userId,
        layout:          { dashboards: [] } as any,
        visibleWidgets:  tokenStore as any,
        dateRangeDefault: 'CURRENT_QUARTER',
      },
    });

    const { origin } = new URL(request.url);
    return NextResponse.json({
      success:    true,
      token,
      dashboardId,
      visibility,
      url: `${origin}/dashboards/shared/${token}`,
    });
  } catch (err: any) {
    console.error('Share POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── GET: read shared dashboard by token ──────────────────────────────────────
// Scans all DashboardConfig rows for a matching token (tenant filter recommended when auth lands).
// Enforces visibility: PRIVATE tokens return 403.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'token is required' }, { status: 400 });

    // Search all config rows (all tenants since we don't have real auth yet)
    const allConfigs = await prisma.dashboardConfig.findMany();

    let matchedConfig: any = null;
    let matchedDashboardId: string | null = null;
    let matchedEntry: TokenEntry | null = null;

    for (const cfg of allConfigs) {
      const store = readTokenStore(cfg.visibleWidgets);
      for (const [dashboardId, entry] of Object.entries(store.shareTokens)) {
        if (entry.token === token) {
          matchedConfig      = cfg;
          matchedDashboardId = dashboardId;
          matchedEntry       = entry;
          break;
        }
      }
      if (matchedConfig) break;
    }

    if (!matchedConfig || !matchedDashboardId || !matchedEntry) {
      return NextResponse.json({ error: 'Share link not found or has been revoked' }, { status: 404 });
    }

    // Enforce visibility: if the dashboard's access was changed back to PRIVATE, block access
    const dashboards = parseLayout(matchedConfig.layout);
    const dashboard  = dashboards.find((d: any) => d.id === matchedDashboardId);

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard no longer exists' }, { status: 404 });
    }

    const currentAccess = dashboard.access ?? matchedEntry.visibility;
    if (currentAccess === 'PRIVATE') {
      return NextResponse.json({ error: 'This dashboard is private. The owner has restricted access.' }, { status: 403 });
    }

    // Fetch deal data for the dashboard owner's tenant
    const deals = await prisma.deal.findMany({
      where:   { tenantId: matchedConfig.tenantid },
      include: { account: true },
    });

    const mappedDeals = deals.map((deal: any) => ({
      dealName:      deal.name,
      deal_name:     deal.name,
      amount:        Number(deal.amount),
      stage:         deal.stage,
      ownerName:     (deal as any).ownerName || deal.ownerId || 'Unknown',
      accountName:   deal.account?.name || 'Unknown',
      company_name:  deal.account?.name || 'Unknown',
      industry:      deal.account?.industry || '',
      quarter:       deal.quarter,
      closeDate:     deal.closeDate ? deal.closeDate.toISOString().split('T')[0] : '',
      close_date:    deal.closeDate ? deal.closeDate.toISOString().split('T')[0] : '',
      pipelineStage: deal.stage === 'Closed Won' || deal.stage === 'Closed Lost' ? 'Closed'
                   : deal.stage === 'Negotiation' ? 'Late'
                   : deal.stage === 'Proposal'   || deal.stage === 'Discovery' ? 'Mid' : 'Early',
      status: deal.stage === 'Closed Lost' ? 'Needs Attention'
            : deal.stage === 'Closed Won'  ? 'Won'
            : (deal as any).isWon          ? 'Won' : 'On Track',
    }));

    return NextResponse.json({
      readOnly:    true,
      dashboardId: matchedDashboardId,
      visibility:  currentAccess,
      title:       dashboard.title      || 'Shared Dashboard',
      target:      dashboard.target     ?? 150000,
      widgets:     dashboard.items      ?? [],
      deals:       mappedDeals,
      // Return the owner's saved filter state so the shared view renders with
      // the same time range the owner was using when they shared the dashboard.
      timeRange:   dashboard.timeRange  ?? 'ALL_TIME',
      dateFrom:    dashboard.dateFrom   ?? null,
      dateTo:      dashboard.dateTo     ?? null,
    });
  } catch (err: any) {
    console.error('Share GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE: revoke share token for a specific dashboard ───────────────────────
export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, tenantId } = resolveUser(request, body);

    const dashboardId = body.dashboardId as string | undefined;
    if (!dashboardId) {
      return NextResponse.json({ error: 'dashboardId is required' }, { status: 400 });
    }

    const config = await prisma.dashboardConfig.findUnique({
      where: { tenantid_userid: { tenantid: tenantId, userid: userId } },
    });

    if (!config) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    const tokenStore = readTokenStore(config.visiblewidgets);

    if (!tokenStore.shareTokens[dashboardId]) {
      return NextResponse.json({ error: 'No active share token for this dashboard' }, { status: 404 });
    }

    // Remove just this dashboard's token entry
    delete tokenStore.shareTokens[dashboardId];

    await prisma.dashboardConfig.update({
      where: { tenantid_userid: { tenantid: tenantId, userid: userId } },
      data:  { visibleWidgets: tokenStore as any },
    });

    return NextResponse.json({ success: true, message: 'Share token revoked successfully' });
  } catch (err: any) {
    console.error('Share DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
