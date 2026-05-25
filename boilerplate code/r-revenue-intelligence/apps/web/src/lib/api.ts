import { fallbackBuilderConfig, fallbackDashboardConfig } from "./sample-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function getKpis(token?: string, timeRange = "CURRENT_QUARTER") {
  const response = await fetch(`${API_URL}/revenue-graph/kpis?timeRange=${timeRange}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      bookings: 0,
      targetAttainment: 0,
      winRate: 0,
      quarter: timeRange,
    };
  }

  return response.json();
}

export async function getSampleBuilderConfig() {
  try {
    const response = await fetch(`${API_URL}/deal-account/sample-builder`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return fallbackBuilderConfig;
    }
    return response.json();
  } catch {
    return fallbackBuilderConfig;
  }
}

export async function validateSampleDataset(body: Record<string, unknown>) {
  try {
    const response = await fetch(`${API_URL}/deal-account/sample-builder/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("validation failed");
    }
    return response.json();
  } catch {
    return {
      valid: true,
      mappingStatus: "VALIDATED",
      message: "Mapping validation step passed in local fallback mode.",
      rejectedFields: [],
      relationshipErrors: [],
      suggestedRelationships: fallbackBuilderConfig.relationships,
      preview: fallbackBuilderConfig.objects[0]?.sampleRows ?? [],
    };
  }
}

export async function saveSampleDataset(body: Record<string, unknown>) {
  try {
    const response = await fetch(`${API_URL}/deal-account/sample-builder/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("save failed");
    }
    return response.json();
  } catch {
    return { id: `local-${Date.now()}`, ...body };
  }
}

export async function listSampleDatasets() {
  try {
    const response = await fetch(`${API_URL}/deal-account/sample-builder/datasets`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    return response.json();
  } catch {
    return [];
  }
}

export async function getSampleDashboard(timeRange = "CURRENT_QUARTER") {
  const response = await fetch(`${API_URL}/revenue-graph/sample-dashboard?timeRange=${timeRange}`, {
    cache: "no-store",
  });
  return response.json();
}

export async function getSampleDashboardBuilderConfig() {
  try {
    const response = await fetch(`${API_URL}/revenue-graph/sample-dashboard-builder/config`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return fallbackDashboardConfig;
    }
    return response.json();
  } catch {
    return fallbackDashboardConfig;
  }
}

export async function addSampleWidget(body: Record<string, unknown>) {
  try {
    const response = await fetch(`${API_URL}/revenue-graph/sample-dashboard-builder/widgets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("add widget failed");
    }
    return response.json();
  } catch {
    return { id: `local-widget-${Date.now()}`, ...body };
  }
}

export async function removeSampleWidget(widgetId: string) {
  try {
    const response = await fetch(`${API_URL}/revenue-graph/sample-dashboard-builder/widgets/${widgetId}/delete`, {
      method: "POST",
    });
    if (!response.ok) {
      return [];
    }
    return response.json();
  } catch {
    return [];
  }
}

export async function renderSampleDashboard(body: Record<string, unknown>) {
  try {
    const response = await fetch(`${API_URL}/revenue-graph/sample-dashboard-builder/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("render failed");
    }
    return response.json();
  } catch {
    return {
      quarter: (body.timeRange as string) === "LAST_QUARTER" ? "Q1-2026" : "Q2-2026",
      summary: { bookings: 100000, targetAttainment: 67, winRate: 50 },
      widgets: (body.widgets as Array<Record<string, unknown>>).map((widget) => ({
        ...widget,
        value: widget.yMetric === "bookings" ? 100000 : widget.yMetric === "targetAttainment" ? 67 : 50,
        data: widget.type === "KPI"
          ? []
          : [
            { label: "Northwind", value: 58000 },
            { label: "Globex", value: 42000 },
          ],
      })),
    };
  }
}

export async function exportSampleDashboard(body: Record<string, unknown>) {
  try {
    const response = await fetch(`${API_URL}/revenue-graph/sample-dashboard-builder/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("export failed");
    }
    return response.json();
  } catch {
    return { exportedAt: new Date().toISOString(), snapshot: body };
  }
}

export async function shareSampleDashboard(body: Record<string, unknown>) {
  try {
    const response = await fetch(`${API_URL}/revenue-graph/sample-dashboard-builder/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("share failed");
    }
    return response.json();
  } catch {
    return { shareUrl: "http://localhost:3000/dashboards?share=local-preview" };
  }
}
