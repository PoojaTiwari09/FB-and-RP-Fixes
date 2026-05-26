/**
 * Governed Metrics Registry — single source of truth for all dashboard metrics.
 * Feature #21: every metric is defined here; UI and widgets reference this registry.
 */

export type MetricFormat   = 'currency' | 'percent' | 'number';
export type MetricCategory = 'Revenue' | 'Pipeline' | 'Activity' | 'Efficiency';

export type MetricDefinition = {
  id:              string;
  name:            string;
  shortName:       string;
  description:     string;
  format:          MetricFormat;
  category:        MetricCategory;
  higherIsBetter:  boolean;
  /** What time/filter context makes this metric meaningful */
  hint?:           string;
};

export const METRICS_REGISTRY: Record<string, MetricDefinition> = {
  bookings: {
    id:             'bookings',
    name:           'Bookings',
    shortName:      'Bookings',
    description:    'Total revenue from Closed Won deals in the selected period',
    format:         'currency',
    category:       'Revenue',
    higherIsBetter: true,
    hint:           'Sum of amount for stage = "Closed Won"',
  },
  targetAttainment: {
    id:             'targetAttainment',
    name:           'Target Attainment',
    shortName:      'Attainment',
    description:    'Bookings ÷ configured revenue target × 100',
    format:         'percent',
    category:       'Revenue',
    higherIsBetter: true,
    hint:           'Requires a revenue target to be set',
  },
  winRate: {
    id:             'winRate',
    name:           'Win Rate',
    shortName:      'Win Rate',
    description:    'Closed Won deals ÷ total deals in period × 100',
    format:         'percent',
    category:       'Efficiency',
    higherIsBetter: true,
    hint:           'Includes all deal stages in the denominator',
  },
  pipelineValue: {
    id:             'pipelineValue',
    name:           'Pipeline Value',
    shortName:      'Pipeline',
    description:    'Total value of all open (non-closed) deals in the period',
    format:         'currency',
    category:       'Pipeline',
    higherIsBetter: true,
    hint:           'Excludes Closed Won and Closed Lost stages',
  },
  dealCount: {
    id:             'dealCount',
    name:           'Deal Count',
    shortName:      'Deals',
    description:    'Total number of deals matching current filters',
    format:         'number',
    category:       'Activity',
    higherIsBetter: true,
    hint:           'Count of all deal rows after filters applied',
  },
};

/** All metric keys in order for display */
export const METRIC_KEYS = Object.keys(METRICS_REGISTRY);

/** Format a raw metric value using registry rules */
export function formatMetricValue(metricId: string, value: number): string {
  const m = METRICS_REGISTRY[metricId];
  if (!m) return String(value);
  if (m.format === 'currency') return `$${Math.round(value / 1000)}k`;
  if (m.format === 'percent')  return `${value}%`;
  return String(value);
}

/** Return the MetricDefinition or a safe fallback */
export function getMetric(metricId: string): MetricDefinition {
  return METRICS_REGISTRY[metricId] ?? {
    id: metricId, name: metricId, shortName: metricId,
    description: metricId, format: 'number', category: 'Activity', higherIsBetter: true,
  };
}

/** Group metric definitions by category for the Data Studio panel */
export function getMetricsByCategory(): Record<MetricCategory, MetricDefinition[]> {
  const out: Record<MetricCategory, MetricDefinition[]> = {
    Revenue: [], Pipeline: [], Activity: [], Efficiency: [],
  };
  Object.values(METRICS_REGISTRY).forEach(m => out[m.category].push(m));
  return out;
}
