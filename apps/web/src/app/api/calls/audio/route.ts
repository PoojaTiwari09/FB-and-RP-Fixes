import { NextRequest, NextResponse } from 'next/server';
import { DEMO_RECORDING_URLS } from '@shared/lib/demo-recordings';

const ALLOWED_SOURCE = [
  /^https:\/\/recordings-buttons\.s3\.eu-north-1\.amazonaws\.com\/.+/i,
  /^https:\/\/github\.com\/.+/i,
  /^https:\/\/raw\.githubusercontent\.com\/.+/i,
  /^http:\/\/localhost:3001\/uploads\/audio\/.+/i,
  /^http:\/\/127\.0\.0\.1:3001\/uploads\/audio\/.+/i,
];

function isAllowedSource(src: string): boolean {
  return ALLOWED_SOURCE.some((re) => re.test(src));
}

async function fetchUpstream(src: string, range: string | null): Promise<Response> {
  const headers: HeadersInit = {};
  if (range) headers.Range = range;
  return fetch(src, { headers, cache: 'no-store' });
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('src');
  if (!src || !isAllowedSource(src)) {
    return NextResponse.json({ error: 'Invalid or missing audio source' }, { status: 400 });
  }

  const range = req.headers.get('range');
  let upstream = await fetchUpstream(src, range);

  if (!upstream.ok) {
    const fallback = DEMO_RECORDING_URLS[0];
    upstream = await fetchUpstream(fallback, range);
    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'Audio file not found on server or demo bucket' },
        { status: upstream.status || 502 },
      );
    }
  }

  const outHeaders = new Headers();
  const passThrough = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
  for (const key of passThrough) {
    const v = upstream.headers.get(key);
    if (v) outHeaders.set(key, v);
  }
  outHeaders.set('cache-control', 'private, max-age=3600');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: outHeaders,
  });
}
