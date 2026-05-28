import { prisma } from "@/modules/m07-revenue-dashboards/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

// ── Fix #7: In-memory cache (30 s TTL) ───────────────────────────────────────
type CacheEntry = { rows: any[]; hasMore: boolean; nextCursor: string | null; cachedAt: number };
const previewCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

function cacheKey(source: string, primaryObject: string, fields: string[], limit: number, after: string) {
  return `${source}:${primaryObject}:${[...fields].sort().join(',')}:${limit}:${after}`;
}
function getCached(key: string): CacheEntry | null {
  const entry = previewCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) { previewCache.delete(key); return null; }
  return entry;
}
function setCache(key: string, value: Omit<CacheEntry, 'cachedAt'>) {
  previewCache.set(key, { ...value, cachedAt: Date.now() });
  // Evict oldest entries if cache grows beyond 100 keys
  if (previewCache.size > 100) {
    const oldest = Array.from(previewCache.entries()).sort((a, b) => a[1].cachedAt - b[1].cachedAt)[0];
    previewCache.delete(oldest[0]);
  }
}

// ── Fix #1: Token auto-refresh ────────────────────────────────────────────────
async function refreshAccessToken(dataSourceId: string, refreshToken: string): Promise<string | null> {
  const clientId     = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  try {
    const res = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        client_id:     clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data:  { accessToken: data.access_token, refreshToken: data.refresh_token },
    });
    return data.access_token;
  } catch { return null; }
}

/** Fetch wrapper: auto-refresh on 401, throw typed error on 429 */
async function hubFetch(
  url: string,
  opts: RequestInit,
  dataSource: any,
): Promise<{ res: Response; token: string }> {
  let token = dataSource.accessToken;

  const doFetch = (t: string) =>
    fetch(url, { ...opts, headers: { ...(opts.headers ?? {}), Authorization: `Bearer ${t}` } });

  let res = await doFetch(token);

  // Fix #1: auto-refresh on 401
  if (res.status === 401 && dataSource.refreshToken) {
    const newToken = await refreshAccessToken(dataSource.id, dataSource.refreshToken);
    if (newToken) { token = newToken; res = await doFetch(token); }
  }

  // Fix #6: surface 429 as a named error
  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After') ?? '10';
    const err: any = new Error(`HubSpot rate limit reached. Retry after ${retryAfter}s.`);
    err.status = 429;
    err.retryAfter = parseInt(retryAfter, 10);
    throw err;
  }

  return { res, token };
}

// ── Fix #3: Dynamic field classification from DB ──────────────────────────────
/** Returns { objectName → [fieldNames] } using DataSourceField metadata in DB */
async function classifyFieldsFromDB(
  dataSourceId: string,
  fields: string[],
  primaryObject: string,
): Promise<Record<string, string[]>> {
  try {
    const meta = (prisma as any).dataSourceField;
    if (!meta) throw new Error('no delegate');

    const rows = await meta.findMany({
      where: { fieldName: { in: fields }, object: { dataSourceId } },
      include: { object: { select: { objectName: true } } },
    });

    const fieldToObject: Record<string, string> = {};
    for (const r of rows) fieldToObject[r.fieldName] = r.object.objectName;

    const grouped: Record<string, string[]> = {};
    for (const f of fields) {
      const obj = fieldToObject[f] ?? primaryObject; // default to primary if unknown
      if (!grouped[obj]) grouped[obj] = [];
      grouped[obj].push(f);
    }
    return grouped;
  } catch {
    // Fallback: all fields go to primary object
    return { [primaryObject]: fields };
  }
}

// ── Fix #2 + #4: Generic HubSpot object fetcher ───────────────────────────────
/** Fetch up to `limit` records for ANY HubSpot CRM object */
async function fetchObjectPage(
  objectName: string,
  properties: string[],
  limit: number,
  after: string,
  dataSource: any,
): Promise<{ records: any[]; nextCursor: string | null; token: string }> {
  if (!properties.length) properties = ['hs_object_id'];

  const url = new URL(`https://api.hubapi.com/crm/v3/objects/${objectName}`);
  url.searchParams.set('limit',      String(Math.min(limit, 100)));
  url.searchParams.set('properties', properties.join(','));
  if (after) url.searchParams.set('after', after);

  const { res, token } = await hubFetch(url.toString(), {}, dataSource);
  if (!res.ok) return { records: [], nextCursor: null, token };

  const data = await res.json();
  return {
    records:    data.results ?? [],
    nextCursor: data.paging?.next?.after ?? null,
    token,
  };
}

/** Batch-fetch association IDs: sourceObject → targetObject */
async function fetchAssociations(
  sourceObject: string,
  targetObject: string,
  sourceIds: string[],
  dataSource: any,
): Promise<Record<string, string>> {
  if (!sourceIds.length) return {};
  const { res } = await hubFetch(
    `https://api.hubapi.com/crm/v3/associations/${sourceObject}/${targetObject}/batch/read`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ inputs: sourceIds.map(id => ({ id })) }),
    },
    dataSource,
  );
  if (!res.ok) return {};
  const out: Record<string, string> = {};
  for (const r of (await res.json()).results ?? []) {
    const cid = r.to?.[0]?.id;
    if (cid) out[r.from.id] = cid;
  }
  return out;
}

/** Batch-fetch properties for a set of IDs */
async function fetchPropertiesBatch(
  objectName: string,
  ids: string[],
  properties: string[],
  dataSource: any,
): Promise<Record<string, Record<string, any>>> {
  if (!ids.length || !properties.length) return {};
  const { res } = await hubFetch(
    `https://api.hubapi.com/crm/v3/objects/${objectName}/batch/read`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ inputs: ids.map(id => ({ id })), properties }),
    },
    dataSource,
  );
  if (!res.ok) return {};
  const out: Record<string, Record<string, any>> = {};
  for (const r of (await res.json()).results ?? []) out[r.id] = r.properties ?? {};
  return out;
}

// ── Fix #2 + #4: Live HubSpot preview (any anchor object) ────────────────────
async function fetchHubSpotPreview(
  fields: string[],
  primaryObject: string,
  limit: number,
  after: string,
  dataSource: any,
): Promise<{ rows: any[]; hasMore: boolean; nextCursor: string | null }> {
  // 1. Classify fields by object using DB metadata
  const fieldsByObject = await classifyFieldsFromDB(dataSource.id, fields, primaryObject);

  const primaryFields = fieldsByObject[primaryObject] ?? fields;

  // 2. Fetch anchor records
  const { records, nextCursor, token } = await fetchObjectPage(
    primaryObject, primaryFields, limit, after, dataSource,
  );
  if (!records.length) return { rows: [], hasMore: false, nextCursor: null };

  // Update dataSource with possibly-refreshed token for subsequent calls
  const liveDs = { ...dataSource, accessToken: token };
  const recordIds = records.map((r: any) => r.id);

  // 3. Enrich with each associated object's fields
  const enrichedByRecord: Record<string, Record<string, any>> = {};
  for (const [assocObject, assocFields] of Object.entries(fieldsByObject)) {
    if (assocObject === primaryObject || !assocFields.length) continue;

    try {
      // Get association: primaryObject → assocObject
      const assocMap = await fetchAssociations(primaryObject, assocObject, recordIds, liveDs);
      const assocIds = Array.from(new Set(Object.values(assocMap)));
      if (!assocIds.length) continue;

      // Batch-fetch properties of the associated records
      const propMap = await fetchPropertiesBatch(assocObject, assocIds, assocFields, liveDs);

      // Map back to primary record IDs
      for (const [recordId, assocId] of Object.entries(assocMap)) {
        if (!enrichedByRecord[recordId]) enrichedByRecord[recordId] = {};
        Object.assign(enrichedByRecord[recordId], propMap[assocId] ?? {});
      }
    } catch (e) {
      console.warn(`Preview: enrichment from ${assocObject} failed:`, (e as any).message);
    }
  }

  // 4. Merge into flat rows
  const rows = records.map((record: any) => {
    const row: Record<string, any> = {};
    const primary   = record.properties ?? {};
    const enriched  = enrichedByRecord[record.id] ?? {};
    const merged    = { ...enriched, ...primary }; // primary wins on conflict

    fields.forEach(field => {
      const val = merged[field];
      row[field] = (val !== undefined && val !== null && val !== '') ? val : '-';
    });
    // Always include a record identifier
    row._id     = record.id;
    row._object = primaryObject;
    return row;
  });

  return { rows, hasMore: nextCursor !== null, nextCursor };
}

// ── Fix #5: Improved Postgres fallback ───────────────────────────────────────
async function fetchPostgresPreview(
  fields: string[],
  limit: number,
  offset: number,
): Promise<{ rows: any[]; hasMore: boolean; nextCursor: string | null }> {
  const deals = await prisma.deal.findMany({
    where:   { tenantId: TENANT_ID },
    include: { account: true },
    take:    limit + 1,   // fetch one extra to detect hasMore
    skip:    offset,
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = deals.length > limit;
  const page    = deals.slice(0, limit);

  // Comprehensive HubSpot → Postgres field map
  const HS_TO_PG: Record<string, (deal: any) => any> = {
    dealname:         d => d.name,
    deal_name:        d => d.name,
    amount:           d => Number(d.amount),
    dealstage:        d => d.stage,
    deal_stage:       d => d.stage,
    closedate:        d => d.closeDate ? new Date(d.closeDate).toISOString().split('T')[0] : null,
    close_date:       d => d.closeDate ? new Date(d.closeDate).toISOString().split('T')[0] : null,
    hubspot_owner_id: d => d.ownerId,
    ownerid:          d => d.ownerId,
    hs_object_id:     d => d.externalId,
    pipeline:         d => 'default',
    quarter:          d => d.quarter,
    iswon:            d => d.isWon,
    is_won:           d => d.isWon,
    // Account / company fields
    name:             d => d.account?.name,
    company:          d => d.account?.name,
    domain:           d => d.account?.name,
    industry:         d => d.account?.industry,
    account_name:     d => d.account?.name,
  };

  const rows = page.map((deal: any) => {
    const row: Record<string, any> = {};
    fields.forEach(field => {
      const resolver = HS_TO_PG[field.toLowerCase()];
      const val = resolver ? resolver(deal) : (deal as any)[field] ?? deal.account?.[field];
      row[field] = (val !== undefined && val !== null) ? val : '-';
    });
    row._id     = deal.id;
    row._object = 'deals';
    return row;
  });

  return {
    rows,
    hasMore,
    nextCursor: hasMore ? String(offset + limit) : null,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────
/**
 * GET /api/datasets/preview
 *
 * Query params:
 *   source        = hubspot | mock       (default: mock)
 *   fields        = comma-separated list (default: dealname,amount,dealstage,closedate)
 *   primaryObject = deals | contacts | companies | tickets | quotes |
 *                   line_items | calls | meetings | tasks | notes | emails
 *                   (default: deals)
 *   limit         = 5–50                 (default: 10)
 *   after         = cursor from prev response (HubSpot) or numeric offset (Postgres)
 *
 * Response:
 *   { rows, hasMore, nextCursor, cached, source, primaryObject, fieldCount }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source        = searchParams.get('source') || 'mock';
    const fieldsParam   = searchParams.get('fields') || '';
    const primaryObject = searchParams.get('primaryObject') || 'deals';
    const limitParam    = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 50);
    const after         = searchParams.get('after') || '';

    const fields = fieldsParam
      ? fieldsParam.split(',').map(f => f.trim()).filter(Boolean)
      : ['dealname', 'amount', 'dealstage', 'closedate'];

    // Fix #7: check cache
    const key    = cacheKey(source, primaryObject, fields, limitParam, after);
    const cached = getCached(key);
    if (cached) {
      return NextResponse.json({
        rows:          cached.rows,
        hasMore:       cached.hasMore,
        nextCursor:    cached.nextCursor,
        cached:        true,
        source,
        primaryObject,
        fieldCount:    fields.length,
      });
    }

    let rows: any[]            = [];
    let hasMore                = false;
    let nextCursor: string | null = null;

    if (source === 'hubspot') {
      // Load DataSource
      const dataSource = await prisma.dataSource.findFirst({
        where:   { tenantId: TENANT_ID, sourceType: 'hubspot' },
        orderBy: { createdAt: 'desc' },
      });

      if (!dataSource?.accessToken || dataSource.accessToken === 'mock_postgres_access_token') {
        return NextResponse.json(
          { error: 'No live HubSpot connection. Connect HubSpot first or use source=mock.' },
          { status: 400 },
        );
      }

      ({ rows, hasMore, nextCursor } = await fetchHubSpotPreview(
        fields, primaryObject, limitParam, after, dataSource,
      ));
    } else {
      // Fix #5: improved Postgres fallback with pagination
      const offset = parseInt(after || '0', 10) || 0;
      ({ rows, hasMore, nextCursor } = await fetchPostgresPreview(fields, limitParam, offset));
    }

    // Fix #7: populate cache
    setCache(key, { rows, hasMore, nextCursor });

    return NextResponse.json({
      rows,
      hasMore,
      nextCursor,
      cached:       false,
      source,
      primaryObject,
      fieldCount:   fields.length,
      // Fix #8: row count metadata
      rowCount:     rows.length,
    });
  } catch (error: any) {
    console.error('Preview route error:', error);

    // Fix #6: surface rate limit errors clearly
    if (error.status === 429) {
      return NextResponse.json(
        { error: error.message, retryAfter: error.retryAfter ?? 10 },
        { status: 429 },
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
