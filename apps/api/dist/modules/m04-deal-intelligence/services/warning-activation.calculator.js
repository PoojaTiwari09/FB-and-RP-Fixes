"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeWarningActivations = computeWarningActivations;
exports.countFlaggedDeals = countFlaggedDeals;
const period_util_1 = require("./period.util");
function computeWarningActivations(events, window) {
    const result = new Map();
    if (events.length === 0)
        return result;
    const windowEndMidnight = new Date(window.end);
    windowEndMidnight.setUTCHours(0, 0, 0, 0);
    const grouped = new Map();
    for (const ev of events) {
        if (!grouped.has(ev.dealId))
            grouped.set(ev.dealId, new Map());
        const byWarning = grouped.get(ev.dealId);
        if (!byWarning.has(ev.warningId))
            byWarning.set(ev.warningId, []);
        byWarning.get(ev.warningId).push(ev);
    }
    for (const [dealId, byWarning] of grouped) {
        const dealMap = new Map();
        for (const [warningId, rawEvents] of byWarning) {
            const beforeWindow = rawEvents.filter((e) => e.triggeredAt < window.start);
            const inOrAfterWindow = rawEvents.filter((e) => e.triggeredAt >= window.start);
            let activeAtWindowStart = false;
            if (beforeWindow.length > 0) {
                const lastBefore = beforeWindow[beforeWindow.length - 1];
                activeAtWindowStart = lastBefore.status === 'ACTIVE';
            }
            const intervals = [];
            let currentStart = activeAtWindowStart ? window.start : null;
            for (const ev of inOrAfterWindow) {
                if (ev.triggeredAt > window.end)
                    break;
                if (ev.status === 'ACTIVE') {
                    if (currentStart === null)
                        currentStart = ev.triggeredAt;
                }
                else {
                    if (currentStart !== null) {
                        intervals.push({ start: currentStart, end: ev.triggeredAt });
                        currentStart = null;
                    }
                }
            }
            if (currentStart !== null) {
                intervals.push({ start: currentStart, end: windowEndMidnight });
            }
            let totalActiveMs = 0;
            for (const interval of intervals) {
                totalActiveMs += (0, period_util_1.intervalOverlapMs)(interval.start, interval.end, window.start, window.end);
            }
            const activeHours = (0, period_util_1.msToHours)(totalActiveMs);
            dealMap.set(warningId, {
                activeHours,
                meetsThreshold: activeHours >= period_util_1.WARNING_ACTIVE_THRESHOLD_HOURS,
            });
        }
        result.set(dealId, dealMap);
    }
    return result;
}
function countFlaggedDeals(activationMap, dealIds, warningId) {
    let count = 0;
    for (const dealId of dealIds) {
        const activation = activationMap.get(dealId)?.get(warningId);
        if (activation?.meetsThreshold)
            count++;
    }
    return count;
}
//# sourceMappingURL=warning-activation.calculator.js.map