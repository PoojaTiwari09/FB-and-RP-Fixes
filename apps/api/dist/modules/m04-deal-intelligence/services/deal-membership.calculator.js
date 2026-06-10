"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeRepDealSets = computeRepDealSets;
const period_util_1 = require("./period.util");
const MIN_OWNERSHIP_HOURS = 24;
function computeRepDealSets(rawDeals, window) {
    const result = new Map();
    for (const row of rawDeals) {
        const { repId, dealId, openedAt, closedAt } = row;
        const ownershipEnd = closedAt ?? window.end;
        if (ownershipEnd <= window.start)
            continue;
        const openedBeforeWindow = openedAt < window.start;
        if (!openedBeforeWindow) {
            const overlapMs = (0, period_util_1.intervalOverlapMs)(openedAt, ownershipEnd, window.start, window.end);
            if ((0, period_util_1.msToHours)(overlapMs) < MIN_OWNERSHIP_HOURS)
                continue;
        }
        if (!result.has(repId)) {
            result.set(repId, { repId, qualifyingDealIds: [], dealCount: 0 });
        }
        const repSet = result.get(repId);
        if (!repSet.qualifyingDealIds.includes(dealId)) {
            repSet.qualifyingDealIds.push(dealId);
            repSet.dealCount++;
        }
    }
    return result;
}
//# sourceMappingURL=deal-membership.calculator.js.map