import { NextResponse } from "next/server";
import { PrismaClient } from "@rri/database/node_modules/@prisma/client";
import { getDateBounds } from "@/modules/m07-revenue-dashboards/lib/sample-data";

const prisma = new PrismaClient();

const DEFAULT_TENANT = '11111111-1111-1111-1111-111111111111';
const DEFAULT_USER   = '22222222-2222-2222-2222-222222222222';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TargetConfig = {
  owners:    Record<string, number>;  // { "Rep Name" → quota }
  teams:     Record<string, number>;  // { "Team Name" → quota }
  quarterly: Record<string, number>;  // { "Q2-2026"  → amount }
};

export type SavedDashboard = {
  id:           string;
  title:        string;
  target:       number;
  items:        any[];
  status:       'draft' | 'published';
  starred:      boolean;
  access:       'PRIVATE' | 'TEAM' | 'LINK';
  datasetId?:   string;
  // ── Filter / scope state ──────────────────────────────────────────────────
  timeRange?:    'CURRENT_QUARTER' | 'LAST_QUARTER' | 'ALL_TIME' | 'CUSTOM_RANGE';
  /** ISO date string — only used when timeRange === 'CUSTOM_RANGE' */
  dateFrom?:     string | null;
  /** ISO date string — only used when timeRange === 'CUSTOM_RANGE' */
  dateTo?:       string | null;
  customer?:     string;
  team?:         string;
  metricFilter?: string;
  ownerFilter?:  string;
  viewScope?:    'all' | 'team' | 'personal';
  targetConfig?: TargetConfig;
  createdAt:    string;
  updatedAt:    string;
  // ── Sharing metadata (read-only, set by server on GET) ────────────────────
  sharedFrom?:  string;   // userId of the dashboard owner, present only on shared entries
  readOnly?:    boolean;  // true when dashboard was shared by another user
};

// ── Auth helper — reads userId/tenantId from headers > body > query > defaults ─
// Priority: x-user-id header (future real auth) > body field > query param > default
// This makes all four HTTP methods consistent and ready for a real auth layer.

function resolveUser(
  request: Request,
  body?: Record<string, any>
): { userId: string; tenantId: string } {
  const url = new URL(request.url);
  return {
    userId:   request.headers.get('x-user-id')   || body?.userId   || url.searchParams.get('userId')   || DEFAULT_USER,
    tenantId: request.headers.get('x-tenant-id') || body?.tenantId || url.searchParams.get('tenantId') || DEFAULT_TENANT,
  };
}

// ── Layout parsing (handles v1=array, v2=single-obj, v3=multi-dashboard) ──────

function parseLayout(raw: any): SavedDashboard[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    // v3 — multi-dashboard format: { dashboards: [...] }
    if (parsed && Array.isArray(parsed.dashboards)) {
      return parsed.dashboards as SavedDashboard[];
    }

    // v2 — single dashboard: { target, items, status, starred }
    if (parsed && Array.isArray(parsed.items)) {
      return [{
        id:        'main',
        title:     'Main Dashboard',
        target:    parsed.target  ?? 150000,
        items:     parsed.items,
        status:    parsed.status  ?? 'draft',
        starred:   parsed.starred ?? false,
        access:    'PRIVATE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
    }

    // v1 — raw widget array
    if (Array.isArray(parsed)) {
      return [{
        id:        'main',
        title:     'Main Dashboard',
        target:    150000,
        items:     parsed,
        status:    'draft',
        starred:   false,
        access:    'PRIVATE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
    }

    return [];
  } catch {
    return [];
  }
}

// ── GET — return all saved dashboards + shared dashboards + deals + snapshots ──
//
// Query params:
//   userId, tenantId — user context (falls back to defaults)
//   page             — pagination page number, default 1
//   limit            — dashboards per page, default 50

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { userId, tenantId } = resolveUser(request);

    // ── Pagination params ────────────────────────────────────────────────────
    const page  = Math.max(1, Number(url.searchParams.get('page'))  || 1);
    const limit = Math.max(1, Number(url.searchParams.get('limit')) || 50);
    const offset = (page - 1) * limit;

    // ── Optional date-range filtering at the DB level ────────────────────────
    // Callers may pass ?timeRange=CURRENT_QUARTER (or LAST_QUARTER / CUSTOM_RANGE)
    // plus ?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD for custom ranges.
    // When omitted the full deal table is returned (client-side filter still applies).
    const qTimeRange = url.searchParams.get('timeRange') ?? 'ALL_TIME';
    const qDateFrom  = url.searchParams.get('dateFrom');
    const qDateTo    = url.searchParams.get('dateTo');
    const { from: dbFrom, to: dbTo } = getDateBounds(qTimeRange, qDateFrom, qDateTo);

    // ── Optional owner scoping ────────────────────────────────────────────────
    const ownerIdsParam = url.searchParams.get('ownerIds');
    const ownerIdParam  = url.searchParams.get('ownerId');
    const ownerIds = ownerIdsParam
      ? ownerIdsParam.split(',').map(s => s.trim()).filter(Boolean)
      : (ownerIdParam ? [ownerIdParam.trim()] : []);

    // ── Optional confidence score filter ─────────────────────────────────────
    const minConf = url.searchParams.get('minConfidence');
    const maxConf = url.searchParams.get('maxConfidence');

    const config = await prisma.dashboardConfig.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });

    const snapshots = await prisma.coachingsnapshots.findMany({
      where: { tenantid: tenantId, userid: userId },
      orderBy: { computedat: 'desc' },
      take: 1,
    });

    const deals = await prisma.deal.findMany({
      where: {
        tenantId,
        ...(ownerIds.length > 0 ? { ownerId: { in: ownerIds } } : {}),
        // DB-level date filter: only applied when a specific range is requested
        ...(dbFrom && dbTo
          ? { closeDate: { gte: dbFrom, lte: dbTo } }
          : {}),
        // Confidence score filters
        ...(minConf ? { confidenceScore: { gte: parseInt(minConf) } } : {}),
        ...(maxConf ? { confidenceScore: { lte: parseInt(maxConf) } } : {}),
      },
      include: { account: true },
      orderBy: { closeDate: 'desc' },
    });

    const mappedDeals = deals.map((deal: any) => ({
      dealName:      deal.name,
      amount:        Number(deal.amount),
      stage:         deal.stage,
      ownerName:     (deal as any).ownerName || deal.ownerId || 'Unknown',
      accountName:   deal.account?.name || 'Unknown',
      quarter:       deal.quarter,
      closeDate:     deal.closeDate ? deal.closeDate.toISOString().split('T')[0] : '',
      pipelineStage: deal.stage === 'Closed Won' || deal.stage === 'Closed Lost' ? 'Closed'
                   : deal.stage === 'Negotiation' ? 'Late'
                   : deal.stage === 'Proposal' || deal.stage === 'Discovery' ? 'Mid' : 'Early',
      status: deal.stage === 'Closed Lost' ? 'Needs Attention'
            : deal.stage === 'Closed Won'  ? 'Won'
            : deal.isWon                   ? 'Won' : 'On Track',
    }));

    // ── Own dashboards ───────────────────────────────────────────────────────
    const ownDashboards = parseLayout(config?.layout);

    // ── Sharing enforcement (read) ───────────────────────────────────────────
    // Fetch configs belonging to OTHER users in the same tenant.
    // Include only dashboards they have explicitly shared (access = TEAM or LINK).
    // PRIVATE dashboards from other users are never returned.
    const otherConfigs = await prisma.dashboardConfig.findMany({
      where: { tenantId, userId: { not: userId } },
    });

    const sharedDashboards: SavedDashboard[] = otherConfigs.flatMap((cfg: any) =>
      parseLayout(cfg.layout)
        .filter((d: SavedDashboard) => d.access === 'TEAM' || d.access === 'LINK')
        .map((d: SavedDashboard) => ({
          ...d,
          sharedFrom: cfg.userId,
          readOnly:   true,   // shared dashboards cannot be edited by non-owners
        }))
    );

    // Merge own + shared (dedup by id — own copy always wins)
    const seenIds = new Set(ownDashboards.map(d => d.id));
    const allDashboards = [
      ...ownDashboards,
      ...sharedDashboards.filter(d => !seenIds.has(d.id)),
    ];

    // ── Paginate ─────────────────────────────────────────────────────────────
    const total     = allDashboards.length;
    const paginated = allDashboards.slice(offset, offset + limit);

    return NextResponse.json({
      config,
      snapshots,
      deals:      mappedDeals,
      dashboards: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore:    offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('GET /api/dashboards error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST — save or update one dashboard ───────────────────────────────────────
// Body: { dashboardId?, title, widgets, target, status, starred, access, … }

export async function POST(request: Request) {
  try {
    const body               = await request.json();
    const { userId, tenantId } = resolveUser(request, body);

    // ── Duplicate action ────────────────────────────────────────────────────
    if (body.action === 'duplicate') {
      const sourceDashboardId = body.sourceDashboardId as string;
      if (!sourceDashboardId) return NextResponse.json({ error: 'sourceDashboardId required' }, { status: 400 });

      const config = await prisma.dashboardConfig.findUnique({
        where: { tenantId_userId: { tenantId, userId } }
      });
      const dashboards = parseLayout(config?.layout);
      const source = dashboards.find((d: any) => d.id === sourceDashboardId);
      if (!source) return NextResponse.json({ error: 'Source dashboard not found' }, { status: 404 });

      const newId = `dash_${Date.now()}`;
      const now2  = new Date().toISOString();
      const cloned = {
        ...source,
        id: newId,
        title: `${source.title} (Copy)`,
        access: 'PRIVATE' as const,
        status: 'draft' as const,
        starred: false,
        items: (source.items ?? []).map((w: any) => ({ ...w, id: `widget_${Date.now()}_${Math.random().toString(36).slice(2)}` })),
        createdAt: now2,
        updatedAt: now2,
      };
      dashboards.push(cloned);

      await prisma.dashboardConfig.upsert({
        where: { tenantId_userId: { tenantId, userId } },
        update: { layout: { dashboards } as any },
        create: { tenantId: tenantId, userId: userId, layout: { dashboards } as any, visibleWidgets: {} as any, dateRangeDefault: 'CURRENT_QUARTER' },
      });
      return NextResponse.json({ success: true, dashboard: cloned, dashboards });
    }

    const incomingId = body.dashboardId as string | undefined;
    const now        = new Date().toISOString();

    // Load existing config to get the current dashboards array
    const config = await prisma.dashboardConfig.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    const existingDashboards = parseLayout(config?.layout);

    const idx = incomingId ? existingDashboards.findIndex(d => d.id === incomingId) : -1;

    // ── Sharing enforcement (write) ──────────────────────────────────────────
    // If the incoming ID doesn't exist in this user's own config, check whether
    // it belongs to another user. If so, deny the write — edits must go to the
    // owner's own config. (Creating a brand-new dashboard with a fresh id is fine.)
    if (incomingId && idx < 0) {
      const otherConfigs = await prisma.dashboardConfig.findMany({
        where: { tenantId, userId: { not: userId } },
      });
      const existsElsewhere = otherConfigs.some((cfg: any) =>
        parseLayout(cfg.layout).some((d: SavedDashboard) => d.id === incomingId)
      );
      if (existsElsewhere) {
        return NextResponse.json(
          { error: 'Access denied: this dashboard belongs to another user and cannot be edited.' },
          { status: 403 }
        );
      }
    }

    // Build the updated dashboard entry
    const entry: SavedDashboard = {
      id:        incomingId || `dash_${Date.now()}`,
      title:     body.title   || 'Untitled Dashboard',
      target:    Number(body.target) || 150000,
      items:     Array.isArray(body.widgets) ? body.widgets : [],
      status:    body.status === 'published' ? 'published' : 'draft',
      starred:   body.starred === true,
      access:    ['PRIVATE', 'TEAM', 'LINK'].includes(body.access) ? body.access : 'PRIVATE',
      // Persist the dataset this dashboard is bound to
      datasetId: body.datasetId || (idx >= 0 ? existingDashboards[idx].datasetId : undefined),
      // Persist filter / scope state so the dashboard reopens exactly as left
      timeRange:    (['CURRENT_QUARTER','LAST_QUARTER','ALL_TIME','CUSTOM_RANGE'].includes(body.timeRange) ? body.timeRange : undefined)
                    ?? (idx >= 0 ? existingDashboards[idx].timeRange : 'CURRENT_QUARTER'),
      dateFrom:     body.dateFrom ?? (idx >= 0 ? existingDashboards[idx].dateFrom : null),
      dateTo:       body.dateTo   ?? (idx >= 0 ? existingDashboards[idx].dateTo   : null),
      customer:     body.customer     ?? (idx >= 0 ? existingDashboards[idx].customer    : 'All Customers'),
      team:         body.team         ?? (idx >= 0 ? existingDashboards[idx].team        : 'All Teams'),
      metricFilter: body.metricFilter ?? (idx >= 0 ? existingDashboards[idx].metricFilter: 'ALL'),
      ownerFilter:  body.ownerFilter  ?? (idx >= 0 ? existingDashboards[idx].ownerFilter : 'All Owners'),
      viewScope:    (['all','team','personal'].includes(body.viewScope) ? body.viewScope : undefined)
                    ?? (idx >= 0 ? existingDashboards[idx].viewScope : 'all'),
      // Persist per-owner / per-team / quarterly targets
      targetConfig: body.targetConfig
        ? {
            owners:    body.targetConfig.owners    ?? {},
            teams:     body.targetConfig.teams     ?? {},
            quarterly: body.targetConfig.quarterly ?? {},
          }
        : (idx >= 0 ? existingDashboards[idx].targetConfig : undefined),
      createdAt: idx >= 0 ? existingDashboards[idx].createdAt : now,
      updatedAt: now,
    };

    // Replace or append
    let updatedDashboards: SavedDashboard[];
    if (idx >= 0) {
      updatedDashboards = existingDashboards.map((d, i) => i === idx ? entry : d);
    } else {
      updatedDashboards = [...existingDashboards, entry];
    }

    const layout = { dashboards: updatedDashboards };

    const saved = await prisma.dashboardConfig.upsert({
      where:  { tenantId_userId: { tenantId, userId } },
      update: {
        layout:           layout as any,
        // Store the most-recently saved dashboard's timeRange as the default.
        // All 4 values (CURRENT_QUARTER, LAST_QUARTER, ALL_TIME, CUSTOM_RANGE) are persisted.
        dateRangeDefault: entry.timeRange ?? 'CURRENT_QUARTER',
      },
      create: {
        tenantId:         tenantId,
        userId:           userId,
        layout:           layout as any,
        visibleWidgets:   {} as any,  // token store lives here — do not overwrite with widget IDs
        dateRangeDefault: entry.timeRange ?? 'CURRENT_QUARTER',
      },
    });

    return NextResponse.json({
      success:    true,
      dashboard:  entry,
      dashboards: updatedDashboards,
      config:     saved,
    });
  } catch (error: any) {
    console.error('POST /api/dashboards error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── PATCH — lightweight partial update (star, title, access, status, filters) ──
// Body: { dashboardId, …fields to patch }

export async function PATCH(request: Request) {
  try {
    const body               = await request.json();
    const { userId, tenantId } = resolveUser(request, body);   // ← was hardcoded DEFAULT_USER

    const { dashboardId, ...patch } = body;
    if (!dashboardId) {
      return NextResponse.json({ error: 'dashboardId is required' }, { status: 400 });
    }

    const config = await prisma.dashboardConfig.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    const existing = parseLayout(config?.layout);
    const idx = existing.findIndex(d => d.id === dashboardId);

    // ── Sharing enforcement (write) ──────────────────────────────────────────
    if (idx < 0) {
      // Dashboard not in this user's config — check if it belongs to another user
      const otherConfigs = await prisma.dashboardConfig.findMany({
        where: { tenantId, userId: { not: userId } },
      });
      const existsElsewhere = otherConfigs.some((cfg: any) =>
        parseLayout(cfg.layout).some((d: SavedDashboard) => d.id === dashboardId)
      );
      if (existsElsewhere) {
        return NextResponse.json(
          { error: 'Access denied: this dashboard belongs to another user.' },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    // Allow patching only safe scalar fields — never overwrite items/widgets via PATCH
    const PATCHABLE = ['title', 'starred', 'access', 'status', 'timeRange', 'customer',
                       'team', 'metricFilter', 'ownerFilter', 'viewScope', 'target', 'datasetId'];
    const updated = { ...existing[idx], updatedAt: new Date().toISOString() };
    for (const key of PATCHABLE) {
      if (patch[key] !== undefined) (updated as any)[key] = patch[key];
    }

    const updatedList = existing.map((d, i) => i === idx ? updated : d);
    const layout = { dashboards: updatedList };

    await prisma.dashboardConfig.upsert({
      where:  { tenantId_userId: { tenantId, userId } },
      update: {
        layout:           layout as any,
        dateRangeDefault: updated.timeRange ?? 'CURRENT_QUARTER',
        // visiblewidgets not updated — data lives in layout JSON (column kept for schema compat)
      },
      create: {
        tenantId:         tenantId,
        userId:           userId,
        layout:           layout as any,
        visibleWidgets:   updated.items.map((w: any) => w.id),  // required for new row schema
        dateRangeDefault: updated.timeRange ?? 'CURRENT_QUARTER',
      },
    });

    return NextResponse.json({ success: true, dashboard: updated, dashboards: updatedList });
  } catch (error: any) {
    console.error('PATCH /api/dashboards error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE — remove a dashboard by id ─────────────────────────────────────────
// Query params: id=dash_123

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dashboardId        = searchParams.get('id');
    const { userId, tenantId } = resolveUser(request);   // ← was hardcoded DEFAULT_USER

    if (!dashboardId) {
      return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    }

    const config = await prisma.dashboardConfig.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    const existing = parseLayout(config?.layout);
    const idx      = existing.findIndex(d => d.id === dashboardId);

    // ── Sharing enforcement (write) ──────────────────────────────────────────
    if (idx < 0) {
      // Dashboard not in this user's config — check if it belongs to another user
      const otherConfigs = await prisma.dashboardConfig.findMany({
        where: { tenantId, userId: { not: userId } },
      });
      const existsElsewhere = otherConfigs.some((cfg: any) =>
        parseLayout(cfg.layout).some((d: SavedDashboard) => d.id === dashboardId)
      );
      if (existsElsewhere) {
        return NextResponse.json(
          { error: 'Access denied: only the owner can delete this dashboard.' },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    const updated = existing.filter(d => d.id !== dashboardId);

    await prisma.dashboardConfig.upsert({
      where:  { tenantId_userId: { tenantId, userId } },
      update: { layout: { dashboards: updated } as any },
      create: {
        tenantId:         tenantId,
        userId:           userId,
        layout:           { dashboards: updated } as any,
        visibleWidgets:   [],           // required for new row schema
        dateRangeDefault: 'CURRENT_QUARTER',
      },
    });

    return NextResponse.json({ success: true, dashboards: updated });
  } catch (error: any) {
    console.error('DELETE /api/dashboards error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
