"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMatrix = buildMatrix;
const deal_drivers_entities_1 = require("../entities/deal-drivers.entities");
const warning_activation_calculator_1 = require("./warning-activation.calculator");
const TRAINING_NEEDED_THRESHOLD = 4;
function calculatePercentage(flaggedCount, dealCount) {
    if (dealCount === 0)
        return null;
    return Math.round((flaggedCount / dealCount) * 100);
}
function computeColumnHeatmap(cells) {
    const result = new Map();
    const valid = cells.filter((c) => c.percentage !== null);
    if (valid.length === 0)
        return result;
    valid.sort((a, b) => b.percentage - a.percentage);
    if (valid[0].percentage === 0) {
        for (const cell of valid)
            result.set(cell.repId, deal_drivers_entities_1.HeatmapRank.NONE);
        return result;
    }
    const groups = new Map();
    for (const cell of valid) {
        if (!groups.has(cell.percentage))
            groups.set(cell.percentage, []);
        groups.get(cell.percentage).push(cell.repId);
    }
    const uniqueValues = [...groups.keys()].sort((a, b) => b - a);
    const rankMap = {
        0: deal_drivers_entities_1.HeatmapRank.FIRST,
        1: deal_drivers_entities_1.HeatmapRank.SECOND,
        2: deal_drivers_entities_1.HeatmapRank.THIRD,
    };
    uniqueValues.forEach((val, idx) => {
        const rank = rankMap[idx] ?? deal_drivers_entities_1.HeatmapRank.NONE;
        for (const repId of groups.get(val))
            result.set(repId, rank);
    });
    return result;
}
function computeTeamAverage(rows, warningId) {
    let totalFlagged = 0, totalDeals = 0;
    for (const row of rows) {
        const cell = row.cells[warningId];
        if (!cell || cell.isNull)
            continue;
        totalFlagged += cell.flaggedCount;
        totalDeals += cell.dealCount;
    }
    if (totalDeals === 0)
        return null;
    return Math.round((totalFlagged / totalDeals) * 100);
}
function computeTrainingNeeded(rows, warningId) {
    const highlighted = rows.filter((r) => r.cells[warningId]?.heatmapRank !== deal_drivers_entities_1.HeatmapRank.NONE);
    return { needed: highlighted.length >= TRAINING_NEEDED_THRESHOLD, count: highlighted.length };
}
function generateInsightText(rows, warnings) {
    const trainingCols = warnings.filter((w) => w.trainingNeeded).map((w) => w.label);
    if (trainingCols.length === 0)
        return 'No systemic issues detected. Focus on individual coaching.';
    return `⚠ Systemic issue: ${trainingCols.join(', ')} — ${trainingCols.length} of ${warnings.length} columns affected team-wide. Escalate enablement.`;
}
function buildTooltipText(flaggedCount, dealCount, isNull) {
    if (isNull || dealCount === 0)
        return 'No deals in this period';
    return `${flaggedCount} of ${dealCount} deals had this warning`;
}
function buildMatrix(params) {
    const { boardId, boardName, managerId, managerName, period, periodWindow, reps, warnings, repDealSets, activationMap } = params;
    const rawRows = reps.map((rep) => {
        const dealSet = repDealSets.get(rep.id);
        const dealCount = dealSet?.dealCount ?? 0;
        const qualifyingDealIds = dealSet?.qualifyingDealIds ?? [];
        const cells = {};
        for (const warn of warnings) {
            const flaggedCount = (0, warning_activation_calculator_1.countFlaggedDeals)(activationMap, qualifyingDealIds, warn.warningId);
            const percentage = calculatePercentage(flaggedCount, dealCount);
            const isNull = dealCount === 0;
            cells[warn.warningId] = {
                repId: rep.id,
                warningId: warn.warningId,
                flaggedCount,
                dealCount,
                percentage: percentage ?? 0,
                heatmapRank: deal_drivers_entities_1.HeatmapRank.NONE,
                isNull,
                tooltipText: buildTooltipText(flaggedCount, dealCount, isNull),
            };
        }
        return { repId: rep.id, repName: rep.name, segment: rep.segment, dealCount, cells };
    });
    for (const warn of warnings) {
        const colCells = rawRows.map((row) => ({
            repId: row.repId,
            percentage: row.cells[warn.warningId].isNull ? null : row.cells[warn.warningId].percentage,
        }));
        const heatmap = computeColumnHeatmap(colCells);
        for (const row of rawRows) {
            row.cells[warn.warningId].heatmapRank = heatmap.get(row.repId) ?? deal_drivers_entities_1.HeatmapRank.NONE;
        }
    }
    const warningColumns = warnings.map((warn) => {
        const { needed, count } = computeTrainingNeeded(rawRows, warn.warningId);
        return {
            warningId: warn.warningId,
            warningKey: warn.warningKey,
            label: warn.label,
            sortOrder: warn.sortOrder,
            trainingNeeded: needed,
            highlightedRepCount: count,
        };
    });
    const averages = {};
    for (const warn of warnings)
        averages[warn.warningId] = computeTeamAverage(rawRows, warn.warningId);
    const insightText = generateInsightText(rawRows, warningColumns);
    return {
        boardId, boardName, managerId, managerName, period, periodWindow,
        warnings: warningColumns,
        rows: rawRows,
        teamAverage: { averages },
        generatedAt: new Date(),
        insightText,
    };
}
//# sourceMappingURL=matrix.builder.js.map