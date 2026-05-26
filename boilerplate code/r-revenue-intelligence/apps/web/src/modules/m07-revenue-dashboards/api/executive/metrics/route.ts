import { NextResponse } from 'next/server';
import { PrismaClient } from '@rri/database/node_modules/@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const DEFAULT_TENANT = '11111111-1111-1111-1111-111111111111';

// GET /api/executive/metrics?tenantId=xxx
// Returns board-level metrics distinct from regular sales metrics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = request.headers.get('x-tenant-id') ?? searchParams.get('tenantId') ?? DEFAULT_TENANT;

    const deals = await prisma.deal.findMany({ where: { tenantId }, include: { account: true } });

    const wonDeals  = deals.filter((d: any) => d.stage === 'Closed Won');
    const lostDeals = deals.filter((d: any) => d.stage === 'Closed Lost');
    const openDeals = deals.filter((d: any) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');

    const totalARR      = wonDeals.reduce((s: number, d: any) => s + Number(d.amount), 0);
    const pipelineValue = openDeals.reduce((s: number, d: any) => s + Number(d.amount), 0);
    const winRate       = deals.length ? Math.round((wonDeals.length / deals.length) * 100) : 0;
    const avgDealSize   = wonDeals.length ? Math.round(totalARR / wonDeals.length) : 0;
    const churnRisk     = deals.filter((d: any) => d.status === 'Needs Attention' || (d as any).riskLabel === 'Critical').length;

    // Revenue by account (top 10)
    const byAccount = new Map<string, number>();
    wonDeals.forEach((d: any) => {
      const name = d.account?.name ?? 'Unknown';
      byAccount.set(name, (byAccount.get(name) ?? 0) + Number(d.amount));
    });
    const topAccounts = Array.from(byAccount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, revenue]) => ({ name, revenue }));

    // Quarterly trend
    const byQuarter = new Map<string, { won: number; total: number }>();
    deals.forEach((d: any) => {
      const q = d.quarter ?? 'Unknown';
      const cur = byQuarter.get(q) ?? { won: 0, total: 0 };
      cur.total++;
      if (d.stage === 'Closed Won') cur.won++;
      byQuarter.set(q, cur);
    });
    const quarterlyTrend = Array.from(byQuarter.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, { won, total }]) => ({
        quarter,
        won,
        total,
        winRate: total ? Math.round((won / total) * 100) : 0,
      }));

    return NextResponse.json({
      summary: {
        totalARR,
        pipelineValue,
        winRate,
        avgDealSize,
        churnRisk,
        totalDeals: deals.length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
      },
      topAccounts,
      quarterlyTrend,
    });
  } catch (error: any) {
    console.error('GET /api/executive/metrics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
