import { NextResponse } from "next/server";
import { computeDashboardRows, getDateBounds } from "@/modules/m07-revenue-dashboards/lib/sample-data";

type TimeRange = "CURRENT_QUARTER" | "LAST_QUARTER" | "ALL_TIME" | "CUSTOM_RANGE";

function normalizeNumber(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function sumAmounts(rows: any[]): number {
  return rows.reduce((s, r) => s + normalizeNumber(r.amount), 0);
}

function isOpenDeal(row: any) {
  return row.stage !== "Closed Won" && row.stage !== "Closed Lost";
}

function getWeekKey(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // ISO week start (Mon)
  const dayNum = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + (1 - dayNum));
  const y = day.getUTCFullYear();
  const m = String(day.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(day.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`; // week starting date
}

async function loadDealsFromDatasetApi(params: {
  origin: string;
  source: string;
  datasetId: string;
  tenantId: string | null;
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

    const timeRange = (url.searchParams.get("timeRange") ?? "ALL_TIME") as TimeRange;
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    const customer = url.searchParams.get("customer") ?? "All Customers";
    const team = url.searchParams.get("team") ?? "All Teams";
    const metricFilter = url.searchParams.get("metricFilter") ?? "ALL";

    const target = normalizeNumber(url.searchParams.get("target") ?? 150000);

    if (!datasetId) {
      return NextResponse.json({ error: "datasetId is required" }, { status: 400 });
    }

    const { from, to } = getDateBounds(timeRange, dateFrom, dateTo);
    const fromIso = from ? from.toISOString().split("T")[0] : null;
    const toIso = to ? to.toISOString().split("T")[0] : null;

    const deals = await loadDealsFromDatasetApi({
      origin,
      source,
      datasetId,
      tenantId: tenantIdHeader,
      timeRange,
      dateFrom: fromIso,
      dateTo: toIso,
    });

    const rows = computeDashboardRows(deals, { timeRange, dateFrom: fromIso, dateTo: toIso, customer, team, metricFilter } as any);

    // Performance (by owner)
    const repMap = new Map<string, any[]>();
    rows.forEach((r: any) => {
      const name = r.ownerName || "Unknown";
      repMap.set(name, [...(repMap.get(name) ?? []), r]);
    });
    const performance = Array.from(repMap.entries())
      .map(([name, items]) => {
        const won = items.filter((d: any) => d.stage === "Closed Won");
        const bookings = sumAmounts(won);
        const wonCount = won.length;
        const winRate = items.length ? Math.round((wonCount / items.length) * 100) : 0;
        const attainment = target > 0 ? Math.round((bookings / target) * 100) : 0;
        return { name, bookings, attainment, dealCount: items.length, winRate };
      })
      .sort((a, b) => b.bookings - a.bookings);

    // Attainment time-series (weekly bookings)
    const wonRows = rows.filter((r: any) => r.stage === "Closed Won" && r.closeDate);
    const byWeek = new Map<string, number>();
    wonRows.forEach((r: any) => {
      const wk = getWeekKey(r.closeDate);
      if (!wk) return;
      byWeek.set(wk, (byWeek.get(wk) ?? 0) + normalizeNumber(r.amount));
    });
    const attainmentSeries = Array.from(byWeek.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([weekStart, bookings]) => ({
        weekStart,
        bookings,
        attainment: target > 0 ? Math.round((bookings / target) * 100) : 0,
      }));

    // Forecast rollup (heuristic stage buckets)
    const commit = rows.filter((r: any) => ["Closed Won", "Negotiation"].includes(r.stage));
    const bestCase = rows.filter((r: any) => ["Closed Won", "Negotiation", "Proposal"].includes(r.stage));
    const pipeline = rows.filter((r: any) => isOpenDeal(r));
    const forecast = {
      commit: sumAmounts(commit),
      bestCase: sumAmounts(bestCase),
      pipeline: sumAmounts(pipeline),
    };

    // Trends (WoW and MoM on bookings + pipeline)
    const openPipelineValue = sumAmounts(rows.filter((r: any) => isOpenDeal(r)));
    const bookingsValue = sumAmounts(rows.filter((r: any) => r.stage === "Closed Won"));

    // Changes (stage mix summary)
    const stageCounts: Record<string, number> = {};
    rows.forEach((r: any) => {
      const k = String(r.stage || "Unknown");
      stageCounts[k] = (stageCounts[k] ?? 0) + 1;
    });

    return NextResponse.json({
      meta: { source, datasetId, timeRange, dateFrom: fromIso, dateTo: toIso, customer, team, metricFilter, target },
      performance,
      attainmentSeries,
      forecast,
      trends: {
        bookings: bookingsValue,
        openPipeline: openPipelineValue,
      },
      changes: {
        stageCounts,
      },
    });
  } catch (error: any) {
    console.error("GET /api/dashboards/analytics error:", error);
    return NextResponse.json({ error: error.message ?? "Internal error" }, { status: 500 });
  }
}
