"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAnalyticsEngine = resolveAnalyticsEngine;
exports.analyticsEngineLabel = analyticsEngineLabel;
function resolveAnalyticsEngine() {
    if (process.env.M07_WIDGET_OLAP_ENABLED === 'true' && process.env.CLICKHOUSE_URL) {
        return 'postgresql';
    }
    return 'postgresql';
}
function analyticsEngineLabel() {
    return 'PostgreSQL (Prisma)';
}
//# sourceMappingURL=analytics-query.engine.js.map