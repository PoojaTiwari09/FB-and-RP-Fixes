import { prisma } from "@/modules/m07-revenue-dashboards/lib/prisma";
import { NextResponse } from 'next/server';
const DEFAULT_TENANT = '11111111-1111-1111-1111-111111111111';

function computeScore(deal: any): { score: number; label: string; flags: string[] } {
  let score = 50;
  const flags: string[] = [];

  // Stage baseline
  if (deal.stage === 'Closed Won') { score = 100; }
  else if (deal.stage === 'Closed Lost') { score = 0; }
  else if (deal.stage === 'Negotiation') { score += 20; }
  else if (deal.stage === 'Proposal') { score += 5; }
  else if (deal.stage === 'Discovery') { score -= 10; }

  // Close date checks
  if (deal.closeDate) {
    const daysUntil = Math.ceil((new Date(deal.closeDate).getTime() - Date.now()) / 86400000);
    if (daysUntil < 0)  { score -= 22; flags.push('Overdue'); }
    else if (daysUntil <= 14) { score += 8; flags.push('Closing Soon'); }
  } else { score -= 10; flags.push('No Close Date'); }

  // Status checks
  if (deal.status === 'Needs Attention') { score -= 18; flags.push('Needs Attention'); }
  if (!deal.ownerId && !deal.ownerName) { flags.push('No Owner'); score -= 5; }

  score = Math.max(0, Math.min(100, score));
  const label = score >= 75 ? 'High' : score >= 50 ? 'Medium' : score >= 25 ? 'Low' : 'Critical';
  return { score, label, flags };
}

// POST /api/deals/score
// Body: { tenantId?, dealIds?: string[] }
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const tenantId = request.headers.get('x-tenant-id') || body?.tenantId || DEFAULT_TENANT;
    const dealIds: string[] | undefined = Array.isArray(body?.dealIds) ? body.dealIds : undefined;

    const where: any = { tenantId };
    if (dealIds && dealIds.length > 0) {
      where.id = { in: dealIds };
    }

    const deals = await prisma.deal.findMany({ where });

    let updated = 0;
    for (const deal of deals) {
      const { score, label, flags } = computeScore(deal);
      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          confidenceScore: score,
          riskScore: score,
          riskLabel: label,
          riskFlags: flags,
        } as any,
      });
      updated++;
    }

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error('POST /api/deals/score error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
