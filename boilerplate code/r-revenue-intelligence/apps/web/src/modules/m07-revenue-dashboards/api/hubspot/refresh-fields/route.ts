import { prisma } from "@/modules/m07-revenue-dashboards/lib/prisma";
import { NextResponse } from "next/server";
const TENANT_ID = '11111111-1111-1111-1111-111111111111';

function metaDelegates(db: any) {
  return {
    object: db.dataSourceObject ?? db.crmObject,
    field:  db.dataSourceField  ?? db.crmField,
  };
}

/** Refresh an expired HubSpot access token using the stored refresh token */
async function refreshAccessToken(dataSourceId: string, refreshToken: string): Promise<string | null> {
  const clientId     = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        client_id:     clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      console.error('Token refresh failed:', await res.text());
      return null;
    }

    const data = await res.json();
    const newAccessToken  = data.access_token;
    const newRefreshToken = data.refresh_token;

    // Persist new tokens to DB
    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data:  { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });

    return newAccessToken;
  } catch (e) {
    console.error('Token refresh error:', e);
    return null;
  }
}

/** Fetch all properties for an object from HubSpot, auto-refreshing token if expired */
async function fetchAllProperties(
  objectName: string,
  accessToken: string,
  dataSourceId: string,
  refreshToken: string | null
): Promise<{ props: any[]; newToken: string }> {
  let token = accessToken;

  const tryFetch = async (t: string) =>
    fetch(`https://api.hubapi.com/crm/v3/properties/${objectName}`, {
      headers: { Authorization: `Bearer ${t}` },
    });

  let res = await tryFetch(token);

  // 401 = token expired — try to refresh
  if (res.status === 401 && refreshToken) {
    console.log(`Access token expired for ${objectName}, refreshing...`);
    const refreshed = await refreshAccessToken(dataSourceId, refreshToken);
    if (refreshed) {
      token = refreshed;
      res = await tryFetch(token);
    }
  }

  if (!res.ok) {
    const body = await res.text();
    console.error(`HubSpot properties fetch failed [${objectName}] ${res.status}:`, body);
    return { props: [], newToken: token };
  }

  const data = await res.json();
  // Keep only visible, user-facing fields — exclude hidden system properties
  const props = (data.results || []).filter(
    (p: any) => !p.hidden && p.type !== 'unknown'
  );
  return { props, newToken: token };
}

// All objects we want to support — we try every one; those without scope are skipped gracefully
const ALL_SUPPORTED_OBJECTS = [
  { name: 'deals',      display: 'Deals' },
  { name: 'companies',  display: 'Companies' },
  { name: 'contacts',   display: 'Contacts' },
  { name: 'tickets',    display: 'Tickets' },
  { name: 'quotes',     display: 'Quotes' },
  { name: 'line_items', display: 'Line Items' },
  { name: 'calls',      display: 'Calls' },
  { name: 'meetings',   display: 'Meetings' },
  { name: 'tasks',      display: 'Tasks' },
  { name: 'notes',      display: 'Notes' },
  { name: 'emails',     display: 'Emails' },
];

export async function POST() {
  try {
    const meta = metaDelegates(prisma as any);
    if (!meta.object || !meta.field) {
      return NextResponse.json({
        error: 'Prisma delegates missing — stop the dev server, run `cd packages/database && npx prisma generate`, then restart.',
      }, { status: 500 });
    }

    // 1. Load DataSource
    const dataSource = await prisma.dataSource.findFirst({
      where:   { tenantId: TENANT_ID, sourceType: 'hubspot' },
      orderBy: { createdAt: 'desc' },
    });

    if (!dataSource) {
      return NextResponse.json({ error: 'No HubSpot connection found. Connect HubSpot first.' }, { status: 404 });
    }
    if (!dataSource.accessToken || dataSource.accessToken === 'mock_postgres_access_token') {
      return NextResponse.json({ error: 'No real HubSpot access token stored. This is a mock connection.' }, { status: 400 });
    }

    // 2. Load already-registered objects
    const existingObjects = await meta.object.findMany({ where: { dataSourceId: dataSource.id } });
    const existingNames   = new Set(existingObjects.map((o: any) => o.objectName));

    let currentToken = dataSource.accessToken;
    const results:  Record<string, number> = {};
    const skipped:  string[] = [];
    const newlyAdded: string[] = [];

    // 3. Process every supported object — update existing, discover new
    for (const objDef of ALL_SUPPORTED_OBJECTS) {
      try {
        const { props, newToken } = await fetchAllProperties(
          objDef.name,
          currentToken,
          dataSource.id,
          dataSource.refreshToken,
        );
        currentToken = newToken;

        // HubSpot returned no properties → scope not granted or object unavailable
        if (props.length === 0) {
          skipped.push(objDef.name);
          continue;
        }

        let dbObj = existingObjects.find((o: any) => o.objectName === objDef.name);

        if (dbObj) {
          // Existing object — wipe and re-insert fields
          await meta.field.deleteMany({ where: { objectId: dbObj.id } });
        } else {
          // New object discovered — register it
          dbObj = await meta.object.create({
            data: { dataSourceId: dataSource.id, objectName: objDef.name, displayName: objDef.display },
          });
          newlyAdded.push(objDef.display);
        }

        await meta.field.createMany({
          skipDuplicates: true,
          data: props.map((p: any) => ({
            objectId:    dbObj.id,
            fieldName:   p.name,
            displayName: p.label || p.name,
            fieldType:   p.type,
          })),
        });

        results[objDef.name] = props.length;
        console.log(`✓ ${objDef.name}: ${props.length} fields${existingNames.has(objDef.name) ? '' : ' (NEW)'}`);
      } catch (objErr: any) {
        console.warn(`Warning: could not sync ${objDef.name}:`, objErr.message);
        skipped.push(objDef.name);
      }
    }

    const total      = Object.values(results).reduce((a, b) => a + b, 0);
    const syncedObjs = Object.keys(results).length;
    return NextResponse.json({
      success:    true,
      message:    `Synced ${total} fields across ${syncedObjs} objects from HubSpot.${newlyAdded.length ? ` Newly added: ${newlyAdded.join(', ')}.` : ''}`,
      breakdown:  results,
      newlyAdded,
      skipped,
    });
  } catch (err: any) {
    console.error('refresh-fields error:', err);
    return NextResponse.json({ error: err.message, stack: err.stack?.split('\n').slice(0, 5) }, { status: 500 });
  }
}
