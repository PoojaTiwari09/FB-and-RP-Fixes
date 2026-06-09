import { NextResponse } from 'next/server';

export async function GET() {
  const hasServerKey = Boolean(process.env.ASSEMBLYAI_API_KEY?.trim());
  return NextResponse.json({ hasServerKey });
}
