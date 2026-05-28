import { prisma } from "@/modules/m07-revenue-dashboards/lib/prisma";
import { NextResponse } from "next/server";
function metadataDelegates(db: any) {
  return {
    object: db.dataSourceObject ?? db.crmObject,
    field: db.dataSourceField ?? db.crmField,
    relationship: db.dataSourceRelationship ?? db.crmRelationship,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json({ error: "HubSpot authorization was denied or failed." }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: "No authorization code provided." }, { status: 400 });
    }

    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    // Derive redirect URI from the actual request origin so it always matches
    // whatever port the server is running on — no hardcoding needed
    const { origin } = new URL(request.url);
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI || `${origin}/api/hubspot/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "HubSpot credentials missing in environment variables." }, { status: 500 });
    }

    // 1. Exchange code for access token
    const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("HubSpot Token Error:", err);
      return NextResponse.json({ error: "Failed to exchange authorization code for token." }, { status: tokenRes.status });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    const tenantId = '11111111-1111-1111-1111-111111111111';
    const meta = metadataDelegates(prisma as any);
    if (!meta.object || !meta.field || !meta.relationship) {
      throw new Error("Metadata layer Prisma delegates are missing. Run prisma generate or use compatible client.");
    }

    // 2. Wipe any existing HubSpot data source for this tenant to avoid duplicates
    const existing = await prisma.dataSource.findMany({
      where: { tenantId, sourceType: 'hubspot' },
      select: { id: true },
    });
    if (existing.length > 0) {
      const existingIds = existing.map((s: any) => s.id);
      const existingObjs = await meta.object.findMany({
        where: { dataSourceId: { in: existingIds } },
        select: { id: true },
      });
      const existingObjIds = existingObjs.map((o: any) => o.id);
      if (existingObjIds.length > 0) {
        await meta.relationship.deleteMany({
          where: { OR: [{ sourceObjectId: { in: existingObjIds } }, { targetObjectId: { in: existingObjIds } }] },
        });
        await meta.field.deleteMany({ where: { objectId: { in: existingObjIds } } });
        await meta.object.deleteMany({ where: { id: { in: existingObjIds } } });
      }
      await prisma.dataSource.deleteMany({ where: { id: { in: existingIds } } });
    }

    // 3. Save fresh Data Source to Postgres
    const dataSource = await prisma.dataSource.create({
      data: {
        tenantId,
        sourceName: 'HubSpot CRM (Live)',
        sourceType: 'hubspot',
        accessToken,
        refreshToken,
      }
    });

    // 4. Objects to fetch (matching registered scopes)
    const objectsToFetch = [
      // Core CRM
      { name: 'deals',      display: 'Deals' },
      { name: 'companies',  display: 'Companies' },
      { name: 'contacts',   display: 'Contacts' },
      // Extended CRM — fetched with graceful fallback if scope not granted
      { name: 'tickets',    display: 'Tickets' },
      { name: 'quotes',     display: 'Quotes' },
      { name: 'line_items', display: 'Line Items' },
      { name: 'calls',      display: 'Calls' },
      { name: 'meetings',   display: 'Meetings' },
      { name: 'tasks',      display: 'Tasks' },
      { name: 'notes',      display: 'Notes' },
      { name: 'emails',     display: 'Emails' },
    ];

    const createdObjects: Record<string, any> = {};

    for (const obj of objectsToFetch) {
      try {
        const propsRes = await fetch(`https://api.hubapi.com/crm/v3/properties/${obj.name}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Skip objects where the scope isn't granted (403) or object doesn't exist (404)
        if (!propsRes.ok) {
          console.log(`Skipping ${obj.name} — HTTP ${propsRes.status} (scope not granted or object not available)`);
          continue;
        }

        const propsData = await propsRes.json();
        const propertiesToInsert = (propsData.results || [])
          .filter((prop: any) => !prop.hidden && prop.type !== 'unknown')
          .map((prop: any) => ({
            fieldName: prop.name,
            displayName: prop.label || prop.name,
            fieldType: prop.type,
          }));

        // Only create the DB record if HubSpot confirmed the object exists
        const crmObj = await meta.object.create({
          data: { dataSourceId: dataSource.id, objectName: obj.name, displayName: obj.display }
        });
        createdObjects[obj.name] = crmObj;

        if (propertiesToInsert.length > 0) {
          await meta.field.createMany({
            data: propertiesToInsert.map((p: any) => ({ ...p, objectId: crmObj.id })),
            skipDuplicates: true,
          });
        }

        console.log(`✓ Synced ${obj.display}: ${propertiesToInsert.length} fields`);
      } catch (objErr: any) {
        console.warn(`Warning: could not sync ${obj.name}:`, objErr.message);
      }
    }

    // 5. Save standard HubSpot associations for all synced objects
    const associationPairs = [
      // Core
      { from: 'deals',      to: 'companies',  type: 'many_to_one'  },
      { from: 'contacts',   to: 'companies',  type: 'many_to_one'  },
      { from: 'deals',      to: 'contacts',   type: 'many_to_many' },
      // Extended
      { from: 'tickets',    to: 'companies',  type: 'many_to_one'  },
      { from: 'tickets',    to: 'contacts',   type: 'many_to_many' },
      { from: 'tickets',    to: 'deals',      type: 'many_to_many' },
      { from: 'quotes',     to: 'deals',      type: 'many_to_one'  },
      { from: 'line_items', to: 'quotes',     type: 'many_to_one'  },
      { from: 'calls',      to: 'contacts',   type: 'many_to_many' },
      { from: 'calls',      to: 'deals',      type: 'many_to_many' },
      { from: 'meetings',   to: 'contacts',   type: 'many_to_many' },
      { from: 'meetings',   to: 'deals',      type: 'many_to_many' },
      { from: 'notes',      to: 'contacts',   type: 'many_to_many' },
      { from: 'notes',      to: 'deals',      type: 'many_to_many' },
      { from: 'emails',     to: 'contacts',   type: 'many_to_many' },
    ];

    for (const pair of associationPairs) {
      const fromObj = createdObjects[pair.from];
      const toObj   = createdObjects[pair.to];
      if (!fromObj || !toObj) continue; // skip if either object wasn't synced

      try {
        await meta.relationship.create({
          data: {
            sourceObjectId: fromObj.id,
            targetObjectId: toObj.id,
            relationshipType: pair.type,
            sourceField: 'hubspot_id',
            targetField: `associated_${pair.to}_id`,
          }
        });
      } catch (relErr: any) {
        console.warn(`Warning: could not create ${pair.from}→${pair.to} relationship:`, relErr.message);
      }
    }

    // Redirect user back to the Dataset Builder UI
    return NextResponse.redirect(new URL('/datasets?hubspot_success=true', request.url));
  } catch (err: any) {
    console.error("HubSpot Callback Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
