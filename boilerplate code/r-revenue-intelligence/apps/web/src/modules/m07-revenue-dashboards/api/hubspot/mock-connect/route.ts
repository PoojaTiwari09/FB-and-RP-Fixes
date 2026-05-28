import { prisma } from "@/modules/m07-revenue-dashboards/lib/prisma";
import { NextResponse } from "next/server";
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DEMO_TOKEN = 'hubspot_demo_connected_token';

export async function POST(request: Request) {
  try {
    let token = DEMO_TOKEN;
    try {
      const body = await request.json();
      if (body?.token) token = body.token;
    } catch (_) {}

    await prisma.dataSource.deleteMany({
      where: { tenantId: TENANT_ID, sourceType: 'hubspot' },
    });

    await prisma.dataSource.create({
      data: {
        tenantId: TENANT_ID,
        sourceName: token === DEMO_TOKEN ? 'HubSpot CRM (Demo)' : 'HubSpot CRM (Live)',
        sourceType: 'hubspot',
        accessToken: token,
        refreshToken: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
