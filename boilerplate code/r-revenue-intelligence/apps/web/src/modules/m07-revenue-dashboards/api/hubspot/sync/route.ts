import { prisma } from "@/modules/m07-revenue-dashboards/lib/prisma";
import { NextResponse } from "next/server";
const TENANT_ID = "11111111-1111-1111-1111-111111111111";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Exchange a refresh_token for a new access_token and persist both to DB */
async function refreshAccessToken(
  dataSourceId: string,
  refreshToken: string,
): Promise<string | null> {
  const clientId     = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  try {
    const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "refresh_token",
        client_id:     clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) { console.error("Sync token refresh failed:", await res.text()); return null; }
    const data = await res.json();
    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data:  { accessToken: data.access_token, refreshToken: data.refresh_token },
    });
    return data.access_token;
  } catch (e) { console.error("Sync token refresh error:", e); return null; }
}

/** Fetch wrapper — retries exactly once on 401 with a fresh token */
async function hubFetch(
  url: string,
  opts: RequestInit,
  dataSource: any,
): Promise<{ res: Response; token: string }> {
  let token = dataSource.accessToken;
  let res = await fetch(url, {
    ...opts,
    headers: { ...(opts.headers ?? {}), Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 && dataSource.refreshToken) {
    console.log("Sync: access token expired — refreshing…");
    const newToken = await refreshAccessToken(dataSource.id, dataSource.refreshToken);
    if (newToken) {
      token = newToken;
      res = await fetch(url, {
        ...opts,
        headers: { ...(opts.headers ?? {}), Authorization: `Bearer ${token}` },
      });
    }
  }
  return { res, token };
}

/** Map HubSpot internal stage IDs → readable names */
function normalizeStage(stage: string): string {
  const map: Record<string, string> = {
    appointmentscheduled:  "Discovery",
    qualifiedtobuy:        "Discovery",
    presentationscheduled: "Proposal",
    decisionmakerboughtin: "Proposal",
    contractsent:          "Negotiation",
    closedwon:             "Closed Won",
    closedlost:            "Closed Lost",
  };
  return map[stage?.toLowerCase()] ?? stage ?? "Unknown";
}

/** Derive fiscal quarter label matching computeDashboardRows format: "Q2-2026" */
function toQuarter(closeDateStr: string | null): string {
  const d = closeDateStr ? new Date(closeDateStr) : null;
  if (!d || isNaN(d.getTime())) {
    const now = new Date();
    return `Q${Math.ceil((now.getMonth() + 1) / 3)}-${now.getFullYear()}`;
  }
  return `Q${Math.ceil((d.getMonth() + 1) / 3)}-${d.getFullYear()}`;
}

// ── HubSpot API helpers ───────────────────────────────────────────────────────

/**
 * Fetch all owners with full pagination (fixes the 100-owner cap).
 * Returns { ownerId → "First Last" }.
 */
async function fetchOwnersMap(
  dataSource: any,
  token: string,
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  let after: string | undefined;

  do {
    const url = new URL("https://api.hubapi.com/crm/v3/owners");
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);

    const { res } = await hubFetch(url.toString(), {}, { ...dataSource, accessToken: token });
    if (!res.ok) { console.warn("Owners fetch failed:", res.status); break; }
    const data = await res.json();

    for (const owner of data.results ?? []) {
      map[owner.id] =
        `${owner.firstName ?? ""} ${owner.lastName ?? ""}`.trim() || owner.email || owner.id;
    }
    after = data.paging?.next?.after;
  } while (after);

  return map;
}

/**
 * Fetch deals — two modes:
 *  • sinceMs defined → INCREMENTAL via search API (hs_lastmodifieddate >= sinceMs)
 *  • sinceMs undefined → FULL via standard list endpoint with cursor pagination
 */
async function fetchDeals(
  dataSource: any,
  properties: string[],
  sinceMs?: number,
): Promise<{ deals: any[]; token: string }> {
  const deals: any[] = [];
  let after: string | undefined;
  let currentToken = dataSource.accessToken;

  if (sinceMs !== undefined) {
    // ── Incremental: HubSpot Search API ──────────────────────────────────────
    do {
      const body: Record<string, any> = {
        filterGroups: [{
          filters: [{
            propertyName: "hs_lastmodifieddate",
            operator:     "GTE",
            value:        String(sinceMs),
          }],
        }],
        properties,
        limit: 100,
        sorts: [{ propertyName: "hs_lastmodifieddate", direction: "ASCENDING" }],
      };
      if (after) body.after = after;

      const { res, token } = await hubFetch(
        "https://api.hubapi.com/crm/v3/objects/deals/search",
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        },
        { ...dataSource, accessToken: currentToken },
      );
      currentToken = token;
      if (!res.ok) throw new Error(`HubSpot deals search failed: ${await res.text()}`);
      const data = await res.json();
      deals.push(...(data.results ?? []));
      after = data.paging?.next?.after;
    } while (after);
  } else {
    // ── Full: standard paginated list ────────────────────────────────────────
    do {
      const url = new URL("https://api.hubapi.com/crm/v3/objects/deals");
      url.searchParams.set("limit", "100");
      url.searchParams.set("properties", properties.join(","));
      if (after) url.searchParams.set("after", after);

      const { res, token } = await hubFetch(url.toString(), {}, { ...dataSource, accessToken: currentToken });
      currentToken = token;
      if (!res.ok) throw new Error(`HubSpot deals fetch failed: ${await res.text()}`);
      const data = await res.json();
      deals.push(...(data.results ?? []));
      after = data.paging?.next?.after;
    } while (after);
  }

  return { deals, token: currentToken };
}

/**
 * Batch-fetch company info (name, industry, externalId) for all deal IDs.
 * Two round-trips: associations batch → companies batch.
 */
async function fetchCompanyInfo(
  dataSource: any,
  token: string,
  dealIds: string[],
): Promise<Record<string, { externalId: string; name: string; industry: string | null }>> {
  if (!dealIds.length) return {};

  // Step 1 — associations: deal → company
  const { res: assocRes } = await hubFetch(
    "https://api.hubapi.com/crm/v3/associations/deals/companies/batch/read",
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ inputs: dealIds.map(id => ({ id })) }),
    },
    { ...dataSource, accessToken: token },
  );
  if (!assocRes.ok) return {};
  const assocData = await assocRes.json();

  const companyIdByDeal: Record<string, string> = {};
  const allCompanyIds = new Set<string>();
  for (const result of assocData.results ?? []) {
    const cid = result.to?.[0]?.id;
    if (cid) { companyIdByDeal[result.from.id] = cid; allCompanyIds.add(cid); }
  }
  if (!allCompanyIds.size) return {};

  // Step 2 — batch read company properties
  const { res: companyRes } = await hubFetch(
    "https://api.hubapi.com/crm/v3/objects/companies/batch/read",
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        inputs:     Array.from(allCompanyIds).map(id => ({ id })),
        properties: ["name", "industry"],
      }),
    },
    { ...dataSource, accessToken: token },
  );

  const companyInfoById: Record<string, { externalId: string; name: string; industry: string | null }> = {};
  if (companyRes.ok) {
    for (const c of (await companyRes.json()).results ?? []) {
      companyInfoById[c.id] = {
        externalId: c.id,
        name:       c.properties?.name ?? "Unknown",
        industry:   c.properties?.industry ?? null,
      };
    }
  }

  const out: Record<string, { externalId: string; name: string; industry: string | null }> = {};
  for (const [dealId, cid] of Object.entries(companyIdByDeal)) {
    if (companyInfoById[cid]) out[dealId] = companyInfoById[cid];
  }
  return out;
}

// ── Route handlers ────────────────────────────────────────────────────────────

/**
 * POST /api/hubspot/sync
 *
 * Query params:
 *   ?mode=incremental  (default) — fetch only deals modified since last DB write
 *   ?mode=full         — fetch ALL deals; also removes stale deals from Postgres
 *
 * Improvements over v1:
 *  ✅ Paginated owner fetch  (no 100-owner cap)
 *  ✅ Dynamic deal properties from DataSourceField table  (not just 6 hardcoded)
 *  ✅ Incremental sync via HubSpot Search API  (hs_lastmodifieddate filter)
 *  ✅ Batched upserts via prisma.$transaction  (50 deals per batch)
 *  ✅ Stale-deal cleanup on full sync  (remove HubSpot-deleted deals)
 *  ✅ Company industry + externalId synced to Account table
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") ?? "incremental"; // "full" | "incremental"

    // 1. Load DataSource ───────────────────────────────────────────────────────
    const dataSource = await prisma.dataSource.findFirst({
      where:   { tenantId: TENANT_ID, sourceType: "hubspot" },
      orderBy: { createdAt: "desc" },
    });
    if (!dataSource?.accessToken) {
      return NextResponse.json(
        { error: "HubSpot is not connected. Please connect via OAuth first." },
        { status: 400 },
      );
    }

    // 2. Build dynamic property list from registered fields ───────────────────
    // Falls back to core properties if field sync has not been run yet.
    const CORE_PROPS = [
      "dealname", "amount", "closedate", "dealstage",
      "hubspot_owner_id", "hs_lastmodifieddate", "pipeline",
    ];

    const meta = (prisma as any);
    const dealsObj = meta.dataSourceObject
      ? await meta.dataSourceObject.findFirst({
          where:   { dataSourceId: dataSource.id, objectName: "deals" },
          include: { fields: { select: { fieldName: true } } },
        })
      : null;

    const registeredFields: string[] = dealsObj?.fields?.map((f: any) => f.fieldName) ?? [];
    // HubSpot allows max 100 properties per request — always keep core fields
    const properties = Array.from(new Set([...CORE_PROPS, ...registeredFields])).slice(0, 100);

    console.log(`Sync: requesting ${properties.length} deal properties`);

    // 3. Determine incremental cutoff ─────────────────────────────────────────
    let sinceMs: number | undefined;
    if (mode === "incremental") {
      const latestDeal = await prisma.deal.findFirst({
        where:   { tenantId: TENANT_ID },
        orderBy: { updatedAt: "desc" },
        select:  { updatedAt: true },
      });
      if (latestDeal?.updatedAt) {
        // 5-minute buffer to handle clock skew / near-simultaneous updates
        sinceMs = latestDeal.updatedAt.getTime() - 5 * 60 * 1000;
        console.log(`Sync: incremental mode — fetching deals modified after ${new Date(sinceMs).toISOString()}`);
      } else {
        console.log("Sync: no existing deals — falling back to full sync");
      }
    } else {
      console.log("Sync: full mode — fetching all deals");
    }

    // 4. Fetch deals from HubSpot ─────────────────────────────────────────────
    const { deals: hubspotDeals, token: freshToken } =
      await fetchDeals(dataSource, properties, sinceMs);

    console.log(`Sync: received ${hubspotDeals.length} deals from HubSpot`);

    const liveDs = { ...dataSource, accessToken: freshToken };
    const dealIds = hubspotDeals.map((d: any) => d.id);

    // 5. Fetch owners (paginated) + company info (batched) in parallel ─────────
    const [ownersMap, companyInfoMap] = await Promise.all([
      fetchOwnersMap(liveDs, freshToken),
      fetchCompanyInfo(liveDs, freshToken, dealIds),
    ]);

    console.log(`Sync: resolved ${Object.keys(ownersMap).length} owners`);

    // 6. Transform HubSpot deals → internal shape ─────────────────────────────
    type TransformedDeal = {
      externalId:  string;
      name:        string;
      amount:      number;
      stage:       string;
      closeDate:   string | null;
      quarter:     string;
      ownerId:     string | null;
      ownerName:   string;
      companyInfo: { externalId: string; name: string; industry: string | null } | null;
    };

    const transformed: TransformedDeal[] = hubspotDeals.map((d: any) => {
      const p        = d.properties ?? {};
      const stage    = normalizeStage(p.dealstage);
      const closeDate = p.closedate ?? null;
      const ownerId  = p.hubspot_owner_id ?? null;

      return {
        externalId:  d.id,
        name:        p.dealname ?? `Deal ${d.id}`,
        amount:      parseFloat(p.amount ?? "0") || 0,
        stage,
        closeDate,
        quarter:     toQuarter(closeDate),
        ownerId,
        ownerName:   ownerId ? (ownersMap[ownerId] ?? ownerId) : "Unassigned",
        companyInfo: companyInfoMap[d.id] ?? null,
      };
    });

    // 7. Upsert Accounts (deduplicated) ───────────────────────────────────────
    // Collect unique companies first so each is upserted exactly once.
    const uniqueCompanies = new Map<
      string,
      { externalId: string; name: string; industry: string | null; ownerName: string }
    >();
    for (const deal of transformed) {
      if (deal.companyInfo && !uniqueCompanies.has(deal.companyInfo.externalId)) {
        uniqueCompanies.set(deal.companyInfo.externalId, {
          ...deal.companyInfo,
          ownerName: deal.ownerName,
        });
      }
    }

    // Map hubspot company externalId → our DB account id
    const accountIdByExtId: Record<string, string> = {};

    for (const [extId, info] of Array.from(uniqueCompanies.entries())) {
      const dbId = `acct_${TENANT_ID}_${extId}`;
      await prisma.account.upsert({
        where:  { id: dbId },
        update: {
          name:      info.name,
          industry:  info.industry,
          ownerName: info.ownerName,
        },
        create: {
          id:         dbId,
          tenantId:   TENANT_ID,
          externalId: extId,
          name:       info.name,
          industry:   info.industry,
          ownerName:  info.ownerName,
        },
      });
      accountIdByExtId[extId] = dbId;
    }

    console.log(`Sync: upserted ${uniqueCompanies.size} accounts`);

    // 8. Batch-upsert Deals (50 per transaction) ──────────────────────────────
    const BATCH_SIZE = 50;
    let upserted = 0;

    for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
      const batch = transformed.slice(i, i + BATCH_SIZE);

      await prisma.$transaction(
        batch.map((deal) => {
          const accountId = deal.companyInfo
            ? (accountIdByExtId[deal.companyInfo.externalId] ?? undefined)
            : undefined;

          const dealId = `${TENANT_ID}_${deal.externalId}`;

          return prisma.deal.upsert({
            where:  { id: dealId },
            update: {
              name:      deal.name,
              amount:    deal.amount,
              stage:     deal.stage,
              closeDate: deal.closeDate ? new Date(deal.closeDate) : null,
              quarter:   deal.quarter,
              ownerId:   deal.ownerId,
              accountId: accountId ?? null,
              isWon:     deal.stage === "Closed Won",
            },
            create: {
              id:         dealId,
              tenantId:   TENANT_ID,
              externalId: deal.externalId,
              name:       deal.name,
              amount:     deal.amount,
              stage:      deal.stage,
              closeDate:  deal.closeDate ? new Date(deal.closeDate) : null,
              quarter:    deal.quarter,
              ownerId:    deal.ownerId,
              accountId:  accountId ?? null,
              isWon:      deal.stage === "Closed Won",
            },
          });
        }),
      );

      upserted += batch.length;
    }

    // 9. Cleanup — only on full sync ──────────────────────────────────────────
    // Remove deals that exist in our DB but have been deleted from HubSpot.
    let deleted = 0;
    if (mode === "full" && hubspotDeals.length > 0) {
      const freshExternalIds = hubspotDeals.map((d: any) => d.id);
      const result = await prisma.deal.deleteMany({
        where: {
          tenantId:   TENANT_ID,
          externalId: { not: null, notIn: freshExternalIds },
        },
      });
      deleted = result.count;
      if (deleted > 0) console.log(`Sync: removed ${deleted} stale deals`);
    }

    const syncMode = sinceMs !== undefined ? "incremental" : "full";
    return NextResponse.json({
      success:            true,
      mode:               syncMode,
      synced:             upserted,
      accountsUpserted:   uniqueCompanies.size,
      deleted,
      propertiesRequested: properties.length,
      message: `[${syncMode}] Synced ${upserted} deals, ${uniqueCompanies.size} accounts${deleted ? `, removed ${deleted} stale deals` : ""}.`,
    });
  } catch (err: any) {
    console.error("HubSpot sync error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/hubspot/sync
 * Quick status check — how many deals & accounts are in Postgres right now.
 */
export async function GET() {
  try {
    const [dealsCount, accountsCount, latestDeal] = await Promise.all([
      prisma.deal.count({ where: { tenantId: TENANT_ID } }),
      prisma.account.count({ where: { tenantId: TENANT_ID } }),
      prisma.deal.findFirst({
        where:   { tenantId: TENANT_ID },
        orderBy: { updatedAt: "desc" },
        select:  { updatedAt: true },
      }),
    ]);

    return NextResponse.json({
      dealsInDatabase:    dealsCount,
      accountsInDatabase: accountsCount,
      lastSyncedAt:       latestDeal?.updatedAt ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
