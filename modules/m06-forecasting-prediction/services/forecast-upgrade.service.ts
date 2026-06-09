import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Optional } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import * as crypto from 'crypto';

@Injectable()
export class ForecastUpgradeService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly eventPublisher?: EventPublisherService,
  ) {}

  // ── B1. SUBMISSIONS ────────────────────────────────────────────────────────

  async getSubmissions(periodId: string, repId: string) {
    const subs = await this.prisma.forecastSubmission.findMany({
      where: { periodId, repUserId: repId, NOT: { dealId: null } },
      orderBy: [{ dealId: 'asc' }, { version: 'desc' }],
    });

    // Take only the latest version of submission per deal
    const latestMap = new Map<string, any>();
    for (const sub of subs) {
      if (sub.dealId && !latestMap.has(sub.dealId)) {
        latestMap.set(sub.dealId, sub);
      }
    }

    const result = [];
    for (const [dealId, sub] of latestMap.entries()) {
      const deal = await this.prisma.crmDeal.findUnique({ where: { id: dealId } });
      result.push({
        id: sub.id,
        deal_id: dealId,
        deal_name: deal?.dealName ?? 'Deal',
        best_case_value: sub.bestCaseForecast ?? 0,
        commit_value: sub.commitForecast ?? 0,
        best_case_state: sub.bestCaseState,
        commit_state: sub.commitState,
        approved_best_case: sub.approvedBestCase,
        approved_commit: sub.approvedCommit,
      });
    }

    return result;
  }

  async createOrUpdateSubmission(repId: string, dealId: string, periodId: string, field: 'best_case' | 'commit', value: number) {
    const latest = await this.prisma.forecastSubmission.findFirst({
      where: { repUserId: repId, dealId, periodId },
      orderBy: { version: 'desc' },
    });

    const version = (latest?.version ?? 0) + 1;
    const isBestCase = field === 'best_case';

    const bestCaseForecast = isBestCase ? value : (latest?.bestCaseForecast ?? 0);
    const commitForecast = !isBestCase ? value : (latest?.commitForecast ?? 0);

    const sub = await this.prisma.forecastSubmission.create({
      data: {
        tenantId: latest?.tenantId ?? '00000000-0000-0000-0000-000000000001',
        periodId,
        repUserId: repId,
        dealId,
        lob: latest?.lob ?? 'Enterprise',
        version,
        bestCaseForecast,
        commitForecast,
        bestCaseState: latest?.bestCaseState ?? 'editable',
        commitState: latest?.commitState ?? 'editable',
        approvedBestCase: latest?.approvedBestCase ?? null,
        approvedCommit: latest?.approvedCommit ?? null,
        status: latest?.status ?? 'draft',
      },
    });

    const hasLog = await this.prisma.forecastAuditLog.findFirst({
      where: { forecastSubmissionId: sub.id, action: 'draft_created' },
    });

    if (!hasLog) {
      await this.logActivity(sub.id, 'draft_created', repId, `Draft created for deal: ${dealId}`);
    }

    return sub;
  }

  async submitForecast(id: string, repId: string, field: 'best_case' | 'commit' | 'both') {
    const latest = await this.prisma.forecastSubmission.findUnique({ where: { id } });
    if (!latest) throw new NotFoundException('Submission not found');

    const nextBestCaseState = (field === 'best_case' || field === 'both') ? 'submitted' : latest.bestCaseState;
    const nextCommitState = (field === 'commit' || field === 'both') ? 'submitted' : latest.commitState;

    const sub = await this.prisma.forecastSubmission.create({
      data: {
        tenantId: latest.tenantId,
        periodId: latest.periodId,
        repUserId: latest.repUserId,
        dealId: latest.dealId,
        lob: latest.lob,
        version: latest.version + 1,
        bestCaseForecast: latest.bestCaseForecast,
        commitForecast: latest.commitForecast,
        bestCaseState: nextBestCaseState,
        commitState: nextCommitState,
        approvedBestCase: latest.approvedBestCase,
        approvedCommit: latest.approvedCommit,
        status: 'submitted',
      },
    });

    await this.logActivity(sub.id, 'submitted', repId, `Submitted ${field} forecast for deal: ${latest.dealId}`);

    this.eventPublisher?.publish('forecast.submitted', {
      tenantId: sub.tenantId,
      correlationId: crypto.randomUUID(),
      payload: {
        submissionId: sub.id,
        periodId: sub.periodId,
        userId: sub.repUserId,
        submittedAmount: sub.commitForecast,
        version: sub.version,
        lob: sub.lob,
      },
    });

    return { id: sub.id, best_case_state: sub.bestCaseState, commit_state: sub.commitState };
  }

  async approveSubmission(id: string, managerId: string, field: 'best_case' | 'commit' | 'both') {
    const latest = await this.prisma.forecastSubmission.findUnique({ where: { id } });
    if (!latest) throw new NotFoundException('Submission not found');

    const nextBestCaseState = (field === 'best_case' || field === 'both') ? 'approved' : latest.bestCaseState;
    const nextCommitState = (field === 'commit' || field === 'both') ? 'approved' : latest.commitState;

    const approvedBestCase = (field === 'best_case' || field === 'both') ? latest.bestCaseForecast : latest.approvedBestCase;
    const approvedCommit = (field === 'commit' || field === 'both') ? latest.commitForecast : latest.approvedCommit;

    const sub = await this.prisma.forecastSubmission.create({
      data: {
        tenantId: latest.tenantId,
        periodId: latest.periodId,
        repUserId: latest.repUserId,
        dealId: latest.dealId,
        lob: latest.lob,
        version: latest.version + 1,
        bestCaseForecast: latest.bestCaseForecast,
        commitForecast: latest.commitForecast,
        bestCaseState: nextBestCaseState,
        commitState: nextCommitState,
        approvedBestCase,
        approvedCommit,
        status: 'approved',
        managerId,
      },
    });

    await this.logActivity(sub.id, 'approved', managerId, `Approved ${field} forecast`);

    const deal = await this.prisma.crmDeal.findUnique({ where: { id: latest.dealId || '' } });
    const rep = await this.prisma.forecastUser.findFirst({ where: { id: latest.repUserId } });

    await this.createNotification(
      latest.repUserId,
      rep?.name ?? 'Rep',
      sub.id,
      'approved',
      field,
      deal?.dealName ?? 'Deal',
      approvedBestCase,
      approvedCommit
    );

    if (approvedCommit !== null && latest.dealId) {
      await this.syncManualForecast(latest.repUserId, latest.dealId, latest.periodId, approvedCommit);
    }

    return {
      id: sub.id,
      approved_best_case: sub.approvedBestCase,
      approved_commit: sub.approvedCommit,
      best_case_state: sub.bestCaseState,
      commit_state: sub.commitState,
    };
  }

  async reopenSubmission(id: string, managerId: string) {
    const latest = await this.prisma.forecastSubmission.findUnique({ where: { id } });
    if (!latest) throw new NotFoundException('Submission not found');

    const sub = await this.prisma.forecastSubmission.create({
      data: {
        tenantId: latest.tenantId,
        periodId: latest.periodId,
        repUserId: latest.repUserId,
        dealId: latest.dealId,
        lob: latest.lob,
        version: latest.version + 1,
        bestCaseForecast: latest.bestCaseForecast,
        commitForecast: latest.commitForecast,
        bestCaseState: 'reopened',
        commitState: 'reopened',
        approvedBestCase: latest.approvedBestCase,
        approvedCommit: latest.approvedCommit,
        status: 'reopened',
        managerId,
      },
    });

    await this.logActivity(sub.id, 'reopened', managerId, 'Reopened submission');

    const deal = await this.prisma.crmDeal.findUnique({ where: { id: latest.dealId || '' } });
    const rep = await this.prisma.forecastUser.findFirst({ where: { id: latest.repUserId } });

    await this.createNotification(
      latest.repUserId,
      rep?.name ?? 'Rep',
      sub.id,
      'reopened',
      'both',
      deal?.dealName ?? 'Deal',
      latest.bestCaseForecast,
      latest.commitForecast
    );

    return { id: sub.id, best_case_state: sub.bestCaseState, commit_state: sub.commitState };
  }

  async overrideSubmission(id: string, managerId: string, field: 'best_case' | 'commit' | 'both', overrideValue: number) {
    const latest = await this.prisma.forecastSubmission.findUnique({ where: { id } });
    if (!latest) throw new NotFoundException('Submission not found');

    const nextBestCaseState = (field === 'best_case' || field === 'both') ? 'overridden' : latest.bestCaseState;
    const nextCommitState = (field === 'commit' || field === 'both') ? 'overridden' : latest.commitState;

    const approvedBestCase = (field === 'best_case' || field === 'both') ? overrideValue : latest.approvedBestCase;
    const approvedCommit = (field === 'commit' || field === 'both') ? overrideValue : latest.approvedCommit;

    const sub = await this.prisma.forecastSubmission.create({
      data: {
        tenantId: latest.tenantId,
        periodId: latest.periodId,
        repUserId: latest.repUserId,
        dealId: latest.dealId,
        lob: latest.lob,
        version: latest.version + 1,
        bestCaseForecast: latest.bestCaseForecast,
        commitForecast: latest.commitForecast,
        bestCaseState: nextBestCaseState,
        commitState: nextCommitState,
        approvedBestCase,
        approvedCommit,
        status: latest.status,
        managerId,
        overriddenBy: managerId,
      },
    });

    await this.logActivity(sub.id, 'overridden', managerId, `Overrode ${field} with value ${overrideValue}`);

    const deal = await this.prisma.crmDeal.findUnique({ where: { id: latest.dealId || '' } });
    const rep = await this.prisma.user.findFirst({ where: { id: latest.repUserId } });

    await this.createNotification(
      latest.repUserId,
      rep?.name ?? 'Rep',
      sub.id,
      'overridden',
      field,
      deal?.dealName ?? 'Deal',
      approvedBestCase,
      approvedCommit
    );

    if (approvedCommit !== null && latest.dealId) {
      await this.syncManualForecast(latest.repUserId, latest.dealId, latest.periodId, approvedCommit);
    }

    return {
      id: sub.id,
      approved_best_case: sub.approvedBestCase,
      approved_commit: sub.approvedCommit,
      best_case_state: sub.bestCaseState,
      commit_state: sub.commitState,
    };
  }

  // ── B2. NOTIFICATIONS ──────────────────────────────────────────────────────

  async getNotifications(repId: string) {
    const list = await this.prisma.forecastNotification.findMany({
      where: { repId, isSeen: false },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((n) => ({
      id: n.id,
      action_type: n.actionType,
      request_type: n.requestType ?? 'both',
      deal_name: n.dealName,
      rep_name: n.repName ?? 'Rep',
      best_case_value: n.bestCaseValue ?? n.finalValue,
      commit_value: n.commitValue ?? n.finalValue,
      created_at: n.createdAt.toISOString(),
    }));
  }

  async markNotificationSeen(id: string) {
    await this.prisma.forecastNotification.update({
      where: { id },
      data: { isSeen: true },
    });
    return { success: true };
  }

  // ── B3. ACTIVITY LOG ───────────────────────────────────────────────────────

  async getSubmissionActivity(submissionId: string) {
    const list = await this.prisma.forecastAuditLog.findMany({
      where: { forecastSubmissionId: submissionId },
      orderBy: { createdAt: 'asc' },
    });

    const result = [];
    for (const log of list) {
      const actor = await this.prisma.forecastUser.findFirst({ where: { id: log.actorId } });
      result.push({
        id: log.id,
        status: log.action,
        performed_by_name: actor?.name ?? log.actorName ?? 'System',
        timestamp: log.createdAt.toISOString(),
        notes: (log.metadata as any)?.notes ?? null,
      });
    }
    return result;
  }

  async logActivity(submissionId: string, status: string, performedByUserId: string, notes?: string) {
    const actor = await this.prisma.forecastUser.findFirst({ where: { id: performedByUserId } });
    await this.prisma.forecastAuditLog.create({
      data: {
        tenantId: '00000000-0000-0000-0000-000000000001',
        forecastSubmissionId: submissionId,
        action: status,
        actorId: performedByUserId,
        actorName: actor?.name ?? 'System',
        actorRole: actor?.role ?? 'System',
        metadata: notes ? { notes } : undefined,
      },
    });
  }

  // ── B4. NOTIFICATIONS INTERNAL FUNCTION ────────────────────────────────────

  async createNotification(
    repId: string,
    repName: string,
    submissionId: string,
    actionType: 'approved' | 'reopened' | 'overridden',
    requestType: 'best_case' | 'commit' | 'both',
    dealName: string,
    bestCaseValue: number | null,
    commitValue: number | null,
  ) {
    await this.prisma.forecastNotification.create({
      data: {
        tenantId: '00000000-0000-0000-0000-000000000001',
        repId,
        repName,
        submissionId,
        actionType,
        requestType,
        dealName,
        bestCaseValue,
        commitValue,
        finalValue: commitValue ?? bestCaseValue ?? 0,
        isSeen: false,
      },
    });
  }

  // ── B5. TARGETS ────────────────────────────────────────────────────────────

  async getTargets(periodId: string) {
    const list = await this.prisma.quota.findMany({ where: { periodId } });
    const result = [];
    for (const q of list) {
      const rep = await this.prisma.forecastUser.findFirst({ where: { id: q.repUserId } });
      result.push({
        rep_id: q.repUserId,
        rep_name: rep?.name ?? 'Rep',
        target_value: q.amount,
      });
    }
    return result;
  }

  async assignTargets(periodId: string, managerId: string, assignments: { rep_id: string; target_value: number }[]) {
    for (const assign of assignments) {
      await this.prisma.quota.upsert({
        where: {
          tenantId_periodId_repUserId: {
            tenantId: '00000000-0000-0000-0000-000000000001',
            periodId,
            repUserId: assign.rep_id,
          },
        },
        create: {
          tenantId: '00000000-0000-0000-0000-000000000001',
          periodId,
          repUserId: assign.rep_id,
          amount: assign.target_value,
        },
        update: {
          amount: assign.target_value,
        },
      });
    }
    return { assigned_count: assignments.length };
  }

  // ── B6. FORECAST PERIODS ───────────────────────────────────────────────────

  async getPeriods() {
    const periods = await this.prisma.forecastPeriod.findMany({
      orderBy: { startDate: 'desc' },
    });
    return periods.map((p) => ({
      id: p.id,
      name: p.name,
      start_date: p.startDate.toISOString().slice(0, 10),
      end_date: p.endDate.toISOString().slice(0, 10),
      submission_deadline: p.submissionDeadline ? p.submissionDeadline.toISOString().slice(0, 10) : p.endDate.toISOString().slice(0, 10),
    }));
  }

  async getPeriodReps(periodId: string) {
    const subs = await this.prisma.forecastSubmission.findMany({
      where: { periodId },
      select: { repUserId: true },
      distinct: ['repUserId'],
    });

    const quotas = await this.prisma.quota.findMany({
      where: { periodId },
      select: { repUserId: true },
      distinct: ['repUserId'],
    });

    const repIds = Array.from(new Set([...subs.map(s => s.repUserId), ...quotas.map(q => q.repUserId)]));

    const result = [];
    for (const repId of repIds) {
      const rep = await this.prisma.forecastUser.findFirst({ where: { id: repId } });
      if (rep) {
        result.push({ rep_id: rep.id, rep_name: rep.name });
      }
    }
    return result;
  }

  // ── B7. CLOSED DEALS ───────────────────────────────────────────────────────

  async getClosedDealsTotal(repId: string, periodId: string) {
    const period = await this.prisma.forecastPeriod.findUnique({ where: { id: periodId } });
    if (!period) return { rep_id: repId, period_id: periodId, total_closed_value: 0 };

    const deals = await this.prisma.crmDeal.findMany({
      where: {
        repUserId: repId,
        stage: 'Closed Won',
        isClosedWon: true,
        closeDate: { gte: period.startDate, lte: period.endDate },
      },
    });

    const total = deals.reduce((sum, d) => sum + d.amount, 0);
    return { rep_id: repId, period_id: periodId, total_closed_value: total };
  }

  async getClosedDealValue(repId: string, dealId: string) {
    const deal = await this.prisma.crmDeal.findFirst({
      where: { id: dealId, repUserId: repId, isClosedWon: true, stage: 'Closed Won' },
    });
    return { deal_id: dealId, closed_value: deal ? deal.amount : 0 };
  }

  // ── B8. PIPELINE ───────────────────────────────────────────────────────────

  async getPipelineTotal(repId: string, periodId: string) {
    const row = await this.prisma.pipelineValuesCache.findUnique({
      where: {
        tenantId_periodId_repId_dealId: {
          tenantId: '00000000-0000-0000-0000-000000000001',
          periodId,
          repId,
          dealId: '',
        },
      },
    });

    if (!row) {
      // Recompute on-demand if missing
      await this.recomputePipeline(repId, '', periodId);
      const recomputed = await this.prisma.pipelineValuesCache.findUnique({
        where: {
          tenantId_periodId_repId_dealId: {
            tenantId: '00000000-0000-0000-0000-000000000001',
            periodId,
            repId,
            dealId: '',
          },
        },
      });
      return { rep_id: repId, period_id: periodId, pipeline_value: recomputed ? recomputed.pipelineValue : 0 };
    }

    return { rep_id: repId, period_id: periodId, pipeline_value: row.pipelineValue };
  }

  async getPipelineDealValue(repId: string, dealId: string, periodId: string) {
    const row = await this.prisma.pipelineValuesCache.findUnique({
      where: {
        tenantId_periodId_repId_dealId: {
          tenantId: '00000000-0000-0000-0000-000000000001',
          periodId,
          repId,
          dealId,
        },
      },
    });

    if (!row) {
      await this.recomputePipeline(repId, dealId, periodId);
      const recomputed = await this.prisma.pipelineValuesCache.findUnique({
        where: {
          tenantId_periodId_repId_dealId: {
            tenantId: '00000000-0000-0000-0000-000000000001',
            periodId,
            repId,
            dealId,
          },
        },
      });
      return { deal_id: dealId, period_id: periodId, pipeline_value: recomputed ? recomputed.pipelineValue : 0 };
    }

    return { deal_id: dealId, period_id: periodId, pipeline_value: row.pipelineValue };
  }

  async recomputePipeline(repId: string, dealId: string, periodId: string) {
    const period = await this.prisma.forecastPeriod.findUnique({ where: { id: periodId } });
    if (!period) return;

    if (dealId) {
      const deal = await this.prisma.crmDeal.findUnique({ where: { id: dealId } });
      if (deal && !deal.isClosedWon && !deal.isClosedLost) {
        // contribution = amount * probability
        const val = deal.amount * (deal.probability ?? 0.4);
        await this.prisma.pipelineValuesCache.upsert({
          where: {
            tenantId_periodId_repId_dealId: {
              tenantId: '00000000-0000-0000-0000-000000000001',
              periodId,
              repId,
              dealId,
            },
          },
          create: {
            tenantId: '00000000-0000-0000-0000-000000000001',
            periodId,
            repId,
            dealId,
            pipelineValue: val,
          },
          update: { pipelineValue: val, computedAt: new Date() },
        });
      }
    }

    // Recalculate rep-level aggregate
    const allDeals = await this.prisma.crmDeal.findMany({
      where: {
        repUserId: repId,
        isClosedWon: false,
        isClosedLost: false,
        closeDate: { gte: period.startDate, lte: period.endDate },
      },
    });

    const totalVal = allDeals.reduce((sum, d) => sum + (d.amount * (d.probability ?? 0.4)), 0);

    await this.prisma.pipelineValuesCache.upsert({
      where: {
        tenantId_periodId_repId_dealId: {
          tenantId: '00000000-0000-0000-0000-000000000001',
          periodId,
          repId,
          dealId: '',
        },
      },
      create: {
        tenantId: '00000000-0000-0000-0000-000000000001',
        periodId,
        repId,
        dealId: '',
        pipelineValue: totalVal,
      },
      update: { pipelineValue: totalVal, computedAt: new Date() },
    });
  }

  // ── B9. AI REVENUE PREDICTOR SYNC ──────────────────────────────────────────

  async getAiPredictionScores(repId: string) {
    const snaps = await this.prisma.aiForecastSnapshot.findMany({
      orderBy: { computedAt: 'desc' },
      take: 1,
    });
    if (!snaps.length) return [];
    const explainability = snaps[0].modelInputs as any;
    const deals = explainability?.deals ?? [];

    const result = [];
    for (const d of deals) {
      // Find CRM deal ID
      const crmDeal = await this.prisma.crmDeal.findFirst({ where: { dealName: d.deal } });
      if (crmDeal && crmDeal.repUserId === repId) {
        result.push({
          deal_id: crmDeal.id,
          ai_prediction_score: d.aiConf === 'High' ? 95 : d.aiConf === 'Med' ? 70 : 40,
        });
      }
    }
    return result;
  }

  async syncManualForecast(repId: string, dealId: string, periodId: string, finalValue: number) {
    await this.prisma.crmDeal.update({
      where: { id: dealId },
      data: {
        manualForecast: finalValue,
        manualForecastUpdatedAt: new Date(),
      },
    });
  }

  // ── B10. DRILL-DOWN & BOARD VIEWS ──────────────────────────────────────────

  async getRepDrilldown(repId: string, periodId: string) {
    const period = await this.prisma.forecastPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Period not found');

    const deals = await this.prisma.crmDeal.findMany({
      where: { repUserId: repId, closeDate: { gte: period.startDate, lte: period.endDate } },
    });

    const result = [];
    for (const deal of deals) {
      const latestSub = await this.prisma.forecastSubmission.findFirst({
        where: { periodId, repUserId: repId, dealId: deal.id },
        orderBy: { version: 'desc' },
      });

      const pipeVal = await this.getPipelineDealValue(repId, deal.id, periodId);
      const scoreList = await this.getAiPredictionScores(repId);
      const score = scoreList.find((s) => s.deal_id === deal.id)?.ai_prediction_score ?? 65;

      const closedVal = deal.isClosedWon ? deal.amount : 0;
      const hasPending = latestSub?.commitState === 'submitted' || latestSub?.bestCaseState === 'submitted';
      const isPastDue = new Date(deal.closeDate) < new Date() && !deal.isClosedWon && !deal.isClosedLost;

      result.push({
        id: latestSub?.id ?? null,
        deal_id: deal.id,
        deal_name: deal.dealName,
        account_name: deal.dealName.split(' ')[0] ?? 'Account',
        amount: deal.amount,
        stage: deal.stage,
        close_date: deal.closeDate.toISOString(),
        is_closed_won: deal.isClosedWon,
        is_closed_lost: deal.isClosedLost,
        is_past_due: isPastDue,
        pipeline_value: pipeVal.pipeline_value,
        best_case_value: latestSub?.bestCaseForecast ?? 0,
        approved_best_case: latestSub?.approvedBestCase ?? null,
        best_case_state: latestSub?.bestCaseState ?? 'editable',
        commit_value: latestSub?.commitForecast ?? 0,
        approved_commit: latestSub?.approvedCommit ?? null,
        commit_state: latestSub?.commitState ?? 'editable',
        closed_value: closedVal,
        ai_prediction_score: score,
        has_pending_request: hasPending,
        manager_annotation: latestSub?.managerComment ?? null,
        requested_best_case: latestSub?.bestCaseState === 'submitted' ? (latestSub?.bestCaseForecast ?? null) : null,
        requested_commit: latestSub?.commitState === 'submitted' ? (latestSub?.commitForecast ?? null) : null,
        requested_best_case_note: latestSub?.bestCaseState === 'submitted' ? (latestSub?.notes ?? null) : null,
        requested_commit_note: latestSub?.commitState === 'submitted' ? (latestSub?.notes ?? null) : null,
      });
    }

    return result;
  }

  async getRepDrilldownSummary(repId: string, periodId: string) {
    const drilldown = await this.getRepDrilldown(repId, periodId);

    const pipeline_total = drilldown.reduce((sum, d) => sum + d.pipeline_value, 0);
    const best_case_total = drilldown.reduce((sum, d) => sum + (d.approved_best_case !== null ? d.approved_best_case : d.best_case_value), 0);
    const commit_total = drilldown.reduce((sum, d) => sum + (d.approved_commit !== null ? d.approved_commit : d.commit_value), 0);
    const closed_won_total = drilldown.reduce((sum, d) => sum + d.closed_value, 0);

    return {
      pipeline_total,
      best_case_total,
      commit_total,
      closed_won_total,
    };
  }

  async getManagerBoard(managerId: string, periodId: string) {
    // Find all reps under this manager
    const reps = await this.prisma.forecastUser.findMany({
      where: { tenantId: '00000000-0000-0000-0000-000000000001', role: 'sales_rep' },
    });

    const result = [];
    for (const rep of reps) {
      const summary = await this.getRepDrilldownSummary(rep.id, periodId);
      const quota = await this.prisma.quota.findFirst({
        where: { periodId, repUserId: rep.id },
      });

      const scores = await this.getAiPredictionScores(rep.id);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.ai_prediction_score, 0) / scores.length) : 75;

      const targetVal = quota ? quota.amount : 0;
      const progress = targetVal > 0 ? ((summary.closed_won_total + summary.commit_total) / targetVal) * 100 : 0;

      const drilldownDeals = await this.getRepDrilldown(rep.id, periodId);
      const hasPending = drilldownDeals.some((d) => d.has_pending_request);

      result.push({
        rep_id: rep.id,
        rep_name: rep.name,
        pipeline_total: summary.pipeline_total,
        best_case_total: summary.best_case_total,
        commit_total: summary.commit_total,
        closed_total: summary.closed_won_total,
        ai_prediction_score: avgScore,
        target_value: targetVal,
        target_progress_pct: Math.round(progress),
        has_pending_requests: hasPending,
      });
    }

    return result;
  }
}
