import { NextResponse } from "next/server";
import { computeDashboardRows, getDateBounds } from "@/modules/m07-revenue-dashboards/lib/sample-data";

type TimeRange = "CURRENT_QUARTER" | "LAST_QUARTER" | "ALL_TIME" | "CUSTOM_RANGE";

async function loadDealsFromDatasetApi(params: {
  origin: string;
  tenantId: string | null;
  source: string;
  datasetId: string;
  timeRange: TimeRange;
  dateFrom: string | null;
  dateTo: string | null;
}) {
  const url = new URL(`${params.origin}/api/datasets/data`);
  url.searchParams.set("source", params.source);
  url.searchParams.set("datasetId", params.datasetId);
  if (params.tenantId) url.searchParams.set("tenantId", params.tenantId);
  url.searchParams.set("timeRange", params.timeRange);
  if (params.dateFrom) url.searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) url.searchParams.set("dateTo", params.dateTo);
  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();
  return Array.isArray(data?.deals) ? data.deals : [];
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const origin = url.origin;

    const tenantIdHeader = request.headers.get("x-tenant-id");

    const source = url.searchParams.get("source") ?? "mock";
    const datasetId = url.searchParams.get("datasetId") ?? "";
    const xField = url.searchParams.get("xField") ?? "";
    const label = url.searchParams.get("label") ?? "";

    const timeRange = (url.searchParams.get("timeRange") ?? "ALL_TIME") as TimeRange;
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    const customer = url.searchParams.get("customer") ?? "All Customers";
    const team = url.searchParams.get("team") ?? "All Teams";
    const metricFilter = url.searchParams.get("metricFilter") ?? "ALL";

    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit")) || 50));
    const offset = (page - 1) * limit;

    if (!datasetId || !xField) {
      return NextResponse.json({ error: "datasetId and xField are required" }, { status: 400 });
    }

    const { from, to } = getDateBounds(timeRange, dateFrom, dateTo);
    const fromIso = from ? from.toISOString().split("T")[0] : null;
    const toIso = to ? to.toISOString().split("T")[0] : null;

    const deals = await loadDealsFromDatasetApi({
      origin,
      tenantId: tenantIdHeader,
      source,
      datasetId,
      timeRange,
      dateFrom: fromIso,
      dateTo: toIso,
    });

    const rows = computeDashboardRows(deals, { timeRange, dateFrom: fromIso, dateTo: toIso, customer, team, metricFilter } as any);
    const filtered = label
      ? rows.filter((r: any) => String((r as any)[xField] ?? "Unknown") === label)
      : rows;

    const total = filtered.length;
    const pageRows = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      meta: { source, datasetId, xField, label, timeRange, dateFrom: fromIso, dateTo: toIso, customer, team, metricFilter, page, limit, total },
      rows: pageRows,
    });
  } catch (error: any) {
    console.error("GET /api/dashboards/drilldown error:", error);
    return NextResponse.json({ error: error.message ?? "Internal error" }, { status: 500 });
  }
}

