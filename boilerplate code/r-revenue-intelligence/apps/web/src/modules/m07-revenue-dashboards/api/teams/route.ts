import { prisma } from "@/modules/m07-revenue-dashboards/lib/prisma";
import { NextResponse } from 'next/server';
const DEFAULT_TENANT = '11111111-1111-1111-1111-111111111111';

function resolveUser(request: Request, body?: Record<string, any>) {
  const url = new URL(request.url);
  return {
    tenantId: request.headers.get('x-tenant-id') || body?.tenantId || url.searchParams.get('tenantId') || DEFAULT_TENANT,
  };
}

// Build a nested tree from a flat list of teams
function buildTree(teams: any[]): any[] {
  const map = new Map<string, any>();
  teams.forEach(t => map.set(t.id, { ...t, children: [] }));
  const roots: any[] = [];
  map.forEach(team => {
    if (team.parentId && map.has(team.parentId)) {
      map.get(team.parentId).children.push(team);
    } else {
      roots.push(team);
    }
  });
  return roots;
}

// GET /api/teams?tenantId=xxx — list all teams for tenant as a tree
export async function GET(request: Request) {
  try {
    const { tenantId } = resolveUser(request);
    const teams = await (prisma as any).team.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    const tree = buildTree(teams);
    return NextResponse.json({ teams, tree });
  } catch (error: any) {
    console.error('GET /api/teams error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/teams — create team
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId } = resolveUser(request, body);
    const { name, parentId, managerId, members } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const team = await (prisma as any).team.create({
      data: {
        tenantId,
        name: name.trim(),
        parentId: parentId || null,
        managerId: managerId || null,
        members: Array.isArray(members) ? members : [],
      },
    });
    return NextResponse.json({ success: true, team });
  } catch (error: any) {
    console.error('POST /api/teams error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/teams — update team
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, parentId, managerId, members } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (parentId !== undefined) data.parentId = parentId || null;
    if (managerId !== undefined) data.managerId = managerId || null;
    if (members !== undefined) data.members = Array.isArray(members) ? members : [];

    const team = await (prisma as any).team.update({
      where: { id },
      data,
    });
    return NextResponse.json({ success: true, team });
  } catch (error: any) {
    console.error('PATCH /api/teams error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/teams?id=xxx — delete team
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    }

    // Unset parentId for any children before deleting
    await (prisma as any).team.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    });

    await (prisma as any).team.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/teams error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
