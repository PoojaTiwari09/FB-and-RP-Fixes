import { NextResponse } from 'next/server';
import { PrismaClient } from '@rri/database/node_modules/@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_TENANT = '11111111-1111-1111-1111-111111111111';
const DEFAULT_USER   = '22222222-2222-2222-2222-222222222222';

function resolveUser(request: Request, body?: Record<string, any>) {
  const url = new URL(request.url);
  return {
    userId:   request.headers.get('x-user-id')   || body?.userId   || url.searchParams.get('userId')   || DEFAULT_USER,
    tenantId: request.headers.get('x-tenant-id') || body?.tenantId || url.searchParams.get('tenantId') || DEFAULT_TENANT,
  };
}

// GET /api/dashboards/access?dashboardId=xxx — list all grants for a dashboard
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dashboardId = searchParams.get('dashboardId');
    if (!dashboardId) {
      return NextResponse.json({ error: 'dashboardId required' }, { status: 400 });
    }

    const grants = await (prisma as any).dashboardAccess.findMany({
      where: { dashboardId },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ grants });
  } catch (error: any) {
    console.error('GET /api/dashboards/access error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/dashboards/access — grant access
// Body: { dashboardId, userId, canEdit?, tenantId? }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId: grantedBy, tenantId } = resolveUser(request, body);
    const { dashboardId, userId, canEdit } = body;

    if (!dashboardId || !userId) {
      return NextResponse.json({ error: 'dashboardId and userId required' }, { status: 400 });
    }

    const grant = await (prisma as any).dashboardAccess.upsert({
      where: { dashboardId_userId: { dashboardId, userId } },
      update: { canEdit: canEdit === true, canView: true },
      create: {
        tenantId,
        dashboardId,
        userId,
        grantedBy,
        canView: true,
        canEdit: canEdit === true,
      },
    });
    return NextResponse.json({ success: true, grant });
  } catch (error: any) {
    console.error('POST /api/dashboards/access error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/dashboards/access — revoke access
// Body: { dashboardId, userId }
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { dashboardId, userId } = body;

    if (!dashboardId || !userId) {
      return NextResponse.json({ error: 'dashboardId and userId required' }, { status: 400 });
    }

    await (prisma as any).dashboardAccess.delete({
      where: { dashboardId_userId: { dashboardId, userId } },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/dashboards/access error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
