import { NextRequest, NextResponse } from 'next/server';

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_MANAGER_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_REP_ID = 'me';

const FORWARD_REQUEST_HEADERS = ['x-user-id', 'x-user-role', 'content-type', 'authorization'];

async function proxyForecast(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const target = `${BACKEND_ORIGIN}/api/forecast/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  headers.set('x-tenant-id', DEMO_TENANT_ID);
  headers.set('X-Tenant-ID', DEMO_TENANT_ID);
  headers.set('x-org-id', DEMO_TENANT_ID);

  for (const key of FORWARD_REQUEST_HEADERS) {
    const value = req.headers.get(key);
    if (value) headers.set(key, value);
  }

  if (!headers.get('x-user-id')) {
    const role = req.headers.get('x-user-role');
    headers.set('x-user-id', role === 'manager' ? DEMO_MANAGER_ID : DEMO_REP_ID);
  }
  if (!headers.get('x-user-role')) {
    headers.set('x-user-role', 'manager');
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
      { message: 'Forecasting API unreachable. Start unified-api on port 3001.' },
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
  const { path } = await ctx.params;
  return proxyForecast(req, path);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyForecast(req, path);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyForecast(req, path);
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyForecast(req, path);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyForecast(req, path);
}
