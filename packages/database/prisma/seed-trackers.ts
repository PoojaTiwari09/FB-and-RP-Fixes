/**
 * Seed M02 keyword trackers + scan M01 demo call transcripts for detections.
 * Run: pnpm exec tsx packages/database/prisma/seed-trackers.ts
 */
import { PrismaClient } from '@rri/database';

const prisma = new PrismaClient();
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const TRACKER_DEFS = [
  {
    slug: 'trk-001',
    name: 'Pricing discussion',
    keywords: ['pricing', 'cost', 'price', '$', 'discount', 'budget', 'quote'],
    trend: 12,
    aiInsight:
      'Pricing discussions appear frequently in late-stage discovery calls. Reps who anchor on ROI before stating price see shorter negotiation cycles.',
  },
  {
    slug: 'trk-002',
    name: 'Renewal risk',
    keywords: ['renewal', 'contract', 'expire', 'churn', 'cancel'],
    trend: -8,
    aiInsight:
      'Renewal-risk language often correlates with budget timing objections. Proactive value recap emails reduce follow-up friction.',
  },
  {
    slug: 'trk-003',
    name: 'Competitor mention',
    keywords: ['competitor', 'salesforce', 'hubspot', 'alternative', 'comparison'],
    trend: 5,
    aiInsight:
      'Competitive mentions spike when buyers are evaluating multiple vendors. Differentiate on integration depth and implementation speed.',
  },
  {
    slug: 'trk-004',
    name: 'Feature request',
    keywords: ['feature', 'customization', 'integration', 'workflow', 'automation'],
    trend: 3,
    aiInsight:
      'Feature requests cluster around customization and ERP/marketing integrations — align demos to stated integration needs.',
  },
  {
    slug: 'trk-005',
    name: 'Escalation signal',
    keywords: ['escalation', 'manager', 'urgent', 'blocker', 'issue'],
    trend: -2,
    aiInsight:
      'Escalation signals are rare in early discovery but should trigger manager review within 24 hours.',
  },
  {
    slug: 'trk-006',
    name: 'Upsell opportunity',
    keywords: ['upsell', 'expand', 'additional', 'upgrade', 'more users'],
    trend: 7,
    aiInsight:
      'Upsell language often follows successful ROI discussions. Bundle expansion options in follow-up proposals.',
  },
  {
    slug: 'trk-007',
    name: 'Customer feedback',
    keywords: ['feedback', 'complaint', 'complaining', 'users are', 'slow'],
    trend: 4,
    aiInsight:
      'Customer feedback themes highlight performance and usability — address with proof points on scalability.',
  },
  {
    slug: 'trk-008',
    name: 'Product demo',
    keywords: ['demo', 'demonstration', 'walkthrough', 'show you'],
    trend: -3,
    aiInsight:
      'Demo requests are strong buying signals. Confirm stakeholders and success criteria before scheduling.',
  },
  {
    slug: 'trk-009',
    name: 'Technical issue',
    keywords: ['technical', 'security', 'compliance', 'gdpr', 'hipaa', 'pci'],
    trend: 6,
    aiInsight:
      'Security and compliance questions are common in enterprise evaluations — lead with certifications and audit cadence.',
  },
  {
    slug: 'trk-010',
    name: 'Contract negotiation',
    keywords: ['negotiation', 'contract', 'terms', 'legal', 'proposal'],
    trend: 9,
    aiInsight:
      'Contract negotiation trackers align with proposal and legal review stages. Set clear timelines for redlines.',
  },
];

function findSnippet(text: string, keyword: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(keyword.toLowerCase());
  if (idx < 0) return keyword;
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + keyword.length + 40);
  return text.slice(start, end).trim();
}

async function main() {
  console.log('M02 trackers seed — cleaning previous data for', TENANT_ID);
  await prisma.m02TrackerDetection.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.m02Tracker.deleteMany({ where: { tenantId: TENANT_ID } });

  const calls = await prisma.callRecord.findMany({
    where: { tenantId: TENANT_ID, transcriptStatus: 'completed' },
    include: { transcript: { include: { utterances: true } } },
  });

  console.log(`M02 trackers seed — creating ${TRACKER_DEFS.length} trackers, scanning ${calls.length} calls`);

  for (const def of TRACKER_DEFS) {
    const tracker = await prisma.m02Tracker.create({
      data: {
        tenantId: TENANT_ID,
        slug: def.slug,
        name: def.name,
        keywords: def.keywords,
        trend: def.trend,
        aiInsight: def.aiInsight,
        isActive: true,
      },
    });

    for (const call of calls) {
      const fullText =
        call.transcript?.fullText ||
        (call.transcript?.utterances ?? []).map((u) => u.text).join(' ');
      if (!fullText?.trim()) continue;

      const accountName = call.accountId || call.title.split('—').pop()?.trim() || 'Unknown Account';
      const repName = call.callOwner || 'Rep';
      const textLower = fullText.toLowerCase();

      for (const keyword of def.keywords) {
        if (!textLower.includes(keyword.toLowerCase())) continue;

        const utterance = (call.transcript?.utterances ?? []).find((u) =>
          u.text.toLowerCase().includes(keyword.toLowerCase()),
        );

        await prisma.m02TrackerDetection.create({
          data: {
            tenantId: TENANT_ID,
            trackerId: tracker.id,
            entityType: 'call',
            entityId: call.id,
            matchedKeyword: keyword,
            snippet: findSnippet(fullText, keyword),
            timestampSeconds: utterance ? Math.floor((utterance.startMs ?? 0) / 1000) : null,
            accountName,
            repName,
          },
        });
        break;
      }
    }
  }

  const count = await prisma.m02Tracker.count({ where: { tenantId: TENANT_ID } });
  const detections = await prisma.m02TrackerDetection.count({ where: { tenantId: TENANT_ID } });
  console.log(`M02 trackers seed — done (${count} trackers, ${detections} detections)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
