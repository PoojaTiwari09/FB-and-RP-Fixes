import {
  DashboardDefinition,
  DatasetDefinition,
  DashboardWidget,
  computeDashboardRows,
  fallbackBuilderConfig,
  renderWidgetData,
  summarizeRows,
} from "./sample-data";

const DATASETS_KEY = "rri.datasets";
const DASHBOARDS_KEY = "rri.dashboards";
const SHARES_KEY = "rri.shares";

const SEEDED_DATASETS: DatasetDefinition[] = [
  {
    id: "dataset-sample-combined",
    name: "Sample Combined Revenue Dataset",
    sourceMode: "COMBINED",
    selectedObjects: ["deals", "accounts", "calls", "transcriptions"],
    selectedFields: {
      deals: ["dealName", "amount", "stage", "ownerName", "accountName", "quarter"],
      accounts: ["accountName", "ownerName", "industry"],
      calls: ["accountName", "durationSec", "occurredAt"],
      transcriptions: ["accountName", "sentiment", "occurredAt"],
    },
    relationships: fallbackBuilderConfig.relationships,
    mappingAccepted: true,
    createdAt: new Date("2026-05-18T12:00:00.000Z").toISOString(),
  },
];

const SEEDED_DASHBOARDS: DashboardDefinition[] = [
  {
    id: "dashboard-sample-revenue",
    title: "Sample Revenue Dashboard",
    datasetId: "dataset-sample-combined",
    access: "PRIVATE",
    createdAt: new Date("2026-05-18T12:30:00.000Z").toISOString(),
    widgets: [
      {
        id: "widget-sample-bookings",
        title: "Bookings",
        type: "KPI",
        xField: "accountName",
        yMetric: "bookings",
        filters: { customer: "All Customers", team: "All Teams", metricFilter: "ALL" },
      },
      {
        id: "widget-sample-stage",
        title: "Pipeline by Stage",
        type: "FUNNEL",
        xField: "stage",
        yMetric: "pipelineValue",
        filters: { customer: "All Customers", team: "All Teams", metricFilter: "ALL" },
      },
      {
        id: "widget-sample-account",
        title: "Bookings by Account",
        type: "BAR",
        xField: "accountName",
        yMetric: "pipelineValue",
        filters: { customer: "All Customers", team: "All Teams", metricFilter: "ALL" },
      },
    ],
  },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function listDatasets() {
  const value = readJson<DatasetDefinition[] | unknown>(DATASETS_KEY, []);
  const datasets = Array.isArray(value) ? value as DatasetDefinition[] : [];
  return datasets.length > 0 ? datasets : SEEDED_DATASETS;
}

export function saveDataset(dataset: DatasetDefinition) {
  const current = listDatasets();
  const next = [dataset, ...current.filter((item) => item.id !== dataset.id)];
  writeJson(DATASETS_KEY, next);
  return dataset;
}

export function listDashboards() {
  const value = readJson<DashboardDefinition[] | unknown>(DASHBOARDS_KEY, []);
  if (!Array.isArray(value)) {
    return SEEDED_DASHBOARDS;
  }
  const dashboards = value
    .filter((item): item is DashboardDefinition => typeof item === "object" && item !== null)
    .map((item) => ({
      ...item,
      widgets: Array.isArray(item.widgets) ? item.widgets : [],
    }));
  return dashboards.length > 0 ? dashboards : SEEDED_DASHBOARDS;
}

export function saveDashboard(dashboard: DashboardDefinition) {
  const current = listDashboards();
  const next = [dashboard, ...current.filter((item) => item.id !== dashboard.id)];
  writeJson(DASHBOARDS_KEY, next);
  return dashboard;
}

export function createWidgetSeed(type: DashboardWidget["type"] = "BAR"): DashboardWidget {
  return {
    id: `widget-${Date.now()}`,
    title: type === "KPI" ? "New KPI" : "New Chart",
    type,
    xField: "accountName",
    yMetric: type === "KPI" ? "bookings" : "pipelineValue",
    filters: {
      customer: "All Customers",
      team: "All Teams",
      metricFilter: "ALL",
    },
  };
}

export function exportDashboardSnapshot(dashboard: DashboardDefinition, filters: {
  timeRange: "CURRENT_QUARTER" | "LAST_QUARTER" | "ALL_TIME";
  customer: string;
  team: string;
  metricFilter: string;
}, rows: any[]) {
  const filteredRows = computeDashboardRows(rows, filters);
  const summary = summarizeRows(filteredRows);
  const renderedWidgets = dashboard.widgets.map((widget) => ({
    ...widget,
    ...renderWidgetData(widget, filteredRows),
  }));
  return {
    dashboard,
    filters,
    summary,
    renderedWidgets,
    exportedAt: new Date().toISOString(),
  };
}

// createShareLink removed — share links are now generated server-side via
// POST /api/dashboards/share with proper per-dashboard token scoping.
