/**
 * M07 analytics query engine — PostgreSQL-first.
 *
 * Architecture decision (2026-05-27): ClickHouse is NOT wired at runtime.
 * - Primary: Prisma/PostgreSQL aggregations + DashboardSnapshot cache
 * - Future: optional ClickHouse when M07_WIDGET_OLAP_ENABLED=true and client exists
 *
 * See _audit/m07_clickhouse_architecture_decision.md
 */

export type AnalyticsEngine = 'snapshot_cache' | 'postgresql';

export function resolveAnalyticsEngine(): AnalyticsEngine {
  if (process.env.M07_WIDGET_OLAP_ENABLED === 'true' && process.env.CLICKHOUSE_URL) {
    return 'postgresql';
  }
  return 'postgresql';
}

export function analyticsEngineLabel(): string {
  return 'PostgreSQL (Prisma)';
}
