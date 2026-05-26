import { NextResponse } from "next/server";
import { PrismaClient } from "@rri/database/node_modules/@prisma/client";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const TENANT_ID = "11111111-1111-1111-1111-111111111111";

async function refreshAccessToken(dataSourceId: string, refreshToken: string): Promise<string | null> {
  const clientId     = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  try {
    const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    await prisma.dataSource.update({ where: { id: dataSourceId }, data: { accessToken: data.access_token, refreshToken: data.refresh_token } });
    return data.access_token;
  } catch { return null; }
}

async function hubFetch(url: string, opts: RequestInit, dataSource: any): Promise<{ res: Response; token: string }> {
  let token = dataSource.accessToken;
  const doFetch = (t: string) =>
    fetch(url, { ...opts, headers: { ...(opts.headers ?? {}), Authorization: `Bearer ${t}` } });
  let res = await doFetch(token);
  if (res.status === 401 && dataSource.refreshToken) {
    const newToken = await refreshAccessToken(dataSource.id, dataSource.refreshToken);
    if (newToken) { token = newToken; res = await doFetch(token); }
  }
  return { res, token };
}

/**
 * GET /api/hubspot/goals
 *
 * Fetches HubSpot revenue goals using the crm.objects.goals.read scope.
 * Returns:
 *  {
 *    ownerTargets: { "ownerId": amount },   // keyed by HubSpot owner ID
 *    namedTargets: { "Goal Name": amount }, // keyed by goal name
 *    raw: [...]                             // raw HubSpot goal objects
 *  }
 *
 * Map ownerTargets to rep names using the owners list from your sync.
 */
export async function GET() {
  try {
    const dataSource = await prisma.dataSource.findFirst({
      where: { tenantId: TENANT_ID, sourceType: "hubspot" },
      orderBy: { createdAt: "desc" },
    });

    if (!dataSource?.accessToken || dataSource.accessToken === "mock_postgres_access_token") {
      return NextResponse.json({ error: "No live HubSpot connection." }, { status: 400 });
    }

    // Fetch goals — HubSpot Goals API (requires crm.objects.goals.read scope)
    const goalProps = [
      "hs_goal_name",
      "hs_goal_type",
      "hs_target_amount",
      "hs_start_datetime",
      "hs_end_datetime",
      "hs_assignee_owner_id",
      "hs_team_id",
      "hs_fiscal_year",
      "hs_fiscal_quarter",
    ].join(",");

    const { res, token } = await hubFetch(
      `https://api.hubapi.com/crm/v3/objects/goals?limit=100&properties=${goalProps}`,
      {},
      dataSource,
    );

    if (!res.ok) {
      const body = await res.text();
      // 403 = scope not granted, surface a helpful message
      if (res.status === 403) {
        return NextResponse.json({
          error: "Goals scope not granted. Add crm.objects.goals.read to your HubSpot app scopes and re-authenticate.",
          ownerTargets: {},
          namedTargets: {},
          raw: [],
        }, { status: 403 });
      }
      return NextResponse.json({ error: `HubSpot goals fetch failed: ${body}` }, { status: res.status });
    }

    // Persist refreshed token if changed
    if (token !== dataSource.accessToken) {
      await prisma.dataSource.update({ where: { id: dataSource.id }, data: { accessToken: token } });
    }

    const data = await res.json();
    const goals: any[] = data.results ?? [];

    // Build ownerTargets: { ownerId → total target amount }
    const ownerTargets: Record<string, number> = {};
    const namedTargets: Record<string, number> = {};

    for (const goal of goals) {
      const p = goal.properties ?? {};
      const amount  = parseFloat(p.hs_target_amount ?? "0") || 0;
      const ownerId = p.hs_assignee_owner_id;
      const name    = p.hs_goal_name ?? `Goal ${goal.id}`;

      if (ownerId && amount > 0) {
        ownerTargets[ownerId] = (ownerTargets[ownerId] ?? 0) + amount;
      }
      if (name && amount > 0) {
        namedTargets[name] = amount;
      }
    }

    return NextResponse.json({
      ownerTargets,   // { "12345": 150000 }  ← ownerId keys
      namedTargets,   // { "Q2 Revenue Goal": 500000 }
      total:          goals.length,
      raw:            goals,
    });
  } catch (err: any) {
    console.error("HubSpot Goals error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
