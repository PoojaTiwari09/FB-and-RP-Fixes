"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChartCard } from "./chart-card";
import { KpiCard } from "./kpi-card";
import {
  DashboardDefinition,
  DashboardWidget,
  DatasetDefinition,
  computeDashboardRows,
  fallbackDashboardConfig,
  renderWidgetData,
  resolveDataSource,
  summarizeRows,
  quarterLabel,
} from "../lib/sample-data";
import {
  createWidgetSeed,
  exportDashboardSnapshot,
} from "../lib/workspace-store";
import {
  METRICS_REGISTRY,
  METRIC_KEYS,
  getMetric,
  getMetricsByCategory,
  formatMetricValue,
} from "../lib/metrics-registry";

// ── Deals Widget Table ────────────────────────────────────────────────────────
function DealsTable({ rows, cap = 6 }: { rows: any[]; cap?: number }) {
  // ── Fix 1: column sort state ─────────────────────────────────────────────────
  const [sortCol, setSortCol]   = useState<string>("amount");
  const [sortDir, setSortDir]   = useState<"asc" | "desc">("desc");
  // ── Fix 2: search bar ────────────────────────────────────────────────────────
  const [search, setSearch]     = useState("");
  // ── Fix 3: expand all rows ───────────────────────────────────────────────────
  const [expanded, setExpanded] = useState(false);

  // ── Stage colour helper ───────────────────────────────────────────────────────
  const stageColor = (stage: string) => {
    if (stage === "Closed Won")  return { bg: "#dcfce7", color: "#16a34a" };
    if (stage === "Closed Lost") return { bg: "#fee2e2", color: "#dc2626" };
    if (stage === "Negotiation") return { bg: "#fef9c3", color: "#ca8a04" };
    if (stage === "Proposal")    return { bg: "#dbeafe", color: "#2563eb" };
    return { bg: "#f1f5f9", color: "#64748b" };
  };

  // ── Fix 6: close-date urgency colour ─────────────────────────────────────────
  const closeDateStyle = (dateStr: string, stage: string) => {
    if (!dateStr || stage === "Closed Won" || stage === "Closed Lost")
      return { color: "#94a3b8" };
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
    if (days < 0)  return { color: "#dc2626", fontWeight: 700, title: "Overdue" };
    if (days <= 14) return { color: "#d97706", fontWeight: 600, title: "Closing soon" };
    return { color: "#64748b" };
  };

  // ── Fix 1: sort handler ───────────────────────────────────────────────────────
  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  function sortArrow(col: string) {
    if (sortCol !== col) return <span style={{ color: "#cbd5e1", marginLeft: 2 }}>↕</span>;
    return <span style={{ color: "var(--accent)", marginLeft: 2 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  // ── Fix 2: filter by search ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(d =>
      (d.dealName    || "").toLowerCase().includes(q) ||
      (d.ownerName   || "").toLowerCase().includes(q) ||
      (d.accountName || "").toLowerCase().includes(q) ||
      (d.stage       || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  // ── Fix 1: sort the filtered rows ────────────────────────────────────────────
  const sortedRows = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: any, bv: any;
      if (sortCol === "amount")      { av = a.amount;      bv = b.amount; }
      else if (sortCol === "deal")   { av = a.dealName;    bv = b.dealName; }
      else if (sortCol === "owner")  { av = a.ownerName;   bv = b.ownerName; }
      else if (sortCol === "stage")  { av = a.stage;       bv = b.stage; }
      else if (sortCol === "close")  { av = a.closeDate;   bv = b.closeDate; }
      else if (sortCol === "conf")   { av = computeRiskScore(a).score; bv = computeRiskScore(b).score; }
      else if (sortCol === "account"){ av = a.accountName; bv = b.accountName; }
      else { av = a.amount; bv = b.amount; }
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  // ── Fix 3: cap or show all ────────────────────────────────────────────────────
  const visible = expanded ? sortedRows : sortedRows.slice(0, cap);

  if (rows.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "0.85rem" }}>
        No deals match current filters
      </div>
    );
  }

  // ── Column header helper ──────────────────────────────────────────────────────
  const Th = ({ col, label, align = "left" }: { col: string; label: string; align?: string }) => (
    <th
      onClick={() => handleSort(col)}
      style={{
        padding: "6px 8px", textAlign: align as any, fontWeight: 600,
        color: sortCol === col ? "var(--accent)" : "#64748b",
        borderBottom: "1px solid #e2e8f0", cursor: "pointer",
        userSelect: "none", whiteSpace: "nowrap",
      }}
    >
      {label}{sortArrow(col)}
    </th>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontSize: "0.78rem" }}>

      {/* ── Fix 2: Search bar ── */}
      <div style={{ padding: "4px 6px 6px", flexShrink: 0 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search deals, owner, account…"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "5px 10px", borderRadius: 6,
            border: "1px solid #e2e8f0", fontSize: "0.74rem",
            outline: "none", background: "#f8fafc",
          }}
        />
        {search && filtered.length === 0 && (
          <p style={{ fontSize: "0.68rem", color: "#94a3b8", margin: "4px 2px 0" }}>
            No deals match &quot;{search}&quot;
          </p>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", position: "sticky", top: 0, zIndex: 1 }}>
              <Th col="deal"    label="Deal" />
              <Th col="account" label="Account" />
              <Th col="owner"   label="Owner" />
              <Th col="stage"   label="Stage" />
              <Th col="amount"  label="Amount"  align="right" />
              <Th col="close"   label="Close"   align="right" />
              <Th col="conf"    label="Conf."   align="center" />
            </tr>
          </thead>
          <tbody>
            {visible.map((deal, i) => {
              const { bg, color } = stageColor(deal.stage);
              const risk          = computeRiskScore(deal);
              const dateStyle     = closeDateStyle(deal.closeDate, deal.stage);
              // Fix 5: full amount for tooltip
              const fullAmount    = deal.amount != null
                ? `$${Number(deal.amount).toLocaleString()}`
                : "";

              return (
                /* Fix 4: row hover highlight */
                <tr
                  key={i}
                  style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f0fdf4"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
                >
                  {/* Deal name */}
                  <td style={{ padding: "5px 8px", maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={deal.dealName}>
                    {deal.dealName}
                  </td>

                  {/* Fix 7: Account name column */}
                  <td style={{ padding: "5px 8px", color: "#64748b", maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={deal.accountName}>
                    {deal.accountName || "—"}
                  </td>

                  {/* Owner */}
                  <td style={{ padding: "5px 8px", color: "#64748b", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {deal.ownerName}
                  </td>

                  {/* Stage badge */}
                  <td style={{ padding: "5px 8px" }}>
                    <span style={{ background: bg, color, borderRadius: "4px", padding: "2px 6px", fontSize: "0.72rem", fontWeight: 500, whiteSpace: "nowrap" }}>
                      {deal.stage}
                    </span>
                  </td>

                  {/* Fix 5: rounded display + full amount on hover tooltip */}
                  <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 600 }}
                    title={fullAmount}>
                    ${Math.round(deal.amount / 1000)}k
                  </td>

                  {/* Fix 6: urgency-coloured close date */}
                  <td style={{ padding: "5px 8px", textAlign: "right", ...dateStyle }}
                    title={(dateStyle as any).title}>
                    {deal.closeDate || "—"}
                  </td>

                  {/* Confidence score */}
                  <td style={{ padding: "5px 8px", textAlign: "center" }}>
                    {deal.stage !== "Closed Won" && deal.stage !== "Closed Lost" && (
                      <span
                        title={`Confidence: ${risk.score}/100${risk.flags.length ? " · " + risk.flags.join(", ") : ""}`}
                        style={{ background: risk.bg, color: risk.color, borderRadius: 4, padding: "1px 5px", fontSize: "0.65rem", fontWeight: 700, cursor: "help" }}>
                        {risk.score}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Fix 3: expand / collapse footer */}
      {sortedRows.length > cap && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          style={{
            width: "100%", padding: "6px 8px",
            background: "#f8fafc", border: "none",
            borderTop: "1px solid #e2e8f0",
            color: "var(--accent)", fontSize: "0.72rem",
            fontWeight: 600, cursor: "pointer",
            textAlign: "center", flexShrink: 0,
          }}
        >
          {expanded
            ? `▲ Show less`
            : `▼ Show ${sortedRows.length - cap} more deal${sortedRows.length - cap !== 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
}

// ── Performance Widget ────────────────────────────────────────────────────────
function PerformanceWidget({
  rows,
  target,
  ownerTargets = {},
  serverReps,
}: {
  rows: any[];
  target: number;
  ownerTargets?: Record<string, number>;
  serverReps?: Array<{ name: string; bookings: number; attainment: number; dealCount: number; winRate: number }>;
}) {
  if (serverReps && serverReps.length > 0) {
    const attColor = (p: number) => p >= 100 ? '#16a34a' : p >= 80 ? '#0f766e' : p >= 60 ? '#ca8a04' : '#dc2626';
    const attBg    = (p: number) => p >= 100 ? '#dcfce7' : p >= 80 ? '#ccfbf1' : p >= 60 ? '#fef9c3' : '#fee2e2';
    return (
      <div style={{ overflow: 'auto', height: '100%', fontSize: '0.75rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
              {['Rep','Bookings','Attain%','Deals','Win%'].map(h => (
                <th key={h} style={{ padding: '5px 6px', textAlign: h === 'Rep' ? 'left' : 'right', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {serverReps.map((rep, i) => (
              <tr key={rep.name} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '4px 6px', fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rep.name}>{rep.name}</td>
                <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 600 }}>${Math.round(rep.bookings / 1000)}k</td>
                <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                  <span style={{ background: attBg(rep.attainment), color: attColor(rep.attainment), borderRadius: 4, padding: '1px 5px', fontWeight: 700, fontSize: '0.68rem' }}>{rep.attainment}%</span>
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'right', color: '#64748b' }}>{rep.dealCount}</td>
                <td style={{ padding: '4px 6px', textAlign: 'right', color: '#64748b' }}>{rep.winRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  const repMap = new Map<string, any[]>();
  rows.forEach(r => {
    const name = r.ownerName || 'Unknown';
    repMap.set(name, [...(repMap.get(name) ?? []), r]);
  });
  const reps = Array.from(repMap.entries()).map(([name, deals]) => {
    const bookings = deals.filter(d => d.stage === 'Closed Won').reduce((s: number, d: any) => s + d.amount, 0);
    // Use per-owner quota if defined, otherwise fall back to dashboard target
    const repTarget = (ownerTargets[name] && ownerTargets[name] > 0) ? ownerTargets[name] : target;
    const attainment = repTarget > 0 ? Math.round((bookings / repTarget) * 100) : 0;
    const won = deals.filter(d => d.stage === 'Closed Won').length;
    const winRate = deals.length ? Math.round((won / deals.length) * 100) : 0;
    return { name, bookings, attainment, dealCount: deals.length, winRate };
  }).sort((a, b) => b.bookings - a.bookings);

  const attColor = (p: number) => p >= 100 ? '#16a34a' : p >= 80 ? '#0f766e' : p >= 60 ? '#ca8a04' : '#dc2626';
  const attBg    = (p: number) => p >= 100 ? '#dcfce7' : p >= 80 ? '#ccfbf1' : p >= 60 ? '#fef9c3' : '#fee2e2';

  if (!reps.length) return <div style={{ padding: 24, color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>No rep data</div>;
  return (
    <div style={{ overflow: 'auto', height: '100%', fontSize: '0.75rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
            {['Rep','Bookings','Attain%','Deals','Win%'].map(h => (
              <th key={h} style={{ padding: '5px 6px', textAlign: h === 'Rep' ? 'left' : 'right', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reps.map((rep, i) => (
            <tr key={rep.name} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={{ padding: '4px 6px', fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rep.name}>{rep.name}</td>
              <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 600 }}>${Math.round(rep.bookings / 1000)}k</td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                <span style={{ background: attBg(rep.attainment), color: attColor(rep.attainment), borderRadius: 4, padding: '1px 5px', fontWeight: 700, fontSize: '0.68rem' }}>{rep.attainment}%</span>
              </td>
              <td style={{ padding: '4px 6px', textAlign: 'right', color: '#64748b' }}>{rep.dealCount}</td>
              <td style={{ padding: '4px 6px', textAlign: 'right', color: '#64748b' }}>{rep.winRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Attainment Trend Widget ───────────────────────────────────────────────────
function AttainmentTrendWidget({
  allDeals,
  target,
  serverSeries,
}: {
  allDeals: any[];
  target: number;
  serverSeries?: Array<{ weekStart: string; bookings: number; attainment: number }>;
}) {
  if (serverSeries && serverSeries.length > 0) {
    const max = Math.max(...serverSeries.map(p => p.bookings), 1);
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Weekly bookings (server)</span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Target: ${Math.round(target / 1000)}k</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', paddingRight: 2 }}>
          {serverSeries.map((p) => (
            <div key={p.weekStart} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 82, fontSize: '0.68rem', color: '#64748b', flexShrink: 0 }}>{p.weekStart}</span>
              <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                <div style={{ width: `${Math.round((p.bookings / max) * 100)}%`, height: '100%', background: '#14b8a6' }} />
              </div>
              <span style={{ width: 70, textAlign: 'right', fontSize: '0.68rem', color: '#0f172a', fontWeight: 700 }}>${Math.round(p.bookings / 1000)}k</span>
              <span style={{ width: 48, textAlign: 'right', fontSize: '0.68rem', color: '#64748b' }}>{p.attainment}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const qMap = new Map<string, number>();
  allDeals.forEach(d => {
    if (d.stage === 'Closed Won' && d.quarter) qMap.set(d.quarter, (qMap.get(d.quarter) ?? 0) + d.amount);
  });
  const quarters = Array.from(qMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([q, bookings]) => ({ q, bookings, pct: target > 0 ? Math.round((bookings / target) * 100) : 0 }));

  if (!quarters.length) return <div style={{ padding: 24, color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>No quarter data yet</div>;
  const maxVal = Math.max(...quarters.map(q => q.bookings), target);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0 0' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 6, position: 'relative', padding: '20px 4px 0' }}>
        {/* 100% target reference line */}
        <div style={{ position: 'absolute', left: 4, right: 4, bottom: `${(target / maxVal) * 100}%`, borderTop: '2px dashed #ef4444', zIndex: 2, pointerEvents: 'none' }}>
          <span style={{ position: 'absolute', right: 0, top: -13, fontSize: '0.6rem', color: '#ef4444', fontWeight: 700, background: '#fff', padding: '0 2px' }}>Target</span>
        </div>
        {quarters.map(({ q, bookings, pct }) => {
          const barH = `${Math.max(2, (bookings / maxVal) * 100)}%`;
          const color = pct >= 100 ? '#16a34a' : pct >= 80 ? '#0f766e' : pct >= 60 ? '#f59e0b' : '#ef4444';
          return (
            <div key={q} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <span style={{ fontSize: '0.6rem', color, fontWeight: 700, marginBottom: 1 }}>{pct}%</span>
              <div style={{ width: '65%', height: barH, background: color, borderRadius: '3px 3px 0 0' }} title={`${q}: $${Math.round(bookings / 1000)}k (${pct}%)`} />
              <small style={{ fontSize: '0.58rem', color: '#94a3b8', marginTop: 2, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q}</small>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'center', paddingBottom: 2 }}>
        — Target: ${Math.round(target / 1000)}k | bars = Closed Won bookings
      </div>
    </div>
  );
}

// ── Forecast Rollup Widget ────────────────────────────────────────────────────
function ForecastWidget({
  rows,
  target,
  serverForecast,
}: {
  rows: any[];
  target: number;
  serverForecast?: { commit: number; bestCase: number; pipeline: number; won?: number };
}) {
  const won      = rows.filter(d => d.stage === 'Closed Won').reduce((s: number, d: any) => s + d.amount, 0);
  const commit   = rows.filter(d => ['Closed Won','Negotiation'].includes(d.stage)).reduce((s: number, d: any) => s + d.amount, 0);
  const bestCase = rows.filter(d => ['Closed Won','Negotiation','Proposal'].includes(d.stage)).reduce((s: number, d: any) => s + d.amount, 0);
  const pipeline = rows.filter(d => d.stage !== 'Closed Lost').reduce((s: number, d: any) => s + d.amount, 0);

  const swon      = serverForecast?.won      ?? won;
  const scommit   = serverForecast?.commit   ?? commit;
  const sbestCase = serverForecast?.bestCase ?? bestCase;
  const spipeline = serverForecast?.pipeline ?? pipeline;

  const cats = [
    { label: 'Won',       value: swon,      color: '#16a34a', bg: '#dcfce7' },
    { label: 'Commit',    value: scommit,   color: '#0f766e', bg: '#ccfbf1' },
    { label: 'Best Case', value: sbestCase, color: '#2563eb', bg: '#dbeafe' },
    { label: 'Pipeline',  value: spipeline, color: '#7c3aed', bg: '#ede9fe' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 7, padding: '4px 2px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
        <span>Forecast vs ${Math.round(target / 1000)}k target</span>
        <span style={{ color: swon >= target ? '#16a34a' : '#64748b', fontWeight: 700 }}>{target > 0 ? Math.round((swon / target) * 100) : 0}% won</span>
      </div>
      {cats.map(({ label, value, color, bg }) => {
        const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.73rem' }}>
            <span style={{ width: 62, color: '#475569', fontWeight: 600, flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 999, height: 11, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
            </div>
            <span style={{ background: bg, color, padding: '1px 5px', borderRadius: 4, fontWeight: 700, fontSize: '0.66rem', flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
              ${Math.round(value / 1000)}k
            </span>
          </div>
        );
      })}
      <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '0.63rem', color: '#94a3b8' }}>
        <span>🎯 Target: ${Math.round(target / 1000)}k</span>
        <span>Coverage: {target > 0 && pipeline > 0 ? Math.round((pipeline / target) * 100) : 0}%</span>
      </div>
    </div>
  );
}

// ── Trends Widget ─────────────────────────────────────────────────────────────
function TrendsWidget({ allDeals, target }: { allDeals: any[]; target: number }) {
  const now = new Date();
  const curQ = Math.ceil((now.getMonth() + 1) / 3);
  const curY = now.getFullYear();
  const prevQ = curQ === 1 ? 4 : curQ - 1;
  const prevY = curQ === 1 ? curY - 1 : curY;
  const curLabel  = `Q${curQ}-${curY}`;
  const prevLabel = `Q${prevQ}-${prevY}`;

  const cur  = allDeals.filter(d => d.quarter === curLabel);
  const prev = allDeals.filter(d => d.quarter === prevLabel);

  const metrics = [
    {
      label: 'Bookings',
      cur:  cur.filter(d => d.stage === 'Closed Won').reduce((s: number, d: any) => s + d.amount, 0),
      prev: prev.filter(d => d.stage === 'Closed Won').reduce((s: number, d: any) => s + d.amount, 0),
      fmt: (v: number) => `$${Math.round(v / 1000)}k`,
    },
    {
      label: 'Win Rate',
      cur:  cur.length ? Math.round((cur.filter(d => d.stage === 'Closed Won').length / cur.length) * 100) : 0,
      prev: prev.length ? Math.round((prev.filter(d => d.stage === 'Closed Won').length / prev.length) * 100) : 0,
      fmt: (v: number) => `${v}%`,
    },
    {
      label: 'Deal Count',
      cur:  cur.length,
      prev: prev.length,
      fmt: (v: number) => `${v}`,
    },
    {
      label: 'Pipeline',
      cur:  cur.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').reduce((s: number, d: any) => s + d.amount, 0),
      prev: prev.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').reduce((s: number, d: any) => s + d.amount, 0),
      fmt: (v: number) => `$${Math.round(v / 1000)}k`,
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.63rem', color: '#94a3b8', padding: '0 2px' }}>
        <span>{prevLabel}</span>
        <span style={{ color: '#475569', fontWeight: 600 }}>QoQ Change</span>
        <span>{curLabel}</span>
      </div>
      {metrics.map(({ label, cur, prev, fmt }) => {
        const delta = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : (cur > 0 ? 100 : 0);
        const up = delta > 0; const flat = delta === 0;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', background: '#f8fafc', borderRadius: 8, fontSize: '0.73rem' }}>
            <span style={{ flex: 1, fontWeight: 600, color: '#475569' }}>{label}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.68rem', minWidth: 28, textAlign: 'right' }}>{fmt(prev)}</span>
            <span style={{ fontSize: '0.85rem', color: flat ? '#94a3b8' : up ? '#16a34a' : '#dc2626' }}>{flat ? '→' : up ? '↑' : '↓'}</span>
            <span style={{ color: flat ? '#94a3b8' : up ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: '0.68rem', minWidth: 32, textAlign: 'center' }}>
              {flat ? '—' : `${up ? '+' : ''}${delta}%`}
            </span>
            <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.73rem', minWidth: 36, textAlign: 'right' }}>{fmt(cur)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Changes Widget ────────────────────────────────────────────────────────────
function ChangesWidget({ rows }: { rows: any[] }) {
  const won     = rows.filter(d => d.stage === 'Closed Won');
  const lost    = rows.filter(d => d.stage === 'Closed Lost');
  const atRisk  = rows.filter(d => d.status === 'Needs Attention' || d.status === 'At Risk');
  const newPipe = rows.filter(d => d.pipelineStage === 'Early' && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');

  const sections = [
    { label: '✅ Won',          deals: won,     color: '#16a34a', bg: '#dcfce7' },
    { label: '🆕 New Pipeline', deals: newPipe, color: '#2563eb', bg: '#dbeafe' },
    { label: '⚠️ At Risk',      deals: atRisk,  color: '#ca8a04', bg: '#fef9c3' },
    { label: '❌ Lost',         deals: lost,    color: '#dc2626', bg: '#fee2e2' },
  ].filter(s => s.deals.length > 0);

  if (!sections.length) return <div style={{ padding: 24, color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>No deal changes this period</div>;
  return (
    <div style={{ overflow: 'auto', height: '100%', fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: 7 }}>
      {sections.map(({ label, deals, color, bg }) => (
        <div key={label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontWeight: 700, color, fontSize: '0.7rem' }}>{label}</span>
            <span style={{ background: bg, color, borderRadius: 999, padding: '1px 6px', fontSize: '0.62rem', fontWeight: 700 }}>
              {deals.length} · ${Math.round(deals.reduce((s: number, d: any) => s + d.amount, 0) / 1000)}k
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {deals.slice(0, 3).map((d: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', background: '#fafafa', borderRadius: 4 }}>
                <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>{d.dealName}</span>
                <span style={{ color: '#64748b', flexShrink: 0, marginLeft: 6 }}>${Math.round(d.amount / 1000)}k</span>
              </div>
            ))}
            {deals.length > 3 && <span style={{ color: '#94a3b8', fontSize: '0.62rem', padding: '0 4px' }}>+{deals.length - 3} more</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Deal Confidence / Risk Score (#27) ───────────────────────────────────────
export function computeRiskScore(deal: any): {
  score: number; label: string; color: string; bg: string; flags: string[];
} {
  const stageBase: Record<string, number> = {
    'Closed Won': 100, 'Negotiation': 78, 'Proposal': 58,
    'Discovery': 38, 'Prospecting': 25, 'Closed Lost': 5,
  };
  let score = stageBase[deal.stage] ?? 40;
  const flags: string[] = [];

  // Close-date signals
  if (deal.closeDate) {
    const daysToClose = Math.ceil((new Date(deal.closeDate).getTime() - Date.now()) / 86_400_000);
    if (daysToClose < 0 && deal.stage !== 'Closed Won' && deal.stage !== 'Closed Lost') {
      score = Math.max(5, score - 22);
      flags.push('Overdue');
    } else if (daysToClose >= 0 && daysToClose <= 14 && score > 50) {
      score = Math.min(96, score + 8);
      flags.push('Closing soon');
    }
  } else if (deal.stage !== 'Closed Won' && deal.stage !== 'Closed Lost') {
    score = Math.max(8, score - 10);
    flags.push('No close date');
  }

  // Status / pipeline signals
  if (deal.status === 'Needs Attention' || deal.status === 'At Risk') {
    score = Math.max(8, score - 18); flags.push('At Risk');
  }
  if (deal.status === 'Won') score = 100;

  // Large deal risk (over $100k)
  if (deal.amount > 100_000) flags.push('Large Deal');
  // No owner assigned
  if (!deal.ownerName || deal.ownerName === 'Unknown') flags.push('No Owner');

  score = Math.max(0, Math.min(100, Math.round(score)));

  const label = score >= 80 ? 'High'   : score >= 55 ? 'Medium'
              : score >= 30 ? 'Low'    : 'Critical';
  const color = score >= 80 ? '#16a34a' : score >= 55 ? '#0f766e'
              : score >= 30 ? '#ca8a04' : '#dc2626';
  const bg    = score >= 80 ? '#dcfce7' : score >= 55 ? '#ccfbf1'
              : score >= 30 ? '#fef9c3' : '#fee2e2';

  return { score, label, color, bg, flags };
}

// ── Risk Scorecard Widget (#27) ───────────────────────────────────────────────
function RiskScorecardWidget({ rows }: { rows: any[] }) {
  const open   = rows.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
  const scored = open.map(d => ({ ...d, _risk: computeRiskScore(d) }))
                     .sort((a, b) => a._risk.score - b._risk.score);
  const critical  = scored.filter(d => d._risk.score < 30).length;
  const lowConf   = scored.filter(d => d._risk.score < 55).length;
  const wonCount  = rows.filter(d => d.stage === 'Closed Won').length;
  const avgScore  = scored.length
    ? Math.round(scored.reduce((s, d) => s + d._risk.score, 0) / scored.length) : 0;

  if (!scored.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6, color: '#14b8a6' }}>
      <span style={{ fontSize: '2.2rem' }}>✅</span>
      <strong style={{ fontSize: '0.9rem' }}>No open deals to track</strong>
      <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{wonCount} Closed Won this period</span>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.73rem' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 999, padding: '2px 8px', fontWeight: 700, fontSize: '0.62rem' }}>
          🚨 {critical} critical
        </span>
        <span style={{ background: '#fef9c3', color: '#ca8a04', borderRadius: 999, padding: '2px 8px', fontWeight: 700, fontSize: '0.62rem' }}>
          ⚠ {lowConf} low confidence
        </span>
        <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 999, padding: '2px 8px', fontWeight: 700, fontSize: '0.62rem' }}>
          ✓ {wonCount} won
        </span>
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.62rem', alignSelf: 'center' }}>
          avg {avgScore}/100
        </span>
      </div>
      {/* Score bar overview */}
      <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{
          height: '100%', borderRadius: 999,
          width: `${avgScore}%`,
          background: avgScore >= 70 ? '#16a34a' : avgScore >= 45 ? '#f59e0b' : '#ef4444',
          transition: 'width 0.4s',
        }} />
      </div>
      {/* Deal rows — worst first */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {scored.slice(0, 10).map((d: any, i: number) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 7px',
            background: '#fafafa', borderRadius: 7,
            borderLeft: `3px solid ${d._risk.color}`,
          }}>
            {/* Score badge */}
            <span style={{
              background: d._risk.bg, color: d._risk.color,
              borderRadius: 5, padding: '1px 5px',
              fontWeight: 800, fontSize: '0.63rem', flexShrink: 0, minWidth: 26, textAlign: 'center',
            }}>
              {d._risk.score}
            </span>
            {/* Deal name */}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1e293b', fontWeight: 500 }}
              title={d.dealName}>{d.dealName}</span>
            {/* Owner */}
            <span style={{ color: '#94a3b8', fontSize: '0.62rem', flexShrink: 0, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.ownerName}
            </span>
            {/* Amount */}
            <span style={{ color: '#475569', flexShrink: 0, fontSize: '0.65rem', fontWeight: 600 }}>
              ${Math.round(d.amount / 1000)}k
            </span>
            {/* First flag */}
            {d._risk.flags[0] && (
              <span style={{
                background: d._risk.bg, color: d._risk.color,
                borderRadius: 999, padding: '1px 5px', fontSize: '0.58rem', fontWeight: 600, flexShrink: 0,
              }}>
                {d._risk.flags[0]}
              </span>
            )}
          </div>
        ))}
        {scored.length > 10 && (
          <span style={{ color: '#94a3b8', fontSize: '0.62rem', padding: '2px 7px' }}>
            +{scored.length - 10} more open deals
          </span>
        )}
      </div>
    </div>
  );
}

// ── Default widget sizes per type ─────────────────────────────────────────────
const WIDGET_SIZES: Record<string, { w: number; h: number }> = {
  KPI:              { w: 4, h: 2 },
  TABLE:            { w: 6, h: 3 },
  FUNNEL:           { w: 6, h: 4 },
  TREEMAP:          { w: 6, h: 3 },
  MATRIX:           { w: 6, h: 3 },
  PERFORMANCE:      { w: 6, h: 4 },
  ATTAINMENT_TREND: { w: 6, h: 3 },
  FORECAST:         { w: 4, h: 3 },
  TRENDS:           { w: 4, h: 3 },
  CHANGES:          { w: 6, h: 3 },
  RISK_SCORECARD:   { w: 6, h: 4 },
  default:          { w: 4, h: 3 },
};

function getWidgetSize(type: string) {
  return WIDGET_SIZES[type] ?? WIDGET_SIZES.default;
}

export function DashboardClient() {
  const [datasets, setDatasets] = useState<DatasetDefinition[]>([]);
  const [dashboards, setDashboards] = useState<DashboardDefinition[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  // Ref always holds the latest selectedDatasetId so stale closures (e.g. loadRepDashboard
  // called from a .then() callback) can stamp widgets with the correct dataset.
  const selectedDatasetIdRef = useRef("");
  const [activeTemplateKey, setActiveTemplateKey] = useState<string | null>('rep');
  const [title, setTitle] = useState("Revenue Dashboard");
  const [access, setAccess] = useState<DashboardDefinition["access"]>("PRIVATE");
  const [widgets, setWidgets] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<"CURRENT_QUARTER" | "LAST_QUARTER" | "ALL_TIME">("CURRENT_QUARTER");
  const [customer, setCustomer] = useState("All Customers");
  const [team, setTeam] = useState("All Teams");
  const [metricFilter, setMetricFilter] = useState("ALL");
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [saveToast, setSaveToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState("");
  const [dbDeals, setDbDeals] = useState<any[]>([]);
  const [dbSnapshots, setDbSnapshots] = useState<any[]>([]);
  const [dbConfigLoaded, setDbConfigLoaded] = useState(false);
  // ── Per-dataset deal cache: { datasetId → deals[] } ─────────────────────────
  // Widgets use their own dataset's rows instead of the shared dbDeals pool.
  const [datasetCache, setDatasetCache] = useState<Record<string, any[]>>({});
  const [specialWidgetApi, setSpecialWidgetApi] = useState<Record<string, any>>({});
  // ── Multi-dashboard list ─────────────────────────────────────────────────────
  const [savedDashboardsList, setSavedDashboardsList] = useState<any[]>([]);
  const [activeDashboardId,   setActiveDashboardId]   = useState<string | null>(null);
  // ── Read-only flag — true when the active dashboard was shared by another user ─
  const [isReadOnly, setIsReadOnly] = useState(false);
  // ── Pagination — tracks whether more dashboards exist beyond the current page ──
  const [dashboardPage,      setDashboardPage]      = useState(1);
  const [dashboardHasMore,   setDashboardHasMore]   = useState(false);
  const [dashboardLoadingMore, setDashboardLoadingMore] = useState(false);
  // ── Configurable target ──────────────────────────────────────────────────────
  const [dashboardTarget, setDashboardTarget] = useState(150000);
  /** Per-owner targets: { "Rep Name" → annual/quarterly quota } */
  const [ownerTargets,   setOwnerTargets]   = useState<Record<string, number>>({});
  /** Per-team targets: { "Team Name" → quota } */
  const [teamTargets,    setTeamTargets]    = useState<Record<string, number>>({});
  /** Quarterly targets: { "Q2-2026" → amount } */
  const [quarterlyTargets, setQuarterlyTargets] = useState<Record<string, number>>({});
  /** Validation warning for target inputs */
  const [targetConfigWarning, setTargetConfigWarning] = useState('');
  /** Whether the advanced targets section is expanded */
  const [showAdvancedTargets, setShowAdvancedTargets] = useState(false);
  // ── Draft / Published state ──────────────────────────────────────────────────
  const [dashboardStatus, setDashboardStatus] = useState<'draft' | 'published'>('draft');
  // ── Star / Pin (#23) ─────────────────────────────────────────────────────────
  const [dashboardStarred, setDashboardStarred] = useState(false);
  // ── Rep / Owner scope (#25, #26) ─────────────────────────────────────────────
  const [ownerFilter, setOwnerFilter] = useState('All Owners');
  /** 'all' = company-wide, 'team' = same teamName, 'personal' = ownerFilter only */
  const [viewScope, setViewScope] = useState<'all' | 'team' | 'personal'>('all');
  // ── Drilldown modal (#22) ─────────────────────────────────────────────────────
  const [drilldown, setDrilldown] = useState<{ title: string; rows: any[] } | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  // ── Data Studio — fully functional (#21) ─────────────────────────────────────
  const [showDataStudio,   setShowDataStudio]   = useState(false);
  /** Mutable local copy of the metrics registry — supports renaming + custom metrics */
  const [localMetrics, setLocalMetrics] = useState<Record<string, any>>(() => ({ ...METRICS_REGISTRY }));
  const [metricsLoaded, setMetricsLoaded] = useState(false);
  /** Which metric ID is currently highlighted on the canvas */
  const [highlightedMetric, setHighlightedMetric] = useState<string | null>(null);
  /** Metric card currently in edit (rename) mode */
  const [editingMetricId,   setEditingMetricId]   = useState<string | null>(null);
  const [editingMetricName, setEditingMetricName] = useState('');
  /** Expanded metric IDs showing widget usage list */
  const [expandedUsage,     setExpandedUsage]     = useState<Set<string>>(new Set());
  /** Custom metric builder form */
  const [showNewMetric,     setShowNewMetric]     = useState(false);
  const [newMetricForm,     setNewMetricForm]     = useState({ name: '', description: '', metricA: 'bookings', op: '÷', metricB: 'dealCount' });

  async function persistMetrics(nextMetrics: Record<string, any>) {
    try {
      const renames: Record<string, string> = {};
      Object.keys(METRICS_REGISTRY).forEach((id) => {
        const base = (METRICS_REGISTRY as any)[id];
        const cur = nextMetrics[id];
        if (base?.name && cur?.name && cur.name !== base.name) renames[id] = cur.name;
      });
      const custom = Object.values(nextMetrics).filter((m: any) => m?.isCustom === true);
      await fetch('/api/dashboards/metrics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renames, custom }),
      });
    } catch {
      // Best-effort persistence; keep UI responsive even if server fails.
    }
  }
  // ── Team Builder — API-backed with localStorage fallback (#26) ───────────────
  type TeamConfig = { id: string; name: string; members: string[]; parentId?: string };
  const [teamConfig,      setTeamConfig]      = useState<TeamConfig[]>([]);
  const [showTeamBuilder, setShowTeamBuilder] = useState(false);
  const [newTeamName,     setNewTeamName]     = useState('');
  const [newTeamParentId, setNewTeamParentId] = useState('');
  // ── Confidence score filter ───────────────────────────────────────────────────
  const [minConfidence,  setMinConfidence]  = useState<number | ''>('');
  const [maxConfidence,  setMaxConfidence]  = useState<number | ''>('');
  // ── User role (Feature 5) ─────────────────────────────────────────────────────
  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/x-user-role=([^;]+)/);
      if (match) return match[1];
    }
    return 'SALES_REP';
  });
  // ── Auto-refresh (Feature 3) ─────────────────────────────────────────────────
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  // ── Access modal: per-user grants ────────────────────────────────────────────
  const [accessGrants, setAccessGrants] = useState<any[]>([]);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantCanEdit, setGrantCanEdit] = useState(false);
  // ── Executive metrics (Feature 5) ────────────────────────────────────────────
  const [execMetrics, setExecMetrics] = useState<any>(null);
  // ── Data Refresh Indicator (#28) ─────────────────────────────────────────────
  const [lastRefreshed,  setLastRefreshed]  = useState<Date | null>(null);
  const [timeAgo,        setTimeAgo]        = useState('');
  const [isRefreshing,   setIsRefreshing]   = useState(false);
  // ── Dashboard Duplicate + Manage Access (#29) ─────────────────────────────────
  const [showAccessModal, setShowAccessModal] = useState(false);
  // ── Share link modal — shows generated URL with copy + revoke ────────────────
  const [showShareModal,  setShowShareModal]  = useState(false);
  const [shareUrl,        setShareUrl]        = useState('');
  const [shareCopied,     setShareCopied]     = useState(false);
  const [shareRevoking,   setShareRevoking]   = useState(false);
  // ── Executive Stakeholder Mode (#30) ─────────────────────────────────────────
  const [execMode, setExecMode] = useState(false);
  // ── Drop indicator: which grid cell is highlighted during drag ───────────────
  const [dropIndicator, setDropIndicator] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  // Stores the drag payload type so dragover can compute indicator size
  // (browsers block getData() during dragover for security)
  const dragPayloadRef = useRef<{ type: string; widgetId?: string } | null>(null);
  // Ref to the canvas grid div — used in snapToGrid so we never depend on e.currentTarget
  // (which React nullifies when a drop lands on a child element instead of the canvas itself)
  const canvasRef = useRef<HTMLDivElement>(null);
  // Tracks whether the first automatic dataset selection has already been skipped
  const isInitialDatasetRef = useRef(true);

  // Load team config from API (with localStorage fallback)
  useEffect(() => {
    fetch('/api/teams')
      .then(r => r.json())
      .then((data: any) => {
        if (Array.isArray(data.teams) && data.teams.length > 0) {
          setTeamConfig(data.teams.map((t: any) => ({
            id: t.id, name: t.name, members: t.members ?? [], parentId: t.parentId ?? undefined,
          })));
        } else {
          // Fallback to localStorage
          try {
            const stored = localStorage.getItem('rri_team_config');
            if (stored) setTeamConfig(JSON.parse(stored));
          } catch {}
        }
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem('rri_team_config');
          if (stored) setTeamConfig(JSON.parse(stored));
        } catch {}
      });
  }, []);

  // Persist team config to localStorage whenever it changes (as cache)
  useEffect(() => {
    if (teamConfig.length > 0 || localStorage.getItem('rri_team_config')) {
      localStorage.setItem('rri_team_config', JSON.stringify(teamConfig));
    }
  }, [teamConfig]);

  // Load governed metric overrides (renames + custom metrics) from server.
  useEffect(() => {
    if (metricsLoaded) return;
    fetch('/api/dashboards/metrics')
      .then(r => r.json())
      .then((cfg: any) => {
        const renames = cfg?.renames && typeof cfg.renames === 'object' ? cfg.renames : {};
        const custom  = Array.isArray(cfg?.custom) ? cfg.custom : [];
        setLocalMetrics(() => {
          const next: Record<string, any> = { ...METRICS_REGISTRY };
          Object.entries(renames).forEach(([id, name]) => {
            if (next[id] && typeof name === 'string' && name.trim()) next[id] = { ...next[id], name: name.trim() };
          });
          custom.forEach((m: any) => {
            if (m?.id && typeof m.id === 'string') next[m.id] = m;
          });
          return next;
        });
        setMetricsLoaded(true);
      })
      .catch(() => setMetricsLoaded(true));
  }, [metricsLoaded]);

  // ── HubSpot sample data fallback (used when real HubSpot is not connected) ──
  function loadHubSpotSampleData(datasetId: string, dataset: any) {
    fetch(`/api/datasets/data?source=hubspot&datasetId=${encodeURIComponent(datasetId)}`)
      .then(r => r.json())
      .then((data: any) => {
        if (Array.isArray(data.deals) && data.deals.length > 0) {
          setDatasetCache(prev => ({ ...prev, [datasetId]: data.deals }));
        }
      })
      .catch(() => {});
  }

  // ── Fallback: use crm_mock data built from the dataset's selectedObjects ────
  function loadMockFallback(datasetId: string, dataset: any) {
    fetch(`/api/datasets/data?source=mock&datasetId=${encodeURIComponent(datasetId)}`)
      .then(r => r.json())
      .then((data: any) => {
        if (Array.isArray(data.deals) && data.deals.length > 0) {
          const mapped = data.deals.map((d: any) => ({ ...d, amount: Number(d.amount) }));
          setDatasetCache(prev => ({ ...prev, [datasetId]: mapped }));
          setWorkspaceMessage(`✅ Dataset "${dataset.name}" — ${mapped.length} rows loaded (mock)`);
        }
      })
      .catch(() => {});
  }

  // ── Load data for a dataset and store it in the per-dataset cache ─────────────
  function loadDatasetIntoCache(datasetId: string, datasetList: any[]) {
    // Skip only if the cache has REAL data (not the temporary dbDeals seed).
    // We detect a seed by checking if the cached array is the same reference as dbDeals.
    const cached = datasetCache[datasetId];
    if ((cached?.length ?? 0) > 0 && cached !== dbDeals) return;

    const dataset = datasetList.find((d: any) => d.id === datasetId);
    if (!dataset) return;

    // resolveDataSource handles both new ('hubspot'|'mock'|'postgres') and legacy
    // ('COMBINED', 'CRM_ONLY', etc.) sourceMode values.
    const src = resolveDataSource(dataset);

    if (src === 'hubspot') {
      // ── HubSpot: fetch data directly (API route handles token check internally) ──
      // Avoids extra /api/hubspot/test-connection round-trip before loading data.
      fetch(`/api/datasets/data?source=hubspot&datasetId=${encodeURIComponent(datasetId)}`)
        .then(r => r.json())
        .then((data: any) => {
          if (Array.isArray(data.deals) && data.deals.length > 0) {
            setDatasetCache(prev => ({ ...prev, [datasetId]: data.deals }));
          } else {
            loadHubSpotSampleData(datasetId, dataset);
          }
        })
        .catch(() => loadHubSpotSampleData(datasetId, dataset));

    } else {
      // ── mock / postgres / legacy ─────────────────────────────────────────────
      // Pass datasetId so the API builds the right JOIN for this dataset's selectedObjects.
      const apiSrc = src === 'postgres' ? 'postgres' : 'mock';
      fetch(`/api/datasets/data?source=${apiSrc}&datasetId=${encodeURIComponent(datasetId)}`)
        .then(r => r.json())
        .then((data: any) => {
          if (Array.isArray(data.deals) && data.deals.length > 0) {
            const mapped = data.deals.map((d: any) => ({ ...d, amount: Number(d.amount) }));
            setDatasetCache(prev => ({ ...prev, [datasetId]: mapped }));
            setWorkspaceMessage(`✅ Dataset "${dataset.name}" — ${mapped.length} rows loaded`);
          } else if (data.error) {
            setWorkspaceMessage(`⚠️ Dataset "${dataset.name}": ${data.error}`);
          }
        })
        .catch(() => setWorkspaceMessage('⚠️ Could not load dataset data.'));
    }
  }

  // Keep ref in sync so stale closures always see the latest selectedDatasetId
  useEffect(() => { selectedDatasetIdRef.current = selectedDatasetId; }, [selectedDatasetId]);

  const selectedDeals = useMemo(() => {
    if (selectedDatasetId && (datasetCache[selectedDatasetId]?.length ?? 0) > 0) {
      return datasetCache[selectedDatasetId] ?? [];
    }
    return dbDeals;
  }, [selectedDatasetId, datasetCache, dbDeals]);

  // ── Instant seed: when dbDeals arrives, pre-fill every empty dataset cache slot ──
  // This makes canvas widgets render immediately (using dbDeals as a placeholder)
  // instead of spinning. loadDatasetIntoCache then replaces with real dataset rows.
  useEffect(() => {
    if (!dbDeals.length) return;
    const ids = Array.from(new Set([
      ...widgets.map((w: any) => w.datasetId),
      selectedDatasetId,
    ].filter(Boolean))) as string[];
    if (!ids.length) return;
    setDatasetCache(prev => {
      const next = { ...prev };
      ids.forEach(id => { if (!(next[id]?.length > 0)) next[id] = dbDeals; });
      return next;
    });
  }, [dbDeals]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── When selected dataset changes, ensure it's in the cache ──────────────────
  useEffect(() => {
    if (!selectedDatasetId) return;
    if (isInitialDatasetRef.current) {
      isInitialDatasetRef.current = false;
    }
    if (datasets.length > 0) {
      loadDatasetIntoCache(selectedDatasetId, datasets);
    }
    // Re-stamp ALL existing widgets with the new datasetId so they all switch to the new dataset
    setWidgets(current =>
      current.map(w => ({ ...w, datasetId: selectedDatasetId }))
    );
  }, [selectedDatasetId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // 1. Fetch datasets list (fast — metadata only, no row data)
    // This populates the dropdown immediately. Cache warming happens separately
    // via loadDatasetIntoCache, and dbDeals acts as an instant fallback for widgets.
    fetch('/api/datasets')
      .then(res => res.json())
      .then(datasetList => {
        if (Array.isArray(datasetList)) {
          setDatasets(datasetList);
          // Only auto-select the first dataset if none has been chosen yet
          // (loadDashboardEntry may have already set selectedDatasetId via entry.datasetId)
          if (datasetList.length > 0 && !selectedDatasetIdRef.current) {
            setSelectedDatasetId(datasetList[0].id);
          }
          // Trigger async cache load for all datasets in background
          datasetList.forEach((ds: any) => {
            loadDatasetIntoCache(ds.id, datasetList);
          });
        }
      })
      .catch(console.error);

    // 2. Fetch dashboard configs & deals from PostgreSQL
    fetch('/api/dashboards')
      .then(res => res.json())
      .then(data => {
        if (data.deals) {
          const mappedDeals = data.deals.map((d: any) => ({ ...d, amount: Number(d.amount) }));
          setDbDeals(mappedDeals);
          // __postgres__ key acts as a fallback slot; real dataset-specific keys
          // are populated by loadDatasetIntoCache as they arrive.
          setDatasetCache(prev => ({ ...prev, __postgres__: mappedDeals }));
        }
        if (data.snapshots) {
          setDbSnapshots(data.snapshots);
        }
        // Fix #4: honour daterangedefault from config if no dashboard-level override will come
        if (data.config?.daterangedefault) {
          const dr = data.config.daterangedefault;
          if (dr === 'LAST_QUARTER' || dr === 'ALL_TIME') setTimeRange(dr);
        }
        // Load the multi-dashboard list + store pagination metadata
        const allDashboards: any[] = Array.isArray(data.dashboards) ? data.dashboards : [];
        setSavedDashboardsList(allDashboards);
        setDashboardPage(1);
        setDashboardHasMore(data.pagination?.hasMore === true);

        if (allDashboards.length > 0) {
          // Auto-load the most recently updated dashboard
          const first = [...allDashboards].sort(
            (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
          )[0];
          loadDashboardEntry(first);
        } else {
          // No saved dashboards yet — load the default template
          loadRepDashboard();
        }

        setDbConfigLoaded(true);
        setLastRefreshed(new Date());
      })
      .catch(console.error);
  }, []);

  // ── Ensure all widget datasets are loaded when datasets list becomes available ─
  // Problem: loadDashboardEntry sets widgets (with datasetId) before /api/datasets
  // finishes. The selectedDatasetId effect fires but datasets=[]. Later when datasets
  // load this effect kicks in and triggers the lazy fetch for any uncached dataset.
  useEffect(() => {
    if (!datasets.length) return;
    // Collect every unique datasetId referenced by current widgets + selectedDatasetId
    const needed = new Set<string>([
      ...widgets.map((w: any) => w.datasetId).filter(Boolean),
      ...(selectedDatasetId ? [selectedDatasetId] : []),
    ]);
    needed.forEach(dsId => loadDatasetIntoCache(dsId, datasets));
  }, [datasets]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live "X ago" ticker (#28) ─────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (!lastRefreshed) { setTimeAgo(''); return; }
      const secs = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);
      if (secs < 60)   setTimeAgo(`${secs}s ago`);
      else if (secs < 3600) setTimeAgo(`${Math.floor(secs / 60)}m ago`);
      else             setTimeAgo(`${Math.floor(secs / 3600)}h ago`);
    };
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, [lastRefreshed]);

  // ── Load dataset data when widgets change (e.g. dashboard loaded from sidebar) ─
  useEffect(() => {
    if (!datasets.length || !widgets.length) return;
    const needed = new Set<string>(widgets.map((w: any) => w.datasetId).filter(Boolean));
    needed.forEach(dsId => loadDatasetIntoCache(dsId, datasets));
  }, [widgets]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-refresh effect (Feature 3) ──────────────────────────────────────────
  useEffect(() => {
    if (!autoRefreshInterval) return;
    const id = setInterval(() => { refreshData(); }, autoRefreshInterval * 60 * 1000);
    return () => clearInterval(id);
  }, [autoRefreshInterval]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Owner/team scope pre-filter (#25, #26) ────────────────────────────────────
  const scopedDeals = useMemo(() => {
    if (!selectedDeals.length) return [];
    if (viewScope === 'personal' && ownerFilter !== 'All Owners') {
      return selectedDeals.filter(d => d.ownerName === ownerFilter);
    }
    if (viewScope === 'team' && ownerFilter !== 'All Owners') {
      // 1) Try user-defined teamConfig first (works even without teamName field in deals)
      const definedTeam = teamConfig.find(t => t.members.includes(ownerFilter));
      if (definedTeam) return selectedDeals.filter(d => definedTeam.members.includes(d.ownerName));
      // 2) Fall back to teamName field on deals (only works if HubSpot populates it)
      const ownerTeam = selectedDeals.find(d => d.ownerName === ownerFilter)?.teamName;
      if (ownerTeam) return selectedDeals.filter(d => d.teamName === ownerTeam);
    }
    return selectedDeals;
  }, [selectedDeals, viewScope, ownerFilter, teamConfig]);

  const rows = useMemo(
    () => computeDashboardRows(scopedDeals, { timeRange, customer, team, metricFilter }),
    [scopedDeals, timeRange, customer, team, metricFilter],
  );
  // ── Quarterly-aware effective target ─────────────────────────────────────────
  const effectiveDashboardTarget = useMemo(() => {
    if (timeRange === 'CURRENT_QUARTER') {
      const now = new Date();
      const qKey = `Q${Math.ceil((now.getMonth() + 1) / 3)}-${now.getFullYear()}`;
      if (quarterlyTargets[qKey] > 0) return quarterlyTargets[qKey];
    }
    if (timeRange === 'LAST_QUARTER') {
      const now = new Date();
      const cq = Math.ceil((now.getMonth() + 1) / 3);
      const cy = now.getFullYear();
      const pq = cq === 1 ? 4 : cq - 1;
      const py = cq === 1 ? cy - 1 : cy;
      const qKey = `Q${pq}-${py}`;
      if (quarterlyTargets[qKey] > 0) return quarterlyTargets[qKey];
    }
    return dashboardTarget;
  }, [timeRange, dashboardTarget, quarterlyTargets]);

  const summary = useMemo(() => summarizeRows(rows, effectiveDashboardTarget), [rows, effectiveDashboardTarget]);

  // ── Previous-period rows for delta computation (#24) ────────────────────────
  const prevRows = useMemo(() => {
    if (timeRange === 'ALL_TIME') return [];
    const prevRange = timeRange === 'CURRENT_QUARTER' ? 'LAST_QUARTER' : 'CURRENT_QUARTER';
    return computeDashboardRows(scopedDeals, { timeRange: prevRange, customer, team, metricFilter });
  }, [scopedDeals, timeRange, customer, team, metricFilter]);

  const prevSummary = useMemo(() => summarizeRows(prevRows, effectiveDashboardTarget), [prevRows, effectiveDashboardTarget]);

  const openPipelineValue = useMemo(() => {
    return rows
      .filter((r: any) => r.stage !== 'Closed Won' && r.stage !== 'Closed Lost')
      .reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
  }, [rows]);

  const prevOpenPipelineValue = useMemo(() => {
    return prevRows
      .filter((r: any) => r.stage !== 'Closed Won' && r.stage !== 'Closed Lost')
      .reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
  }, [prevRows]);

  const openDealCount = useMemo(() => {
    return rows.filter((r: any) => r.stage !== 'Closed Won' && r.stage !== 'Closed Lost').length;
  }, [rows]);

  const prevOpenDealCount = useMemo(() => {
    return prevRows.filter((r: any) => r.stage !== 'Closed Won' && r.stage !== 'Closed Lost').length;
  }, [prevRows]);

  function calcDelta(cur: number, prev: number): number | undefined {
    if (timeRange === 'ALL_TIME' || prev === 0) return undefined;
    return Math.round(((cur - prev) / prev) * 100);
  }
  const deltaLabel = timeRange === 'CURRENT_QUARTER' ? 'vs last quarter' : 'vs current quarter';

  // ── Data Refresh (#28) ───────────────────────────────────────────────────────
  async function refreshData() {
    setIsRefreshing(true);
    try {
      const res  = await fetch('/api/dashboards');
      const data = await res.json();
      if (data.deals)      setDbDeals(data.deals.map((d: any) => ({ ...d, amount: Number(d.amount) })));
      if (data.snapshots)  setDbSnapshots(data.snapshots);
      if (Array.isArray(data.dashboards)) setSavedDashboardsList(data.dashboards);
      setDashboardPage(1);
      setDashboardHasMore(data.pagination?.hasMore === true);
      setLastRefreshed(new Date());
      setWorkspaceMessage('✅ Data refreshed successfully');
      setTimeout(() => setWorkspaceMessage(''), 3000);
    } catch (e: any) {
      setWorkspaceMessage('❌ Refresh failed: ' + e.message);
    } finally {
      setIsRefreshing(false);
    }
  }

  // ── Load the next page of dashboards (pagination) ────────────────────────────
  async function loadMoreDashboards() {
    if (dashboardLoadingMore || !dashboardHasMore) return;
    setDashboardLoadingMore(true);
    try {
      const nextPage = dashboardPage + 1;
      const res  = await fetch(`/api/dashboards?page=${nextPage}&limit=50`);
      const data = await res.json();
      if (Array.isArray(data.dashboards) && data.dashboards.length > 0) {
        // Append new dashboards, dedup by id (own copies take priority)
        setSavedDashboardsList(prev => {
          const existingIds = new Set(prev.map((d: any) => d.id));
          const fresh = data.dashboards.filter((d: any) => !existingIds.has(d.id));
          return [...prev, ...fresh];
        });
        setDashboardPage(nextPage);
        setDashboardHasMore(data.pagination?.hasMore === true);
      } else {
        setDashboardHasMore(false);
      }
    } catch (e: any) {
      setWorkspaceMessage('❌ Could not load more dashboards: ' + e.message);
    } finally {
      setDashboardLoadingMore(false);
    }
  }

  // ── Load a saved dashboard entry into the editor ─────────────────────────────
  function loadDashboardEntry(entry: any) {
    const rawWs = Array.isArray(entry.items) ? entry.items : [];
    // Backfill datasetId for widgets saved before per-widget dataset stamping was added.
    // Without this, widgets with no datasetId fall back to dbDeals (global pool) and
    // every dashboard shows the same numbers regardless of which dataset it was built on.
    const ws = rawWs.map((w: any) => ({
      ...w,
      datasetId: w.datasetId || entry.datasetId || '',
    }));
    setTitle(entry.title || 'Untitled Dashboard');
    setWidgets(ws);
    setSelectedWidgetId(ws[0]?.id || '');
    setDashboardTarget(entry.target ?? 150000);
    setDashboardStatus(entry.status === 'published' ? 'published' : 'draft');
    setDashboardStarred(entry.starred === true);
    setAccess((['PRIVATE', 'TEAM', 'LINK'].includes(entry.access) ? entry.access : 'PRIVATE') as any);
    setActiveDashboardId(entry.id);
    // Mark the canvas read-only when loading a shared (non-owned) dashboard
    setIsReadOnly(entry.readOnly === true);
    // Restore the dataset this dashboard was built on (skip the re-fetch effect by
    // marking initial again so the effect treats it as an automatic selection)
    if (entry.datasetId) {
      isInitialDatasetRef.current = true;
      selectedDatasetIdRef.current = entry.datasetId;
      setSelectedDatasetId(entry.datasetId);
      // Immediately trigger the cache load — don't wait for the effect
      if (datasets.length > 0) {
        loadDatasetIntoCache(entry.datasetId, datasets);
      }
    }
    // Restore filter / scope state
    if (entry.timeRange)    setTimeRange(entry.timeRange);
    if (entry.customer)     setCustomer(entry.customer);
    if (entry.team)         setTeam(entry.team);
    if (entry.metricFilter) setMetricFilter(entry.metricFilter);
    if (entry.ownerFilter)  setOwnerFilter(entry.ownerFilter);
    if (entry.viewScope)    setViewScope(entry.viewScope);
    // Restore per-owner / per-team / quarterly targets
    const tc = entry.targetConfig ?? {};
    setOwnerTargets(tc.owners ?? {});
    setTeamTargets(tc.teams ?? {});
    setQuarterlyTargets(tc.quarterly ?? {});
    setDashboards([{
      id:        entry.id,
      title:     entry.title || 'Untitled Dashboard',
      datasetId: entry.datasetId || selectedDatasetId || '',
      access:    entry.access || 'PRIVATE',
      widgets:   ws,
      createdAt: entry.createdAt || new Date().toISOString(),
    }]);
    setActiveTemplateKey(null);
  }

  // ── Start a brand-new blank dashboard ────────────────────────────────────────
  function newDashboard() {
    setTitle('New Dashboard');
    setWidgets([]);
    setSelectedWidgetId('');
    setActiveTemplateKey(null);
    setDashboardTarget(150000);
    setDashboardStatus('draft');
    setDashboardStarred(false);
    setAccess('PRIVATE');
    setActiveDashboardId(null);
    setIsReadOnly(false);
    setOwnerTargets({});
    setTeamTargets({});
    setQuarterlyTargets({});
    setTargetConfigWarning('');
    // Reset filters to defaults
    setTimeRange('CURRENT_QUARTER');
    setCustomer('All Customers');
    setTeam('All Teams');
    setMetricFilter('ALL');
    setOwnerFilter('All Owners');
    setViewScope('all');
    // Next dataset selection by the user should trigger a data reload
    isInitialDatasetRef.current = false;
    setWorkspaceMessage('✨ New dashboard — add widgets then click "Save draft".');
  }

  // ── Delete a saved dashboard ──────────────────────────────────────────────────
  async function deleteDashboard(id: string) {
    if (!confirm('Delete this dashboard? This cannot be undone.')) return;
    const res  = await fetch(`/api/dashboards?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      const updated: any[] = Array.isArray(data.dashboards) ? data.dashboards : [];
      setSavedDashboardsList(updated);
      // If we just deleted the active dashboard, switch to next or blank
      if (id === activeDashboardId) {
        if (updated.length > 0) {
          loadDashboardEntry(updated[updated.length - 1]);
        } else {
          newDashboard();
        }
      }
    }
  }

  // ── Duplicate Dashboard (#29) — API-backed ───────────────────────────────────
  async function duplicateDashboard() {
    // If there's an active saved dashboard, use the API
    if (activeDashboardId) {
      try {
        setWorkspaceMessage('⏳ Duplicating dashboard…');
        const res = await fetch('/api/dashboards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'duplicate', sourceDashboardId: activeDashboardId }),
        });
        const data = await res.json();
        if (data.success && data.dashboard) {
          // Add cloned dashboard to list and switch to it
          setSavedDashboardsList(prev => [...prev, data.dashboard]);
          loadDashboardEntry({ ...data.dashboard, items: data.dashboard.items ?? widgets.map(w => ({ ...w, id: `${w.id}_copy${Date.now()}` })) });
          setWorkspaceMessage('📋 Dashboard duplicated — this is now your active dashboard.');
          showSaveToast('📋 Dashboard duplicated!', 'success');
          return;
        }
      } catch {}
    }
    // Fallback: local clone
    const stamp        = Date.now();
    const clonedWidgets = widgets.map(w => ({ ...w, id: `${w.id}_copy${stamp}` }));
    setTitle(`${title} (Copy)`);
    setWidgets(clonedWidgets);
    setDashboardStatus('draft');
    setDashboardStarred(false);
    setActiveDashboardId(null);
    setWorkspaceMessage('📋 Dashboard duplicated as a new draft — click "Save draft" to persist it.');
  }

  // ── Owner list for scope filter (#25) ────────────────────────────────────────
  const ownersList = useMemo(() => {
    const s = new Set<string>();
    selectedDeals.forEach(d => { if (d.ownerName && d.ownerName !== 'Unknown') s.add(d.ownerName); });
    return ['All Owners', ...Array.from(s).sort()];
  }, [selectedDeals]);

  // ── Metric usage map — which widgets use each metric (#21) ──────────────────
  const metricUsage = useMemo(() => {
    const map = new Map<string, any[]>();
    widgets.forEach(w => {
      if (!map.has(w.yMetric)) map.set(w.yMetric, []);
      map.get(w.yMetric)!.push(w);
    });
    return map;
  }, [widgets]);

  /** Compute a base metric value from rows */
  function computeBaseMetric(metricId: string, rows: any[], target: number): number {
    const won = rows.filter((r: any) => r.stage === 'Closed Won');
    if (metricId === 'bookings')        return won.reduce((s: number, r: any) => s + r.amount, 0);
    if (metricId === 'pipelineValue')   return rows.filter((r: any) => r.stage !== 'Closed Won' && r.stage !== 'Closed Lost').reduce((s: number, r: any) => s + r.amount, 0);
    if (metricId === 'dealCount')       return rows.length;
    if (metricId === 'winRate')         return rows.length ? Math.round((won.length / rows.length) * 100) : 0;
    if (metricId === 'targetAttainment') { const b = won.reduce((s: number, r: any) => s + r.amount, 0); return target > 0 ? Math.round((b / target) * 100) : 0; }
    // Unknown / custom chained — return 0
    return 0;
  }

  /** Compute a custom formula metric value */
  function computeCustomMetricValue(formula: { metricA: string; op: string; metricB: string }, rows: any[], target: number): number {
    const a = computeBaseMetric(formula.metricA, rows, target);
    const b = computeBaseMetric(formula.metricB, rows, target);
    if (formula.op === '÷') return b !== 0 ? Math.round(a / b) : 0;
    if (formula.op === '×') return Math.round(a * b);
    if (formula.op === '+') return Math.round(a + b);
    if (formula.op === '-') return Math.round(a - b);
    return a;
  }

  /** Rename a metric and cascade to widget titles that used the old name */
  function commitMetricRename(metricId: string, newName: string) {
    const oldName = localMetrics[metricId]?.name ?? '';
    setLocalMetrics(prev => {
      const next = { ...prev, [metricId]: { ...prev[metricId], name: newName } };
      persistMetrics(next);
      return next;
    });
    // Update widget titles that exactly match the old metric name
    setWidgets(prev => prev.map(w =>
      w.yMetric === metricId && w.title === oldName ? { ...w, title: newName } : w
    ));
    setEditingMetricId(null);
  }

  /** Add a new custom metric */
  function addCustomMetric() {
    if (!newMetricForm.name.trim()) return;
    const id = `custom_${Date.now()}`;
    setLocalMetrics(prev => {
      const next = {
        ...prev,
        [id]: {
          id, name: newMetricForm.name.trim(),
          shortName: newMetricForm.name.trim(),
          description: newMetricForm.description || `${newMetricForm.metricA} ${newMetricForm.op} ${newMetricForm.metricB}`,
          format: 'number' as const, category: 'Activity' as const,
          higherIsBetter: true,
          formula: { metricA: newMetricForm.metricA, op: newMetricForm.op, metricB: newMetricForm.metricB },
          isCustom: true,
        },
      };
      persistMetrics(next);
      return next;
    });
    setNewMetricForm({ name: '', description: '', metricA: 'bookings', op: '÷', metricB: 'dealCount' });
    setShowNewMetric(false);
  }

  const customersList = useMemo(() => {
    const list = new Set<string>();
    dbDeals.forEach(deal => {
      if (deal.accountName) list.add(deal.accountName);
    });
    return ["All Customers", ...Array.from(list)];
  }, [dbDeals]);

  const teamsList = useMemo(() => {
    const list = new Set<string>();
    dbDeals.forEach(deal => {
      if (deal.teamName) list.add(deal.teamName);
    });
    const arr = Array.from(list);
    return arr.length > 0 ? ["All Teams", ...arr] : ["All Teams", "North Team", "Strategic Team"];
  }, [dbDeals]);

  // Fields from the currently selected dataset's CACHED ROWS (actual field names, not raw DB schema names)
  const datasetFields = useMemo(() => {
    if (!selectedDatasetId) return fallbackDashboardConfig.availableXFields;
    const cached = datasetCache[selectedDatasetId];
    if (!cached?.length) return fallbackDashboardConfig.availableXFields;
    // Derive field names from the first cached row — these are the actual runtime field names
    const fields = Object.keys(cached[0]).filter(k => !k.startsWith('_'));
    return fields.length > 0 ? fields : fallbackDashboardConfig.availableXFields;
  }, [selectedDatasetId, datasetCache]);

  const renderedWidgets = useMemo(() => {
    return (Array.isArray(widgets) ? widgets : []).map((widget) => {
      // Use widget-level target if set, otherwise fall back to quarterly-aware dashboard target
      const effectiveTarget = (widget.target && widget.target > 0) ? widget.target : effectiveDashboardTarget;

      const activeFilters = {
        timeRange,
        customer: widget.filters?.customer && widget.filters.customer !== "All Customers" ? widget.filters.customer : customer,
        team:     widget.filters?.team     && widget.filters.team     !== "All Teams"     ? widget.filters.team     : team,
        metricFilter: widget.filters?.metricFilter && widget.filters.metricFilter !== "ALL" ? widget.filters.metricFilter : metricFilter,
      };

      // ── Dataset routing ────────────────────────────────────────────────────────
      const datasetId = widget.datasetId || selectedDatasetId;
      const datasetRows: any[] = datasetId ? (datasetCache[datasetId] ?? []) : [];

      // Apply filters. If the quarter filter empties the result (historical data),
      // fall back to ALL_TIME so the dataset's rows are always visible.
      let widgetRows = computeDashboardRows(datasetRows, activeFilters);
      if (datasetRows.length > 0 && widgetRows.length === 0) {
        widgetRows = computeDashboardRows(datasetRows, { ...activeFilters, timeRange: 'ALL_TIME' });
      }

      let value = 0;
      let chartData: Array<{ label: string; value: number }> = [];

      // Special types that self-render from _rows / _allDeals — skip aggregation
      const SELF_RENDER = ["PERFORMANCE", "ATTAINMENT_TREND", "FORECAST", "TRENDS", "CHANGES", "RISK_SCORECARD"];

      if (widget.type === "KPI") {
        const kpiSummary = summarizeRows(widgetRows, effectiveTarget);
        if      (widget.yMetric === "bookings")         value = kpiSummary.bookings;
        else if (widget.yMetric === "targetAttainment") value = kpiSummary.targetAttainment;
        else if (widget.yMetric === "winRate")          value = kpiSummary.winRate;
        else if (widget.yMetric === "pipelineValue")    value = widgetRows.filter(r => r.stage !== "Closed Won" && r.stage !== "Closed Lost").reduce((s, r) => s + r.amount, 0);
        else if (widget.yMetric === "dealCount")        value = widgetRows.length;
        else {
          // Dataset field or custom metric
          const customMeta = localMetrics[widget.yMetric];
          if (customMeta?.formula) value = computeCustomMetricValue(customMeta.formula, widgetRows, effectiveTarget);
          else value = widgetRows.reduce((s, r) => s + (Number((r as any)[widget.yMetric]) || 0), 0);
        }
      } else if (!SELF_RENDER.includes(widget.type) && widget.type !== "TABLE") {
        // Group by xField — works for any field name from the dataset
        const groups = new Map<string, typeof widgetRows>();
        widgetRows.forEach(row => {
          const key = String((row as any)[widget.xField] ?? "Unknown");
          groups.set(key, [...(groups.get(key) ?? []), row]);
        });
        chartData = Array.from(groups.entries()).map(([label, items]) => {
          let metricValue = 0;
          if      (widget.yMetric === "dealCount")        metricValue = items.length;
          else if (widget.yMetric === "bookings")         metricValue = items.filter((r: any) => r.stage === "Closed Won").reduce((s: number, r: any) => s + r.amount, 0);
          else if (widget.yMetric === "pipelineValue")    metricValue = items.filter((r: any) => r.stage !== "Closed Won" && r.stage !== "Closed Lost").reduce((s: number, r: any) => s + r.amount, 0);
          else if (widget.yMetric === "winRate")          { const won = items.filter((r: any) => r.stage === "Closed Won").length; metricValue = items.length ? Math.round((won / items.length) * 100) : 0; }
          else if (widget.yMetric === "targetAttainment") metricValue = Math.round((items.reduce((s: number, r: any) => s + r.amount, 0) / effectiveTarget) * 100);
          // Dataset field: sum the numeric value of that field across grouped rows
          else                                            metricValue = items.reduce((s: number, r: any) => s + (Number(r[widget.yMetric]) || 0), 0);
          const firstRow = items[0] as any;
          return {
            label, value: metricValue,
            meta: {
              stage: firstRow?.stage, pipelineStage: firstRow?.pipelineStage,
              status: firstRow?.status, closeDate: firstRow?.closeDate,
            }
          };
        });
      }

      const api = specialWidgetApi[widget.id];

      // ATTAINMENT_TREND and TRENDS need all deals for multi-quarter view
      const needsAllDeals = widget.type === "ATTAINMENT_TREND" || widget.type === "TRENDS";
      return { ...widget, value, data: chartData, _rows: widgetRows, _target: effectiveTarget, ...(needsAllDeals ? { _allDeals: datasetRows } : {}), ...(api ? { _api: api } : {}) };
    });
  }, [widgets, timeRange, customer, team, metricFilter, dashboardTarget, effectiveDashboardTarget, selectedDatasetId, datasetCache, specialWidgetApi]);

  // Server-backed analytics for special widgets (Performance/Attainment/Forecast/Trends/Changes).
  useEffect(() => {
    if (!datasets.length || !widgets.length) return;

    const controller = new AbortController();

    async function run() {
      const updates: Record<string, any> = {};

      for (const widget of widgets) {
        const isSpecial = ["PERFORMANCE", "ATTAINMENT_TREND", "FORECAST", "TRENDS", "CHANGES"].includes(widget.type);
        if (!isSpecial) continue;

        const datasetId = widget.datasetId || selectedDatasetIdRef.current || selectedDatasetId;
        if (!datasetId) continue;

        const dataset = datasets.find((d: any) => d.id === datasetId);
        if (!dataset) continue;

        const src = resolveDataSource(dataset);

        const activeFilters = {
          timeRange,
          customer: widget.filters?.customer && widget.filters.customer !== "All Customers" ? widget.filters.customer : customer,
          team:     widget.filters?.team     && widget.filters.team     !== "All Teams"     ? widget.filters.team     : team,
          metricFilter: widget.filters?.metricFilter && widget.filters.metricFilter !== "ALL" ? widget.filters.metricFilter : metricFilter,
        };

        const effectiveTarget = (widget.target && widget.target > 0) ? widget.target : effectiveDashboardTarget;

        const key = `${datasetId}:${src}:${activeFilters.timeRange}:${activeFilters.customer}:${activeFilters.team}:${activeFilters.metricFilter}:${effectiveTarget}`;
        if (specialWidgetApi[widget.id]?.__key === key) continue;

        try {
          const reqUrl = new URL("/api/dashboards/analytics", window.location.origin);
          reqUrl.searchParams.set("source", src);
          reqUrl.searchParams.set("datasetId", datasetId);
          reqUrl.searchParams.set("timeRange", activeFilters.timeRange);
          reqUrl.searchParams.set("customer", activeFilters.customer);
          reqUrl.searchParams.set("team", activeFilters.team);
          reqUrl.searchParams.set("metricFilter", activeFilters.metricFilter);
          reqUrl.searchParams.set("target", String(effectiveTarget));

          const res = await fetch(reqUrl.toString(), { signal: controller.signal });
          const data = await res.json();
          if (res.ok && !data?.error) {
            updates[widget.id] = { __key: key, ...data };
          }
        } catch {
          // Best-effort; widgets fall back to client-side rendering.
        }
      }

      if (!controller.signal.aborted && Object.keys(updates).length > 0) {
        setSpecialWidgetApi((prev) => ({ ...prev, ...updates }));
      }
    }

    run();
    return () => controller.abort();
  }, [datasets, widgets, selectedDatasetId, timeRange, customer, team, metricFilter, effectiveDashboardTarget, specialWidgetApi]);

  function findFreePosition(
    existing: any[],
    w: number,
    h: number,
    excludeId?: string,
  ): { x: number; y: number } {
    const occupied = (cx: number, cy: number, cw: number, ch: number, nx: number, ny: number, nw: number, nh: number) =>
      nx < cx + cw && nx + nw > cx && ny < cy + ch && ny + nh > cy;

    const others = existing.filter((wgt) => wgt.id !== excludeId);
    const maxRow = others.reduce((m, wgt) => Math.max(m, (wgt.position?.y ?? 0) + (wgt.position?.h ?? 3)), 0);

    for (let row = 0; row <= maxRow + h; row++) {
      for (let col = 0; col <= 12 - w; col++) {
        const hasCollision = others.some((wgt) => {
          const p = wgt.position || { x: 0, y: 0, w: 4, h: 3 };
          return occupied(p.x, p.y, p.w, p.h, col, row, w, h);
        });
        if (!hasCollision) return { x: col, y: row };
      }
    }
    return { x: 0, y: maxRow + 1 };
  }

  // Fix #10: sanitise widget positions before save — clamp to grid, resolve overlaps
  function sanitiseWidgetPositions(ws: any[]): any[] {
    const GRID_COLS = 12;
    const sanitised = ws.map(w => {
      const p = w.position ?? { x: 0, y: 0, w: 4, h: 3 };
      return {
        ...w,
        position: {
          x: Math.max(0, Math.min(Math.round(p.x), GRID_COLS - 1)),
          y: Math.max(0, Math.round(p.y)),
          w: Math.max(1, Math.min(Math.round(p.w), GRID_COLS)),
          h: Math.max(1, Math.round(p.h)),
        },
      };
    });
    // Re-place any widget whose right edge overflows the grid
    return sanitised.map(w => {
      if (w.position.x + w.position.w > GRID_COLS) {
        w = { ...w, position: { ...w.position, w: GRID_COLS - w.position.x } };
      }
      return w;
    });
  }

  function addWidget(type: DashboardWidget["type"]) {
    const next = createWidgetSeed(type);
    const { w, h } = getWidgetSize(type);
    const { x, y } = findFreePosition(widgets, w, h);
    // Stamp the widget with the currently selected dataset so it always knows
    // which dataset it was built on, even if the dashboard-level selector changes later.
    setWidgets((current) => [...current, { ...next, datasetId: selectedDatasetId, position: { x, y, w, h } }]);
    setSelectedWidgetId(next.id);
  }

  function updateWidget(widgetId: string, patch: Partial<any>) {
    setWidgets((current) => current.map((widget) => (widget.id === widgetId ? { ...widget, ...patch } : widget)));
  }

  function removeWidget(widgetId: string) {
    setWidgets((current) => current.filter((widget) => widget.id !== widgetId));
    setSelectedWidgetId((current) => (current === widgetId ? "" : current));
  }

  const selectedWidget = widgets.find((widget) => widget.id === selectedWidgetId) ?? widgets[0];

  function showSaveToast(message: string, type: 'success' | 'error' = 'success') {
    setSaveToast({ message, type });
    setTimeout(() => setSaveToast(null), 3500);
  }

  // Returns the confirmed dashboard ID so callers (e.g. createAccessLink) can use
  // the freshly-created/confirmed ID without relying on the stale closure value.
  async function persistDashboard(overrideStatus?: 'draft' | 'published'): Promise<string> {
    const saveStatus = overrideStatus ?? dashboardStatus;
    setWorkspaceMessage("Saving dashboard…");

    // Fix #9: Assign a stable ID before the network call so retries don't create duplicates.
    // If the save fails, we keep this ID for the next attempt.
    const pendingId = activeDashboardId ?? `dash_${Date.now()}`;
    if (!activeDashboardId) setActiveDashboardId(pendingId);

    try {
      const safeWidgets = sanitiseWidgetPositions(widgets); // Fix #10
      const res = await fetch('/api/dashboards', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardId:  pendingId,
          title:        title || 'Untitled Dashboard',
          widgets:      safeWidgets.map((w: any) => ({ ...w, datasetId: selectedDatasetId || w.datasetId })),
          target:       dashboardTarget,
          status:       saveStatus,
          starred:      dashboardStarred,
          access,
          datasetId:    selectedDatasetId,
          // ── Persist filter / scope state ─────────────────────────────────
          timeRange,
          customer,
          team,
          metricFilter,
          ownerFilter,
          viewScope,
          targetConfig: {
            owners:    ownerTargets,
            teams:     teamTargets,
            quarterly: quarterlyTargets,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (overrideStatus) setDashboardStatus(overrideStatus);
        // Sync to the id the server confirmed (server may normalise it)
        const confirmedId = data.dashboard?.id ?? pendingId;
        setActiveDashboardId(confirmedId);
        // Refresh the sidebar list
        if (Array.isArray(data.dashboards)) {
          setSavedDashboardsList(data.dashboards);
        }
        const msg = overrideStatus === 'published' ? '🚀 Dashboard published!'
          : overrideStatus === 'draft' ? '✏️ Reverted to draft.'
          : '✅ Dashboard saved.';
        setWorkspaceMessage(msg);
        showSaveToast(msg, 'success');
        return confirmedId;  // ← callers get the real ID
      } else {
        const errMsg = "Failed to save: " + (data.error || "Unknown error");
        setWorkspaceMessage(errMsg);
        showSaveToast(errMsg, 'error');
        return pendingId;   // return what we used even on API error
      }
    } catch (e: any) {
      const errMsg = "Failed to save: " + e.message;
      setWorkspaceMessage(errMsg);
      showSaveToast(errMsg, 'error');
      return pendingId;  // still return the ID even on network failure
    }
  }

  async function publishDashboard() {
    await persistDashboard('published');
  }

  async function revertToDraft() {
    await persistDashboard('draft');
  }

  function exportOffline() {
    if (!selectedDatasetId) {
      setWorkspaceMessage("Choose a dataset before exporting.");
      return;
    }
    const snapshot = exportDashboardSnapshot(
      {
        id: "preview-dashboard",
        title,
        datasetId: selectedDatasetId,
        access,
        widgets,
        createdAt: new Date().toISOString(),
      },
      { timeRange, customer, team, metricFilter },
      dbDeals,
    );
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.replace(/\s+/g, "-").toLowerCase()}-offline-snapshot.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    setWorkspaceMessage("Offline snapshot exported.");
  }

  // ── Named dashboard templates ─────────────────────────────────────────────────
  const DASHBOARD_TEMPLATES: Record<string, { title: string; description: string; widgets: any[] }> = {
    rep: {
      title: "My Sales Rep Dashboard",
      description: "Personal KPIs, pipeline funnel, top open deals",
      widgets: [
        { id: "w_r1", title: "My Bookings",          type: "KPI",    filters: {}, xField: "dealName",      yMetric: "bookings",         position: { x: 0, y: 0, w: 4, h: 2 } },
        { id: "w_r2", title: "% Target Attainment",  type: "KPI",    filters: {}, xField: "dealName",      yMetric: "targetAttainment", position: { x: 4, y: 0, w: 4, h: 2 } },
        { id: "w_r3", title: "My Win Rate",           type: "KPI",    filters: {}, xField: "dealName",      yMetric: "winRate",          position: { x: 8, y: 0, w: 4, h: 2 } },
        { id: "w_r4", title: "Pipeline by Stage",    type: "FUNNEL", filters: {}, xField: "pipelineStage", yMetric: "pipelineValue",    position: { x: 0, y: 2, w: 6, h: 4 } },
        { id: "w_r5", title: "Top Open Deals",        type: "TABLE",  filters: {}, xField: "dealName",      yMetric: "pipelineValue",    position: { x: 6, y: 2, w: 6, h: 4 } },
        { id: "w_r6", title: "Deals by Account",     type: "BAR",    filters: {}, xField: "accountName",   yMetric: "dealCount",        position: { x: 0, y: 6, w: 4, h: 3 } },
        { id: "w_r7", title: "Revenue by Stage",     type: "COLUMN", filters: {}, xField: "stage",         yMetric: "bookings",         position: { x: 4, y: 6, w: 4, h: 3 } },
        { id: "w_r8", title: "Win Rate by Owner",    type: "PIE",    filters: {}, xField: "ownerName",     yMetric: "winRate",          position: { x: 8, y: 6, w: 4, h: 3 } },
      ],
    },
    performance: {
      title: "Performance Review",
      description: "Compare individual rep output: bookings, attainment, win rate per owner",
      widgets: [
        { id: "p_1", title: "Total Bookings",         type: "KPI",    filters: {}, xField: "ownerName",    yMetric: "bookings",         position: { x: 0, y: 0, w: 3, h: 2 } },
        { id: "p_2", title: "Target Attainment",      type: "KPI",    filters: {}, xField: "ownerName",    yMetric: "targetAttainment", position: { x: 3, y: 0, w: 3, h: 2 } },
        { id: "p_3", title: "Win Rate",               type: "KPI",    filters: {}, xField: "ownerName",    yMetric: "winRate",          position: { x: 6, y: 0, w: 3, h: 2 } },
        { id: "p_4", title: "Deal Count",             type: "KPI",    filters: {}, xField: "ownerName",    yMetric: "dealCount",        position: { x: 9, y: 0, w: 3, h: 2 } },
        { id: "p_5", title: "Bookings by Rep",        type: "BAR",    filters: {}, xField: "ownerName",    yMetric: "bookings",         position: { x: 0, y: 2, w: 6, h: 3 } },
        { id: "p_6", title: "Win Rate by Rep",        type: "COLUMN", filters: {}, xField: "ownerName",    yMetric: "winRate",          position: { x: 6, y: 2, w: 6, h: 3 } },
        { id: "p_7", title: "Pipeline by Rep",        type: "TREEMAP",filters: {}, xField: "ownerName",    yMetric: "pipelineValue",    position: { x: 0, y: 5, w: 6, h: 3 } },
        { id: "p_8", title: "Top Deals",              type: "TABLE",  filters: {}, xField: "dealName",     yMetric: "bookings",         position: { x: 6, y: 5, w: 6, h: 3 } },
      ],
    },
    pipeline: {
      title: "Pipeline Generation",
      description: "Open pipeline health: volume by stage, age, and account",
      widgets: [
        { id: "g_1", title: "Open Pipeline Value",    type: "KPI",    filters: {}, xField: "stage",         yMetric: "pipelineValue",   position: { x: 0, y: 0, w: 4, h: 2 } },
        { id: "g_2", title: "Open Deal Count",        type: "KPI",    filters: {}, xField: "stage",         yMetric: "dealCount",       position: { x: 4, y: 0, w: 4, h: 2 } },
        { id: "g_3", title: "Avg Deal Size",          type: "KPI",    filters: {}, xField: "accountName",   yMetric: "bookings",        position: { x: 8, y: 0, w: 4, h: 2 } },
        { id: "g_4", title: "Pipeline Funnel",        type: "FUNNEL", filters: {}, xField: "pipelineStage", yMetric: "pipelineValue",   position: { x: 0, y: 2, w: 5, h: 4 } },
        { id: "g_5", title: "Pipeline by Account",   type: "BAR",    filters: {}, xField: "accountName",   yMetric: "pipelineValue",   position: { x: 5, y: 2, w: 7, h: 4 } },
        { id: "g_6", title: "Stage Breakdown",       type: "PIE",    filters: {}, xField: "stage",         yMetric: "dealCount",       position: { x: 0, y: 6, w: 4, h: 3 } },
        { id: "g_7", title: "Pipeline by Rep",       type: "COLUMN", filters: {}, xField: "ownerName",     yMetric: "pipelineValue",   position: { x: 4, y: 6, w: 4, h: 3 } },
        { id: "g_8", title: "All Open Deals",        type: "TABLE",  filters: {}, xField: "dealName",      yMetric: "pipelineValue",   position: { x: 8, y: 6, w: 4, h: 3 } },
      ],
    },
    qbr: {
      title: "QBR — Quarterly Business Review",
      description: "Full-quarter summary: bookings, attainment, pipeline coverage, win/loss",
      widgets: [
        { id: "q_1", title: "Quarter Bookings",       type: "KPI",    filters: {}, xField: "quarter",       yMetric: "bookings",        position: { x: 0, y: 0, w: 3, h: 2 } },
        { id: "q_2", title: "Target Attainment",      type: "KPI",    filters: {}, xField: "quarter",       yMetric: "targetAttainment",position: { x: 3, y: 0, w: 3, h: 2 } },
        { id: "q_3", title: "Win Rate",               type: "KPI",    filters: {}, xField: "quarter",       yMetric: "winRate",         position: { x: 6, y: 0, w: 3, h: 2 } },
        { id: "q_4", title: "Total Deals",            type: "KPI",    filters: {}, xField: "quarter",       yMetric: "dealCount",       position: { x: 9, y: 0, w: 3, h: 2 } },
        { id: "q_5", title: "Revenue by Account",    type: "BAR",    filters: {}, xField: "accountName",   yMetric: "bookings",        position: { x: 0, y: 2, w: 8, h: 3 } },
        { id: "q_6", title: "Win / Loss Split",      type: "PIE",    filters: {}, xField: "stage",         yMetric: "dealCount",       position: { x: 8, y: 2, w: 4, h: 3 } },
        { id: "q_7", title: "Pipeline Coverage",     type: "FUNNEL", filters: {}, xField: "pipelineStage", yMetric: "pipelineValue",   position: { x: 0, y: 5, w: 4, h: 4 } },
        { id: "q_8", title: "Bookings by Rep",       type: "COLUMN", filters: {}, xField: "ownerName",     yMetric: "bookings",        position: { x: 4, y: 5, w: 4, h: 4 } },
        { id: "q_9", title: "All Quarter Deals",     type: "TABLE",  filters: {}, xField: "dealName",      yMetric: "bookings",        position: { x: 8, y: 5, w: 4, h: 4 } },
      ],
    },
    executive: {
      title: "Executive Summary",
      description: "Board-ready KPIs, revenue attainment, forecast rollup, risk overview — read-optimised",
      widgets: [
        { id: "e_1", title: "Total Bookings",        type: "KPI",            filters: {}, xField: "quarter",       yMetric: "bookings",         position: { x: 0,  y: 0, w: 3, h: 2 } },
        { id: "e_2", title: "Target Attainment",     type: "KPI",            filters: {}, xField: "quarter",       yMetric: "targetAttainment", position: { x: 3,  y: 0, w: 3, h: 2 } },
        { id: "e_3", title: "Win Rate",              type: "KPI",            filters: {}, xField: "ownerName",     yMetric: "winRate",          position: { x: 6,  y: 0, w: 3, h: 2 } },
        { id: "e_4", title: "Open Pipeline",         type: "KPI",            filters: {}, xField: "stage",         yMetric: "pipelineValue",    position: { x: 9,  y: 0, w: 3, h: 2 } },
        { id: "e_5", title: "Attainment by Quarter", type: "ATTAINMENT_TREND",filters:{}, xField: "quarter",       yMetric: "bookings",         position: { x: 0,  y: 2, w: 6, h: 4 } },
        { id: "e_6", title: "Forecast Rollup",       type: "FORECAST",       filters: {}, xField: "stage",         yMetric: "pipelineValue",    position: { x: 6,  y: 2, w: 6, h: 4 } },
        { id: "e_7", title: "Revenue by Account",    type: "BAR",            filters: {}, xField: "accountName",   yMetric: "bookings",         position: { x: 0,  y: 6, w: 6, h: 3 } },
        { id: "e_8", title: "Deal Risk Scorecard",   type: "RISK_SCORECARD", filters: {}, xField: "dealName",      yMetric: "dealCount",        position: { x: 6,  y: 6, w: 6, h: 4 } },
        { id: "e_9", title: "Pipeline by Stage",     type: "FUNNEL",         filters: {}, xField: "pipelineStage", yMetric: "pipelineValue",    position: { x: 0,  y: 9, w: 5, h: 4 } },
        { id: "e_10",title: "Top Deals",             type: "TABLE",          filters: {}, xField: "dealName",      yMetric: "bookings",         position: { x: 5,  y: 9, w: 7, h: 4 } },
      ],
    },
    analytics: {
      title: "Advanced Analytics Dashboard",
      description: "Performance table, attainment trend, forecast rollup, QoQ trends, deal changes",
      widgets: [
        { id: "a_1", title: "Rep Performance",         type: "PERFORMANCE",      filters: {}, xField: "ownerName",  yMetric: "bookings",        position: { x: 0, y: 0, w: 6, h: 4 } },
        { id: "a_2", title: "Attainment by Quarter",   type: "ATTAINMENT_TREND", filters: {}, xField: "quarter",    yMetric: "bookings",        position: { x: 6, y: 0, w: 6, h: 4 } },
        { id: "a_3", title: "Forecast Rollup",         type: "FORECAST",         filters: {}, xField: "stage",      yMetric: "pipelineValue",   position: { x: 0, y: 4, w: 4, h: 3 } },
        { id: "a_4", title: "QoQ Trends",              type: "TRENDS",           filters: {}, xField: "quarter",    yMetric: "bookings",        position: { x: 4, y: 4, w: 4, h: 3 } },
        { id: "a_5", title: "Deal Changes",            type: "CHANGES",          filters: {}, xField: "stage",      yMetric: "dealCount",       position: { x: 8, y: 4, w: 4, h: 3 } },
      ],
    },
  };

  function loadRepDashboard() {
    const tpl = DASHBOARD_TEMPLATES.rep;
    setTitle(tpl.title);
    setActiveTemplateKey('rep');
    // Templates should never overwrite an existing saved dashboard in-place.
    // Treat template loads as starting a brand-new draft.
    setActiveDashboardId(null);
    setDashboardStatus('draft');
    setDashboardStarred(false);
    setIsReadOnly(false);
    // Use the ref so we always get the current selectedDatasetId even when called
    // from a stale .then() closure (which captures selectedDatasetId = '' from mount).
    const dsId = selectedDatasetIdRef.current || selectedDatasetId;
    setWidgets(tpl.widgets.map((w: any) => ({ ...w, ...(dsId ? { datasetId: dsId } : {}) })));
  }

  function loadTemplate(key: string) {
    const tpl = DASHBOARD_TEMPLATES[key];
    if (!tpl) return;
    setTitle(tpl.title);
    setActiveTemplateKey(key);
    // Templates should never overwrite an existing saved dashboard in-place.
    // Treat template loads as starting a brand-new draft.
    setActiveDashboardId(null);
    setDashboardStatus('draft');
    setDashboardStarred(false);
    setIsReadOnly(false);
    // Stamp the currently selected dataset onto every template widget — same
    // pattern used by loadRepDashboard — so widgets show data immediately.
    const dsId = selectedDatasetIdRef.current || selectedDatasetId;
    setWidgets(tpl.widgets.map(w => ({
      ...w,
      id: `${w.id}_${Date.now()}`,
      ...(dsId ? { datasetId: dsId } : {}),
    })));
    setWorkspaceMessage('✨ Template loaded as a new draft — click "Save draft" to keep it.');
  }


  async function createAccessLink() {
    if (access === 'PRIVATE') {
      setWorkspaceMessage("⚠️ Cannot share a PRIVATE dashboard. Change access to LINK or TEAM in the 🔐 Access menu first.");
      return;
    }
    setWorkspaceMessage("⏳ Saving & generating share link…");
    try {
      // persistDashboard saves the current state AND returns the confirmed ID.
      // We use the returned ID directly — never the stale closure value of
      // activeDashboardId — so this works even on brand-new unsaved dashboards.
      const dashId = await persistDashboard();
      if (!dashId) {
        setWorkspaceMessage("❌ Could not save dashboard before sharing. Please try again.");
        return;
      }
      const res = await fetch('/api/dashboards/share', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ dashboardId: dashId, visibility: access }),
      });
      const data = await res.json();
      if (data.url) {
        setShareUrl(data.url);
        setShareCopied(false);
        setShowShareModal(true);
        setWorkspaceMessage('');
      } else {
        setWorkspaceMessage("❌ Failed to create share link: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      setWorkspaceMessage("❌ Share link error: " + e.message);
    }
  }

  async function revokeShareLink() {
    if (!activeDashboardId) return;
    setShareRevoking(true);
    try {
      const res = await fetch('/api/dashboards/share', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ dashboardId: activeDashboardId }),
      });
      const data = await res.json();
      if (data.success) {
        setShareUrl('');
        setShowShareModal(false);
        setWorkspaceMessage('✅ Share link revoked. The previous link is now invalid.');
        setTimeout(() => setWorkspaceMessage(''), 4000);
      } else {
        setWorkspaceMessage("❌ Revoke failed: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      setWorkspaceMessage("❌ Revoke error: " + e.message);
    } finally {
      setShareRevoking(false);
    }
  }

  // isLocked: published dashboards cannot be edited; shared dashboards (readOnly=true)
  // belong to another user and are also locked — edits must be done by the owner.
  const isLocked = dashboardStatus === 'published' || isReadOnly;

  // HTML5 Drag and Drop Handlers
  const handleLibDragStart = (e: React.DragEvent, type: string) => {
    if (isLocked) { e.preventDefault(); return; }
    e.dataTransfer.setData("text/plain", `lib:${type}`);
    dragPayloadRef.current = { type };
  };

  const handleWidgetDragStart = (e: React.DragEvent, widgetId: string) => {
    if (isLocked) { e.preventDefault(); return; }
    e.dataTransfer.setData("text/plain", `widget:${widgetId}`);
    dragPayloadRef.current = { type: "widget", widgetId };
  };

  async function openDrilldownFromWidget(widget: any, label: string) {
    const datasetId = widget.datasetId || selectedDatasetIdRef.current || selectedDatasetId;
    if (!datasetId) {
      setDrilldown({ title: `${widget.title} — ${label}`, rows: [] });
      return;
    }
    const dataset = datasets.find((d: any) => d.id === datasetId);
    const src = dataset ? resolveDataSource(dataset) : 'mock';

    const activeFilters = {
      timeRange,
      customer: widget.filters?.customer && widget.filters.customer !== "All Customers" ? widget.filters.customer : customer,
      team:     widget.filters?.team     && widget.filters.team     !== "All Teams"     ? widget.filters.team     : team,
      metricFilter: widget.filters?.metricFilter && widget.filters.metricFilter !== "ALL" ? widget.filters.metricFilter : metricFilter,
    };

    setDrilldownLoading(true);
    try {
      const reqUrl = new URL('/api/dashboards/drilldown', window.location.origin);
      reqUrl.searchParams.set('source', src);
      reqUrl.searchParams.set('datasetId', datasetId);
      reqUrl.searchParams.set('xField', widget.xField);
      reqUrl.searchParams.set('label', label);
      reqUrl.searchParams.set('timeRange', activeFilters.timeRange);
      reqUrl.searchParams.set('customer', activeFilters.customer);
      reqUrl.searchParams.set('team', activeFilters.team);
      reqUrl.searchParams.set('metricFilter', activeFilters.metricFilter);
      reqUrl.searchParams.set('page', '1');
      reqUrl.searchParams.set('limit', '120');

      const res = await fetch(reqUrl.toString());
      const data = await res.json();
      if (res.ok && Array.isArray(data?.rows)) {
        setDrilldown({ title: `${widget.title} — ${label}`, rows: data.rows });
      }
    } catch {
      // fall back to client-side drilldown
    } finally {
      setDrilldownLoading(false);
    }
  }

  /** Convert a mouse position over the canvas to the nearest snapped grid col/row.
   *  Uses canvasRef instead of e.currentTarget — React nullifies currentTarget when
   *  a drop lands on a child element (widget card) rather than the canvas background. */
  function snapToGrid(
    e: React.DragEvent,
    w: number,
    h: number,
  ): { col: number; row: number } {
    const el = canvasRef.current ?? (e.currentTarget as HTMLDivElement | null);
    if (!el) return { col: 0, row: 0 };

    const rect = el.getBoundingClientRect();
    const padding = 16;
    const gapSize = 16;
    const cols = 12;
    const rowHeightPx = 120 + gapSize; // grid-auto-rows: 120px + gap: 16px
    const colWidthPx = (rect.width - padding * 2 - gapSize * (cols - 1)) / cols + gapSize;

    const relX = e.clientX - rect.left - padding;
    const relY = e.clientY - rect.top  - padding;

    const col = Math.max(0, Math.min(cols - w, Math.round(relX / colWidthPx)));
    const row = Math.max(0, Math.round(relY / rowHeightPx));
    return { col, row };
  }

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Use ref (not dataTransfer.getData — blocked by browsers during dragover)
    const payload = dragPayloadRef.current;
    let w = 4, h = 3;
    if (payload) {
      if (payload.type !== "widget") {
        ({ w, h } = getWidgetSize(payload.type));
      } else if (payload.widgetId) {
        const wgt = widgets.find((x) => x.id === payload.widgetId);
        if (wgt?.position) { w = wgt.position.w; h = wgt.position.h; }
      }
    }
    const { col, row } = snapToGrid(e, w, h);
    setDropIndicator({ x: col, y: row, w, h });
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    // Only clear if we truly left the canvas (not just a child element)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropIndicator(null);
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropIndicator(null);
    dragPayloadRef.current = null;
    if (isLocked) return;
    const dataStr = e.dataTransfer.getData("text/plain");
    if (!dataStr) return;

    if (dataStr.startsWith("lib:")) {
      const type = dataStr.substring(4) as any;
      const seed = createWidgetSeed(type);
      const { w, h } = getWidgetSize(type);
      const { col, row } = snapToGrid(e, w, h);
      const desiredPos = { x: col, y: row };
      const hasCollision = widgets.some((wgt) => {
        const p = wgt.position || { x: 0, y: 0, w: 4, h: 3 };
        return desiredPos.x < p.x + p.w && desiredPos.x + w > p.x &&
               desiredPos.y < p.y + p.h && desiredPos.y + h > p.y;
      });
      // If the exact cell is free use it; otherwise find nearest open slot
      const finalPos = hasCollision ? findFreePosition(widgets, w, h) : desiredPos;
      const newWidget = { ...seed, datasetId: selectedDatasetId, position: { x: finalPos.x, y: finalPos.y, w, h } };
      setWidgets((current) => [...current, newWidget]);
      setSelectedWidgetId(newWidget.id);

    } else if (dataStr.startsWith("widget:")) {
      const widgetId = dataStr.substring(7);
      setWidgets((current) =>
        current.map((wgt) => {
          if (wgt.id !== widgetId) return wgt;
          const width  = wgt.position?.w || 4;
          const height = wgt.position?.h || 3;
          const { col, row } = snapToGrid(e, width, height);
          const desiredPos = { x: col, y: row };
          const hasCollision = current.some((other) => {
            if (other.id === widgetId) return false;
            const p = other.position || { x: 0, y: 0, w: 4, h: 3 };
            return desiredPos.x < p.x + p.w && desiredPos.x + width  > p.x &&
                   desiredPos.y < p.y + p.h && desiredPos.y + height > p.y;
          });
          const finalPos = hasCollision
            ? findFreePosition(current, width, height, widgetId)
            : desiredPos;
          return { ...wgt, position: { x: finalPos.x, y: finalPos.y, w: width, h: height } };
        })
      );
    }
  };

  return (
    <main className="shell shell-wide grid">
      <style suppressHydrationWarning>{`
        body, .shell {
          background-color: #ffffff !important;
        }
        .relative-grid {
          position: relative;
          display: grid !important;
          grid-template-columns: repeat(12, 1fr) !important;
          grid-auto-rows: 120px !important;
          gap: 16px !important;
          min-height: 540px;
          border-radius: 20px;
          padding: 16px;
          /* Panel-gap color — widgets are white, gap is the grid line */
          background: #e8edf4;
          border: 1px solid #d1d9e6;
        }
        /* Ghost cell shown for every unoccupied panel slot */
        .ghost-cell {
          border-radius: 10px;
          background: #f4f6fb;
          border: 1.5px dashed #c8d0de;
          pointer-events: none;
          z-index: 0;
          transition: background 0.15s;
        }
        /* Drop-indicator: highlighted cell showing where the widget will land */
        .drop-indicator {
          border-radius: 10px;
          background: rgba(20, 184, 166, 0.12) !important;
          border: 2px dashed #14b8a6 !important;
          pointer-events: none;
          z-index: 5;
        }
        .relative-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          min-height: unset !important;
          padding: 12px !important;
          background: #ffffff !important;
          border-radius: 12px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
          border: 1px solid #e8edf4;
          transition: box-shadow 0.2s ease;
          z-index: 1;
        }
        .relative-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.10);
        }
        .selected-widget {
          border: 2px solid var(--accent) !important;
          box-shadow: 0 6px 20px rgba(15, 118, 110, 0.18) !important;
        }
        .widget-drag-handle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          background: #f7f6f2;
          border-radius: 8px;
          cursor: move;
          margin-bottom: 8px;
          font-size: 0.8rem;
          user-select: none;
        }
        .grip-icon {
          color: #9ca3af;
          font-weight: bold;
          font-size: 1.1rem;
        }
        .widget-header-title {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .widget-header-badge {
          background: #e3f3ef;
          color: var(--accent);
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 999px;
        }
        .widget-content-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 0;
          overflow: hidden;
        }
        .library-draggable {
          cursor: grab;
          transition: transform 0.2s;
        }
        .library-draggable:active {
          cursor: grabbing;
          transform: scale(0.96);
        }
        .visualizations-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          background: #181818;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #2e2e2e;
          margin-top: 10px;
        }
        .vis-icon-btn {
          background: #252525;
          border: 1px solid #333;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: grab;
          padding: 8px 4px;
          transition: all 0.2s ease;
          user-select: none;
        }
        .vis-icon-btn:hover {
          background: #333;
          border-color: #f59e0b;
          transform: translateY(-2px);
        }
        .vis-icon-btn:active {
          cursor: grabbing;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .save-toast {
          position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
          z-index: 9999; padding: 12px 24px; border-radius: 12px;
          font-size: 0.88rem; font-weight: 600; box-shadow: 0 4px 20px rgba(0,0,0,0.18);
          animation: slideInUp 0.25s ease; white-space: nowrap;
        }
        .save-toast.success { background: #16a34a; color: #fff; }
        .save-toast.error   { background: #dc2626; color: #fff; }
      `}</style>

      {/* Floating save toast */}
      {saveToast && (
        <div className={`save-toast ${saveToast.type}`}>{saveToast.message}</div>
      )}

      <section className="hero">
        {/* Title row with star + status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <p style={{ margin: 0 }}>Revenue Dashboard</p>
          {/* Star button — feature #23 */}
          <button
            type="button"
            onClick={async () => {
              const next = !dashboardStarred;
              setDashboardStarred(next);
              if (activeDashboardId) {
                // Use PATCH — no need to re-send the full widget array just to toggle a star
                const r = await fetch('/api/dashboards', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ dashboardId: activeDashboardId, starred: next }),
                });
                const d = await r.json();
                if (d.dashboards) setSavedDashboardsList(d.dashboards);
              }
            }}
            title={dashboardStarred ? 'Unpin dashboard' : 'Pin / Star this dashboard'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: '0 2px', color: dashboardStarred ? '#f59e0b' : '#cbd5e1', transition: 'color 0.2s' }}
          >
            {dashboardStarred ? '⭐' : '☆'}
          </button>
          {dashboardStarred && (
            <span style={{ fontSize: '0.7rem', background: '#fef9c3', color: '#ca8a04', padding: '2px 8px', borderRadius: 999, fontWeight: 600, border: '1px solid #fde68a' }}>
              Pinned
            </span>
          )}
        </div>
        <h1>Create a widget-based dashboard from a saved dataset</h1>
        <p>
          Drag components from the library and arrange widgets dynamically on a 12-column workspace canvas, then export that dashboard offline or share it.
        </p>
        <div className="actions" style={{ flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <Link href="/datasets" className="secondary">Create Dataset First</Link>
          {/* Data Studio toggle — feature #21 */}
          <button
            type="button"
            className="secondary"
            onClick={() => setShowDataStudio(v => !v)}
            style={{ fontSize: '13px', background: showDataStudio ? '#e3f3ef' : undefined, color: showDataStudio ? 'var(--accent)' : undefined }}
          >
            🗂 Data Studio {showDataStudio ? '▲' : '▼'}
          </button>
          {/* Executive mode toggle — feature #30 — only shown to EXECUTIVE/ADMIN */}
          {(userRole === 'EXECUTIVE' || userRole === 'ADMIN') && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                if (!execMode) {
                  // Fetch exec metrics when opening
                  fetch('/api/executive/metrics')
                    .then(r => r.json())
                    .then(data => setExecMetrics(data))
                    .catch(() => {});
                }
                setExecMode(v => !v);
              }}
              style={{ fontSize: '13px', background: execMode ? '#1e1b4b' : undefined, color: execMode ? '#a78bfa' : undefined, borderColor: execMode ? '#6d28d9' : undefined }}
            >
              📊 Exec View {execMode ? '▲' : '▼'}
            </button>
          )}
          {/* Refresh button — feature #28 */}
          <button
            type="button"
            className="secondary"
            onClick={refreshData}
            disabled={isRefreshing}
            style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <span style={{ display: 'inline-block', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          {/* Auto-refresh selector — feature #28 */}
          <select
            value={autoRefreshInterval}
            onChange={e => setAutoRefreshInterval(Number(e.target.value))}
            style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}
            title="Auto-refresh interval"
          >
            <option value={0}>Manual</option>
            <option value={5}>5 min</option>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={60}>60 min</option>
          </select>
          {/* Last-refreshed indicator — feature #28 */}
          {timeAgo && (
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', alignSelf: 'center' }}>
              Last synced: <strong style={{ color: '#64748b' }}>{timeAgo}</strong>
            </span>
          )}
          {/* Stale data warning — feature #28 */}
          {lastRefreshed && (Date.now() - lastRefreshed.getTime()) > 30 * 60 * 1000 && (
            <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>⚠️ Data may be stale</span>
          )}
          {/* Rescore Deals — feature #2 */}
          <button
            type="button"
            className="secondary"
            onClick={async () => {
              setWorkspaceMessage('⏳ Rescoring deals…');
              try {
                const res = await fetch('/api/deals/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
                const data = await res.json();
                if (data.success) {
                  setWorkspaceMessage(`✅ Rescored ${data.updated} deals. Refreshing…`);
                  await refreshData();
                } else {
                  setWorkspaceMessage('❌ Rescore failed: ' + (data.error || 'Unknown error'));
                }
              } catch (e: any) {
                setWorkspaceMessage('❌ Rescore error: ' + e.message);
              }
            }}
            style={{ fontSize: '13px' }}
            title="Recompute confidence scores for all deals"
          >
            🎯 Rescore Deals
          </button>
          {/* Role selector — feature #5 */}
          <select
            value={userRole}
            onChange={e => {
              const role = e.target.value;
              setUserRole(role);
              document.cookie = `x-user-role=${role}; path=/`;
            }}
            style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}
            title="Your role"
          >
            <option value="SALES_REP">Sales Rep</option>
            <option value="MANAGER">Manager</option>
            <option value="ANALYST">Analyst</option>
            <option value="EXECUTIVE">Executive</option>
            <option value="ADMIN">Admin</option>
          </select>
          {Object.entries(DASHBOARD_TEMPLATES).map(([key, tpl]) => (
            <button key={key} type="button" className="secondary" onClick={() => loadTemplate(key)}
              title={tpl.description}
              style={{ fontSize: '13px' }}>
              {key === 'rep' ? '👤' : key === 'performance' ? '🏆' : key === 'pipeline' ? '📊' : key === 'executive' ? '🎯' : key === 'analytics' ? '🔬' : '📋'} {tpl.title.split('—')[0].trim()}
            </button>
          ))}
        </div>

        {/* ── Data Studio Panel — fully functional (#21) ───────────────────── */}
        {showDataStudio && (
          <div style={{ marginTop: 16, background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>🗂 Governed Metrics Library</h3>
              <button type="button" onClick={() => setShowNewMetric(v => !v)}
                style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                {showNewMetric ? '✕ Cancel' : '+ Custom Metric'}
              </button>
            </div>

            {/* Custom metric builder */}
            {showNewMetric && (
              <div style={{ background: '#1e293b', border: '1px solid #0f766e', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <p style={{ color: '#14b8a6', fontWeight: 700, fontSize: '0.8rem', margin: '0 0 10px' }}>New Custom Metric</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                    Name
                    <input value={newMetricForm.name} onChange={e => setNewMetricForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Avg Deal Size"
                      style={{ display: 'block', width: '100%', marginTop: 3, padding: '4px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: '0.8rem' }} />
                  </label>
                  <label style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                    Description (optional)
                    <input value={newMetricForm.description} onChange={e => setNewMetricForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="e.g. Average booked value per deal"
                      style={{ display: 'block', width: '100%', marginTop: 3, padding: '4px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: '0.8rem' }} />
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                  <span>Formula:</span>
                  {(['metricA', 'metricB'] as const).map((field, idx) => (
                    <>
                      {idx === 1 && (
                        <select value={newMetricForm.op} onChange={e => setNewMetricForm(p => ({ ...p, op: e.target.value }))}
                          style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: '0.8rem' }}>
                          {['÷','×','+','-'].map(o => <option key={o}>{o}</option>)}
                        </select>
                      )}
                      <select key={field} value={newMetricForm[field]} onChange={e => setNewMetricForm(p => ({ ...p, [field]: e.target.value }))}
                        style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: '0.8rem' }}>
                        {Object.keys(localMetrics).filter(id => !localMetrics[id]?.isCustom).map(id => (
                          <option key={id} value={id}>{localMetrics[id]?.name ?? id}</option>
                        ))}
                      </select>
                    </>
                  ))}
                  <button type="button" onClick={addCustomMetric}
                    disabled={!newMetricForm.name.trim()}
                    style={{ marginLeft: 'auto', background: newMetricForm.name.trim() ? '#16a34a' : '#334155', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: newMetricForm.name.trim() ? 'pointer' : 'default' }}>
                    Add Metric
                  </button>
                </div>
                <p style={{ color: '#475569', fontSize: '0.65rem', margin: '8px 0 0', fontStyle: 'italic' }}>
                  Preview: {newMetricForm.name || 'New Metric'} = {localMetrics[newMetricForm.metricA]?.shortName ?? newMetricForm.metricA} {newMetricForm.op} {localMetrics[newMetricForm.metricB]?.shortName ?? newMetricForm.metricB}
                </p>
              </div>
            )}

            {/* Metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {Object.values(localMetrics).map((m: any) => {
                const usedBy: any[] = metricUsage.get(m.id) ?? [];
                const isHighlighted = highlightedMetric === m.id;
                const isEditing     = editingMetricId === m.id;
                const isExpanded    = expandedUsage.has(m.id);

                return (
                  <div key={m.id} style={{
                    background: '#1e293b', borderRadius: 10, padding: '12px 14px',
                    border: isHighlighted ? '2px solid #f59e0b' : '1px solid #334155',
                    boxShadow: isHighlighted ? '0 0 0 3px rgba(245,158,11,0.2)' : 'none',
                    transition: 'border 0.2s, box-shadow 0.2s',
                  }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editingMetricName}
                          onChange={e => setEditingMetricName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitMetricRename(m.id, editingMetricName);
                            if (e.key === 'Escape') setEditingMetricId(null);
                          }}
                          style={{ flex: 1, padding: '2px 6px', borderRadius: 4, border: '1px solid #0f766e', background: '#0f172a', color: '#f1f5f9', fontSize: '0.82rem', fontWeight: 700 }}
                        />
                      ) : (
                        <span style={{ flex: 1, fontWeight: 700, color: '#f1f5f9', fontSize: '0.82rem' }}>{m.name}</span>
                      )}
                      <span style={{ fontSize: '0.6rem', background: m.isCustom ? '#7c3aed33' : '#0f766e33', color: m.isCustom ? '#a78bfa' : '#14b8a6', padding: '1px 5px', borderRadius: 4, fontWeight: 600, flexShrink: 0 }}>
                        {m.isCustom ? 'custom' : m.format}
                      </span>
                      {/* Highlight toggle */}
                      <button type="button" title="Highlight widgets using this metric"
                        onClick={() => setHighlightedMetric(isHighlighted ? null : m.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: isHighlighted ? '#f59e0b' : '#475569', padding: 2 }}>🎯</button>
                      {/* Edit / save rename */}
                      {isEditing ? (
                        <button type="button" onClick={() => commitMetricRename(m.id, editingMetricName)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#16a34a', padding: 2 }}>✓</button>
                      ) : (
                        <button type="button" title="Rename metric (cascades to widget titles)"
                          onClick={() => { setEditingMetricId(m.id); setEditingMetricName(m.name); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#475569', padding: 2 }}>✏️</button>
                      )}
                      {/* Delete custom metric */}
                      {m.isCustom && (
                        <button type="button" onClick={() => setLocalMetrics(prev => { const n = { ...prev }; delete n[m.id]; persistMetrics(n); return n; })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#ef4444', padding: 2 }}>🗑</button>
                      )}
                    </div>

                    <p style={{ color: '#94a3b8', fontSize: '0.7rem', margin: '0 0 5px', lineHeight: 1.4 }}>{m.description}</p>
                    {m.isCustom && m.formula && (
                      <p style={{ color: '#7c3aed', fontSize: '0.65rem', margin: '0 0 5px', fontFamily: 'monospace', background: '#1e1b4b', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                        {localMetrics[m.formula.metricA]?.shortName ?? m.formula.metricA} {m.formula.op} {localMetrics[m.formula.metricB]?.shortName ?? m.formula.metricB}
                      </p>
                    )}
                    {m.hint && !m.isCustom && <p style={{ color: '#475569', fontSize: '0.63rem', margin: '0 0 5px', fontStyle: 'italic' }}>{m.hint}</p>}

                    {/* Usage row */}
                    <button type="button"
                      onClick={() => setExpandedUsage(prev => {
                        const n = new Set(prev);
                        isExpanded ? n.delete(m.id) : n.add(m.id);
                        return n;
                      })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.68rem', color: usedBy.length > 0 ? '#14b8a6' : '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ background: usedBy.length > 0 ? '#0f766e44' : '#33415544', color: usedBy.length > 0 ? '#14b8a6' : '#64748b', borderRadius: 999, padding: '1px 6px', fontWeight: 700, fontSize: '0.65rem' }}>{usedBy.length}</span>
                      {usedBy.length === 1 ? '1 widget' : `${usedBy.length} widgets`} {usedBy.length > 0 ? (isExpanded ? '▲' : '▼') : ''}
                    </button>

                    {isExpanded && usedBy.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {usedBy.map((w: any) => (
                          <button key={w.id} type="button"
                            onClick={() => { setSelectedWidgetId(w.id); setShowDataStudio(false); }}
                            style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 4, padding: '3px 8px', fontSize: '0.7rem', color: '#94a3b8', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ color: '#475569' }}>→</span> {w.title}
                            <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: '#475569' }}>{w.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {highlightedMetric && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef9c322', border: '1px solid #f59e0b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                  🎯 Highlighting widgets using: <strong>{localMetrics[highlightedMetric]?.name}</strong>
                </span>
                <button type="button" onClick={() => setHighlightedMetric(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700 }}>Clear</button>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="builder-layout">
        <div className="card stack">
          <div className="section-head">
            <h2>Create Dashboard</h2>
            <span style={{
              background: dashboardStatus === 'published' ? '#dcfce7' : '#fef9c3',
              color:      dashboardStatus === 'published' ? '#16a34a' : '#ca8a04',
              fontWeight: 700, fontSize: '0.7rem', padding: '3px 10px', borderRadius: 999, border: `1px solid ${dashboardStatus === 'published' ? '#86efac' : '#fde68a'}`
            }}>
              {dashboardStatus === 'published' ? '🚀 PUBLISHED' : '✏️ DRAFT'}
            </span>
          </div>
          {isReadOnly && (
            <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: 8, padding: '8px 12px', fontSize: '0.76rem', color: '#0369a1' }}>
              👁 This dashboard was shared with you — it is <strong>view only</strong>. Use <strong>Duplicate</strong> to create your own editable copy.
            </div>
          )}
          {dashboardStatus === 'published' && !isReadOnly && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '8px 12px', fontSize: '0.76rem', color: '#15803d' }}>
              🔒 Dashboard is published — editing is locked. Click "Revert to Draft" to make changes.
            </div>
          )}
          <label className="field">
            <span>Dataset</span>
            <select
              value={selectedDatasetId}
              onChange={(event) => {
                const next = event.target.value;
                selectedDatasetIdRef.current = next;
                setSelectedDatasetId(next);
              }}
            >
              <option value="">Select saved dataset</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Dashboard title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="field">
            <span>Access based control</span>
            <select value={access} onChange={(event) => setAccess(event.target.value as DashboardDefinition["access"])}>
              <option value="PRIVATE">PRIVATE</option>
              <option value="TEAM">TEAM</option>
              <option value="LINK">LINK</option>
            </select>
          </label>
          <label className="field">
            <span>🎯 Revenue Target ($)</span>
            <input
              type="number"
              min="1000"
              max="10000000"
              step="10000"
              value={dashboardTarget}
              onChange={e => {
                const val = Number(e.target.value) || 0;
                setDashboardTarget(val || 150000);
                if (val > 0 && val < 1000)      setTargetConfigWarning('⚠ Target seems too low — minimum $1,000 recommended.');
                else if (val > 10_000_000)       setTargetConfigWarning('⚠ Target exceeds $10 M — is this intentional?');
                else                             setTargetConfigWarning('');
              }}
              placeholder="e.g. 150000"
              style={{ borderColor: targetConfigWarning ? '#f59e0b' : undefined }}
            />
          </label>
          {targetConfigWarning && (
            <p style={{ fontSize: '0.72rem', color: '#d97706', margin: '-8px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              {targetConfigWarning}
            </p>
          )}
          <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "-4px 0 0" }}>
            Used for all Target Attainment KPI widgets. Override per-widget in Widget Settings.
            {Object.keys(quarterlyTargets).length > 0 && (
              <span style={{ color: '#0f766e', fontWeight: 600 }}> · Quarterly overrides active.</span>
            )}
          </p>
          {/* ── Advanced Targets: quarterly + per-owner ──────────────────────── */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setShowAdvancedTargets(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: showAdvancedTargets ? '#f0fdf4' : '#f8fafc',
                border: '1px solid', borderColor: showAdvancedTargets ? '#86efac' : '#e2e8f0',
                borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 600, color: showAdvancedTargets ? '#15803d' : '#374151',
              }}
            >
              <span>
                🎯 Advanced Targets
                {(Object.keys(quarterlyTargets).length > 0 || Object.keys(ownerTargets).length > 0) && (
                  <span style={{ marginLeft: 6, background: '#0f766e', color: '#fff', borderRadius: 999, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700 }}>
                    {Object.keys(quarterlyTargets).length + Object.keys(ownerTargets).length} set
                  </span>
                )}
              </span>
              <span>{showAdvancedTargets ? '▲' : '▼'}</span>
            </button>

            {showAdvancedTargets && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* ── Quarterly Targets ── */}
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    📅 Quarterly Targets
                    <span style={{ fontSize: '0.65rem', fontWeight: 400, color: '#64748b' }}>
                      (overrides the dashboard target when that quarter is selected)
                    </span>
                  </p>
                  {(() => {
                    // Build a list of recent + future quarters
                    const now = new Date();
                    const quarters: string[] = [];
                    for (let i = -3; i <= 2; i++) {
                      const totalM = now.getMonth() + i * 3;
                      const y = now.getFullYear() + Math.floor(totalM / 12);
                      const m = ((totalM % 12) + 12) % 12;
                      quarters.push(`Q${Math.ceil((m + 1) / 3)}-${y}`);
                    }
                    // Also include any quarters from data
                    dbDeals.forEach(d => { if (d.quarter && !quarters.includes(d.quarter)) quarters.push(d.quarter); });
                    return Array.from(new Set(quarters)).sort().map(qKey => (
                      <div key={qKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{
                          fontSize: '0.73rem', fontWeight: 600, width: 60, flexShrink: 0,
                          color: quarterlyTargets[qKey] ? '#0f766e' : '#94a3b8',
                        }}>{qKey}</span>
                        <input
                          type="number"
                          min="1000"
                          step="10000"
                          placeholder={`$${Math.round(dashboardTarget / 1000)}k (default)`}
                          value={quarterlyTargets[qKey] ?? ''}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setQuarterlyTargets(prev => {
                              const next = { ...prev };
                              if (val > 0) next[qKey] = val; else delete next[qKey];
                              return next;
                            });
                          }}
                          style={{ flex: 1, fontSize: '0.75rem', padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}
                        />
                        {quarterlyTargets[qKey] && (
                          <button
                            type="button"
                            onClick={() => setQuarterlyTargets(prev => { const n = { ...prev }; delete n[qKey]; return n; })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.75rem', padding: 2 }}
                            title="Clear override"
                          >✕</button>
                        )}
                      </div>
                    ));
                  })()}
                </div>

                {/* ── Per-Owner Quotas ── */}
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    👤 Per-Owner Quotas
                    <span style={{ fontSize: '0.65rem', fontWeight: 400, color: '#64748b' }}>
                      (used in the Performance widget attainment column)
                    </span>
                  </p>
                  {ownersList.filter(o => o !== 'All Owners').map(owner => (
                    <div key={owner} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 500, flex: 1, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: ownerTargets[owner] ? '#0f766e' : '#94a3b8',
                      }} title={owner}>{owner}</span>
                      <input
                        type="number"
                        min="1000"
                        step="5000"
                        placeholder={`$${Math.round(dashboardTarget / 1000)}k (default)`}
                        value={ownerTargets[owner] ?? ''}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setOwnerTargets(prev => {
                            const next = { ...prev };
                            if (val > 0) next[owner] = val; else delete next[owner];
                            return next;
                          });
                        }}
                        style={{ width: 110, fontSize: '0.74rem', padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}
                      />
                      {ownerTargets[owner] && (
                        <button
                          type="button"
                          onClick={() => setOwnerTargets(prev => { const n = { ...prev }; delete n[owner]; return n; })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.75rem', padding: 2 }}
                          title="Clear quota"
                        >✕</button>
                      )}
                    </div>
                  ))}
                  {ownersList.filter(o => o !== 'All Owners').length === 0 && (
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
                      No owners found in current data. Sync deals to populate owners.
                    </p>
                  )}
                </div>

              </div>
            )}
          </div>

          <div className="actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <button type="button" className="primary" onClick={() => persistDashboard()} disabled={isLocked}>Save draft</button>
            {dashboardStatus === 'draft' ? (
              <button type="button" className="primary" onClick={publishDashboard}
                style={{ background: '#16a34a', borderColor: '#16a34a' }}>
                🚀 Publish
              </button>
            ) : (
              <button type="button" className="secondary" onClick={revertToDraft}
                style={{ color: '#ca8a04', borderColor: '#fde68a' }}>
                ↩ Revert to Draft
              </button>
            )}
            {/* New blank dashboard */}
            <button type="button" className="secondary" onClick={newDashboard}
              title="Start a new blank dashboard">
              ✨ New
            </button>
            {/* Duplicate — feature #29 */}
            <button type="button" className="secondary" onClick={duplicateDashboard}
              title="Clone this dashboard (widgets, target, layout) into a new draft">
              📋 Duplicate
            </button>
            {/* Manage Access — feature #29 */}
            <button type="button" className="secondary"
              onClick={() => {
                setShowAccessModal(true);
                // Load existing grants for this dashboard
                if (activeDashboardId) {
                  fetch(`/api/dashboards/access?dashboardId=${activeDashboardId}`)
                    .then(r => r.json())
                    .then(data => { if (Array.isArray(data.grants)) setAccessGrants(data.grants); })
                    .catch(() => {});
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              🔐 Access
              <span style={{
                background: access === 'PRIVATE' ? '#fee2e2' : access === 'TEAM' ? '#dbeafe' : '#dcfce7',
                color:      access === 'PRIVATE' ? '#dc2626' : access === 'TEAM' ? '#2563eb' : '#16a34a',
                borderRadius: 999, padding: '1px 6px', fontSize: '0.65rem', fontWeight: 700,
              }}>{access}</span>
            </button>
            <button type="button" className="secondary" onClick={exportOffline}>Offline save</button>
            <button
              type="button"
              className="secondary"
              onClick={createAccessLink}
              disabled={access === 'PRIVATE'}
              title={access === 'PRIVATE' ? 'Change access to LINK or TEAM first' : 'Generate a shareable link'}
              style={{ opacity: access === 'PRIVATE' ? 0.5 : 1, cursor: access === 'PRIVATE' ? 'not-allowed' : 'pointer' }}
            >
              🔗 Share Link
            </button>
          </div>
          {workspaceMessage ? <div className="success-banner">{workspaceMessage}</div> : null}
        </div>

        <div className="card stack">
          <div className="section-head">
            <h2>Filters</h2>
            <span>Customer metrics included</span>
          </div>
          <label className="field">
            <span>Time range</span>
            <select value={timeRange} onChange={(event) => setTimeRange(event.target.value as "CURRENT_QUARTER" | "LAST_QUARTER" | "ALL_TIME")}>
              {fallbackDashboardConfig.filters.timeRanges.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Customer filter</span>
            <select value={customer} onChange={(event) => setCustomer(event.target.value)}>
              {customersList.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Team filter</span>
            <select value={team} onChange={(event) => setTeam(event.target.value)}>
              {teamsList.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Customer metrics</span>
            <select value={metricFilter} onChange={(event) => setMetricFilter(event.target.value)}>
              {fallbackDashboardConfig.filters.metricFilters.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          {/* ── Confidence Score Filter (Feature 2) ─────────────────────────── */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 4 }}>
            <span style={{ fontWeight: 600, fontSize: '0.78rem', color: '#374151', display: 'block', marginBottom: 6 }}>🎯 Confidence Score</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <label style={{ fontSize: '0.72rem', color: '#64748b', flex: 1 }}>
                Min
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={minConfidence}
                  onChange={e => setMinConfidence(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  style={{ display: 'block', width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.75rem', marginTop: 2 }}
                />
              </label>
              <span style={{ color: '#94a3b8', alignSelf: 'flex-end', marginBottom: 6 }}>–</span>
              <label style={{ fontSize: '0.72rem', color: '#64748b', flex: 1 }}>
                Max
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={maxConfidence}
                  onChange={e => setMaxConfidence(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="100"
                  style={{ display: 'block', width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.75rem', marginTop: 2 }}
                />
              </label>
              <button
                type="button"
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    const params = new URLSearchParams();
                    if (minConfidence !== '') params.set('minConfidence', String(minConfidence));
                    if (maxConfidence !== '') params.set('maxConfidence', String(maxConfidence));
                    const res = await fetch(`/api/dashboards?${params.toString()}`);
                    const data = await res.json();
                    if (data.deals) setDbDeals(data.deals.map((d: any) => ({ ...d, amount: Number(d.amount) })));
                    setLastRefreshed(new Date());
                  } catch {}
                  setIsRefreshing(false);
                }}
                style={{ alignSelf: 'flex-end', padding: '4px 8px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Apply
              </button>
            </div>
            {(minConfidence !== '' || maxConfidence !== '') && (
              <button
                type="button"
                onClick={() => { setMinConfidence(''); setMaxConfidence(''); refreshData(); }}
                style={{ marginTop: 4, fontSize: '0.68rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                ✕ Clear confidence filter
              </button>
            )}
          </div>

          {/* ── Rep / Owner scope (#25) ─────────────────────────────────────── */}
          <div className="section-head" style={{ marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#374151' }}>👤 View Scope</span>
          </div>
          {/* View scope toggle — feature #26 (team hierarchy) */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            {(['all', 'team', 'personal'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setViewScope(s)}
                style={{
                  flex: 1, padding: '4px 6px', borderRadius: 6, border: '1px solid',
                  fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                  background:    viewScope === s ? '#0f766e' : '#f8fafc',
                  color:         viewScope === s ? '#fff'    : '#64748b',
                  borderColor:   viewScope === s ? '#0f766e' : '#e2e8f0',
                }}
              >
                {s === 'all' ? '🏢 Company' : s === 'team' ? '👥 Team' : '🙋 Personal'}
              </button>
            ))}
          </div>
          <label className="field">
            <span>Viewing as owner</span>
            <select value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
              {ownersList.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
          {viewScope !== 'all' && ownerFilter === 'All Owners' && (
            <p style={{ fontSize: '0.7rem', color: '#f59e0b', margin: '-4px 0 0' }}>
              ⚠ Select a specific owner to activate {viewScope} scope
            </p>
          )}
          {viewScope === 'team' && ownerFilter !== 'All Owners' && (() => {
            const definedTeam = teamConfig.find(t => t.members.includes(ownerFilter));
            const teamName = definedTeam?.name ?? dbDeals.find(d => d.ownerName === ownerFilter)?.teamName;
            return teamName ? (
              <p style={{ fontSize: '0.7rem', color: '#14b8a6', margin: '-4px 0 0' }}>
                Showing {teamName} deals only
              </p>
            ) : (
              <p style={{ fontSize: '0.7rem', color: '#f59e0b', margin: '-4px 0 0' }}>
                ⚠ No team found for {ownerFilter}. Use Team Builder below.
              </p>
            );
          })()}

          {/* ── Team Builder (#26) ────────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setShowTeamBuilder(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: showTeamBuilder ? '#f0fdf4' : '#f8fafc',
                border: '1px solid', borderColor: showTeamBuilder ? '#86efac' : '#e2e8f0',
                borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 600, color: showTeamBuilder ? '#15803d' : '#374151',
              }}
            >
              <span>👥 Team Builder {teamConfig.length > 0 ? `(${teamConfig.length} team${teamConfig.length !== 1 ? 's' : ''})` : ''}</span>
              <span>{showTeamBuilder ? '▲' : '▼'}</span>
            </button>

            {showTeamBuilder && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Existing teams — shown in hierarchy order */}
                {teamConfig.length === 0 ? (
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0, padding: '4px 2px' }}>
                    No teams defined yet. Create one below.
                  </p>
                ) : (
                  // Sort teams: parent teams first, then children indented
                  (() => {
                    const sorted: Array<{ team: TeamConfig; depth: number }> = [];
                    const roots = teamConfig.filter(t => !t.parentId);
                    function addTeam(t: TeamConfig, depth: number) {
                      sorted.push({ team: t, depth });
                      teamConfig.filter(c => c.parentId === t.id).forEach(c => addTeam(c, depth + 1));
                    }
                    roots.forEach(t => addTeam(t, 0));
                    // Also add any orphaned teams (parentId set but parent doesn't exist)
                    teamConfig.filter(t => t.parentId && !teamConfig.find(p => p.id === t.parentId)).forEach(t => sorted.push({ team: t, depth: 0 }));
                    return sorted;
                  })().map(({ team, depth }) => (
                    <div key={team.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', marginLeft: depth * 16 }}>
                      {/* Team header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f766e' }}>
                          {depth > 0 ? '– ' : '👥 '}{team.name}
                          {team.parentId && <span style={{ fontSize: '0.62rem', color: '#94a3b8', marginLeft: 4 }}>(sub-team)</span>}
                        </span>
                        <button type="button"
                          onClick={async () => {
                            // Try API delete first
                            try {
                              await fetch(`/api/teams?id=${team.id}`, { method: 'DELETE' });
                            } catch {}
                            setTeamConfig(prev => prev.filter(t => t.id !== team.id));
                          }}
                          title="Delete team"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem', padding: '1px 4px', borderRadius: 4 }}>
                          🗑 Delete
                        </button>
                      </div>
                      {/* Members list */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                        {team.members.length === 0 ? (
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>No members yet</span>
                        ) : (
                          team.members.map(member => (
                            <span key={member} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                              background: '#e0f2fe', color: '#0369a1', borderRadius: 999,
                              padding: '1px 7px', fontSize: '0.68rem', fontWeight: 500,
                            }}>
                              {member}
                              <button type="button"
                                onClick={() => setTeamConfig(prev => prev.map(t =>
                                  t.id === team.id ? { ...t, members: t.members.filter(m => m !== member) } : t
                                ))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0369a1', fontSize: '0.7rem', padding: 0, lineHeight: 1, marginLeft: 1 }}
                                title={`Remove ${member} from team`}>✕</button>
                            </span>
                          ))
                        )}
                      </div>
                      {/* Add member selector */}
                      <div style={{ display: 'flex', gap: 4 }}>
                        <select
                          defaultValue=""
                          onChange={e => {
                            const owner = e.target.value;
                            if (!owner) return;
                            setTeamConfig(prev => prev.map(t =>
                              t.id === team.id && !t.members.includes(owner)
                                ? { ...t, members: [...t.members, owner] }
                                : t
                            ));
                            e.target.value = '';
                          }}
                          style={{ flex: 1, fontSize: '0.72rem', padding: '3px 6px', borderRadius: 6, border: '1px solid #d1d5db' }}>
                          <option value="">+ Add member…</option>
                          {ownersList.filter(o => o !== 'All Owners' && !team.members.includes(o)).map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}

                {/* New team form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    placeholder="New team name…"
                    style={{ fontSize: '0.76rem', padding: '5px 8px', borderRadius: 7, border: '1px solid #d1d5db' }}
                  />
                  {/* Parent Team selector */}
                  <select
                    value={newTeamParentId}
                    onChange={e => setNewTeamParentId(e.target.value)}
                    style={{ fontSize: '0.72rem', padding: '4px 6px', borderRadius: 6, border: '1px solid #d1d5db' }}
                  >
                    <option value="">No parent (top-level)</option>
                    {teamConfig.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button type="button"
                    disabled={!newTeamName.trim()}
                    onClick={async () => {
                      if (!newTeamName.trim()) return;
                      const newTeam: TeamConfig = { id: `team_${Date.now()}`, name: newTeamName.trim(), members: [], parentId: newTeamParentId || undefined };
                      // Try API first
                      try {
                        const res = await fetch('/api/teams', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name: newTeam.name, parentId: newTeam.parentId || null, members: [] }),
                        });
                        const data = await res.json();
                        if (data.success && data.team) {
                          setTeamConfig(prev => [...prev, { id: data.team.id, name: data.team.name, members: data.team.members ?? [], parentId: data.team.parentId ?? undefined }]);
                          setNewTeamName(''); setNewTeamParentId('');
                          return;
                        }
                      } catch {}
                      // Fallback to local
                      setTeamConfig(prev => [...prev, newTeam]);
                      setNewTeamName(''); setNewTeamParentId('');
                    }}
                    style={{
                      background: newTeamName.trim() ? '#0f766e' : '#e2e8f0',
                      color: newTeamName.trim() ? '#fff' : '#94a3b8',
                      border: 'none', borderRadius: 7, padding: '5px 10px',
                      fontSize: '0.75rem', fontWeight: 700, cursor: newTeamName.trim() ? 'pointer' : 'default',
                    }}>
                    + Create Team
                  </button>
                </div>
                <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0 }}>
                  Teams are saved to the API. Switch to 👥 Team scope and pick an owner to filter by their team.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-builder-shell">
        <aside className="dashboard-sidebar">
          <div className="card stack" style={{ background: "#202020", color: "#f3f4f6", border: "1px solid #333" }}>
            <div className="section-head" style={{ borderBottom: "1px solid #333", paddingBottom: "10px" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: "#e5e7eb", margin: 0 }}>
                Visualizations
              </h2>
              <span style={{ background: "#f59e0b", color: "#000", fontWeight: "bold", fontSize: "0.65rem", borderRadius: "4px", padding: "2px 6px" }}>
                Power BI
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "4px 0" }}>
              Drag an icon shape onto the canvas grid:
            </p>
            
            {/* Widget category legend */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
              {[
                { label: 'KPI', color: '#f59e0b' },
                { label: 'Chart', color: '#14b8a6' },
                { label: 'Table', color: '#3b82f6' },
                { label: 'Special', color: '#a855f7' },
              ].map(c => (
                <span key={c.label} style={{ fontSize: '0.6rem', background: c.color + '22', color: c.color, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{c.label}</span>
              ))}
            </div>

            <div className="visualizations-grid">
              {fallbackDashboardConfig.availableChartTypes.map((type) => {
                let svgIcon = null;
                let displayName: string = type;

                if (type === "KPI") {
                  displayName = "KPI Card";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="3" width="20" height="18" rx="2" fill="#2d2d2d" stroke="#f59e0b" strokeWidth="1.5"/>
                      <text x="12" y="15" fill="#14b8a6" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">123</text>
                    </svg>
                  );
                } else if (type === "BAR") {
                  displayName = "Bar Chart";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="4" width="16" height="4" fill="#f59e0b" rx="1"/>
                      <rect x="2" y="10" width="20" height="4" fill="#14b8a6" rx="1"/>
                      <rect x="2" y="16" width="12" height="4" fill="#3b82f6" rx="1"/>
                    </svg>
                  );
                } else if (type === "LINE") {
                  displayName = "Line Chart";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 18L9 12L15 15L21 6" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="3" cy="18" r="2" fill="#f59e0b"/>
                      <circle cx="9" cy="12" r="2" fill="#f59e0b"/>
                      <circle cx="15" cy="15" r="2" fill="#f59e0b"/>
                      <circle cx="21" cy="6" r="2" fill="#f59e0b"/>
                    </svg>
                  );
                } else if (type === "PIE") {
                  displayName = "Pie Chart";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="9" stroke="#3b82f6" strokeWidth="2"/>
                      <path d="M12 3C16.9706 3 21 7.02944 21 12H12V3Z" fill="#f59e0b"/>
                      <path d="M12 12V21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3V12Z" fill="#14b8a6"/>
                    </svg>
                  );
                } else if (type === "DONUT") {
                  displayName = "Donut Chart";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6Z" fill="#14b8a6"/>
                      <path d="M12 2C17.5228 2 22 6.47715 22 12H18C18 8.68629 15.3137 6 12 6V2Z" fill="#f59e0b"/>
                    </svg>
                  );
                } else if (type === "FUNNEL") {
                  displayName = "Funnel Chart";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 4C2 3.44772 2.44772 3 3 3H21C21.5523 3 22 3.44772 22 4V6C22 6.34094 21.8268 6.65773 21.536 6.83984L14 11.5498V19C14 19.3308 13.836 19.64 13.56 19.824L11.56 21.1573C11.0827 21.4756 10.44 21.1345 10.44 20.5638V11.5498L2.46397 6.83984C2.17322 6.65773 2 6.34094 2 6V4Z" fill="#f59e0b"/>
                    </svg>
                  );
                } else if (type === "COLUMN") {
                  displayName = "Column Chart";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="10" width="4" height="10" fill="#f59e0b" rx="1"/>
                      <rect x="10" y="4" width="4" height="16" fill="#14b8a6" rx="1"/>
                      <rect x="16" y="14" width="4" height="6" fill="#3b82f6" rx="1"/>
                    </svg>
                  );
                } else if (type === "AREA") {
                  displayName = "Area Chart";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 20L9 12L15 15L21 6V20H3Z" fill="#14b8a6" opacity="0.6"/>
                      <path d="M3 20L9 12L15 15L21 6" stroke="#14b8a6" strokeWidth="2"/>
                    </svg>
                  );
                } else if (type === "SCATTER") {
                  displayName = "Scatter Plot";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="6" cy="16" r="2" fill="#f59e0b"/>
                      <circle cx="10" cy="8" r="2" fill="#14b8a6"/>
                      <circle cx="14" cy="14" r="2" fill="#3b82f6"/>
                      <circle cx="18" cy="6" r="2" fill="#f59e0b"/>
                    </svg>
                  );
                } else if (type === "WATERFALL") {
                  displayName = "Waterfall";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="14" width="4" height="6" fill="#14b8a6"/>
                      <rect x="10" y="8" width="4" height="6" fill="#14b8a6"/>
                      <rect x="16" y="4" width="4" height="16" fill="#f59e0b"/>
                    </svg>
                  );
                } else if (type === "TREEMAP") {
                  displayName = "Treemap";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="10" height="18" fill="#14b8a6" rx="1"/>
                      <rect x="14" y="3" width="7" height="10" fill="#f59e0b" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" fill="#3b82f6" rx="1"/>
                    </svg>
                  );
                } else if (type === "MAP") {
                  displayName = "Map";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="9" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="3 3"/>
                      <circle cx="12" cy="12" r="3" fill="#f59e0b"/>
                      <circle cx="8" cy="8" r="2" fill="#14b8a6"/>
                      <circle cx="16" cy="16" r="2" fill="#3b82f6"/>
                    </svg>
                  );
                } else if (type === "GAUGE") {
                  displayName = "Gauge";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 16C4 11.5817 7.58172 8 12 8C16.4183 8 20 11.5817 20 16" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"/>
                      <path d="M12 16L15 11" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="16" r="2" fill="#14b8a6"/>
                    </svg>
                  );
                } else if (type === "TABLE") {
                  displayName = "Table";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="4" width="18" height="4" fill="#3d3d3d" rx="1"/>
                      <rect x="3" y="10" width="18" height="3" fill="#9ca3af" rx="0.5"/>
                      <rect x="3" y="15" width="18" height="3" fill="#9ca3af" rx="0.5"/>
                    </svg>
                  );
                } else if (type === "MATRIX") {
                  displayName = "Matrix";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="8" height="8" fill="#14b8a6" rx="1"/>
                      <rect x="13" y="3" width="8" height="8" fill="#3b82f6" rx="1"/>
                      <rect x="3" y="13" width="8" height="8" fill="#f59e0b" rx="1"/>
                      <rect x="13" y="13" width="8" height="8" fill="#9ca3af" rx="1"/>
                    </svg>
                  );
                } else if (type === "PERFORMANCE") {
                  displayName = "Performance";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="7" r="3" fill="#f59e0b"/>
                      <rect x="3" y="12" width="18" height="2.5" rx="1" fill="#14b8a6"/>
                      <rect x="3" y="16" width="12" height="2.5" rx="1" fill="#3b82f6"/>
                      <rect x="3" y="20" width="8" height="2.5" rx="1" fill="#ef4444"/>
                    </svg>
                  );
                } else if (type === "ATTAINMENT_TREND") {
                  displayName = "Attainment";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="12" width="3" height="9" fill="#ef4444" rx="1"/>
                      <rect x="8" y="8" width="3" height="13" fill="#f59e0b" rx="1"/>
                      <rect x="13" y="5" width="3" height="16" fill="#14b8a6" rx="1"/>
                      <rect x="18" y="3" width="3" height="18" fill="#16a34a" rx="1"/>
                      <line x1="2" y1="7" x2="22" y2="7" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2"/>
                    </svg>
                  );
                } else if (type === "FORECAST") {
                  displayName = "Forecast";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="5" width="18" height="3" rx="1.5" fill="#16a34a"/>
                      <rect x="3" y="10" width="13" height="3" rx="1.5" fill="#0f766e"/>
                      <rect x="3" y="15" width="9" height="3" rx="1.5" fill="#2563eb"/>
                      <rect x="3" y="20" width="16" height="2" rx="1" fill="#7c3aed" opacity="0.7"/>
                    </svg>
                  );
                } else if (type === "TRENDS") {
                  displayName = "Trends";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 16L8 10L13 13L19 6" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M19 6L19 10M19 6L15 6" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M3 20L8 18L13 19L19 17" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 1"/>
                    </svg>
                  );
                } else if (type === "CHANGES") {
                  displayName = "Changes";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="4" height="4" rx="1" fill="#16a34a"/>
                      <rect x="3" y="10" width="4" height="4" rx="1" fill="#2563eb"/>
                      <rect x="3" y="17" width="4" height="4" rx="1" fill="#dc2626"/>
                      <rect x="9" y="4" width="12" height="2" rx="1" fill="#86efac"/>
                      <rect x="9" y="11" width="8" height="2" rx="1" fill="#93c5fd"/>
                      <rect x="9" y="18" width="6" height="2" rx="1" fill="#fca5a5"/>
                    </svg>
                  );
                } else if (type === "RISK_SCORECARD") {
                  displayName = "Risk Score";
                  svgIcon = (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="9" stroke="#dc2626" strokeWidth="1.5"/>
                      <path d="M12 7v5" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
                      <circle cx="12" cy="16" r="1.5" fill="#dc2626"/>
                      <rect x="4" y="19" width="4" height="2" rx="1" fill="#dc2626"/>
                      <rect x="10" y="19" width="4" height="2" rx="1" fill="#f59e0b"/>
                      <rect x="16" y="19" width="4" height="2" rx="1" fill="#16a34a"/>
                    </svg>
                  );
                }

                const WIDGET_META: Record<string, { desc: string; category: string; color: string }> = {
                  KPI:              { desc: "Single metric with target bar",    category: "KPI",      color: "#f59e0b" },
                  BAR:              { desc: "Horizontal bars by dimension",     category: "Chart",    color: "#14b8a6" },
                  COLUMN:           { desc: "Vertical bars by dimension",       category: "Chart",    color: "#14b8a6" },
                  LINE:             { desc: "Trend over time / dimension",      category: "Chart",    color: "#14b8a6" },
                  AREA:             { desc: "Filled trend chart",               category: "Chart",    color: "#14b8a6" },
                  PIE:              { desc: "Part-to-whole breakdown",          category: "Chart",    color: "#14b8a6" },
                  DONUT:            { desc: "Pie with center label",            category: "Chart",    color: "#14b8a6" },
                  FUNNEL:           { desc: "Pipeline stage conversion",        category: "Chart",    color: "#14b8a6" },
                  SCATTER:          { desc: "Correlation / distribution",       category: "Chart",    color: "#14b8a6" },
                  WATERFALL:        { desc: "Cumulative value changes",         category: "Chart",    color: "#14b8a6" },
                  TREEMAP:          { desc: "Size-proportional rectangles",     category: "Chart",    color: "#14b8a6" },
                  GAUGE:            { desc: "Progress toward a target",         category: "Chart",    color: "#14b8a6" },
                  MAP:              { desc: "Geographic distribution",          category: "Chart",    color: "#14b8a6" },
                  TABLE:            { desc: "Deal list with stage badges",      category: "Table",    color: "#3b82f6" },
                  MATRIX:           { desc: "Cross-tab / heatmap grid",         category: "Table",    color: "#3b82f6" },
                  PERFORMANCE:      { desc: "Rep attainment table (color-coded)",  category: "Special", color: "#f59e0b" },
                  ATTAINMENT_TREND: { desc: "Bookings bars by quarter + target",   category: "Special", color: "#16a34a" },
                  FORECAST:         { desc: "Commit/Best Case/Pipeline rollup",    category: "Special", color: "#7c3aed" },
                  TRENDS:           { desc: "QoQ delta for key metrics",           category: "Special", color: "#14b8a6" },
                  CHANGES:          { desc: "Won/Lost/New/At-Risk deal groups",    category: "Special", color: "#ef4444" },
                  RISK_SCORECARD:   { desc: "Deal confidence scores, worst-first", category: "Special", color: "#dc2626" },
                };
                const meta = WIDGET_META[type] ?? { desc: type, category: "Chart", color: "#9ca3af" };

                return (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => handleLibDragStart(e, type)}
                    className="vis-icon-btn library-draggable"
                    onClick={() => addWidget(type)}
                    title={`${displayName}: ${meta.desc}`}
                    style={{ position: 'relative' }}
                  >
                    {/* Category dot */}
                    <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
                    {svgIcon}
                    <span style={{ fontSize: "0.6rem", color: "#9ca3af", marginTop: "4px", textAlign: "center", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%" }}>
                      {displayName.replace(" Chart","").replace(" Plot","")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card stack">
            <div className="section-head">
              <h2>Widget List</h2>
              <span>Select to edit</span>
            </div>
            {widgets.map((widget) => (
              <button
                key={widget.id}
                type="button"
                className={selectedWidgetId === widget.id ? "widget-list-item active-card" : "widget-list-item"}
                onClick={() => setSelectedWidgetId(widget.id)}
              >
                <strong>{widget.title}</strong>
                <span>{widget.type} | {widget.yMetric}</span>
              </button>
            ))}
          </div>

          {selectedWidget ? (
            <div className="card stack">
              <div className="section-head">
                <h2>Widget Settings</h2>
                <span>{selectedWidget.type}</span>
              </div>
              <label className="field">
                <span>Widget title</span>
                <input value={selectedWidget.title} onChange={(event) => updateWidget(selectedWidget.id, { title: event.target.value })} />
              </label>
              
              {/* Fine Layout arrangement coordinates */}
              <div className="section-head" style={{ marginTop: "6px" }}>
                <span style={{ background: "#e3f3ef", color: "var(--accent)", padding: "4px 8px" }}>
                  Workspace Positioning
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                <label className="field">
                  <span>Col X (0-11)</span>
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={selectedWidget.position?.x ?? 0}
                    onChange={(event) => updateWidget(selectedWidget.id, { position: { ...(selectedWidget.position || { w: 4, h: 3 }), x: parseInt(event.target.value) || 0 } })}
                  />
                </label>
                <label className="field">
                  <span>Row Y</span>
                  <input
                    type="number"
                    min="0"
                    value={selectedWidget.position?.y ?? 0}
                    onChange={(event) => updateWidget(selectedWidget.id, { position: { ...(selectedWidget.position || { w: 4, h: 3 }), y: parseInt(event.target.value) || 0 } })}
                  />
                </label>
                <label className="field">
                  <span>Width W (1-12)</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={selectedWidget.position?.w ?? 4}
                    onChange={(event) => updateWidget(selectedWidget.id, { position: { ...(selectedWidget.position || { x: 0, y: 0, h: 3 }), w: parseInt(event.target.value) || 1 } })}
                  />
                </label>
                <label className="field">
                  <span>Height H</span>
                  <input
                    type="number"
                    min="1"
                    value={selectedWidget.position?.h ?? 3}
                    onChange={(event) => updateWidget(selectedWidget.id, { position: { ...(selectedWidget.position || { x: 0, y: 0, w: 4 }), h: parseInt(event.target.value) || 1 } })}
                  />
                </label>
              </div>

              <label className="field">
                <span>Chart type</span>
                <select value={selectedWidget.type} onChange={(event) => updateWidget(selectedWidget.id, { type: event.target.value as DashboardWidget["type"] })}>
                  {fallbackDashboardConfig.availableChartTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              {["KPI", "BAR", "LINE", "COLUMN", "AREA", "GAUGE", "ATTAINMENT_TREND", "FORECAST"].includes(selectedWidget.type) && (
                <label className="field">
                  <span>🎯 Widget Target Override ($)</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={selectedWidget.target ?? ''}
                    placeholder={`Dashboard default: $${Math.round(dashboardTarget / 1000)}k`}
                    onChange={e => {
                      const val = Number(e.target.value);
                      updateWidget(selectedWidget.id, { target: val > 0 ? val : undefined });
                    }}
                  />
                </label>
              )}
              <label className="field">
                <span>X-axis column</span>
                <select value={selectedWidget.xField} onChange={(event) => updateWidget(selectedWidget.id, { xField: event.target.value })}>
                  {datasetFields.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Y-axis metric</span>
                <select value={selectedWidget.yMetric} onChange={(event) => updateWidget(selectedWidget.id, { yMetric: event.target.value })}>
                  {/* Dataset fields as dimension/metric options */}
                  <optgroup label="Dataset Fields">
                    {datasetFields.map((f) => (
                      <option key={`field_${f}`} value={f}>{f}</option>
                    ))}
                  </optgroup>
                  {/* Built-in aggregated metrics */}
                  <optgroup label="Built-in Metrics">
                    {Object.values(localMetrics).filter((m: any) => !m.isCustom).map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.format})</option>
                    ))}
                  </optgroup>
                  {/* Custom metrics from Data Studio */}
                  {Object.values(localMetrics).some((m: any) => m.isCustom) && (
                    <optgroup label="Custom Metrics">
                      {Object.values(localMetrics).filter((m: any) => m.isCustom).map((m: any) => (
                        <option key={m.id} value={m.id}>⚗ {m.name} (custom)</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>
              {localMetrics[selectedWidget.yMetric] && (
                <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '-6px 0 2px', padding: '4px 8px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  📐 {localMetrics[selectedWidget.yMetric].isCustom
                    ? `Formula: ${localMetrics[localMetrics[selectedWidget.yMetric].formula?.metricA]?.shortName ?? ''} ${localMetrics[selectedWidget.yMetric].formula?.op ?? ''} ${localMetrics[localMetrics[selectedWidget.yMetric].formula?.metricB]?.shortName ?? ''}`
                    : localMetrics[selectedWidget.yMetric].description}
                </p>
              )}
              <label className="field">
                <span>Widget customer filter</span>
                <select value={selectedWidget.filters?.customer ?? "All Customers"} onChange={(event) => updateWidget(selectedWidget.id, { filters: { ...(selectedWidget.filters || {}), customer: event.target.value } })}>
                  {customersList.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Widget team filter</span>
                <select value={selectedWidget.filters?.team ?? "All Teams"} onChange={(event) => updateWidget(selectedWidget.id, { filters: { ...(selectedWidget.filters || {}), team: event.target.value } })}>
                  {teamsList.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Widget custom metric filter</span>
                <select value={selectedWidget.filters?.metricFilter ?? "ALL"} onChange={(event) => updateWidget(selectedWidget.id, { filters: { ...(selectedWidget.filters || {}), metricFilter: event.target.value } })}>
                  {fallbackDashboardConfig.filters.metricFilters.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              {!isLocked && (
                <button type="button" className="secondary" onClick={() => removeWidget(selectedWidget.id)}>
                  Remove selected widget
                </button>
              )}
            </div>
          ) : null}
        </aside>

        <div className="dashboard-canvas-wrap">
          <section className="kpis">
            {activeTemplateKey === 'pipeline' ? (
              <>
                <KpiCard
                  label="Open Pipeline"
                  value={`$${Math.round(openPipelineValue / 1000)}k`}
                  subtitle="Open pipeline value in period"
                  delta={calcDelta(openPipelineValue, prevOpenPipelineValue)}
                  deltaLabel={deltaLabel}
                />
                <KpiCard
                  label="Pipeline Coverage"
                  value={`${effectiveDashboardTarget > 0 ? Math.round((openPipelineValue / effectiveDashboardTarget) * 100) : 0}%`}
                  subtitle="Pipeline vs target"
                  target={effectiveDashboardTarget}
                  actual={openPipelineValue}
                  attainment={effectiveDashboardTarget > 0 ? Math.round((openPipelineValue / effectiveDashboardTarget) * 100) : undefined}
                />
                <KpiCard
                  label="Open Deals"
                  value={`${openDealCount}`}
                  subtitle="Deals not closed"
                  delta={calcDelta(openDealCount, prevOpenDealCount)}
                  deltaLabel={deltaLabel}
                />
              </>
            ) : activeTemplateKey === 'qbr' ? (
              <>
                <KpiCard
                  label="Bookings"
                  value={`$${Math.round(summary.bookings / 1000)}k`}
                  subtitle="Closed Won deals in period"
                  target={effectiveDashboardTarget}
                  actual={summary.bookings}
                  attainment={effectiveDashboardTarget > 0 ? Math.round((summary.bookings / effectiveDashboardTarget) * 100) : undefined}
                  delta={calcDelta(summary.bookings, prevSummary.bookings)}
                  deltaLabel={deltaLabel}
                />
                <KpiCard
                  label="Target Attainment"
                  value={`${summary.targetAttainment}%`}
                  subtitle="vs configured target"
                  target={effectiveDashboardTarget}
                  actual={summary.bookings}
                  attainment={summary.targetAttainment}
                  delta={calcDelta(summary.targetAttainment, prevSummary.targetAttainment)}
                  deltaLabel={deltaLabel}
                />
                <KpiCard
                  label="Pipeline Coverage"
                  value={`${effectiveDashboardTarget > 0 ? Math.round((openPipelineValue / effectiveDashboardTarget) * 100) : 0}%`}
                  subtitle="Open pipeline vs target"
                  target={effectiveDashboardTarget}
                  actual={openPipelineValue}
                  attainment={effectiveDashboardTarget > 0 ? Math.round((openPipelineValue / effectiveDashboardTarget) * 100) : undefined}
                />
              </>
            ) : (
              <>
                <KpiCard
                  label="Bookings"
                  value={`$${Math.round(summary.bookings / 1000)}k`}
                  subtitle="Closed Won deals in period"
                  target={effectiveDashboardTarget}
                  actual={summary.bookings}
                  attainment={effectiveDashboardTarget > 0 ? Math.round((summary.bookings / effectiveDashboardTarget) * 100) : undefined}
                  delta={calcDelta(summary.bookings, prevSummary.bookings)}
                  deltaLabel={deltaLabel}
                />
                <KpiCard
                  label="Target Attainment"
                  value={`${summary.targetAttainment}%`}
                  subtitle="vs configured target"
                  target={effectiveDashboardTarget}
                  actual={summary.bookings}
                  attainment={summary.targetAttainment}
                  delta={calcDelta(summary.targetAttainment, prevSummary.targetAttainment)}
                  deltaLabel={deltaLabel}
                />
                <KpiCard
                  label="Win Rate"
                  value={`${summary.winRate}%`}
                  subtitle="Won / Total deals"
                  delta={calcDelta(summary.winRate, prevSummary.winRate)}
                  deltaLabel={deltaLabel}
                />
              </>
            )}
          </section>

          <section className="card stack">
            <div className="section-head">
              <h2>Dashboard Canvas</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Live 12-Column Grid</span>
                {isReadOnly && (
                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, border: '1px solid #7dd3fc' }}>
                    👁 VIEW ONLY
                  </span>
                )}
                {!isReadOnly && dashboardStatus === 'published' && (
                  <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, border: '1px solid #86efac' }}>
                    🔒 PUBLISHED
                  </span>
                )}
              </div>
            </div>
            <p>
              {isLocked
                ? '🔒 Dashboard is published. Revert to draft to edit widgets.'
                : 'Drag widgets directly from the library or rearrange elements inside the guidelines below by dragging their handles.'}
            </p>
            
            {(() => {
              // Compute occupied cells so we can render ghost cells only where empty
              const COLS = 12;
              const maxRow = widgets.reduce((m, wgt) => Math.max(m, (wgt.position?.y ?? 0) + (wgt.position?.h ?? 3)), 0);
              // Show at least 3 empty rows beyond last widget (always shows breathing room)
              const gridRows = Math.max(6, maxRow + 3);

              const occupied = new Set<string>();
              widgets.forEach((wgt) => {
                const p = wgt.position || { x: 0, y: 0, w: 4, h: 3 };
                for (let r = p.y; r < p.y + p.h; r++) {
                  for (let c = p.x; c < p.x + p.w; c++) {
                    occupied.add(`${c},${r}`);
                  }
                }
              });

              // Mark drop-indicator cells
              const indicatorCells = new Set<string>();
              if (dropIndicator) {
                for (let r = dropIndicator.y; r < dropIndicator.y + dropIndicator.h; r++) {
                  for (let c = dropIndicator.x; c < dropIndicator.x + dropIndicator.w; c++) {
                    indicatorCells.add(`${c},${r}`);
                  }
                }
              }

              return (
              <div
                ref={canvasRef}
                className="relative-grid"
                onDragOver={handleCanvasDragOver}
                onDragLeave={handleCanvasDragLeave}
                onDrop={handleCanvasDrop}
              >
              {/* ── Panelated ghost cells (empty slots) ── */}
              {Array.from({ length: gridRows }).map((_, row) =>
                Array.from({ length: COLS }).map((_, col) => {
                  const key = `${col},${row}`;
                  if (occupied.has(key)) return null;
                  const isIndicator = indicatorCells.has(key);
                  return (
                    <div
                      key={`ghost-${key}`}
                      className={isIndicator ? "drop-indicator" : "ghost-cell"}
                      style={{
                        gridColumn: `${col + 1}`,
                        gridRow: `${row + 1}`,
                      }}
                    />
                  );
                })
              )}

              {renderedWidgets.map((widget) => {
                const pos = widget.position || { x: 0, y: 0, w: 4, h: 3 };
                const gridStyle = {
                  gridColumn: `${pos.x + 1} / span ${pos.w}`,
                  gridRow: `${pos.y + 1} / span ${pos.h}`,
                  zIndex: selectedWidgetId === widget.id ? 10 : 1,
                };

                const isMetricHighlighted = highlightedMetric !== null && widget.yMetric === highlightedMetric;
                return (
                  <div
                    key={widget.id}
                    className={`relative-card ${selectedWidgetId === widget.id ? "selected-widget" : ""}`}
                    style={{
                      ...gridStyle,
                      ...(isMetricHighlighted ? {
                        border: '2px solid #f59e0b',
                        boxShadow: '0 0 0 3px rgba(245,158,11,0.25), 0 4px 16px rgba(0,0,0,0.1)',
                      } : {}),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWidgetId(widget.id);
                    }}
                  >
                    <div
                      className="widget-drag-handle"
                      draggable={!isLocked}
                      onDragStart={(e) => handleWidgetDragStart(e, widget.id)}
                      style={{ cursor: isLocked ? 'default' : 'move' }}
                    >
                      <span className="grip-icon">⋮⋮</span>
                      <strong className="widget-header-title">{widget.title}</strong>
                      {widget.type !== "KPI" && widget.type !== "TABLE" && (
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {widget.xField} → {widget.yMetric}
                        </span>
                      )}
                      <span className="widget-header-badge">{widget.type}</span>
                      {!isLocked && (
                        <button
                          type="button"
                          title="Delete widget"
                          onClick={(e) => { e.stopPropagation(); removeWidget(widget.id); }}
                          style={{
                            marginLeft: 'auto', background: 'transparent', border: 'none',
                            color: '#ef4444', cursor: 'pointer', fontSize: '1rem',
                            lineHeight: 1, padding: '0 2px', borderRadius: 4,
                            flexShrink: 0,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="widget-content-body">
                      {/* Use widget-level datasetId first, fall back to globally selected dataset */}
                      {(!(widget.datasetId || selectedDatasetId) || (datasetCache[(widget.datasetId || selectedDatasetId) ?? '']?.length ?? 0) === 0) ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.8rem', flexDirection: 'column', gap: 6 }}>
                          {!(widget.datasetId || selectedDatasetId)
                            ? <><span style={{ fontSize: '1.5rem' }}>📊</span><span>Select a dataset above</span></>
                            : <><span style={{ fontSize: '1.5rem', display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span><span>Loading dataset…</span></>}
                        </div>
                      ) : widget.type === "KPI" ? (() => {
                          // Compute actual + attainment for all target-bearing metrics
                          const wonAmount   = (widget._rows ?? []).filter((r: any) => r.stage === "Closed Won").reduce((s: number, r: any) => s + r.amount, 0);
                          const pipeAmount  = (widget._rows ?? []).filter((r: any) => r.stage !== "Closed Won" && r.stage !== "Closed Lost").reduce((s: number, r: any) => s + r.amount, 0);
                          const t           = widget._target ?? 0;

                          let kpiActual: number | undefined;
                          let kpiTarget: number | undefined;
                          let kpiAttainment: number | undefined;

                          if (widget.yMetric === "targetAttainment") {
                            kpiActual     = wonAmount;
                            kpiTarget     = t;
                            kpiAttainment = t > 0 ? Math.round((wonAmount / t) * 100) : 0;
                          } else if (widget.yMetric === "bookings" && t > 0) {
                            kpiActual     = wonAmount;
                            kpiTarget     = t;
                            kpiAttainment = Math.round((wonAmount / t) * 100);
                          } else if (widget.yMetric === "pipelineValue" && t > 0) {
                            kpiActual     = pipeAmount;
                            kpiTarget     = t;
                            kpiAttainment = Math.round((pipeAmount / t) * 100);
                          }

                          const isBuiltIn = ["bookings","pipelineValue","dealCount","winRate","targetAttainment"].includes(widget.yMetric);
                          return (
                            <KpiCard
                              label={widget.title}
                              value={
                                widget.yMetric === "bookings"      ? `$${Math.round((widget.value ?? 0) / 1000)}k`
                              : widget.yMetric === "pipelineValue" ? `$${Math.round((widget.value ?? 0) / 1000)}k`
                              : widget.yMetric === "dealCount"     ? `${widget.value ?? 0}`
                              : (widget.yMetric === "winRate" || widget.yMetric === "targetAttainment") ? `${widget.value ?? 0}%`
                              : `${(widget.value ?? 0).toLocaleString()}`
                              }
                              subtitle={
                                widget.yMetric === "bookings"         ? "Closed Won revenue"
                              : widget.yMetric === "targetAttainment" ? `Target: $${Math.round(t / 1000)}k`
                              : widget.yMetric === "winRate"          ? "Deals won / total deals"
                              : widget.yMetric === "pipelineValue"    ? "Open pipeline value"
                              : widget.yMetric === "dealCount"        ? "Total deals in period"
                              : !isBuiltIn                            ? `Total ${widget.yMetric}`
                              : widget.yMetric
                              }
                              target={kpiTarget}
                              actual={kpiActual}
                              attainment={kpiAttainment}
                            />
                          );
                        })() : widget.type === "TABLE" ? (
                        <DealsTable rows={widget._rows ?? []} cap={6} />
                      ) : widget.type === "PERFORMANCE" ? (
                        <PerformanceWidget
                          rows={widget._rows ?? []}
                          target={widget._target ?? dashboardTarget}
                          ownerTargets={ownerTargets}
                          serverReps={widget._api?.performance}
                        />
                      ) : widget.type === "ATTAINMENT_TREND" ? (
                        <AttainmentTrendWidget
                          allDeals={widget._allDeals ?? dbDeals}
                          target={widget._target ?? dashboardTarget}
                          serverSeries={widget._api?.attainmentSeries}
                        />
                      ) : widget.type === "FORECAST" ? (
                        <ForecastWidget
                          rows={widget._rows ?? []}
                          target={widget._target ?? dashboardTarget}
                          serverForecast={widget._api?.forecast ? { ...widget._api.forecast } : undefined}
                        />
                      ) : widget.type === "TRENDS" ? (
                        <TrendsWidget allDeals={widget._allDeals ?? dbDeals} target={widget._target ?? dashboardTarget} />
                      ) : widget.type === "CHANGES" ? (
                        <ChangesWidget rows={widget._rows ?? []} />
                      ) : widget.type === "RISK_SCORECARD" ? (
                        <RiskScorecardWidget rows={widget._rows ?? []} />
                      ) : (
                        <ChartCard
                          title={widget.title}
                          type={widget.type}
                          data={widget.data}
                          targetValue={widget._target}
                          targetLabel={`Target: $${Math.round((widget._target ?? 0) / 1000)}k`}
                          onBarClick={(label, value) => {
                            const filtered = (widget._rows ?? []).filter(
                              (r: any) => String((r as any)[widget.xField] ?? 'Unknown') === label
                            );
                            setDrilldown({ title: `${widget.title} — ${label}`, rows: filtered });
                            openDrilldownFromWidget(widget, label);
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
              );
            })()}
          </section>
        </div>
      </section>

      <section className="card stack">
        <div className="section-head">
          <h2>My Dashboards</h2>
          <button
            type="button"
            onClick={newDashboard}
            style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
          >
            + New Dashboard
          </button>
        </div>

        {savedDashboardsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>No dashboards saved yet.</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>Add widgets and click <strong>Save draft</strong>.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...savedDashboardsList]
              .sort((a, b) => {
                const sa = a.starred === true ? 1 : 0;
                const sb = b.starred === true ? 1 : 0;
                if (sa !== sb) return sb - sa;
                return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
              })
              .map((dash) => {
                const isActive    = dash.id === activeDashboardId;
                const isPublished = dash.status === 'published';
                const isShared    = dash.readOnly === true; // dashboard belongs to another user
                const widgetCount = Array.isArray(dash.items) ? dash.items.length : 0;
                const updatedAt   = dash.updatedAt || dash.createdAt;
                const timeLabel   = updatedAt
                  ? new Date(updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div
                    key={dash.id}
                    onClick={() => loadDashboardEntry(dash)}
                    style={{
                      border:        `2px solid ${isActive ? '#6366f1' : isShared ? '#bae6fd' : '#e2e8f0'}`,
                      borderRadius:  10,
                      padding:       '12px 14px',
                      cursor:        'pointer',
                      background:    isActive ? '#f5f3ff' : isShared ? '#f0f9ff' : '#fff',
                      transition:    'border-color 0.15s, background 0.15s',
                      position:      'relative',
                    }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <span style={{
                        position: 'absolute', top: 8, right: 10,
                        fontSize: '0.65rem', fontWeight: 700,
                        background: '#6366f1', color: '#fff',
                        borderRadius: 999, padding: '2px 8px',
                      }}>ACTIVE</span>
                    )}

                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      {dash.starred && <span title="Starred">⭐</span>}
                      {isShared && <span title="Shared with you — view only">👁</span>}
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a', flex: 1, paddingRight: isActive ? 60 : 0 }}>
                        {dash.title || 'Untitled'}
                      </strong>
                    </div>

                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {/* Shared badge — replaces draft/published badge for shared dashboards */}
                      {isShared ? (
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                          background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc',
                        }}>
                          👁 View only
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                          background: isPublished ? '#dcfce7' : '#fef9c3',
                          color:      isPublished ? '#16a34a' : '#ca8a04',
                          border:     `1px solid ${isPublished ? '#86efac' : '#fde68a'}`,
                        }}>
                          {isPublished ? '🚀 Published' : '✏️ Draft'}
                        </span>
                      )}
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {widgetCount} widget{widgetCount !== 1 ? 's' : ''}
                      </span>
                      {timeLabel && (
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          · {timeLabel}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); loadDashboardEntry(dash); }}
                        style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 6, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4f46e5', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {isShared ? '👁 View' : '✏️ Open'}
                      </button>
                      {/* Duplicate is always available — creates an owned copy of a shared dashboard */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          loadDashboardEntry(dash);
                          setTimeout(() => {
                            const stamp = Date.now();
                            setTitle(`${dash.title} (Copy)`);
                            setWidgets((dash.items || []).map((w: any) => ({ ...w, id: `${w.id}_copy${stamp}` })));
                            setActiveDashboardId(null);
                            setDashboardStatus('draft');
                            setIsReadOnly(false);  // copy is now owned by this user
                          }, 50);
                        }}
                        style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', cursor: 'pointer' }}
                      >
                        📋 Duplicate
                      </button>
                      {/* Delete is only shown for own dashboards — not for shared ones */}
                      {!isShared && (
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); deleteDashboard(dash.id); }}
                          style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', cursor: 'pointer', marginLeft: 'auto' }}
                        >
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* ── Load more (pagination) ─────────────────────────────────── */}
            {dashboardHasMore && (
              <button
                type="button"
                onClick={loadMoreDashboards}
                disabled={dashboardLoadingMore}
                style={{
                  width: '100%', padding: '8px 0', marginTop: 4,
                  fontSize: '0.78rem', fontWeight: 600,
                  border: '1px dashed #c7d2fe', borderRadius: 8,
                  background: '#f8faff', color: '#4f46e5', cursor: 'pointer',
                  opacity: dashboardLoadingMore ? 0.6 : 1,
                }}
              >
                {dashboardLoadingMore ? '⏳ Loading…' : '↓ Load more dashboards'}
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── Access Management Modal (#29) ──────────────────────────────────── */}
      {showAccessModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowAccessModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 24px 48px rgba(0,0,0,0.22)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>🔐 Manage Dashboard Access</h2>
              <button type="button" onClick={() => setShowAccessModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, color: '#64748b' }}>✕</button>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 18px' }}>
              Choose who can view this dashboard. Changes take effect immediately.
            </p>
            {([
              { value: 'PRIVATE', label: '🔒 Private', desc: 'Only you can view this dashboard', color: '#dc2626', bg: '#fee2e2' },
              { value: 'TEAM',    label: '👥 Team',    desc: 'All members of your team can view', color: '#2563eb', bg: '#dbeafe' },
              { value: 'LINK',    label: '🔗 Link',    desc: 'Anyone with the link can view',     color: '#16a34a', bg: '#dcfce7' },
            ] as const).map(opt => (
              <label key={opt.value} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', marginBottom: 8,
                border: `2px solid ${access === opt.value ? opt.color : '#e2e8f0'}`,
                borderRadius: 10, cursor: 'pointer', background: access === opt.value ? opt.bg : '#fff',
                transition: 'all 0.15s',
              }}>
                <input type="radio" name="access" value={opt.value} checked={access === opt.value}
                  onChange={() => setAccess(opt.value as DashboardDefinition['access'])}
                  style={{ width: 18, height: 18, accentColor: opt.color }} />
                <div>
                  <div style={{ fontWeight: 700, color: opt.color, fontSize: '0.88rem' }}>{opt.label}</div>
                  <div style={{ color: '#64748b', fontSize: '0.74rem', marginTop: 2 }}>{opt.desc}</div>
                </div>
              </label>
            ))}
            {/* Per-user access grants — shown when not PRIVATE (Feature 4d) */}
            {access !== 'PRIVATE' && activeDashboardId && (
              <div style={{ marginTop: 20, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', margin: '0 0 10px' }}>👤 Share with specific user</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    value={grantUserId}
                    onChange={e => setGrantUserId(e.target.value)}
                    placeholder="User ID"
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.78rem' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={grantCanEdit} onChange={e => setGrantCanEdit(e.target.checked)} />
                    Can edit
                  </label>
                  <button type="button"
                    disabled={!grantUserId.trim()}
                    onClick={async () => {
                      if (!grantUserId.trim()) return;
                      try {
                        const res = await fetch('/api/dashboards/access', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ dashboardId: activeDashboardId, userId: grantUserId.trim(), canEdit: grantCanEdit }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setAccessGrants(prev => [...prev.filter(g => g.userId !== grantUserId.trim()), data.grant]);
                          setGrantUserId('');
                          setGrantCanEdit(false);
                        }
                      } catch {}
                    }}
                    style={{ padding: '7px 14px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: grantUserId.trim() ? 'pointer' : 'default', opacity: grantUserId.trim() ? 1 : 0.5 }}>
                    Grant Access
                  </button>
                </div>
                {/* Existing grants */}
                {accessGrants.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {accessGrants.map(grant => (
                      <div key={grant.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.76rem' }}>
                        <span style={{ flex: 1, color: '#0f172a', fontWeight: 500, fontFamily: 'monospace' }}>{grant.userId}</span>
                        <span style={{ color: grant.canEdit ? '#16a34a' : '#64748b', fontSize: '0.7rem' }}>{grant.canEdit ? 'Can edit' : 'View only'}</span>
                        <button type="button"
                          onClick={async () => {
                            try {
                              await fetch('/api/dashboards/access', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ dashboardId: activeDashboardId, userId: grant.userId }),
                              });
                              setAccessGrants(prev => prev.filter(g => g.userId !== grant.userId));
                            } catch {}
                          }}
                          style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: '0.7rem' }}>
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" className="secondary" onClick={() => setShowAccessModal(false)}>Cancel</button>
              <button type="button" className="primary"
                onClick={async () => {
                  await persistDashboard();
                  setShowAccessModal(false);
                  setWorkspaceMessage(`✅ Access updated to ${access}`);
                }}
                style={{ background: '#0f766e', borderColor: '#0f766e' }}>
                Save Access Setting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share Link Modal ─────────────────────────────────────────────────── */}
      {showShareModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, padding: 28, boxShadow: '0 24px 48px rgba(0,0,0,0.22)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>🔗 Share Dashboard</h2>
              <button type="button" onClick={() => setShowShareModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, color: '#64748b' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px' }}>
              Anyone with this link can view <strong>"{title}"</strong> in read-only mode.
            </p>

            {/* URL display + copy */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                readOnly
                value={shareUrl}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                  fontSize: '0.78rem', background: '#f8fafc', color: '#1e293b', fontFamily: 'monospace',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2500);
                  } catch {
                    // fallback: select the text
                  }
                }}
                style={{
                  padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700,
                  background: shareCopied ? '#16a34a' : '#0f766e', color: '#fff', fontSize: '0.82rem',
                  transition: 'background 0.2s', flexShrink: 0, minWidth: 80,
                }}
              >
                {shareCopied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>

            {/* Visibility info */}
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: '0.78rem', color: '#15803d' }}>
              {access === 'TEAM'
                ? '👥 Team access — visible to all members of your tenant'
                : '🔗 Link access — anyone with the link can view this dashboard'}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={revokeShareLink}
                disabled={shareRevoking}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid #fca5a5',
                  background: shareRevoking ? '#f1f5f9' : '#fff', color: '#dc2626',
                  cursor: shareRevoking ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 600,
                }}
              >
                {shareRevoking ? '⏳ Revoking…' : '🗑 Revoke Link'}
              </button>
              <button type="button"
                onClick={() => setShowShareModal(false)}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Executive Presentation Mode (#30) ──────────────────────────────── */}
      {execMode && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          display: 'flex', flexDirection: 'column', overflow: 'auto',
        }}>
          {/* Exec header */}
          <div style={{ padding: '20px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Executive View · Revenue Dashboard</div>
              <h1 style={{ color: '#f1f5f9', margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>{title}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {timeAgo && <span style={{ color: '#475569', fontSize: '0.75rem' }}>Last updated: <strong style={{ color: '#94a3b8' }}>{timeAgo}</strong></span>}
              <span style={{ background: dashboardStarred ? '#fef9c322' : 'transparent', color: '#f59e0b', fontSize: '1.4rem' }}>{dashboardStarred ? '⭐' : ''}</span>
              <span style={{
                background: dashboardStatus === 'published' ? '#16a34a22' : '#ca8a0422',
                color:      dashboardStatus === 'published' ? '#4ade80'   : '#fbbf24',
                fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                border: `1px solid ${dashboardStatus === 'published' ? '#4ade8066' : '#fbbf2466'}`,
              }}>
                {dashboardStatus === 'published' ? '🚀 PUBLISHED' : '✏ DRAFT'}
              </span>
              <button type="button" onClick={() => setExecMode(false)}
                style={{ background: '#ef444422', border: '1px solid #ef444444', color: '#f87171', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                ✕ Exit Exec View
              </button>
            </div>
          </div>

          {/* Exec KPI strip — uses API data when available */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '24px 36px 0' }}>
            {[
              { label: 'ARR / Bookings', value: execMetrics?.summary ? `$${Math.round(execMetrics.summary.totalARR / 1000)}k` : `$${Math.round(summary.bookings / 1000)}k`, delta: calcDelta(summary.bookings, prevSummary.bookings), sub: 'Closed Won revenue' },
              { label: 'Pipeline Value', value: execMetrics?.summary ? `$${Math.round(execMetrics.summary.pipelineValue / 1000)}k` : `$${Math.round(openPipelineValue / 1000)}k`, sub: 'Open deals value' },
              { label: 'Win Rate', value: execMetrics?.summary ? `${execMetrics.summary.winRate}%` : `${summary.winRate}%`, delta: calcDelta(summary.winRate, prevSummary.winRate), sub: 'Won / Total deals' },
              { label: 'Avg Deal Size', value: execMetrics?.summary ? `$${Math.round(execMetrics.summary.avgDealSize / 1000)}k` : `$${Math.round(summary.bookings / Math.max(1, rows.filter(r => r.stage === 'Closed Won').length) / 1000)}k`, sub: execMetrics?.summary ? `Churn risk: ${execMetrics.summary.churnRisk}` : 'Per closed deal' },
            ].map(({ label, value, delta, sub }) => {
              const up   = (delta ?? 0) > 0;
              const flat = delta === 0;
              const deltaColor = delta === undefined ? undefined : flat ? '#94a3b8' : up ? '#4ade80' : '#f87171';
              return (
                <div key={label} style={{ background: '#ffffff0d', border: '1px solid #ffffff14', borderRadius: 14, padding: '20px 22px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ color: '#f1f5f9', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>{value}</span>
                    {delta !== undefined && (
                      <span style={{ color: deltaColor, fontSize: '0.8rem', fontWeight: 700, background: deltaColor + '22', padding: '2px 8px', borderRadius: 999 }}>
                        {flat ? '→ 0%' : `${up ? '↑ +' : '↓ '}${delta}%`}
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.7rem', marginTop: 4 }}>{sub}</div>
                </div>
              );
            })}
          </div>

          {/* Attainment progress bar */}
          <div style={{ padding: '18px 36px 0' }}>
            <div style={{ background: '#ffffff0d', border: '1px solid #ffffff14', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.75rem' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Revenue Target Progress</span>
                <span style={{ color: summary.targetAttainment >= 100 ? '#4ade80' : '#f59e0b', fontWeight: 800 }}>
                  ${Math.round(summary.bookings / 1000)}k / ${Math.round(dashboardTarget / 1000)}k ({summary.targetAttainment}%)
                </span>
              </div>
              <div style={{ height: 14, borderRadius: 999, background: '#1e293b', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 999, transition: 'width 0.6s',
                  width: `${Math.min(100, summary.targetAttainment)}%`,
                  background: summary.targetAttainment >= 100 ? '#16a34a' : summary.targetAttainment >= 75 ? '#0f766e' : summary.targetAttainment >= 50 ? '#f59e0b' : '#ef4444',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.65rem', color: '#475569' }}>
                <span>$0</span>
                <span style={{ color: '#ef444488' }}>${ Math.round(dashboardTarget / 2000)}k (50%)</span>
                <span>${Math.round(dashboardTarget / 1000)}k Target</span>
              </div>
            </div>
          </div>

          {/* Exec widgets: Forecast + Top accounts + Risk summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, padding: '16px 36px' }}>
            {/* Forecast section */}
            <div style={{ background: '#ffffff0d', border: '1px solid #ffffff14', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Forecast Rollup</div>
              {[
                { label: 'Won',       value: rows.filter(r => r.stage === 'Closed Won').reduce((s, r) => s + r.amount, 0), color: '#4ade80' },
                { label: 'Commit',    value: rows.filter(r => ['Closed Won','Negotiation'].includes(r.stage)).reduce((s, r) => s + r.amount, 0), color: '#14b8a6' },
                { label: 'Best Case', value: rows.filter(r => ['Closed Won','Negotiation','Proposal'].includes(r.stage)).reduce((s, r) => s + r.amount, 0), color: '#60a5fa' },
                { label: 'Pipeline',  value: rows.filter(r => r.stage !== 'Closed Lost').reduce((s, r) => s + r.amount, 0), color: '#a78bfa' },
              ].map(({ label, value, color }) => {
                const pct = Math.min(100, dashboardTarget > 0 ? Math.round((value / dashboardTarget) * 100) : 0);
                return (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.72rem' }}>
                      <span style={{ color: '#94a3b8' }}>{label}</span>
                      <span style={{ color, fontWeight: 700 }}>${Math.round(value / 1000)}k <span style={{ color: '#475569', fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: '#1e293b' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top accounts — uses API data when available */}
            <div style={{ background: '#ffffff0d', border: '1px solid #ffffff14', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Top Accounts by Revenue</div>
              {(() => {
                // Prefer API data, fall back to client-side calculation
                const apiAccounts = execMetrics?.topAccounts;
                const sorted = apiAccounts && apiAccounts.length > 0
                  ? apiAccounts.slice(0, 6).map((a: any) => [a.name, a.revenue] as [string, number])
                  : (() => {
                      const accMap = new Map<string, number>();
                      rows.filter(r => r.stage === 'Closed Won').forEach(r => accMap.set(r.accountName, (accMap.get(r.accountName) ?? 0) + r.amount));
                      return Array.from(accMap.entries()).sort(([,a],[,b]) => b - a).slice(0, 6);
                    })();
                const maxVal = (sorted[0]?.[1] as number) ?? 1;
                return sorted.map(([name, val]: [string, number], i: number) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <span style={{ color: '#475569', fontSize: '0.65rem', width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <div style={{ width: 60, height: 5, borderRadius: 999, background: '#1e293b', flexShrink: 0 }}>
                      <div style={{ height: '100%', width: `${(val / maxVal) * 100}%`, background: '#14b8a6', borderRadius: 999 }} />
                    </div>
                    <span style={{ color: '#f1f5f9', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, minWidth: 36, textAlign: 'right' }}>${Math.round(val / 1000)}k</span>
                  </div>
                ));
              })()}
            </div>

            {/* Risk summary */}
            <div style={{ background: '#ffffff0d', border: '1px solid #ffffff14', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Deal Risk Summary</div>
              {(() => {
                const open = rows.filter(r => r.stage !== 'Closed Won' && r.stage !== 'Closed Lost');
                const scored = open.map(r => computeRiskScore(r));
                const critical = scored.filter(s => s.score < 30).length;
                const low      = scored.filter(s => s.score >= 30 && s.score < 55).length;
                const medium   = scored.filter(s => s.score >= 55 && s.score < 80).length;
                const high     = scored.filter(s => s.score >= 80).length;
                const avg      = scored.length ? Math.round(scored.reduce((s, x) => s + x.score, 0) / scored.length) : 0;
                return (
                  <>
                    {[
                      { label: '🚨 Critical',  count: critical, color: '#f87171', bg: '#ef444422' },
                      { label: '⚠ Low Conf',  count: low,      color: '#fbbf24', bg: '#f59e0b22' },
                      { label: '• Medium',    count: medium,   color: '#34d399', bg: '#10b98122' },
                      { label: '✓ High',      count: high,     color: '#4ade80', bg: '#16a34a22' },
                    ].map(({ label, count, color, bg }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 6, background: bg, marginBottom: 5 }}>
                        <span style={{ color, fontSize: '0.73rem', fontWeight: 600 }}>{label}</span>
                        <span style={{ color, fontWeight: 800, fontSize: '0.9rem' }}>{count}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 8, borderTop: '1px solid #334155', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <span style={{ color: '#475569' }}>Avg confidence</span>
                      <span style={{ color: avg >= 70 ? '#4ade80' : avg >= 45 ? '#fbbf24' : '#f87171', fontWeight: 800 }}>{avg}/100</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Quarterly Trend — from API or client data */}
          {(execMetrics?.quarterlyTrend?.length > 0) && (
            <div style={{ margin: '0 36px 16px', background: '#ffffff0d', border: '1px solid #ffffff14', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Quarterly Win Rate Trend</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
                {execMetrics.quarterlyTrend.slice(-8).map((q: any) => {
                  const barH = `${Math.max(4, q.winRate)}%`;
                  const color = q.winRate >= 70 ? '#4ade80' : q.winRate >= 50 ? '#14b8a6' : q.winRate >= 30 ? '#fbbf24' : '#f87171';
                  return (
                    <div key={q.quarter} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                      <span style={{ color, fontSize: '0.6rem', fontWeight: 700, marginBottom: 2 }}>{q.winRate}%</span>
                      <div style={{ width: '60%', height: barH, background: color, borderRadius: '3px 3px 0 0', minHeight: 4 }} title={`${q.quarter}: ${q.won}/${q.total} won`} />
                      <span style={{ fontSize: '0.55rem', color: '#475569', marginTop: 3, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{q.quarter}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Exec footer */}
          <div style={{ padding: '12px 36px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#334155', fontSize: '0.68rem', flexShrink: 0 }}>
            <span>Revenue Intelligence Dashboard · Confidential</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <button type="button" onClick={() => setExecMode(false)}
              style={{ background: 'none', border: '1px solid #334155', color: '#64748b', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: '0.68rem' }}>
              ← Exit Exec View
            </button>
          </div>
        </div>
      )}

      {/* ── Drilldown Modal (feature #22) ──────────────────────────────────── */}
      {drilldown && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setDrilldown(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 16, width: '100%', maxWidth: 860,
              maxHeight: '80vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 24px 48px rgba(0,0,0,0.22)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>🔍 Drilldown</h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>{drilldown.title}</p>
              </div>
	              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
	                {drilldownLoading && (
	                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Loadingâ€¦</span>
	                )}
	                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{drilldown.rows.length} deal{drilldown.rows.length !== 1 ? 's' : ''}</span>
	                <button type="button" onClick={() => setDrilldown(null)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>
                  ✕ Close
                </button>
              </div>
            </div>
            {/* Deals table */}
            <div style={{ overflow: 'auto', flex: 1 }}>
              {drilldown.rows.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No deals match this filter</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                      {['Deal Name', 'Owner', 'Account', 'Stage', 'Amount', 'Close Date', 'Quarter'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Amount' ? 'right' : 'left', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drilldown.rows.map((deal: any, i: number) => {
                      const stageColors: Record<string, { bg: string; color: string }> = {
                        'Closed Won':  { bg: '#dcfce7', color: '#16a34a' },
                        'Closed Lost': { bg: '#fee2e2', color: '#dc2626' },
                        'Negotiation': { bg: '#fef9c3', color: '#ca8a04' },
                        'Proposal':    { bg: '#dbeafe', color: '#2563eb' },
                      };
                      const sc = stageColors[deal.stage] ?? { bg: '#f1f5f9', color: '#64748b' };
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '8px 14px', fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={deal.dealName}>{deal.dealName}</td>
                          <td style={{ padding: '8px 14px', color: '#475569' }}>{deal.ownerName}</td>
                          <td style={{ padding: '8px 14px', color: '#475569', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.accountName}</td>
                          <td style={{ padding: '8px 14px' }}>
                            <span style={{ background: sc.bg, color: sc.color, borderRadius: 4, padding: '2px 7px', fontSize: '0.72rem', fontWeight: 600 }}>{deal.stage}</span>
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700 }}>${Math.round(deal.amount / 1000)}k</td>
                          <td style={{ padding: '8px 14px', color: '#94a3b8' }}>{deal.closeDate || '—'}</td>
                          <td style={{ padding: '8px 14px', color: '#94a3b8' }}>{deal.quarter || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {/* Summary footer */}
            {drilldown.rows.length > 0 && (() => {
              const total = drilldown.rows.reduce((s: number, d: any) => s + d.amount, 0);
              const won   = drilldown.rows.filter((d: any) => d.stage === 'Closed Won').reduce((s: number, d: any) => s + d.amount, 0);
              return (
                <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: 24, fontSize: '0.78rem' }}>
                  <span><strong>${Math.round(total / 1000)}k</strong> total value</span>
                  <span><strong>${Math.round(won / 1000)}k</strong> booked (Closed Won)</span>
                  <span><strong>{drilldown.rows.filter((d: any) => d.stage === 'Closed Won').length}</strong> won deals</span>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </main>
  );
}
