export type AnalyticsEngine = 'snapshot_cache' | 'postgresql';
export declare function resolveAnalyticsEngine(): AnalyticsEngine;
export declare function analyticsEngineLabel(): string;
