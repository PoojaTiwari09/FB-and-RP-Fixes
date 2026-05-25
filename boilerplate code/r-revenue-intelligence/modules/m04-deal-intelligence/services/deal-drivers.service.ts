// src/modules/deal-drivers/deal-drivers.service.ts
// Edge cases solved:
//   TC-G01: Zero direct reports → return empty matrix rows (not an error)
//   TC-G04: CRO accessing unauthorised manager → ForbiddenException
//   TC-G05: No deals in period → matrix with empty rows array
//   TC-G06: Rep with 0 deals → isNull=true, percentage shown as null
//   TC-G07: No warnings on board → return matrix with empty warnings array
//   TC-G08: Drill-down 0 matching deals → return empty deals array (not an error)
//   TC-G09: Coaching partial data → null percentage for missing period
//   TC-G15: Deal open < 24h → excluded from denominator (enforced in computeRepDealSets)
//   TC-G16: Warning active < 24h → excluded from % (enforced in computeWarningActivations)
//   TC-G17: Deal moved boards mid-period → attributed to board at warning-active time
//   TC-G18: Closed deals that were open ≥24h in period → included

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DealDriversRepository } from '../repositories/deal-drivers.repository';
import { MatrixCache } from './matrix.cache';
import { resolvePeriodWindow } from './period.util';
import { computeRepDealSets } from './deal-membership.calculator';
import { computeWarningActivations, countFlaggedDeals } from './warning-activation.calculator';
import { buildMatrix } from './matrix.builder';
import {
  Period, UserRole,
  DealDriversMatrix, DrillDownResult, DrillDownDeal,
  BoardComparisonResult, BoardWarningRate, InsightSummary,
  CoachingEffectivenessResult, CoachingWarningSnapshot, RepSummary,
} from '../entities/deal-drivers.entities';

const ALLOWED_ROLES: string[] = [
  UserRole.SALES_MANAGER,
  UserRole.CRO,
  UserRole.ADMIN_REVOPS,
];

@Injectable()
export class DealDriversService {
  constructor(
    private readonly repo: DealDriversRepository,
    private readonly matrixCache: MatrixCache,
  ) {}

  private assertAccess(roles: string[]): void {
    const allowed = roles.some((r) => ALLOWED_ROLES.includes(r as UserRole));
    // TC-G03: rep role reaches here only if the route guard is bypassed; block it
    if (!allowed) throw new ForbiddenException('Deal Drivers requires manager or higher role.');
  }

  /**
   * TC-G04: CRO / non-manager requesting a manager they have no permission for.
   * A SALES_MANAGER may only query their own managerId (their sub).
   * A CRO or Admin may query any manager — but only ones that exist.
   * Unknown manager → NotFoundException (not a permission issue).
   * Manager that exists but belongs to a different org/hierarchy → ForbiddenException.
   */
  private async assertManagerAccess(
    requestingUserId: string,
    requestingUserRoles: string[],
    managerId: string,
  ): Promise<void> {
    const isSalesManager = requestingUserRoles.includes(UserRole.SALES_MANAGER);
    if (isSalesManager && requestingUserId !== managerId) {
      throw new ForbiddenException(
        `Sales managers can only view their own team. Requested manager: ${managerId}`,
      );
    }
    // CRO / Admin: verify manager exists (repo throws NotFoundException if not found)
    // Additional org-level check: verify the requesting CRO has access to the manager's org unit.
    // We call a dedicated repo method that returns null if no access.
    const hasAccess = await this.repo.checkManagerAccess(requestingUserId, managerId);
    if (!hasAccess) {
      throw new ForbiddenException(
        `You do not have permission to view manager ${managerId}'s team data.`,
      );
    }
  }

  // ─── Matrix ──────────────────────────────────────────────────────────────

  async getMatrix(params: {
    requestingUserId:    string;
    requestingUserRoles: string[];
    managerId:           string;
    boardId:             string;
    period:              Period;
    now?:                Date;
  }): Promise<DealDriversMatrix> {
    this.assertAccess(params.requestingUserRoles);
    // TC-G04: assert manager access before any data fetch
    await this.assertManagerAccess(
      params.requestingUserId,
      params.requestingUserRoles,
      params.managerId,
    );

    const cacheKey = this.matrixCache.key(params.managerId, params.boardId, params.period);
    const cached   = this.matrixCache.get(cacheKey);
    if (cached) return cached;

    const now    = params.now ?? new Date();
    const window = resolvePeriodWindow(params.period, now);

    const [manager, directReports, boardWarnings] = await Promise.all([
      this.repo.getManagerById(params.managerId),
      this.repo.getDirectReports(params.managerId),
      this.repo.getWarningsForBoard(params.boardId),
    ]);
    if (!manager) throw new NotFoundException(`Manager ${params.managerId} not found`);

    // TC-G01: zero direct reports → empty but valid matrix (not an error)
    // TC-G07: no warnings on board → empty columns (not an error)
    // FIX CACHE: cache the early-exit result too, so second identical request
    // is served from cache (the CACHE test verifies getDirectReports called once).
    if (directReports.length === 0 || boardWarnings.length === 0) {
      const board = await this.repo.getBoardById(params.boardId);
      const earlyMatrix = buildMatrix({
        boardId: params.boardId, boardName: board?.name ?? '',
        managerId: params.managerId, managerName: manager.name,
        period: params.period, periodWindow: window,
        reps: directReports.map((r: any) => ({ id: r.id, name: r.name, segment: r.segment ?? null })),
        warnings: [],
        repDealSets: new Map(),
        activationMap: new Map(),
      });
      this.matrixCache.set(cacheKey, earlyMatrix, params.period);
      return earlyMatrix;
    }

    const board = await this.repo.getBoardById(params.boardId);
    if (!board) throw new NotFoundException(`Board ${params.boardId} not found`);

    const repIds      = directReports.map((r: any) => r.id);
    const warningDefs = boardWarnings.map((bw: any) => ({
      warningId: bw.warningId,
      warningKey: bw.warningKey,
      label:      bw.label,
      sortOrder:  bw.sortOrder,
    }));
    const warningIds = warningDefs.map((w) => w.warningId);

    // TC-G15/G18: getQualifyingDealsForTeam returns ALL candidates (open+closed);
    // computeRepDealSets filters to ≥24h ownership overlap — handles both rules.
    // TC-G17: reassigned deals come back under the rep who owned them during the window.
    const rawDeals      = await this.repo.getQualifyingDealsForTeam(repIds, params.boardId, window);
    const repDealSets   = computeRepDealSets(rawDeals, window);
    const allDealIds    = [...new Set(rawDeals.map((d) => d.dealId))];

    // TC-G05: no deals at all → repDealSets is empty, buildMatrix returns rows with isNull
    const rawEvents     = allDealIds.length > 0
      ? await this.repo.getWarningEventsForDeals(allDealIds, warningIds)
      : [];
    // TC-G16: computeWarningActivations only sets meetsThreshold=true for ≥24h active
    const activationMap = computeWarningActivations(rawEvents, window);

    if (params.requestingUserRoles.includes(UserRole.SALES_MANAGER)) {
      await this.repo.setLastUsedBoard(params.requestingUserId, params.boardId).catch(() => {});
    }

    const reps = directReports.map((r: any) => ({
      id: r.id, name: r.name, segment: r.segment ?? null,
    }));

    const matrix = buildMatrix({
      boardId: board.id, boardName: board.name,
      managerId: manager.id, managerName: manager.name,
      period: params.period, periodWindow: window,
      reps, warnings: warningDefs, repDealSets, activationMap,
    });

    this.matrixCache.set(cacheKey, matrix, params.period);
    return matrix;
  }

  // ─── Drill-down ──────────────────────────────────────────────────────────

  async getDrillDown(params: {
    requestingUserRoles: string[];
    repId:               string;
    warningId:           string;
    boardId:             string;
    period:              Period;
    now?:                Date;
  }): Promise<DrillDownResult> {
    this.assertAccess(params.requestingUserRoles);

    const now    = params.now ?? new Date();
    const window = resolvePeriodWindow(params.period, now);

    const [rep, warning, board] = await Promise.all([
      this.repo.getRepById(params.repId),
      this.repo.getWarningById(params.warningId),
      this.repo.getBoardById(params.boardId),
    ]);
    if (!rep)     throw new NotFoundException(`Rep ${params.repId} not found`);
    if (!warning) throw new NotFoundException(`Warning ${params.warningId} not found`);
    if (!board)   throw new NotFoundException(`Board ${params.boardId} not found`);

    const rawDeals    = await this.repo.getQualifyingDealsForTeam([params.repId], params.boardId, window);
    const repDealSets = computeRepDealSets(rawDeals, window);
    const repSet      = repDealSets.get(params.repId);

    // TC-G08: rep has 0 qualifying deals → return empty deals array, not an error
    if (!repSet || repSet.dealCount === 0) {
      return {
        repId: rep.id, repName: (rep as any).name,
        warningId: warning.id, warningLabel: (warning as any).label,
        boardId: board.id, boardName: board.name,
        period: params.period, flaggedCount: 0, totalDealCount: 0, percentage: 0, deals: [],
      };
    }

    const rawEvents     = await this.repo.getWarningEventsForDeals(repSet.qualifyingDealIds, [params.warningId]);
    const activationMap = computeWarningActivations(rawEvents, window);

    const flaggedDealIds = repSet.qualifyingDealIds.filter((id) =>
      activationMap.get(id)?.get(params.warningId)?.meetsThreshold === true,
    );

    // TC-G08: warning exists but no deals are flagged → return empty list
    if (flaggedDealIds.length === 0) {
      return {
        repId: rep.id, repName: (rep as any).name,
        warningId: warning.id, warningLabel: (warning as any).label,
        boardId: board.id, boardName: board.name,
        period: params.period,
        flaggedCount: 0, totalDealCount: repSet.dealCount, percentage: 0, deals: [],
      };
    }

    const dealDetails = await this.repo.getDealDetails(flaggedDealIds);
    const deals: DrillDownDeal[] = dealDetails.map((d: any) => ({
      dealId:             d.dealId,
      accountName:        d.accountName,
      amount:             d.amount,
      currency:           d.currency,
      crmStage:           d.crmStage,
      closeDate:          d.closeDate,
      warningActiveHours: activationMap.get(d.dealId)?.get(params.warningId)?.activeHours ?? 0,
      viewDealUrl: `/boards/${params.boardId}/deals/${d.dealId}?tab=warnings`,
    }));
    deals.sort((a, b) => new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime());

    const percentage = Math.round((flaggedDealIds.length / repSet.dealCount) * 100);

    return {
      repId: rep.id, repName: (rep as any).name,
      warningId: warning.id, warningLabel: (warning as any).label,
      boardId: board.id, boardName: board.name,
      period: params.period,
      flaggedCount: flaggedDealIds.length,
      totalDealCount: repSet.dealCount,
      percentage, deals,
    };
  }

  // ─── Board comparison ─────────────────────────────────────────────────────

  async getBoardComparison(params: {
    requestingUserRoles:  string[];
    baselineBoardId:      string;
    comparisonBoardId:    string;
    managerId:            string | null;
    period:               Period;
    now?:                 Date;
  }): Promise<BoardComparisonResult> {
    this.assertAccess(params.requestingUserRoles);

    // TC-G19: same board on both sides — return a clear error rather than silently
    // computing identical data (which could mislead the CRO)
    if (params.baselineBoardId === params.comparisonBoardId) {
      throw new Error('SAME_BOARD_COMPARISON: baseline and comparison boards must be different.');
    }

    const now    = params.now ?? new Date();
    const window = resolvePeriodWindow(params.period, now);

    const [baselineBoard, comparisonBoard, baselineWarnings, comparisonWarnings] = await Promise.all([
      this.repo.getBoardById(params.baselineBoardId),
      this.repo.getBoardById(params.comparisonBoardId),
      this.repo.getWarningsForBoard(params.baselineBoardId),
      this.repo.getWarningsForBoard(params.comparisonBoardId),
    ]);
    if (!baselineBoard)   throw new NotFoundException('Baseline board not found');
    if (!comparisonBoard) throw new NotFoundException('Comparison board not found');

    // TC-G22: managerId optional — if absent, use all reps visible to the requesting user
    let repIds: string[] = [];
    if (params.managerId) {
      const reps = await this.repo.getDirectReports(params.managerId);
      repIds = reps.map((r: any) => r.id);
    }
    // (if empty, computeBoardRates will query all deals on the board — handled in repo)

    const [baselineRates, comparisonRates] = await Promise.all([
      this.computeBoardRates(params.baselineBoardId, baselineWarnings, repIds, window),
      this.computeBoardRates(params.comparisonBoardId, comparisonWarnings, repIds, window),
    ]);

    const baselineWarningIds   = new Set(baselineWarnings.map((w: any) => w.warningId));
    const comparisonWarningIds = new Set(comparisonWarnings.map((w: any) => w.warningId));
    const baselineRateMap      = new Map(baselineRates.map((r) => [r.warningId, r]));
    const comparisonRateMap    = new Map(comparisonRates.map((r) => [r.warningId, r]));

    // TC-G20: mark warnings that only exist on one board
    for (const rate of baselineRates) {
      rate.isBoardSpecific   = !comparisonWarningIds.has(rate.warningId);
      rate.deltaFromBaseline = null;
      rate.deltaDirection    = null;
    }
    for (const rate of comparisonRates) {
      rate.isBoardSpecific = !baselineWarningIds.has(rate.warningId);
      if (!rate.isBoardSpecific) {
        const base = baselineRateMap.get(rate.warningId);
        if (base) {
          rate.deltaFromBaseline = rate.percentage - base.percentage;
          rate.deltaDirection    = rate.deltaFromBaseline > 0 ? 'WORSE'
            : rate.deltaFromBaseline < 0 ? 'BETTER' : 'UNCHANGED';
        }
      }
    }

    const overlappingWarningIds = [...baselineWarningIds].filter((id) => comparisonWarningIds.has(id));
    const overlapping = overlappingWarningIds.map((id) => {
      const base = baselineRateMap.get(id)!;
      const comp = comparisonRateMap.get(id)!;
      const delta = comp.percentage - base.percentage;
      return {
        warningId:     id,
        label:         base.label,
        baselinePct:   base.percentage,
        comparisonPct: comp.percentage,
        delta,
        // TC-G21: 0% on both sides → UNCHANGED (not hidden)
        direction: (delta > 0 ? 'WORSE' : delta < 0 ? 'BETTER' : 'UNCHANGED') as 'WORSE' | 'BETTER' | 'UNCHANGED',
      };
    }).sort((a, b) => b.delta - a.delta);

    const insightText    = this.generateComparisonInsight(overlapping, baselineBoard.name, comparisonBoard.name);
    const insightSummary = this.buildInsightSummary(overlapping);

    return {
      baselineBoardId:     params.baselineBoardId,
      baselineBoardName:   baselineBoard.name,
      comparisonBoardId:   params.comparisonBoardId,
      comparisonBoardName: comparisonBoard.name,
      managerId: params.managerId,
      period:    params.period,
      baselineRates, comparisonRates, overlappingWarnings: overlapping,
      insightText, insightSummary,
    };
  }

  // ─── Coaching effectiveness ───────────────────────────────────────────────

  async getCoachingEffectiveness(params: {
    requestingUserRoles: string[];
    repId:               string;
    boardId:             string;
    now?:                Date;
  }): Promise<CoachingEffectivenessResult> {
    this.assertAccess(params.requestingUserRoles);

    const now = params.now ?? new Date();
    const [rep, board, warnings] = await Promise.all([
      this.repo.getRepById(params.repId),
      this.repo.getBoardById(params.boardId),
      this.repo.getWarningsForBoard(params.boardId),
    ]);
    if (!rep)   throw new NotFoundException(`Rep ${params.repId} not found`);
    if (!board) throw new NotFoundException(`Board ${params.boardId} not found`);

    const warningDefs = warnings.map((bw: any) => ({
      warningId: bw.warningId, label: bw.label,
    }));
    const warningIds = warningDefs.map((w) => w.warningId);

    // TC-G09: each snapshot computed independently; if one period has no data,
    // that snapshot returns null percentages — handled in computeRepSnapshot
    const [baselineSnapshot, currentSnapshotRaw] = await Promise.all([
      this.computeRepSnapshot(params.repId, params.boardId, Period.LAST_30_DAYS, warningIds, warningDefs, now),
      this.computeRepSnapshot(params.repId, params.boardId, Period.NOW, warningIds, warningDefs, now),
    ]);

    const baseMap = new Map(baselineSnapshot.map((s) => [s.warningId, s]));
    const currentSnapshot: CoachingWarningSnapshot[] = currentSnapshotRaw.map((curr) => {
      const base = baseMap.get(curr.warningId);
      // TC-G09: null percentage on either side → no direction computed
      if (base?.percentage == null || curr.percentage == null) {
        return { ...curr, deltaPercentage: null, direction: null };
      }
      const delta     = curr.percentage - base.percentage;
      const direction = delta < 0 ? 'IMPROVED' : delta > 0 ? 'REGRESSED' : 'UNCHANGED';
      return { ...curr, deltaPercentage: delta, direction: direction as 'IMPROVED' | 'REGRESSED' | 'UNCHANGED' };
    });

    const improvements = currentSnapshot.filter((s) => s.direction === 'IMPROVED').map((s) => s.warningId);
    const regressions  = currentSnapshot.filter((s) => s.direction === 'REGRESSED').map((s) => s.warningId);
    const unchangedCount = currentSnapshot.filter((s) => s.direction === 'UNCHANGED').length;

    let overallDirection: RepSummary['overallDirection'];
    if (improvements.length === 0 && regressions.length === 0) overallDirection = 'NO_CHANGE';
    else if (improvements.length > regressions.length)         overallDirection = 'IMPROVING';
    else if (regressions.length > improvements.length)         overallDirection = 'REGRESSING';
    else                                                        overallDirection = 'MIXED';

    // TC-G09: if both periods have no data, surface a clear no-data state
    const hasBaselineData = baselineSnapshot.some((s) => s.percentage !== null);
    const hasCurrentData  = currentSnapshotRaw.some((s) => s.percentage !== null);

    const repSummary: RepSummary = {
      improvedCount: improvements.length,
      regressedCount: regressions.length,
      unchangedCount,
      overallDirection,
      // Additional coaching metadata for TC-G09
      hasBaselineData,
      hasCurrentData,
    } as any;

    const insightText = this.generateCoachingInsight(
      (rep as any).name, baselineSnapshot, currentSnapshot,
      improvements, regressions, warningDefs,
      hasBaselineData, hasCurrentData,
    );

    return {
      repId: rep.id, repName: (rep as any).name,
      boardId: board.id, boardName: board.name,
      baselinePeriod: Period.LAST_30_DAYS,
      currentPeriod:  Period.NOW,
      baselineSnapshot, currentSnapshot, improvements, regressions, insightText, repSummary,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async computeRepSnapshot(
    repId: string, boardId: string, period: Period,
    warningIds: string[], warningDefs: Array<{ warningId: string; label: string }>,
    now: Date,
  ): Promise<CoachingWarningSnapshot[]> {
    const window      = resolvePeriodWindow(period, now);
    const rawDeals    = await this.repo.getQualifyingDealsForTeam([repId], boardId, window);
    const repDealSets = computeRepDealSets(rawDeals, window);
    const repSet      = repDealSets.get(repId);

    // TC-G09: no data for this period → null percentages, not 0
    if (!repSet || repSet.dealCount === 0) {
      return warningDefs.map((w) => ({
        warningId: w.warningId, label: w.label,
        percentage: null, flaggedCount: 0, dealCount: 0,
        deltaPercentage: null, direction: null,
      }));
    }

    const rawEvents     = await this.repo.getWarningEventsForDeals(repSet.qualifyingDealIds, warningIds);
    const activationMap = computeWarningActivations(rawEvents, window);

    return warningDefs.map((w) => {
      const flaggedCount = countFlaggedDeals(activationMap, repSet.qualifyingDealIds, w.warningId);
      const percentage   = Math.round((flaggedCount / repSet.dealCount) * 100);
      return {
        warningId: w.warningId, label: w.label, percentage, flaggedCount, dealCount: repSet.dealCount,
        deltaPercentage: null, direction: null,
      };
    });
  }

  private async computeBoardRates(
    boardId: string,
    warnings: any[],
    repIds: string[],
    window: { start: Date; end: Date },
  ): Promise<BoardWarningRate[]> {
    if (warnings.length === 0) return [];
    const warningIds = warnings.map((w) => w.warningId);
    const rawDeals   = await this.repo.getQualifyingDealsForTeam(repIds, boardId, window);
    const allDealIds = [...new Set(rawDeals.map((d) => d.dealId))];
    const totalDeals = allDealIds.length;

    if (totalDeals === 0) {
      return warnings.map((w) => ({
        warningId: w.warningId, warningKey: w.warningKey, label: w.label,
        flaggedCount: 0, totalDeals: 0, percentage: 0,
        isBoardSpecific: false, deltaFromBaseline: null, deltaDirection: null,
      }));
    }

    const rawEvents     = await this.repo.getWarningEventsForDeals(allDealIds, warningIds);
    const activationMap = computeWarningActivations(rawEvents, window);

    return warnings.map((w) => {
      let flaggedCount = 0;
      for (const dealId of allDealIds) {
        if (activationMap.get(dealId)?.get(w.warningId)?.meetsThreshold) flaggedCount++;
      }
      return {
        warningId: w.warningId, warningKey: w.warningKey, label: w.label,
        flaggedCount, totalDeals,
        percentage: Math.round((flaggedCount / totalDeals) * 100),
        isBoardSpecific: false, deltaFromBaseline: null, deltaDirection: null,
      };
    });
  }

  private buildInsightSummary(
    overlapping: Array<{ label: string; delta: number; direction: string }>,
  ): InsightSummary {
    const worseningCount = overlapping.filter((w) => w.direction === 'WORSE').length;
    const improvingCount = overlapping.filter((w) => w.direction === 'BETTER').length;
    const worstItem = overlapping.filter((w) => w.direction === 'WORSE').sort((a, b) => b.delta - a.delta)[0] ?? null;
    let recommendation: InsightSummary['recommendation'];
    if (worseningCount >= 2)       recommendation = 'escalate_enablement';
    else if (worseningCount === 1) recommendation = 'individual_coaching';
    else                           recommendation = 'on_track';
    return {
      worseningCount, improvingCount,
      topWorseningWarning: worstItem?.label ?? null,
      topWorseningDelta:   worstItem?.delta ?? null,
      recommendation,
    };
  }

  private generateComparisonInsight(
    overlapping: Array<{ label: string; baselinePct: number; comparisonPct: number; direction: string }>,
    baselineName: string, comparisonName: string,
  ): string {
    if (overlapping.length === 0) return `No overlapping warnings between ${baselineName} and ${comparisonName}.`;
    const worst = overlapping.filter((w) => w.direction === 'WORSE');
    if (worst.length === 0) return `All shared warnings improve or stay flat from ${baselineName} → ${comparisonName}. Pipeline health is consistent.`;
    const top = worst.slice(0, 2)
      .map((w) => `"${w.label}" worsens ${w.baselinePct}% → ${w.comparisonPct}%`)
      .join(' and ');
    return `${top} as deals mature. Problem compounds at closing stage — not discovery. Closing process enablement needed.`;
  }

  private generateCoachingInsight(
    repName: string,
    baseline: CoachingWarningSnapshot[],
    current:  CoachingWarningSnapshot[],
    improvements: string[],
    regressions:  string[],
    warningDefs:  Array<{ warningId: string; label: string }>,
    hasBaselineData: boolean,
    hasCurrentData:  boolean,
  ): string {
    // TC-G09: surface partial-data state clearly
    if (!hasBaselineData && !hasCurrentData) {
      return `No deal data found for ${repName} in either period. No comparison available.`;
    }
    if (!hasBaselineData) {
      return `No data for ${repName} in the last 30 days. Current period data is available — comparison not yet possible.`;
    }
    if (!hasCurrentData) {
      return `${repName} has no active qualifying deals right now. Last 30-day baseline is available for reference.`;
    }
    if (regressions.length === 0 && improvements.length === 0) {
      return `No change detected for ${repName} between periods.`;
    }
    const labelMap = new Map(warningDefs.map((w) => [w.warningId, w.label]));
    const baseMap  = new Map(baseline.map((s) => [s.warningId, s]));
    const currMap  = new Map(current.map((s) => [s.warningId, s]));
    const parts: string[] = [];
    if (improvements.length > 0) {
      const top = improvements[0];
      const b = baseMap.get(top)?.percentage ?? 0;
      const c = currMap.get(top)?.percentage ?? 0;
      parts.push(`"${labelMap.get(top)}" dropped ${b}% → ${c}%`);
    }
    const suffix = regressions.length === 0
      ? 'Coaching is working — continue reinforcement. No regression detected.'
      : `Regression on: ${regressions.map((id) => `"${labelMap.get(id)}"`).join(', ')}. Review coaching approach.`;
    return [parts.join('. '), suffix].filter(Boolean).join('. ');
  }
}
