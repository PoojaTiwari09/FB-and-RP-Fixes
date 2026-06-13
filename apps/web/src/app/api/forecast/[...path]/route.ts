import { NextRequest, NextResponse } from 'next/server';

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3001';
const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_MANAGER_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_REP_ID = 'me';

const FORWARD_REQUEST_HEADERS = ['x-user-id', 'x-user-role', 'content-type', 'authorization'];

async function proxyForecast(req: NextRequest, pathSegments: string[]) {
  let path = pathSegments.join('/');
  path = path.replace('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002');
  path = path.replace('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000003');
  path = path.replace(/q2-fy26-demo/g, '00000000-0000-0000-0000-0000000000b2');
  path = path.replace(/q1-fy26-demo/g, '00000000-0000-0000-0000-0000000000b1');
  
  let search = req.nextUrl.search;
  search = search.replace(/q2-fy26-demo/g, '00000000-0000-0000-0000-0000000000b2');
  search = search.replace(/q1-fy26-demo/g, '00000000-0000-0000-0000-0000000000b1');

  const target = `${BACKEND_ORIGIN}/api/forecast/${path}${search}`;

  const headers: Record<string, string> = {
    'x-tenant-id': DEMO_TENANT_ID,
    'x-org-id': DEMO_TENANT_ID,
  };

  for (const key of FORWARD_REQUEST_HEADERS) {
    const value = req.headers.get(key);
    if (value) headers[key] = value;
  }

  if (headers['x-user-id'] === '22222222-2222-2222-2222-222222222222') {
    headers['x-user-id'] = '00000000-0000-0000-0000-000000000002';
  }
  if (headers['x-user-id'] === '33333333-3333-3333-3333-333333333333') {
    headers['x-user-id'] = '00000000-0000-0000-0000-000000000003';
  }

  if (!headers['x-user-id']) {
    const role = req.headers.get('x-user-role');
    headers['x-user-id'] = role === 'manager' ? DEMO_MANAGER_ID : DEMO_REP_ID;
  }
  if (!headers['x-user-role']) {
    headers['x-user-role'] = 'manager';
  }
  if (!headers['content-type'] && req.method !== 'GET' && req.method !== 'HEAD') {
    headers['content-type'] = 'application/json';
  }

  const body =
    req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer();

  let upstream: Response;
  try {
    console.log('Sending headers to upstream:', headers);
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
