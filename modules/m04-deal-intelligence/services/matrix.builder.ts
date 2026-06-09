// src/modules/deal-drivers/matrix.builder.ts
// Builds the full DealDriversMatrix from pre-computed activation data.

import {
  MatrixCell, MatrixRow, WarningColumn,
  DealDriversMatrix, HeatmapRank, Period, PeriodWindow, RepDealSet,
  ActivationMap,
} from '../entities/deal-drivers.entities';
import { countFlaggedDeals } from './warning-activation.calculator';

const TRAINING_NEEDED_THRESHOLD = 4;

interface RepInfo    { id: string; name: string; segment: string | null }
interface WarningDef { warningId: string; warningKey: string; label: string; sortOrder: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculatePercentage(flaggedCount: number, dealCount: number): number | null {
  if (dealCount === 0) return null;
  return Math.round((flaggedCount / dealCount) * 100);
}

/**
 * FIX TC-G12: When ALL reps have 0%, no heatmap highlighting should occur.
 * Previously, the uniqueValues loop assigned FIRST rank to the 0% value even
 * when every rep shared it. Guard: if the highest unique value is 0, assign
 * HeatmapRank.NONE to everyone.
 */
function computeColumnHeatmap(
  cells: Array<{ repId: string; percentage: number | null }>,
): Map<string, HeatmapRank> {
  const result = new Map<string, HeatmapRank>();
  const valid = cells.filter((c): c is { repId: string; percentage: number } => c.percentage !== null);
  if (valid.length === 0) return result;

  valid.sort((a, b) => b.percentage - a.percentage);

  // FIX TC-G12: If the top percentage is 0, nobody deserves a highlight rank.
  if (valid[0].percentage === 0) {
    for (const cell of valid) result.set(cell.repId, HeatmapRank.NONE);
    return result;
  }

  const groups = new Map<number, string[]>();
  for (const cell of valid) {
    if (!groups.has(cell.percentage)) groups.set(cell.percentage, []);
    groups.get(cell.percentage)!.push(cell.repId);
  }

  const uniqueValues = [...groups.keys()].sort((a, b) => b - a);
  const rankMap: Record<number, HeatmapRank> = {
    0: HeatmapRank.FIRST,
    1: HeatmapRank.SECOND,
    2: HeatmapRank.THIRD,
  };

  uniqueValues.forEach((val, idx) => {
    const rank = rankMap[idx] ?? HeatmapRank.NONE;
    for (const repId of groups.get(val)!) result.set(repId, rank);
  });
  return result;
}

function computeTeamAverage(rows: MatrixRow[], warningId: string): number | null {
  let totalFlagged = 0, totalDeals = 0;
  for (const row of rows) {
    const cell = row.cells[warningId];
    if (!cell || cell.isNull) continue;
    totalFlagged += cell.flaggedCount;
    totalDeals   += cell.dealCount;
  }
  if (totalDeals === 0) return null;
  return Math.round((totalFlagged / totalDeals) * 100);
}

function computeTrainingNeeded(rows: MatrixRow[], warningId: string) {
  const highlighted = rows.filter(
    (r) => r.cells[warningId]?.heatmapRank !== HeatmapRank.NONE,
  );
  return { needed: highlighted.length >= TRAINING_NEEDED_THRESHOLD, count: highlighted.length };
}

function generateInsightText(rows: MatrixRow[], warnings: WarningColumn[]): string {
  const trainingCols = warnings.filter((w) => w.trainingNeeded).map((w) => w.label);
  if (trainingCols.length === 0) return 'No systemic issues detected. Focus on individual coaching.';
  return `⚠ Systemic issue: ${trainingCols.join(', ')} — ${trainingCols.length} of ${warnings.length} columns affected team-wide. Escalate enablement.`;
}

// US-11: build tooltip text for a cell
function buildTooltipText(flaggedCount: number, dealCount: number, isNull: boolean): string {
  if (isNull || dealCount === 0) return 'No deals in this period';
  return `${flaggedCount} of ${dealCount} deals had this warning`;
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildMatrix(params: {
  boardId:        string;
  boardName:      string;
  managerId:      string;
  managerName:    string;
  period:         Period;
  periodWindow:   PeriodWindow;
  reps:           RepInfo[];
  warnings:       WarningDef[];
  repDealSets:    Map<string, RepDealSet>;
  activationMap:  ActivationMap;
}): DealDriversMatrix {
  const { boardId, boardName, managerId, managerName, period, periodWindow, reps, warnings, repDealSets, activationMap } = params;

  // Step 1: raw cells (no heatmap yet)
  const rawRows: MatrixRow[] = reps.map((rep) => {
    const dealSet         = repDealSets.get(rep.id);
    const dealCount       = dealSet?.dealCount ?? 0;
    const qualifyingDealIds = dealSet?.qualifyingDealIds ?? [];
    const cells: Record<string, MatrixCell> = {};

    for (const warn of warnings) {
      const flaggedCount = countFlaggedDeals(activationMap, qualifyingDealIds, warn.warningId);
      const percentage   = calculatePercentage(flaggedCount, dealCount);
      // FIX TC-G06: isNull is true ONLY when rep has zero deals (no data at all).
      // A rep with deals but 0 flagged → isNull:false, percentage:0. Not null.
      const isNull       = dealCount === 0;
      cells[warn.warningId] = {
        repId:        rep.id,
        warningId:    warn.warningId,
        flaggedCount,
        dealCount,
        percentage:   percentage ?? 0,
        heatmapRank:  HeatmapRank.NONE,
        isNull,
        tooltipText:  buildTooltipText(flaggedCount, dealCount, isNull),  // US-11
      };
    }
    return { repId: rep.id, repName: rep.name, segment: rep.segment, dealCount, cells };
  });

  // Step 2: heatmap per column
  for (const warn of warnings) {
    const colCells = rawRows.map((row) => ({
      repId:      row.repId,
      percentage: row.cells[warn.warningId].isNull ? null : row.cells[warn.warningId].percentage,
    }));
    const heatmap = computeColumnHeatmap(colCells);
    for (const row of rawRows) {
      row.cells[warn.warningId].heatmapRank = heatmap.get(row.repId) ?? HeatmapRank.NONE;
    }
  }

  // Step 3: warning columns with training needed
  const warningColumns: WarningColumn[] = warnings.map((warn) => {
    const { needed, count } = computeTrainingNeeded(rawRows, warn.warningId);
    return {
      warningId:           warn.warningId,
      warningKey:          warn.warningKey,
      label:               warn.label,
      sortOrder:           warn.sortOrder,
      trainingNeeded:      needed,
      highlightedRepCount: count,
    };
  });

  // Step 4: team average row
  const averages: Record<string, number | null> = {};
  for (const warn of warnings) averages[warn.warningId] = computeTeamAverage(rawRows, warn.warningId);

  const insightText = generateInsightText(rawRows, warningColumns);

  return {
    boardId, boardName, managerId, managerName, period, periodWindow,
    warnings:    warningColumns,
    rows:        rawRows,
    teamAverage: { averages },
    generatedAt: new Date(),
    insightText,
  };
}
