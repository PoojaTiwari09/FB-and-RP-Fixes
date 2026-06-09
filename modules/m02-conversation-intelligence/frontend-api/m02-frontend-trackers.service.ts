import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

function wrapData<T>(payload: T) {
  return { data: payload };
}

function dateRangeStart(dateRange: string): Date | null {
  const now = new Date();
  switch (dateRange) {
    case 'last-7-days':
      return new Date(now.getTime() - 7 * 86400000);
    case 'last-30-days':
      return new Date(now.getTime() - 30 * 86400000);
    case 'last-quarter':
      return new Date(now.getTime() - 90 * 86400000);
    case 'last-6-months':
      return new Date(now.getTime() - 180 * 86400000);
    default:
      return null;
  }
}

@Injectable()
export class M02FrontendTrackersService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma as any;
  }

  async listTrackers(
    tenantId: string,
    query: { search?: string; teamId?: string; dateRange?: string; interactionType?: string },
  ) {
    const search = (query.search ?? '').trim().toLowerCase();
    const since = dateRangeStart(query.dateRange ?? 'last-30-days');

    const trackers = await this.db.m02Tracker.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(search
          ? {
              name: { contains: search, mode: 'insensitive' },
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      include: {
        detections: {
          where: since ? { createdAt: { gte: since } } : undefined,
        },
      },
    });

    const totalCalls = await this.db.callRecord.count({
      where: { tenantId, transcriptStatus: 'completed' },
    });
    const denominator = Math.max(totalCalls, 1);

    const rows = trackers.map((t: any) => {
      const entityIds = new Set(
        (t.detections ?? []).map((d: { entityId: string }) => d.entityId),
      );
      const percentage = Math.min(100, Math.round((entityIds.size / denominator) * 100));
      return {
        id: t.slug,
        name: t.name,
        percentage: percentage || (t.detections?.length ? Math.min(100, t.detections.length * 25) : 0),
        trend: t.trend ?? 0,
      };
    });

    rows.sort((a: { percentage: number }, b: { percentage: number }) => b.percentage - a.percentage);
    return wrapData(rows);
  }

  async getTrackerDetail(tenantId: string, trackerSlug: string) {
    const tracker = await this.db.m02Tracker.findFirst({
      where: { tenantId, slug: trackerSlug },
      include: { detections: true },
    });
    if (!tracker) throw new NotFoundException('Tracker not found');

    const detections = tracker.detections ?? [];
    const entityIds = new Set(detections.map((d: { entityId: string }) => d.entityId));
    const totalCalls = await this.db.callRecord.count({
      where: { tenantId, transcriptStatus: 'completed' },
    });
    const denominator = Math.max(totalCalls, 1);
    const percentage = Math.min(
      100,
      Math.round((entityIds.size / denominator) * 100) ||
        (detections.length ? Math.min(100, detections.length * 25) : 0),
    );

    const accountCounts = new Map<string, number>();
    const repCounts = new Map<string, number>();
    for (const d of detections) {
      if (d.accountName) {
        accountCounts.set(d.accountName, (accountCounts.get(d.accountName) ?? 0) + 1);
      }
      if (d.repName) {
        repCounts.set(d.repName, (repCounts.get(d.repName) ?? 0) + 1);
      }
    }

    const topAccounts = [...accountCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
    const topReps = [...repCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    return wrapData({
      percentage,
      mentions: detections.length,
      topAccounts: topAccounts.length ? topAccounts : ['No account data yet'],
      topReps: topReps.length ? topReps : ['No rep data yet'],
      aiInsight: tracker.aiInsight || 'No insight available for this tracker yet.',
    });
  }

  async askTracker(tenantId: string, trackerSlug: string, question: string) {
    const list = await this.listTrackers(tenantId, {});
    const rows = (list as { data: any[] }).data ?? list;
    const tracker = rows.find((t: { id: string }) => t.id === trackerSlug);
    const detailRes = await this.getTrackerDetail(tenantId, trackerSlug);
    const detail = (detailRes as { data: any }).data ?? detailRes;

    const name = tracker?.name ?? trackerSlug;
    const pct = detail.percentage ?? tracker?.percentage ?? 0;
    const trend = tracker?.trend ?? 0;
    const trendWord = trend >= 0 ? 'increasing' : 'decreasing';

    const answer = `Based on transcript analysis for "${name}": ${question.trim()} This topic appears in about ${pct}% of completed calls (${detail.mentions} mention(s) detected), with an ${trendWord} trend of ${Math.abs(trend)}% versus the prior period. Top accounts: ${(detail.topAccounts ?? []).join(', ')}.`;

    return wrapData({ answer });
  }
}
