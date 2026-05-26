import { NextResponse } from "next/server";
import { PrismaClient } from "@rri/database/node_modules/@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const MOCK_TOKEN = 'mock_postgres_access_token';
const DEMO_TOKEN = 'hubspot_demo_connected_token';

export async function GET() {
  try {
    const dataSource = await prisma.dataSource.findFirst({
      where: { tenantId: TENANT_ID, sourceType: 'hubspot' },
      orderBy: { createdAt: 'desc' },
    });

    if (!dataSource) {
      return NextResponse.json({ status: 'not_connected', reason: 'No HubSpot data source found. Click "Connect HubSpot" in Dataset Builder.' });
    }

    if (!dataSource.accessToken || dataSource.accessToken === MOCK_TOKEN) {
      return NextResponse.json({ status: 'mock_only', reason: 'Connected to Mock CRM, not real HubSpot. Complete the OAuth flow to connect your HubSpot account.' });
    }

    // Demo connection — treat as fully connected, serve sample data
    if (dataSource.accessToken === DEMO_TOKEN) {
      return NextResponse.json({ status: 'connected', message: 'HubSpot connected (demo mode). Showing sample HubSpot CRM data.', dealCount: 20 });
    }

    // Test the token with a lightweight HubSpot API call
    const testRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=1&properties=dealname', {
      headers: { Authorization: `Bearer ${dataSource.accessToken}` },
    });

    if (testRes.status === 401) {
      // Try refresh
      const clientId     = process.env.HUBSPOT_CLIENT_ID;
      const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
      if (clientId && clientSecret && dataSource.refreshToken) {
        const refreshRes = await fetch('https://api.hubapi.com/oauth/v1/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type:    'refresh_token',
            client_id:     clientId,
            client_secret: clientSecret,
            refresh_token: dataSource.refreshToken,
          }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          await prisma.dataSource.update({
            where: { id: dataSource.id },
            data: { accessToken: refreshData.access_token, refreshToken: refreshData.refresh_token },
          });
          return NextResponse.json({ status: 'connected', message: 'Token refreshed successfully. HubSpot is connected.' });
        }
      }
      return NextResponse.json({ status: 'token_expired', reason: 'HubSpot access token has expired and refresh failed. Please re-authenticate via "Connect HubSpot".' });
    }

    if (testRes.status === 403) {
      return NextResponse.json({ status: 'scope_error', reason: 'HubSpot token lacks required scopes. Re-authenticate and grant all requested permissions.' });
    }

    if (!testRes.ok) {
      const body = await testRes.text();
      return NextResponse.json({ status: 'api_error', reason: `HubSpot API returned ${testRes.status}: ${body.slice(0, 200)}` });
    }

    const data = await testRes.json();
    const dealCount = data.total ?? data.results?.length ?? 0;
    return NextResponse.json({ status: 'connected', message: `HubSpot connected successfully. ${dealCount} deal(s) accessible.`, dealCount });

  } catch (error: any) {
    return NextResponse.json({ status: 'error', reason: error.message }, { status: 500 });
  }
}
