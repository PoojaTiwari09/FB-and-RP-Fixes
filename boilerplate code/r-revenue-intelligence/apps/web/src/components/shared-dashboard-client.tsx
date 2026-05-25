"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartCard } from "./chart-card";
import { KpiCard } from "./kpi-card";
import { computeDashboardRows, summarizeRows } from "../lib/sample-data";

function DealsTable({ rows, cap = 6 }: { rows: any[]; cap?: number }) {
  const sorted = [...rows].sort((a, b) => b.amount - a.amount).slice(0, cap);
  const stageColor = (s: string) => {
    if (s === "Closed Won")  return { bg: "#dcfce7", color: "#16a34a" };
    if (s === "Closed Lost") return { bg: "#fee2e2", color: "#dc2626" };
    if (s === "Negotiation") return { bg: "#fef9c3", color: "#ca8a04" };
    if (s === "Proposal")    return { bg: "#dbeafe", color: "#2563eb" };
    return { bg: "#f1f5f9", color: "#64748b" };
  };
  if (!sorted.length) return <div style={{ padding: 24, color: "#94a3b8", textAlign: "center" }}>No deals</div>;
  return (
    <div style={{ overflow: "auto", height: "100%", fontSize: "0.78rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
            {["Deal","Owner","Stage","Amount","Close"].map(h => (
              <th key={h} style={{ padding: "6px 8px", textAlign: h === "Amount" ? "right" : "left", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((deal, i) => {
            const { bg, color } = stageColor(deal.stage);
            return (
              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "5px 8px", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deal.dealName}</td>
                <td style={{ padding: "5px 8px", color: "#64748b" }}>{deal.ownerName}</td>
                <td style={{ padding: "5px 8px" }}><span style={{ background: bg, color, borderRadius: 4, padding: "2px 6px", fontSize: "0.72rem", fontWeight: 500 }}>{deal.stage}</span></td>
                <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 600 }}>${Math.round(deal.amount / 1000)}k</td>
                <td style={{ padding: "5px 8px", color: "#94a3b8" }}>{deal.closeDate || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function SharedDashboardClient({ token }: { token: string }) {
  const [data, setData]       = useState<any>(null);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboards/share?token=${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const rows = useMemo(() => {
    if (!data?.deals) return [];
    // Use the owner's saved time range (returned by the share API).
    // Falls back to ALL_TIME so shared views always show something even for
    // historical dashboards where the quarter filter would return empty results.
    const savedTimeRange = data.timeRange ?? 'ALL_TIME';
    const filtered = computeDashboardRows(data.deals, {
      timeRange:   savedTimeRange,
      dateFrom:    data.dateFrom ?? null,
      dateTo:      data.dateTo   ?? null,
      customer:    'All Customers',
      team:        'All Teams',
      metricFilter: 'ALL',
    });
    // If the time-range filter empties the result (e.g. historical data), fall back to ALL_TIME
    if (filtered.length === 0 && savedTimeRange !== 'ALL_TIME') {
      return computeDashboardRows(data.deals, { timeRange: 'ALL_TIME', customer: 'All Customers', team: 'All Teams', metricFilter: 'ALL' });
    }
    return filtered;
  }, [data]);

  const summary = useMemo(() => summarizeRows(rows, data?.target ?? 150000), [rows, data]);

  const renderedWidgets = useMemo(() => {
    if (!data?.widgets) return [];
    return data.widgets.map((widget: any) => {
      const effectiveTarget = widget.target || data.target || 150000;
      let value = 0;
      let chartData: any[] = [];

      if (widget.type === "KPI") {
        const s = summarizeRows(rows, effectiveTarget);
        if      (widget.yMetric === "bookings")         value = s.bookings;
        else if (widget.yMetric === "targetAttainment") value = s.targetAttainment;
        else if (widget.yMetric === "winRate")          value = s.winRate;
        else if (widget.yMetric === "pipelineValue")    value = rows.filter(r => r.stage !== "Closed Won" && r.stage !== "Closed Lost").reduce((s, r) => s + r.amount, 0);
        else if (widget.yMetric === "dealCount")        value = rows.length;
      } else if (widget.type !== "TABLE") {
        const groups = new Map<string, any[]>();
        rows.forEach(row => {
          const key = String(row[widget.xField] ?? "Unknown");
          groups.set(key, [...(groups.get(key) ?? []), row]);
        });
        chartData = [...groups.entries()].map(([label, items]) => {
          let v = 0;
          if      (widget.yMetric === "dealCount")     v = items.length;
          else if (widget.yMetric === "bookings")      v = items.filter(r => r.stage === "Closed Won").reduce((s, r) => s + r.amount, 0);
          else if (widget.yMetric === "pipelineValue") v = items.filter(r => r.stage !== "Closed Won" && r.stage !== "Closed Lost").reduce((s, r) => s + r.amount, 0);
          else if (widget.yMetric === "winRate")       { const w = items.filter(r => r.stage === "Closed Won").length; v = items.length ? Math.round((w / items.length) * 100) : 0; }
          else                                        v = items.reduce((s, r) => s + r.amount, 0);
          return { label, value: v };
        });
      }
      return { ...widget, value, data: chartData, _rows: rows, _target: effectiveTarget };
    });
  }, [data, rows]);

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div><p style={{ color: "#64748b" }}>Loading shared dashboard…</p></div>
    </main>
  );

  if (error) {
    const isPrivate = error.includes("private") || error.includes("403");
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", maxWidth: 440, padding: "0 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{isPrivate ? "🔒" : "🔗"}</div>
          <h2 style={{ color: "#1e293b", marginBottom: 8 }}>
            {isPrivate ? "Access Restricted" : "Link Not Found"}
          </h2>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>{error}</p>
          {isPrivate && (
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 12 }}>
              The dashboard owner has changed the access settings. Contact them to request a new link.
            </p>
          )}
          <a href="/dashboards" style={{ display: "inline-block", marginTop: 20, padding: "10px 20px", background: "#0f766e", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.88rem" }}>
            Go to Dashboards
          </a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 24px" }}>
      {/* Header banner */}
      <div style={{ maxWidth: 1400, margin: "0 auto 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a" }}>{data.title || "Revenue Dashboard"}</h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
              🔗 Shared view · Read-only · {new Date().toLocaleDateString()}
              {data.timeRange && data.timeRange !== 'ALL_TIME' && (
                <span style={{ marginLeft: 8, background: '#f1f5f9', borderRadius: 4, padding: '1px 6px', fontSize: '0.75rem', color: '#475569' }}>
                  {data.timeRange === 'CURRENT_QUARTER' ? 'Current Quarter'
                  : data.timeRange === 'LAST_QUARTER'   ? 'Last Quarter'
                  : data.dateFrom && data.dateTo        ? `${data.dateFrom} → ${data.dateTo}`
                  : data.timeRange}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: data.visibility === 'TEAM' ? "#dbeafe" : "#dcfce7", color: data.visibility === 'TEAM' ? "#2563eb" : "#16a34a", fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px", borderRadius: 999, border: `1px solid ${data.visibility === 'TEAM' ? '#bfdbfe' : '#86efac'}` }}>
              {data.visibility === 'TEAM' ? '👥 TEAM' : '🔗 LINK'}
            </span>
            <span style={{ background: "#dbeafe", color: "#2563eb", fontSize: "0.75rem", fontWeight: 600, padding: "4px 12px", borderRadius: 999 }}>
              READ ONLY
            </span>
          </div>
        </div>
      </div>

      {/* KPI summary strip */}
      <div style={{ maxWidth: 1400, margin: "0 auto 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {[
          { label: "Bookings",          value: `$${Math.round(summary.bookings / 1000)}k`,     subtitle: "Closed Won deals" },
          { label: "Target Attainment", value: `${summary.targetAttainment}%`, subtitle: "vs revenue target", target: data.target, actual: summary.bookings, attainment: summary.targetAttainment },
          { label: "Win Rate",          value: `${summary.winRate}%`,          subtitle: "Won / Total deals" },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e8edf4" }}>
            <KpiCard {...kpi} />
          </div>
        ))}
      </div>

      {/* Widget grid */}
      <div style={{
        maxWidth: 1400, margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gridAutoRows: 120,
        gap: 16,
        background: "#e8edf4",
        borderRadius: 16,
        padding: 16,
        border: "1px solid #d1d9e6",
      }}>
        {renderedWidgets.map((widget: any) => {
          const pos = widget.position || { x: 0, y: 0, w: 4, h: 3 };
          return (
            <div
              key={widget.id}
              style={{
                gridColumn: `${pos.x + 1} / span ${pos.w}`,
                gridRow:    `${pos.y + 1} / span ${pos.h}`,
                background: "#fff", borderRadius: 12,
                padding: 12, display: "flex", flexDirection: "column",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                border: "1px solid #e8edf4",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "4px 8px", background: "#f7f6f2", borderRadius: 8 }}>
                <strong style={{ flex: 1, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{widget.title}</strong>
                <span style={{ background: "#e3f3ef", color: "#0f766e", fontSize: "0.7rem", padding: "2px 6px", borderRadius: 999 }}>{widget.type}</span>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                {widget.type === "KPI" ? (
                  <KpiCard
                    label={widget.title}
                    value={widget.yMetric === "bookings" ? `$${Math.round((widget.value ?? 0) / 1000)}k` : `${widget.value ?? 0}${["winRate","targetAttainment"].includes(widget.yMetric) ? "%" : ""}`}
                    subtitle={widget.yMetric}
                    target={widget.yMetric === "targetAttainment" ? widget._target : undefined}
                    actual={widget.yMetric === "targetAttainment" ? widget._rows?.filter((r: any) => r.stage === "Closed Won").reduce((s: number, r: any) => s + r.amount, 0) : undefined}
                    attainment={widget.yMetric === "targetAttainment" ? (widget.value ?? 0) : undefined}
                  />
                ) : widget.type === "TABLE" ? (
                  <DealsTable rows={widget._rows ?? []} cap={6} />
                ) : (
                  <ChartCard title={widget.title} type={widget.type} data={widget.data} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
