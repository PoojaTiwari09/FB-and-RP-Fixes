"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WARNING_ACTIVE_THRESHOLD_HOURS = void 0;
exports.resolvePeriodWindow = resolvePeriodWindow;
exports.intervalOverlapMs = intervalOverlapMs;
exports.msToHours = msToHours;
const deal_drivers_entities_1 = require("../entities/deal-drivers.entities");
const MS_PER_DAY = 24 * 60 * 60 * 1000;
exports.WARNING_ACTIVE_THRESHOLD_HOURS = 24;
function resolvePeriodWindow(period, now = new Date()) {
    const end = new Date(now);
    if (period === deal_drivers_entities_1.Period.NOW) {
        const start = new Date(end);
        start.setUTCHours(0, 0, 0, 0);
        return { start, end };
    }
    const days = period === deal_drivers_entities_1.Period.LAST_30_DAYS ? 30 : 90;
    const start = new Date(end.getTime() - days * MS_PER_DAY);
    return { start, end };
}
function intervalOverlapMs(aStart, aEnd, bStart, bEnd) {
    const overlapStart = Math.max(aStart.getTime(), bStart.getTime());
    const overlapEnd = Math.min(aEnd.getTime(), bEnd.getTime());
    return Math.max(0, overlapEnd - overlapStart);
}
function msToHours(ms) {
    return ms / (1000 * 60 * 60);
}
//# sourceMappingURL=period.util.js.map