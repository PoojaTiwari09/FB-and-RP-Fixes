import { NextResponse } from "next/server";
import { PrismaClient } from "@rri/database/node_modules/@prisma/client";
import { getDateBounds } from "@/modules/m07-revenue-dashboards/lib/sample-data";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
function resolveTenantId(request: Request): string {
  const url = new URL(request.url);
  return request.headers.get('x-tenant-id') || url.searchParams.get('tenantId') || TENANT_ID;
}

// ── Server-side in-memory cache ───────────────────────────────────────────────
// Survives between requests in production (single Node.js process).
// TTL = 2 minutes so data stays fresh without hitting DB on every page load.
const _cache = new Map<string, { deals: any[]; ts: number }>();
const CACHE_TTL = 120_000; // 2 minutes

function getCached(key: string): any[] | null {
  const entry = _cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.deals;
  return null;
}
function setCached(key: string, deals: any[]) {
  _cache.set(key, { deals, ts: Date.now() });
}

function toPipelineStage(stage: string): string {
  if (stage === 'Closed Won' || stage === 'Closed Lost') return 'Closed';
  if (stage === 'Negotiation')                            return 'Late';
  if (stage === 'Proposal' || stage === 'Discovery')      return 'Mid';
  return 'Early';
}

function toStatus(stage: string, isWon?: boolean): string {
  if (stage === 'Closed Lost') return 'Needs Attention';
  if (stage === 'Closed Won' || isWon) return 'Won';
  return 'On Track';
}

// ── HubSpot mock data ────────────────────────────────────────────────────────
// Used when a HubSpot dataset is selected but HubSpot is not connected.
// Completely different companies/values from crm_mock so dashboards look distinct.

const HUBSPOT_MOCK_DEALS = [
  { company: 'Salesforce',   owner: 'Alice Chen',    stage: 'Closed Won',  amount: 285000, q: 'Q1-2026', date: '2026-01-15', industry: 'SaaS',       region: 'North America' },
  { company: 'Microsoft',    owner: 'Bob Patel',     stage: 'Closed Won',  amount: 412000, q: 'Q1-2026', date: '2026-02-03', industry: 'Enterprise',  region: 'EMEA' },
  { company: 'Oracle',       owner: 'Carol James',   stage: 'Closed Lost', amount: 195000, q: 'Q1-2026', date: '2026-01-28', industry: 'Database',    region: 'APAC' },
  { company: 'Adobe',        owner: 'David Kim',     stage: 'Negotiation', amount: 320000, q: 'Q2-2026', date: '2026-04-10', industry: 'Creative',    region: 'North America' },
  { company: 'Stripe',       owner: 'Eva Rodriguez', stage: 'Closed Won',  amount: 178000, q: 'Q1-2026', date: '2026-03-20', industry: 'FinTech',     region: 'North America' },
  { company: 'Snowflake',    owner: 'Frank Liu',     stage: 'Proposal',    amount: 540000, q: 'Q2-2026', date: '2026-05-01', industry: 'Data Cloud',  region: 'North America' },
  { company: 'Atlassian',    owner: 'Alice Chen',    stage: 'Closed Won',  amount: 220000, q: 'Q2-2026', date: '2026-04-22', industry: 'Dev Tools',   region: 'APAC' },
  { company: 'Datadog',      owner: 'Bob Patel',     stage: 'Discovery',   amount: 165000, q: 'Q2-2026', date: '2026-05-18', industry: 'Observability', region: 'EMEA' },
  { company: 'Twilio',       owner: 'Carol James',   stage: 'Closed Won',  amount: 98000,  q: 'Q2-2026', date: '2026-04-05', industry: 'CPaaS',       region: 'North America' },
  { company: 'Salesforce',   owner: 'David Kim',     stage: 'Negotiation', amount: 390000, q: 'Q2-2026', date: '2026-05-30', industry: 'SaaS',       region: 'North America' },
  { company: 'Microsoft',    owner: 'Eva Rodriguez', stage: 'Closed Won',  amount: 502000, q: 'Q2-2026', date: '2026-04-18', industry: 'Enterprise',  region: 'EMEA' },
  { company: 'Adobe',        owner: 'Frank Liu',     stage: 'Closed Won',  amount: 275000, q: 'Q1-2026', date: '2026-03-10', industry: 'Creative',    region: 'APAC' },
  { company: 'Stripe',       owner: 'Alice Chen',    stage: 'Closed Lost', amount: 130000, q: 'Q2-2026', date: '2026-05-05', industry: 'FinTech',     region: 'North America' },
  { company: 'Snowflake',    owner: 'Bob Patel',     stage: 'Closed Won',  amount: 615000, q: 'Q1-2026', date: '2026-02-28', industry: 'Data Cloud',  region: 'North America' },
  { company: 'Atlassian',    owner: 'Carol James',   stage: 'Proposal',    amount: 188000, q: 'Q2-2026', date: '2026-05-12', industry: 'Dev Tools',   region: 'EMEA' },
  { company: 'Datadog',      owner: 'David Kim',     stage: 'Closed Won',  amount: 245000, q: 'Q1-2026', date: '2026-01-22', industry: 'Observability', region: 'North America' },
  { company: 'Twilio',       owner: 'Eva Rodriguez', stage: 'Negotiation', amount: 112000, q: 'Q2-2026', date: '2026-04-30', industry: 'CPaaS',       region: 'APAC' },
  { company: 'Oracle',       owner: 'Frank Liu',     stage: 'Closed Won',  amount: 360000, q: 'Q2-2026', date: '2026-05-25', industry: 'Database',    region: 'EMEA' },
  { company: 'Salesforce',   owner: 'Alice Chen',    stage: 'Closed Won',  amount: 430000, q: 'Q1-2026', date: '2026-03-01', industry: 'SaaS',       region: 'North America' },
  { company: 'Microsoft',    owner: 'Bob Patel',     stage: 'Discovery',   amount: 670000, q: 'Q2-2026', date: '2026-05-20', industry: 'Enterprise',  region: 'North America' },
].map((d, i) => ({
  id:            `hs-deal-${i + 1}`,
  deal_name:     `${d.company} - ${d.industry} Deal`,
  dealName:      `${d.company} - ${d.industry} Deal`,
  amount:        d.amount,
  stage:         d.stage,
  ownerName:     d.owner,
  owner_name:    d.owner,
  accountName:   d.company,
  company_name:  d.company,
  industry:      d.industry,
  region:        d.region,
  quarter:       d.q,
  close_date:    d.date,
  closeDate:     d.date,
  pipelineStage: toPipelineStage(d.stage),
  status:        toStatus(d.stage),
  source:        'hubspot',
}));

// ── crm_mock schema ──────────────────────────────────────────────────────────
// Builds a JOIN query based on the dataset's selectedObjects.
// Each different set of objects gives different columns → different widget data.
//
// crm_mock tables:
//   deals:      id, name, amount, stage, close_date, company_id, contact_id, created_at
//   companies:  id, name, industry, country, employee_count, created_at
//   contacts:   id, first_name, last_name, email, phone, company_id, lifecycle_stage, created_at
//   tickets:    id, subject, status, priority, company_id, created_at
//   activities: id, contact_id, type, duration_minutes, outcome, created_at

interface DateFilter { from: Date | null; to: Date | null; }

async function getMockDataForDataset(
  selectedObjects: string[],
  dateFilter: DateFilter = { from: null, to: null },
): Promise<any[]> {
  const objs = selectedObjects.map(o => o.toLowerCase());
  const wantCompanies  = objs.includes('companies');
  const wantContacts   = objs.includes('contacts');
  const wantTickets    = objs.includes('tickets');
  const wantActivities = objs.includes('activities');

  const selectCols: string[] = [
    'd.id',
    'd.name          AS deal_name',
    'd.amount',
    'd.stage',
    "TO_CHAR(d.close_date, 'YYYY-MM-DD') AS close_date",
    "CONCAT('Q', EXTRACT(QUARTER FROM d.close_date)::int, '-', EXTRACT(YEAR FROM d.close_date)::int) AS quarter",
  ];
  const joins: string[] = [];

  if (wantCompanies) {
    selectCols.push(
      'c.name           AS company_name',
      'c.industry',
      'c.country',
      'c.employee_count',
    );
    joins.push('LEFT JOIN crm_mock.companies c ON d.company_id = c.id');
  }

  if (wantContacts) {
    selectCols.push(
      "CONCAT(ct.first_name, ' ', ct.last_name) AS contact_name",
      'ct.email          AS contact_email',
      'ct.lifecycle_stage',
    );
    joins.push('LEFT JOIN crm_mock.contacts ct ON d.contact_id = ct.id');
  }

  if (wantTickets) {
    selectCols.push(
      'tk.subject  AS ticket_subject',
      'tk.status   AS ticket_status',
      'tk.priority AS ticket_priority',
    );
    joins.push('LEFT JOIN crm_mock.tickets tk ON tk.company_id = d.company_id');
  }

  if (wantActivities) {
    selectCols.push(
      'a.type             AS activity_type',
      'a.duration_minutes AS activity_duration',
      'a.outcome          AS activity_outcome',
    );
    joins.push('LEFT JOIN crm_mock.activities a ON a.contact_id = d.contact_id');
  }

  // DB-level date filter: pushed into WHERE clause so only matching rows are fetched
  const whereClauses: string[] = [];
  const params: any[] = [];
  if (dateFilter.from && dateFilter.to) {
    params.push(dateFilter.from.toISOString(), dateFilter.to.toISOString());
    whereClauses.push(`d.close_date >= $${params.length - 1}::timestamptz AND d.close_date <= $${params.length}::timestamptz`);
  }
  const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT ${selectCols.join(',\n      ')}
    FROM crm_mock.deals d
    ${joins.join('\n    ')}
    ${whereSQL}
    ORDER BY d.close_date DESC NULLS LAST
    LIMIT 500
  `;

  const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
  return rows.map((r: any) => ({
    ...r,
    amount:        Number(r.amount ?? 0),
    dealName:      r.deal_name     || 'Unknown',
    ownerName:     r.contact_name  || 'Unknown',
    accountName:   r.company_name  || 'Unknown',
    pipelineStage: toPipelineStage(r.stage || ''),
    status:        toStatus(r.stage || ''),
  }));
}

// ── public schema (Prisma deal table) ───────────────────────────────────────

async function getPostgresDeals(
  tenantId: string,
  dateFilter: DateFilter = { from: null, to: null },
  ownerIds: string[] = [],
): Promise<any[]> {
  const deals = await prisma.deal.findMany({
    where: {
      tenantId,
      ...(ownerIds.length > 0 ? { ownerId: { in: ownerIds } } : {}),
      ...(dateFilter.from && dateFilter.to
        ? { closeDate: { gte: dateFilter.from, lte: dateFilter.to } }
        : {}),
    },
    include: { account: true },
    orderBy: { closeDate: 'desc' },
  });

  return deals.map((deal: any) => ({
    dealName:      deal.name,
    deal_name:     deal.name,
    amount:        Number(deal.amount),
    stage:         deal.stage,
    ownerName:     deal.ownerName || deal.ownerId || 'Unknown',
    accountName:   deal.account?.name || 'Unknown',
    company_name:  deal.account?.name || 'Unknown',
    industry:      deal.account?.industry || '',
    quarter:       deal.quarter,
    closeDate:     deal.closeDate ? deal.closeDate.toISOString().split('T')[0] : '',
    close_date:    deal.closeDate ? deal.closeDate.toISOString().split('T')[0] : '',
    pipelineStage: toPipelineStage(deal.stage),
    status:        toStatus(deal.stage, deal.isWon),
  }));
}

// ── GET /api/datasets/data?source=mock|postgres|hubspot&datasetId=xxx ────────
//
// Optional date-range params (all three must be present for filtering):
//   timeRange  — CURRENT_QUARTER | LAST_QUARTER | ALL_TIME | CUSTOM_RANGE
//   dateFrom   — ISO date string, e.g. 2026-01-01  (only used with CUSTOM_RANGE)
//   dateTo     — ISO date string, e.g. 2026-03-31  (only used with CUSTOM_RANGE)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source    = searchParams.get('source')    ?? 'mock';
    const datasetId = searchParams.get('datasetId') ?? '';
    const tenantId  = resolveTenantId(request);
    const ownerIdsParam = searchParams.get('ownerIds');
    const ownerIdParam  = searchParams.get('ownerId');
    const ownerIds = ownerIdsParam
      ? ownerIdsParam.split(',').map(s => s.trim()).filter(Boolean)
      : (ownerIdParam ? [ownerIdParam.trim()] : []);

    // ── Date range params — fed into DB queries for server-side filtering ────
    const timeRange = searchParams.get('timeRange') ?? 'ALL_TIME';
    const dateFrom  = searchParams.get('dateFrom');
    const dateTo    = searchParams.get('dateTo');
    const dateFilter = getDateBounds(timeRange, dateFrom, dateTo);

    // ── Cache check — include date range in the key so filtered results are cached separately
    const cacheKey = `${tenantId}:${source}:${datasetId}:${timeRange}:${dateFrom ?? ''}:${dateTo ?? ''}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json({ deals: cached, source, count: cached.length, cached: true });
    }

    let deals: any[];

    if (source === 'hubspot') {
      // Check if a real private app token is stored — if so fetch live deals
      const DEMO_TOKEN = 'hubspot_demo_connected_token';
      const MOCK_TOKEN = 'mock_postgres_access_token';
      const ds = await prisma.dataSource.findFirst({
        where: { tenantId, sourceType: 'hubspot' },
        orderBy: { createdAt: 'desc' },
      });
      const liveToken = ds?.accessToken && ds.accessToken !== DEMO_TOKEN && ds.accessToken !== MOCK_TOKEN
        ? ds.accessToken : null;

      if (liveToken) {
        try {
          const res = await fetch(
            'https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,closedate,hubspot_owner_id',
            { headers: { Authorization: `Bearer ${liveToken}` } }
          );
          if (res.ok) {
            const json = await res.json();
            deals = (json.results || []).map((d: any) => {
              const props = d.properties || {};
              const stage = props.dealstage || 'Unknown';
              return {
                id:            d.id,
                dealName:      props.dealname || 'Unnamed Deal',
                deal_name:     props.dealname || 'Unnamed Deal',
                amount:        Number(props.amount || 0),
                stage,
                ownerName:     props.hubspot_owner_id || 'Unknown',
                accountName:   props.dealname?.split(' ')[0] || 'Unknown',
                company_name:  props.dealname?.split(' ')[0] || 'Unknown',
                industry:      '',
                region:        '',
                quarter:       props.closedate ? `Q${Math.ceil((new Date(props.closedate).getMonth()+1)/3)}-${new Date(props.closedate).getFullYear()}` : '',
                closeDate:     props.closedate || '',
                close_date:    props.closedate || '',
                pipelineStage: toPipelineStage(stage),
                status:        toStatus(stage),
                source:        'hubspot',
              };
            });
          } else {
            deals = HUBSPOT_MOCK_DEALS;
          }
        } catch (_) {
          deals = HUBSPOT_MOCK_DEALS;
        }
      } else {
        deals = HUBSPOT_MOCK_DEALS;
      }
    } else if (source === 'postgres') {
      deals = await getPostgresDeals(tenantId, dateFilter, ownerIds);
    } else {
      // mock — build JOIN based on dataset's selectedObjects
      let selectedObjects: string[] = ['deals'];

      if (datasetId) {
        const dataset = await prisma.dataset.findUnique({ where: { id: datasetId } });
        if (dataset?.selectedObjects) {
          const parsed = typeof dataset.selectedObjects === 'string'
            ? JSON.parse(dataset.selectedObjects)
            : dataset.selectedObjects;
          if (Array.isArray(parsed) && parsed.length > 0) {
            selectedObjects = parsed;
          }
        }
      }

      deals = await getMockDataForDataset(selectedObjects, dateFilter);
    }

    // Store in cache before returning
    setCached(cacheKey, deals);
    return NextResponse.json({ deals, source, count: deals.length });
  } catch (error: any) {
    console.error('GET /api/datasets/data error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
