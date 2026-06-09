import { NextRequest, NextResponse } from 'next/server';

// m07-api runs on port 3001 by default when unified in monorepo monolith (M07_API_PORT env var)
// Use 127.0.0.1 explicitly — Next.js/Turbopack resolves 'localhost' to ::1 (IPv6)
// which fails when the backend only listens on IPv4
const M07_API_ORIGIN =
  process.env.M07_API_URL ??
  `http://127.0.0.1:${process.env.M07_API_PORT ?? '3001'}`;

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_USER_ID   = '00000000-0000-0000-0000-000000000002';

const FORWARD_HEADERS = [
  'x-tenant-id',
  'x-user-id',
  'x-user-role',
  'x-role',
  'x-org-id',
  'content-type',
  'authorization',
];

async function proxyM07(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const target = `${M07_API_ORIGIN}/api/manager/revenue-dashboards/${path}${req.nextUrl.search}`;

  const headers = new Headers();

  // Default demo tenant/user so the backend always resolves a tenant context
  headers.set('x-tenant-id', DEMO_TENANT_ID);
  headers.set('X-Tenant-ID', DEMO_TENANT_ID);
  headers.set('x-org-id', DEMO_TENANT_ID);
  headers.set('x-user-id', DEMO_USER_ID);
  headers.set('x-user-role', 'MANAGER');
  headers.set('x-role', 'MANAGER');

  // Forward any headers that came from the browser (override defaults where set)
  for (const key of FORWARD_HEADERS) {
    const value = req.headers.get(key);
    if (value) headers.set(key, value);
  }

  if (!headers.get('content-type') && req.method !== 'GET' && req.method !== 'HEAD') {
    headers.set('content-type', 'application/json');
  }

  const body =
    req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      {
        error: 'M07 Revenue Dashboards API unreachable.',
        hint: `Start m07-api on port ${process.env.M07_API_PORT ?? '4013'} or set M07_API_URL env var.`,
      },
      { status: 503 },
    );
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get('content-type');
  if (contentType) responseHeaders.set('content-type', contentType);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { path } = await ctx.params;
    return proxyM07(req, path);
  } catch (err) {
    console.error('[M07 proxy] GET error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyM07(req, path);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyM07(req, path);
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyM07(req, path);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyM07(req, path);
}
