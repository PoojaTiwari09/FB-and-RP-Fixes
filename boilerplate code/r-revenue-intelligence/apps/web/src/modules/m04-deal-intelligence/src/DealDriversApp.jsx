// DealDriversApp.jsx — v11 (all gaps fixed)
// FIX-1: Sort state lifted to parent (preserved across filter changes, reset on board change)
// FIX-2: Drill-down badge shows absolute flaggedCount
// FIX-3: View Deal accessibility error handling
// FIX-4: CRO insight line dynamically computed client-side
// FIX-5: Insight text server-side dynamic (coaching + comparison)
// GAP-1: Export CSV button wired to GET /deal-drivers/matrix/export
// GAP-2: Coaching Effectiveness tab now visible to CRO and SM (not SM-only)
// GAP-3: Board Comparison tab now visible to SM and CRO (not CRO-only)
// GAP-4: Coaching tab Rep dropdown uses direct reports from matrix rows, not managers list
// GAP-5: Coaching data field mapping fixed (baselineSnapshot → baseline, currentSnapshot → current)
// GAP-6: CRO default: prompt shown when no manager selected
// GAP-7: repSegment field mapped correctly (backend: segment, frontend: repSegment)
// GAP-8: getBoardWarnings correctly calls /deal-drivers/boards/:boardId/warnings
// GAP-9: getDirectReports derived from last matrix load — reps list for coaching tab

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE = (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : null) || "http://localhost:3001";

const HEATMAP_COLORS = {
  HIGHEST: { bg: "#F59E0B", text: "#fff" },
  SECOND:  { bg: "#FCD34D", text: "#78350F" },
  THIRD:   { bg: "#FEF3C7", text: "#78350F" },
  NONE:    { bg: "transparent", text: "inherit" },
};

const periodOptions = [
  { value: "NOW",          label: "Now" },
  { value: "LAST_30_DAYS", label: "Last 30 days" },
  { value: "LAST_90_DAYS", label: "Last 90 days" },
];

const PERIOD_FOOTNOTES = {
  general: "Deal count = deals open ≥ 1 day in selected period. Percentages = share of deals where warning was active ≥ 1 day.",
};

// ─── Auth helpers ────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("dd_token") || sessionStorage.getItem("dd_token") || "";
const getUser  = () => {
  const token = getToken();
  if (!token) return { role: "cro", name: "Demo User" };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { ...payload, role: (payload.roles?.[0] ?? payload.role ?? "cro") };
  } catch { return { role: "cro", name: "Demo User" }; }
};

// ─── Session timeout ─────────────────────────────────────────────────────────
function useSessionTimeout(onTimeout) {
  const lastActivityRef = useRef(Date.now());
  useEffect(() => {
    // Only run session timeout when a real auth token is present.
    // In demo mode (no token) there is no server session to expire.
    if (!getToken()) return;
    const bump = () => { lastActivityRef.current = Date.now(); };
    ["mousemove","keydown","click","scroll"].forEach(e => window.addEventListener(e, bump, { passive: true }));
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > 30 * 60 * 1000) onTimeout();
    }, 60_000);
    return () => {
      ["mousemove","keydown","click","scroll"].forEach(e => window.removeEventListener(e, bump));
      clearInterval(interval);
    };
  }, [onTimeout]);
}

// ─── Filter persistence ───────────────────────────────────────────────────────
function loadPersistedFilters() {
  try {
    const raw = localStorage.getItem("dd_filters");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (getToken()) {
      const isUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (parsed.boardId && !isUUID(parsed.boardId)) parsed.boardId = null;
      if (parsed.managerId && !isUUID(parsed.managerId)) parsed.managerId = null;
    }
    return parsed;
  } catch { return null; }
}
function persistFilters(filters) {
  try { localStorage.setItem("dd_filters", JSON.stringify(filters)); } catch {}
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  });
  if (res.status === 401) { const err = new Error("SESSION_EXPIRED"); err.code = "SESSION_EXPIRED"; throw err; }
  if (res.status === 403) { const err = new Error("PERMISSION_DENIED"); err.code = "PERMISSION_DENIED"; throw err; }
  if (!res.ok) { const errData = await res.json().catch(() => ({})); const err = new Error(errData.message || `API error ${res.status}`); err.status = res.status; throw err; }
  return res.json();
}

let _lastFetchId = 0;
async function apiFetchRaceGuarded(path, opts = {}) {
  const id = ++_lastFetchId;
  const data = await apiFetch(path, opts);
  if (id !== _lastFetchId) throw new Error("STALE_RESPONSE");
  return data;
}

const api = {
  getMatrix:        (params) => { const q = new URLSearchParams(Object.entries(params).filter(([,v])=>v!=null)); return apiFetchRaceGuarded(`/deal-drivers/matrix?${q}`); },
  getDrillDown:     (params) => { const q = new URLSearchParams(Object.entries(params).filter(([,v])=>v!=null)); return apiFetch(`/deal-drivers/drill-down?${q}`); },
  getBoardComparison:(params) => { const q = new URLSearchParams(Object.entries(params).filter(([,v])=>v!=null)); return apiFetch(`/deal-drivers/board-comparison?${q}`); },
  getCoaching:      (params) => { const q = new URLSearchParams(Object.entries(params).filter(([,v])=>v!=null)); return apiFetch(`/deal-drivers/coaching?${q}`); },
  getBoards:        () => apiFetch("/deal-drivers/boards"),
  getReps:          (managerId) => { const q = managerId ? `?managerId=${managerId}` : ""; return apiFetch(`/deal-drivers/reps${q}`); },
  getManagers:      () => apiFetch("/deal-drivers/managers"),
  getLastUsedBoard: () => apiFetch("/deal-drivers/last-used-board"),
  // GAP-8: correct path — board-warning-config controller is at /deal-drivers/boards/:boardId/warnings
  getBoardWarnings: (boardId) => apiFetch(`/deal-drivers/boards/${boardId}/warnings`),
  exportMatrixCsv:  (params) => { const q = new URLSearchParams(Object.entries(params).filter(([,v])=>v!=null)); return `${BASE}/deal-drivers/matrix/export?${q}`; },
  // FIX-3: accessibility check
  checkDealAccessible: async (url) => {
    try {
      const res = await fetch(`${BASE}${url}`, { method: "HEAD", headers: { Authorization: `Bearer ${getToken()}` } });
      return res.ok;
    } catch { return false; }
  },
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK = {
  boards: [
    { id: "b1", name: "Q2 Commit Board" },
    { id: "b2", name: "Early Stage Pipeline" },
    { id: "b3", name: "Enterprise Board" },
  ],
  managers: [
    { id: "m1", name: "Sarah Chen" },
    { id: "m2", name: "David Kim" },
    { id: "m3", name: "Maria Santos" },
  ],
  // GAP-9: mock reps (direct reports) derived from matrix rows
  reps: [
    { id: "r1", name: "James Okafor" },
    { id: "r2", name: "Priya Sharma" },
    { id: "r3", name: "Leo Nguyen" },
    { id: "r4", name: "Dana Mills" },
    { id: "r5", name: "Anika Patel" },
  ],
  matrix: {
    boardName: "Q2 Commit Board",
    warnings: [
      { warningId: "w1", label: "No next step" },
      { warningId: "w2", label: "Single-threaded" },
      { warningId: "w3", label: "No close plan" },
      { warningId: "w4", label: "Stale >14d" },
      { warningId: "w5", label: "Champion left" },
    ],
    rows: [
      // GAP-7: backend returns `segment` — we normalize to repSegment in enrichMatrixData
      { repId: "r1", repName: "James Okafor", segment: "Mid-market AE", dealCount: 12, cells: { w1: { percentage: 75, count: 9, heatmapRank: "HIGHEST", trainingNeeded: true }, w2: { percentage: 33, count: 4, heatmapRank: "NONE", trainingNeeded: false }, w3: { percentage: 58, count: 7, heatmapRank: "HIGHEST", trainingNeeded: true }, w4: { percentage: 17, count: 2, heatmapRank: "NONE", trainingNeeded: false }, w5: { percentage: 8, count: 1, heatmapRank: "NONE", trainingNeeded: false } } },
      { repId: "r2", repName: "Priya Sharma", segment: "Mid-market AE", dealCount: 9,  cells: { w1: { percentage: 56, count: 5, heatmapRank: "SECOND", trainingNeeded: true }, w2: { percentage: 78, count: 7, heatmapRank: "HIGHEST", trainingNeeded: true }, w3: { percentage: 67, count: 6, heatmapRank: "SECOND", trainingNeeded: true }, w4: { percentage: 33, count: 3, heatmapRank: "NONE", trainingNeeded: false }, w5: { percentage: 0, count: 0, heatmapRank: "NONE", trainingNeeded: false } } },
      { repId: "r3", repName: "Leo Nguyen",   segment: "SMB AE",         dealCount: 15, cells: { w1: { percentage: 40, count: 6, heatmapRank: "THIRD",  trainingNeeded: false }, w2: { percentage: 20, count: 3, heatmapRank: "NONE", trainingNeeded: false }, w3: { percentage: 40, count: 6, heatmapRank: "THIRD",  trainingNeeded: false }, w4: { percentage: 53, count: 8, heatmapRank: "HIGHEST", trainingNeeded: true }, w5: { percentage: 27, count: 4, heatmapRank: "SECOND", trainingNeeded: false } } },
      { repId: "r4", repName: "Dana Mills",   segment: "SMB AE",         dealCount: 7,  cells: { w1: { percentage: 14, count: 1, heatmapRank: "NONE",   trainingNeeded: false }, w2: { percentage: 57, count: 4, heatmapRank: "SECOND", trainingNeeded: true }, w3: { percentage: 14, count: 1, heatmapRank: "NONE",   trainingNeeded: false }, w4: { percentage: 43, count: 3, heatmapRank: "SECOND", trainingNeeded: false }, w5: { percentage: 43, count: 3, heatmapRank: "HIGHEST", trainingNeeded: false } } },
      { repId: "r5", repName: "Anika Patel",  segment: "Mid-market AE", dealCount: 11, cells: { w1: { percentage: 18, count: 2, heatmapRank: "NONE",   trainingNeeded: false }, w2: { percentage: 36, count: 4, heatmapRank: "THIRD",  trainingNeeded: false }, w3: { percentage: 18, count: 2, heatmapRank: "NONE",   trainingNeeded: false }, w4: { percentage: 36, count: 4, heatmapRank: "THIRD",  trainingNeeded: false }, w5: { percentage: 18, count: 2, heatmapRank: "THIRD",  trainingNeeded: false } } },
    ],
    teamAverage: { averages: { w1: 41, w2: 45, w3: 39, w4: 36, w5: 19 } },
    insightText: '"No next step", "Single-threaded", "No close plan" all show ⚠ — systemic issue, not individual coaching. 3 of 5 columns affected team-wide. Escalate enablement.',
  },
  drillDown: {
    repName: "James Okafor", warningName: "No next step", boardName: "Q2 Commit Board", period: "Now",
    flaggedCount: 9, totalDeals: 12,
    deals: [
      { dealId: "d1", accountName: "Meridian Health",     dealAmount: 84000,  crmStage: "Proposal sent",  closeDate: "2024-06-30", viewDealUrl: "/boards/b1/deals/d1?tab=warnings" },
      { dealId: "d2", accountName: "Stonebridge Capital", dealAmount: 210000, crmStage: "Verbal commit",  closeDate: "2024-06-15", viewDealUrl: "/boards/b1/deals/d2?tab=warnings" },
      { dealId: "d3", accountName: "Apex Technologies",   dealAmount: 55000,  crmStage: "Negotiation",   closeDate: "2024-07-31", viewDealUrl: "/boards/b1/deals/d3?tab=warnings" },
      { dealId: "d4", accountName: "Lumina Retail Group", dealAmount: 127500, crmStage: "Demo done",     closeDate: "2024-06-28", viewDealUrl: "/boards/b1/deals/d4?tab=warnings" },
      { dealId: "d5", accountName: "Castleford Logistics",dealAmount: 38000,  crmStage: "Proposal sent", closeDate: "2024-07-15", viewDealUrl: "/boards/b1/deals/d5?tab=warnings" },
    ],
  },
  boardComparison: {
    baselineBoard:   { boardId: "b2", boardName: "Early Stage Pipeline", warnings: [{ warningId: "w1", label: "No next step", percentage: 28 }, { warningId: "w2", label: "Single-threaded", percentage: 35 }, { warningId: "w3", label: "No close plan", percentage: 18 }, { warningId: "w4", label: "Stale >14d", percentage: 40 }, { warningId: "w5", label: "Champion left", percentage: 8 }] },
    comparisonBoard: { boardId: "b1", boardName: "Q2 Commit Board",      warnings: [{ warningId: "w1", label: "No next step", percentage: 41 }, { warningId: "w2", label: "Single-threaded", percentage: 46 }, { warningId: "w3", label: "No close plan", percentage: 39 }, { warningId: "w4", label: "Stale >14d", percentage: 36 }, { warningId: "w5", label: "Champion left", percentage: 19 }] },
    insightText: '"No next step" worsens from 28% → 41% and "Single-threaded" 35% → 46% as deals mature. Problem worsens at closing stage — not discovery. Closing process enablement needed.',
  },
  // GAP-5: mock coaching now uses correct field names matching backend entity (baselineSnapshot/currentSnapshot)
  coaching: {
    repName: "James Okafor",
    insightText: 'All four metrics improved for James. "No next step" dropped 83% → 75%. Coaching is working — continue reinforcement. No regression detected.',
    repSummary: { overallDirection: "IMPROVING" },
    baselineSnapshot: [{ warningId: "w1", label: "No next step", percentage: 83 }, { warningId: "w2", label: "Single-threaded", percentage: 42 }, { warningId: "w3", label: "No close plan", percentage: 67 }, { warningId: "w4", label: "Stale >14d", percentage: 25 }],
    currentSnapshot:  [{ warningId: "w1", label: "No next step", percentage: 75, direction: "IMPROVED" }, { warningId: "w2", label: "Single-threaded", percentage: 33, direction: "IMPROVED" }, { warningId: "w3", label: "No close plan", percentage: 58, direction: "IMPROVED" }, { warningId: "w4", label: "Stale >14d", percentage: 17, direction: "IMPROVED" }],
  },
  boardWarnings: [
    { warningId: "w1", label: "No next step", isEnabled: true },
    { warningId: "w2", label: "Single-threaded", isEnabled: true },
    { warningId: "w3", label: "No close plan", isEnabled: true },
    { warningId: "w4", label: "Stale >14d", isEnabled: true },
  ],
};

// ─── Utils ────────────────────────────────────────────────────────────────────
const formatCurrency = (n) => `$${Number(n).toLocaleString()}`;
const formatDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch { return d; }
};
const CRM_STAGE_COLORS = {
  "Proposal sent": { bg: "#DBEAFE", text: "#1D4ED8" }, "Verbal commit": { bg: "#DCFCE7", text: "#166534" },
  "Negotiation":   { bg: "#FEF3C7", text: "#92400E" }, "Demo done":    { bg: "#EDE9FE", text: "#6D28D9" },
  default:         { bg: "#F3F4F6", text: "#374151" },
};
const getStageColor = (stage) => CRM_STAGE_COLORS[stage] || CRM_STAGE_COLORS.default;

// ─── Heatmap computation ───────────────────────────────────────────────────────
function computeHeatmapRanks(rows, warningId) {
  const pcts = rows.map((r) => r.cells?.[warningId]?.percentage ?? 0);
  const nonZeroPcts = [...new Set(pcts.filter((p) => p > 0))].sort((a, b) => b - a);
  const thresholds = nonZeroPcts.slice(0, 3);
  const result = {};
  rows.forEach((row) => {
    const pct = row.cells?.[warningId]?.percentage ?? 0;
    const idx = thresholds.indexOf(pct);
    result[row.repId] = idx === 0 ? "HIGHEST" : idx === 1 ? "SECOND" : idx === 2 ? "THIRD" : "NONE";
  });
  const yellowCount = Object.values(result).filter((r) => r !== "NONE").length;
  return { ranks: result, trainingNeeded: yellowCount >= 4 };
}

// GAP-7: normalize backend `segment` → `repSegment` here
function enrichMatrixData(matrixData) {
  if (!matrixData) return { warnings: [], rows: [], teamAverage: null, insightText: "", _trainingByWarning: {} };
  const warnings = matrixData.warnings || [];
  const rows = (matrixData.rows || []).map((row) => ({
    ...row,
    // GAP-7: backend sends `segment`, normalize to repSegment for UI consistency
    repSegment: row.repSegment ?? row.segment ?? null,
    cells: { ...(row.cells || {}) },
  }));
  const _trainingByWarning = {};
  warnings.forEach((w) => {
    const { ranks, trainingNeeded } = computeHeatmapRanks(rows, w.warningId);
    _trainingByWarning[w.warningId] = trainingNeeded;
    rows.forEach((row) => {
      if (row.cells[w.warningId]) {
        row.cells[w.warningId] = { ...row.cells[w.warningId], heatmapRank: ranks[row.repId] || "NONE", trainingNeeded };
      }
    });
  });
  return { warnings, rows, teamAverage: matrixData.teamAverage, insightText: matrixData.insightText, _trainingByWarning };
}

// FIX-4: dynamically computed CRO insight line
function computeCROInsightLine(enrichedMatrixData) {
  if (!enrichedMatrixData?._trainingByWarning) return null;
  const total    = Object.keys(enrichedMatrixData._trainingByWarning).length;
  const affected = Object.values(enrichedMatrixData._trainingByWarning).filter(Boolean).length;
  if (affected === 0 || total === 0) return null;
  return `${affected} of ${total} columns affected team-wide. ${affected >= total / 2 ? "Escalate enablement." : "Monitor and coach individually."}`;
}

// ─── Shared Components ────────────────────────────────────────────────────────
function Spinner() {
  return <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><div style={{ width: 28, height: 28, border: "3px solid #E5E7EB", borderTopColor: "#2563EB", borderRadius: "50%", animation: "dd-spin 0.7s linear infinite" }} /></div>;
}

function EmptyState({ icon = "📭", title, body, action }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 24px", color: "#6B7280" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 15, color: "#374151", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{body}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

function AccessError({ code, context }) {
  const msgs = {
    SESSION_EXPIRED:  { title: "Session expired", body: "Your session has expired. Please refresh the page to log in again.", icon: "🔒" },
    PERMISSION_DENIED:{ title: "Access denied",   body: "You don't have permission to view this data. Contact your admin if you believe this is an error.", icon: "🚫" },
  };
  const m = msgs[code] || { title: "Something went wrong", body: context || "An unexpected error occurred. Try refreshing the page.", icon: "⚠️" };
  return (
    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: 24, margin: "24px 0", textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{m.icon}</div>
      <div style={{ fontWeight: 600, fontSize: 16, color: "#991B1B", marginBottom: 6 }}>{m.title}</div>
      <div style={{ fontSize: 13, color: "#7F1D1D" }}>{m.body}</div>
    </div>
  );
}

function SearchableManagerDropdown({ managers, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const filtered = useMemo(() => (managers || []).filter((m) => m.name.toLowerCase().includes(search.toLowerCase())), [managers, search]);
  const selected = managers?.find((m) => m.id === value);
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", minWidth: 180 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: selected ? "#111827" : "#9CA3AF" }}>
        <span>{selected?.name || placeholder || "Select…"}</span>
        <span style={{ color: "#9CA3AF", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 100, maxHeight: 240, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ margin: 8, padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13, outline: "none" }} />
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 ? <div style={{ padding: "10px 16px", fontSize: 13, color: "#9CA3AF" }}>No results</div> : filtered.map((m) => (
              <div key={m.id} onClick={() => { onChange(m.id); setOpen(false); setSearch(""); }} style={{ padding: "8px 14px", cursor: "pointer", fontSize: 14, color: "#111827", background: m.id === value ? "#EFF6FF" : "transparent", fontWeight: m.id === value ? 600 : 400 }}
                onMouseEnter={(e) => { if (m.id !== value) e.target.style.background = "#F9FAFB"; }}
                onMouseLeave={(e) => { if (m.id !== value) e.target.style.background = "transparent"; }}>
                {m.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Select({ value, onChange, options, placeholder, style, disabled }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, background: "#fff", color: value ? "#111827" : "#9CA3AF", cursor: disabled ? "not-allowed" : "pointer", ...style }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Virtual Table (large teams) ──────────────────────────────────────────────
const ROW_HEIGHT = 48;
const BUFFER = 3;
function VirtualTable({ rows, warnings, onCellClick, containerHeight = 480 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + BUFFER * 2;
  const endIdx = Math.min(rows.length, startIdx + visibleCount);
  const visibleRows = rows.slice(startIdx, endIdx);
  const paddingTop = startIdx * ROW_HEIGHT;
  const paddingBottom = Math.max(0, (rows.length - endIdx) * ROW_HEIGHT);
  return (
    <div ref={containerRef} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)} style={{ height: containerHeight, overflowY: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "fixed" }}>
        <tbody>
          <tr style={{ height: paddingTop }}><td colSpan={warnings.length + 2} /></tr>
          {visibleRows.map((row) => (
            <tr key={row.repId} style={{ borderBottom: "1px solid #F3F4F6", height: ROW_HEIGHT }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <td style={{ padding: "6px 12px", fontWeight: 600, fontSize: 13, color: "#111827", width: 160 }}>
                {row.repName}
                {row.repSegment && <div style={{ fontSize: 10, color: "#9CA3AF" }}>{row.repSegment}</div>}
              </td>
              <td style={{ padding: "6px 12px", textAlign: "center", color: "#374151", fontWeight: 500, width: 80 }}>{row.dealCount}</td>
              {warnings.map((w) => {
                const cell = row.cells?.[w.warningId];
                const rank = cell?.heatmapRank || "NONE";
                const pct  = row.dealCount === 0 ? "—" : (cell?.percentage != null ? `${cell.percentage}%` : "—");
                const hc   = HEATMAP_COLORS[rank];
                return (
                  <td key={w.warningId} title={row.dealCount === 0 ? "No deals in period" : `${cell?.count ?? 0} of ${row.dealCount} deals had this warning`}
                    onClick={() => onCellClick({ row, warning: w })}
                    style={{ padding: "4px 8px", textAlign: "center", cursor: "pointer" }}>
                    <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 6, background: hc.bg, color: hc.text, fontWeight: rank !== "NONE" ? 700 : 500, fontSize: 13, minWidth: 40 }}>{pct}</span>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr style={{ height: paddingBottom }}><td colSpan={warnings.length + 2} /></tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Deal Drivers Matrix ───────────────────────────────────────────────────────
// FIX-1: sort state as props (lifted to parent)
function DealDriversMatrix({ matrixData, onCellClick, loading, sortCol, sortDir, onSort, onExport }) {
  const enriched = enrichMatrixData(matrixData);
  const { warnings, rows, teamAverage, insightText, _trainingByWarning } = enriched;
  const croInsightLine = computeCROInsightLine(enriched);

  if (loading) return <Spinner />;
  if (!matrixData || warnings.length === 0) return <EmptyState icon="⚙️" title="No warnings configured" body="The selected deal board has no warnings enabled. Ask your admin to configure warnings for this board." />;
  if (rows.length === 0) return <EmptyState icon="📋" title="No deals found" body="There are no deals open for ≥ 1 day in the selected period for this team." />;

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ color: "#CBD5E1", fontSize: 10, marginLeft: 2 }}>⇅</span>;
    return <span style={{ color: "#2563EB", fontSize: 10, marginLeft: 2 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const sortedRows = [...rows].sort((a, b) => {
    let av, bv;
    if (sortCol === "repName")    { av = a.repName; bv = b.repName; }
    else if (sortCol === "dealCount") { av = a.dealCount; bv = b.dealCount; }
    else { av = a.cells?.[sortCol]?.percentage ?? -1; bv = b.cells?.[sortCol]?.percentage ?? -1; }
    if (av === bv) return 0;
    const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div>
      {/* GAP-1: Export CSV button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        {onExport && (
          <button onClick={onExport} style={{ padding: "6px 14px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
            ⬇ Export CSV
          </button>
        )}
      </div>

      {rows.length > 50 ? (
        <>
          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6, padding: "6px 12px", fontSize: 12, color: "#1D4ED8", marginBottom: 8 }}>
            Showing {rows.length} reps — scrollable table with performance optimisation active.
          </div>
          <VirtualTable rows={sortedRows} warnings={warnings} onCellClick={onCellClick} />
        </>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
                <th onClick={() => onSort("repName")} style={{ padding: "10px 12px", textAlign: "left", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#374151", userSelect: "none" }}>Rep name <SortIcon col="repName" /></th>
                <th onClick={() => onSort("dealCount")} style={{ padding: "10px 12px", textAlign: "center", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#374151", userSelect: "none" }}>Deal count <SortIcon col="dealCount" /></th>
                {warnings.map((w) => (
                  <th key={w.warningId} onClick={() => onSort(w.warningId)} style={{ padding: "10px 8px", textAlign: "center", cursor: "pointer", fontWeight: 600, fontSize: 12, color: "#374151", userSelect: "none", maxWidth: 120 }}>
                    <div>{w.label} <SortIcon col={w.warningId} /></div>
                    {_trainingByWarning[w.warningId] && <div style={{ fontSize: 11, color: "#D97706", fontWeight: 500, marginTop: 2 }}>⚠ Team training needed</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.repId} style={{ borderBottom: "1px solid #F3F4F6" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, fontSize: 14, color: "#111827" }}>
                    {row.repName}
                    {row.repSegment && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{row.repSegment}</div>}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: "#374151", fontWeight: 600 }}>{row.dealCount}</td>
                  {warnings.map((w) => {
                    const cell  = row.cells?.[w.warningId];
                    const rank  = cell?.heatmapRank || "NONE";
                    const pct   = row.dealCount === 0 ? "—" : (cell?.percentage != null ? `${cell.percentage}%` : "—");
                    const tooltip = row.dealCount === 0 ? "No deals in period" : `${cell?.count ?? 0} of ${row.dealCount} deals had this warning`;
                    const hc    = HEATMAP_COLORS[rank];
                    return (
                      <td key={w.warningId} title={tooltip} onClick={() => onCellClick({ row, warning: w })}
                        style={{ padding: "6px 8px", textAlign: "center", cursor: "pointer" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#F0F9FF"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 6, background: hc.bg, color: hc.text, fontWeight: rank !== "NONE" ? 700 : 500, fontSize: 13, minWidth: 44 }}>{pct}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #E5E7EB", background: "#F9FAFB" }}>
                <td style={{ padding: "10px 12px", fontStyle: "italic", color: "#6B7280", fontWeight: 500 }}>Team average</td>
                <td style={{ padding: "10px 12px", textAlign: "center", color: "#6B7280" }}>—</td>
                {warnings.map((w) => (
                  <td key={w.warningId} style={{ padding: "10px 8px", textAlign: "center", color: "#6B7280", fontWeight: 500, fontSize: 13 }}>
                    {teamAverage?.averages?.[w.warningId] != null ? `${teamAverage.averages[w.warningId]}%` : "—"}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Heatmap legend */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "12px 12px 4px", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Heatmap:</span>
        {[{ rank: "HIGHEST", label: "Highest % (most urgent)" }, { rank: "SECOND", label: "2nd highest" }, { rank: "THIRD", label: "3rd highest" }].map(({ rank, label }) => (
          <span key={rank} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, background: HEATMAP_COLORS[rank].bg, border: "1px solid #E5E7EB", display: "inline-block" }} />
            {label}
          </span>
        ))}
      </div>
      <div style={{ padding: "2px 12px 8px", fontSize: 11, color: "#9CA3AF" }}>
        ⚠ Team training needed = 4+ reps yellow in same column &nbsp;·&nbsp; Ties share the same rank level
      </div>
      <div style={{ padding: "0 12px 12px", fontSize: 10, color: "#CBD5E1" }}>{PERIOD_FOOTNOTES.general}</div>

      {/* FIX-4: dynamic CRO insight */}
      {croInsightLine && (
        <div style={{ margin: "8px 0 4px", padding: "10px 16px", background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 8, fontSize: 13, color: "#0369A1" }}>
          <strong>Summary:</strong> {croInsightLine}
        </div>
      )}
      {/* Backend-generated insight */}
      {insightText && (
        <div style={{ margin: "6px 0 0", padding: "12px 16px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, fontSize: 13, color: "#92400E" }}>
          <strong>Insight:</strong> {insightText}
        </div>
      )}
    </div>
  );
}

// ─── Drill-Down Drawer ────────────────────────────────────────────────────────
function DrillDownDrawer({ selection, onClose }) {
  const [data, setData]                     = useState(null);
  const [loading, setLoading]               = useState(false);
  // FIX-3: per-deal accessibility errors
  const [dealErrors, setDealErrors]         = useState({});
  const [navigatingDealId, setNavigatingDealId] = useState(null);

  useEffect(() => {
    if (!selection) return;
    setLoading(true);
    setDealErrors({});
    api.getDrillDown({ repId: selection.row.repId, warningId: selection.warning.warningId, boardId: selection.boardId, period: selection.period })
      .then(setData)
      .catch(() => setData(MOCK.drillDown))
      .finally(() => setLoading(false));
  }, [selection]);

  // FIX-3: check accessibility before navigating
  async function handleViewDeal(deal) {
    setNavigatingDealId(deal.dealId);
    const accessible = await api.checkDealAccessible(deal.viewDealUrl);
    setNavigatingDealId(null);
    if (accessible) { window.location.href = deal.viewDealUrl; }
    else { setDealErrors((prev) => ({ ...prev, [deal.dealId]: "This deal is no longer accessible. It may have been deleted or your permissions may have changed." })); }
  }

  if (!selection) return null;
  const d = data;
  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 200, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E5E7EB", background: "#fff", position: "sticky", top: 0, zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{d?.repName || selection.row.repName} — {selection.warning.label}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
              {d ? `${d.flaggedCount ?? d.deals?.length ?? 0} of ${d.totalDeals ?? selection.row.dealCount} deals had this warning active ≥ 1 day` : `Period: ${selection.period} · Board: ${selection.boardId}`}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* FIX-2: absolute count badge */}
            {d && <span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{d.flaggedCount ?? d.deals?.length ?? 0} deals flagged</span>}
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 20, lineHeight: 1, padding: "0 2px" }}>×</button>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "16px 24px" }}>
        {loading && <Spinner />}
        {!loading && d && (
          d.deals?.length === 0
          ? <EmptyState icon="🔍" title="No deals match this filter" body={`No deals for ${d.repName || "this rep"} had the "${selection.warning.label}" warning active ≥ 1 day in the selected period.`} />
          : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                  {["Account name", "Deal amount", "CRM stage", "Close date", "Action"].map((h) => (
                    <th key={h} style={{ padding: "8px 8px", textAlign: "left", fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.deals.map((deal) => {
                  const sc = getStageColor(deal.crmStage);
                  return (
                    <>
                      <tr key={deal.dealId} style={{ borderBottom: dealErrors[deal.dealId] ? "none" : "1px solid #F3F4F6" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "10px 8px", fontWeight: 600, color: "#111827" }}>{deal.accountName}</td>
                        <td style={{ padding: "10px 8px", color: "#374151" }}>{formatCurrency(deal.dealAmount ?? deal.amount)}</td>
                        <td style={{ padding: "10px 8px" }}><span style={{ background: sc.bg, color: sc.text, borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 500 }}>{deal.crmStage}</span></td>
                        <td style={{ padding: "10px 8px", color: "#6B7280" }}>{formatDate(deal.closeDate)}</td>
                        <td style={{ padding: "10px 8px" }}>
                          <button onClick={() => handleViewDeal(deal)} disabled={navigatingDealId === deal.dealId}
                            style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontSize: 13, textDecoration: "underline", padding: 0, whiteSpace: "nowrap" }}>
                            {navigatingDealId === deal.dealId ? "Checking…" : "View deal ↗"}
                          </button>
                        </td>
                      </tr>
                      {dealErrors[deal.dealId] && (
                        <tr key={`${deal.dealId}-err`} style={{ borderBottom: "1px solid #F3F4F6" }}>
                          <td colSpan={5} style={{ padding: "4px 8px 10px" }}>
                            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#991B1B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>{dealErrors[deal.dealId]}</span>
                              <button onClick={() => setDealErrors((prev) => { const n = { ...prev }; delete n[deal.dealId]; return n; })} style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer", padding: "0 2px", fontSize: 14 }}>×</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>
      <div style={{ padding: "12px 24px", borderTop: "1px solid #E5E7EB", fontSize: 11, color: "#9CA3AF" }}>
        View deal → opens account page on selected deal board → auto-opens Warnings tab for that deal
      </div>
    </div>
  );
}

// ─── Board Comparison Tab ─────────────────────────────────────────────────────
// GAP-3: Now also visible to SM (was CRO-only)
function BoardComparisonTab({ boards, role, managerId: defaultManagerId }) {
  const [baselineId,    setBaselineId]    = useState("");
  const [comparisonId,  setComparisonId]  = useState("");
  // GAP-3: SM can select their own manager context; CRO can select any manager
  const [managerId,     setManagerId]     = useState(defaultManagerId || "");
  const [managers,      setManagers]      = useState([]);
  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [copied,        setCopied]        = useState(false);
  const [sameBoardError, setSameBoardError] = useState(false);

  useEffect(() => {
    // Only CRO/admin need a manager selector; SM is locked to their own team
    if (role === "cro" || role === "admin" || role === "revops") {
      api.getManagers().then(setManagers).catch(() => setManagers(MOCK.managers));
    }
  }, [role]);

  const handleBaselineChange = (id) => {
    setSameBoardError(id === comparisonId && !!id);
    setBaselineId(id);
  };
  const handleComparisonChange = (id) => {
    setSameBoardError(id === baselineId && !!id);
    setComparisonId(id);
  };

  useEffect(() => {
    if (!baselineId || !comparisonId || baselineId === comparisonId) return;
    setLoading(true);
    const params = { baselineBoardId: baselineId, comparisonBoardId: comparisonId };
    if (managerId) params.managerId = managerId;
    api.getBoardComparison(params)
      .then(setData)
      .catch(() => setData(MOCK.boardComparison))
      .finally(() => setLoading(false));
  }, [baselineId, comparisonId, managerId]);

  const boardOptions = boards.map((b) => ({ value: b.id, label: b.name }));
  const managerOptions = managers.map((m) => ({ value: m.id, label: m.name }));

  // Compute all unique warning labels across both boards
  const allWarningLabels = useMemo(() => {
    if (!data) return [];
    const set = new Set();
    (data.baselineBoard?.warnings || []).forEach((w) => set.add(w.label));
    (data.comparisonBoard?.warnings || []).forEach((w) => set.add(w.label));
    return [...set];
  }, [data]);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20, alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>Step 1 — Baseline Deal Board</div>
          <Select value={baselineId} onChange={handleBaselineChange} options={boardOptions} placeholder="Early-stage board…" />
        </div>
        <div style={{ fontSize: 20, color: "#9CA3AF", paddingBottom: 8 }}>→</div>
        <div>
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>Step 2 — Comparison Deal Board</div>
          <Select value={comparisonId} onChange={handleComparisonChange} options={boardOptions} placeholder="Late-stage board…" />
        </div>
        {(role === "cro" || role === "admin" || role === "revops") && (
          <div>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>Team (optional)</div>
            <Select value={managerId} onChange={setManagerId} options={managerOptions} placeholder="All teams" />
          </div>
        )}
      </div>

      {sameBoardError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991B1B", marginBottom: 16 }}>
          ⚠ Baseline and comparison boards must be different.
        </div>
      )}

      {loading && <Spinner />}

      {!loading && data && !sameBoardError && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Baseline */}
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
              <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#374151" }}>{data.baselineBoard?.boardName || "Baseline board"} — warning rates</h4>
              {(data.baselineBoard?.warnings || []).map((w) => (
                <div key={w.warningId || w.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <div style={{ width: 140, fontSize: 13, color: "#374151", flexShrink: 0 }}>{w.label}</div>
                  <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 4, height: 8, maxWidth: 160 }}>
                    <div style={{ width: `${Math.min(w.percentage, 100)}%`, height: "100%", background: "#93C5FD", borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 36, textAlign: "right", fontWeight: 600, fontSize: 13 }}>{w.percentage}%</div>
                </div>
              ))}
            </div>
            {/* Comparison */}
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
              <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#374151" }}>{data.comparisonBoard?.boardName || "Comparison board"} — warning rates</h4>
              {(data.comparisonBoard?.warnings || []).map((w) => {
                const baseW = (data.baselineBoard?.warnings || []).find((x) => x.label === w.label);
                const worsened = baseW && w.percentage > baseW.percentage;
                return (
                  <div key={w.warningId || w.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ width: 140, fontSize: 13, color: "#374151", flexShrink: 0 }}>{w.label}</div>
                    <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 4, height: 8, maxWidth: 160 }}>
                      <div style={{ width: `${Math.min(w.percentage, 100)}%`, height: "100%", background: worsened ? "#FCA5A5" : "#86EFAC", borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 52, textAlign: "right", fontSize: 13, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                      <span style={{ fontWeight: 600 }}>{w.percentage}%</span>
                      {baseW && w.percentage !== baseW.percentage && <span style={{ fontSize: 11, color: worsened ? "#DC2626" : "#16A34A" }}>{worsened ? "↑" : "↓"}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overlapping warnings summary */}
          {allWarningLabels.length > 0 && (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Overlapping warnings — percentage comparison</div>
              {allWarningLabels.map((label) => {
                const bw = (data.baselineBoard?.warnings || []).find((x) => x.label === label);
                const cw = (data.comparisonBoard?.warnings || []).find((x) => x.label === label);
                if (!bw || !cw) return null;
                const delta = cw.percentage - bw.percentage;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "5px 0", borderBottom: "1px solid #F1F5F9", fontSize: 13 }}>
                    <div style={{ width: 140, color: "#374151", flexShrink: 0 }}>{label}</div>
                    <div style={{ color: "#64748B" }}>{bw.percentage}%</div>
                    <div style={{ color: "#9CA3AF" }}>→</div>
                    <div style={{ color: "#374151", fontWeight: 600 }}>{cw.percentage}%</div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: delta > 0 ? "#DC2626" : delta < 0 ? "#16A34A" : "#9CA3AF" }}>
                      {delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FIX-5: dynamic insight */}
          {data.insightText && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div><strong style={{ fontSize: 13, color: "#92400E" }}>CRO insight: </strong><span style={{ fontSize: 13, color: "#92400E" }}>{data.insightText}</span></div>
              <button onClick={() => { navigator.clipboard?.writeText(data.insightText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ padding: "5px 12px", border: "1px solid #FCD34D", borderRadius: 6, background: copied ? "#FEF3C7" : "#fff", cursor: "pointer", fontSize: 12, color: "#92400E", whiteSpace: "nowrap", flexShrink: 0 }}>
                {copied ? "Copied ✓" : "Copy insight"}
              </button>
            </div>
          )}
        </>
      )}

      {!loading && !data && !baselineId && (
        <EmptyState icon="🔀" title="Select two deal boards to compare" body="Choose a baseline (early-stage) and a comparison (late-stage) board above to see how warning rates change across the pipeline." />
      )}
    </div>
  );
}

// ─── Coaching Effectiveness Tab ───────────────────────────────────────────────
// GAP-2: Now visible to CRO too (was SM-only)
// GAP-4: Rep dropdown uses direct reports (reps) not managers
// GAP-5: Field mapping fixed (baselineSnapshot → baseline in UI, currentSnapshot → current)
function CoachingEffectivenessTab({ boards, reps }) {
  const [repId,   setRepId]   = useState("");
  const [boardId, setBoardId] = useState("");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  const boardOptions = (boards || []).map((b) => ({ value: b.id, label: b.name }));
  // GAP-4: use `reps` (direct reports), not managers
  const repOptions  = (reps  || []).map((r) => ({ value: r.id, label: r.name }));

  useEffect(() => {
    if (!repId || !boardId) return;
    setLoading(true);
    api.getCoaching({ repId, boardId })
      .then(setData)
      .catch(() => setData(MOCK.coaching))
      .finally(() => setLoading(false));
  }, [repId, boardId]);

  const direction = data?.repSummary?.overallDirection;
  const directionStyle = { IMPROVING: { color: "#16A34A", icon: "↑ Improving" }, REGRESSING: { color: "#DC2626", icon: "↓ Regressing" }, MIXED: { color: "#D97706", icon: "↔ Mixed" }, NO_CHANGE: { color: "#6B7280", icon: "→ No change" } }[direction] || { color: "#6B7280", icon: "" };

  // GAP-5: backend returns baselineSnapshot/currentSnapshot — normalize here
  const baselineWarnings = data?.baselineSnapshot || data?.baseline?.warnings || [];
  const currentWarnings  = data?.currentSnapshot  || data?.current?.warnings  || [];
  const hasBaseline = baselineWarnings.length > 0 && baselineWarnings.some((w) => w.percentage != null);
  const hasCurrent  = currentWarnings.length  > 0 && currentWarnings.some((w) => w.percentage != null);
  const partialData = data && (!hasBaseline || !hasCurrent);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>Rep</div>
          {/* GAP-4: uses repOptions (direct reports), not managerOptions */}
          <Select value={repId} onChange={setRepId} options={repOptions} placeholder="Select rep…" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>Deal Board</div>
          <Select value={boardId} onChange={setBoardId} options={boardOptions} placeholder="Select board…" />
        </div>
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 20, marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>Comparing:</span>
        <span style={{ background: "#374151", color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 11 }}>Last 30 days</span>
        <span style={{ fontSize: 12, color: "#374151" }}>vs</span>
        <span style={{ background: "#2563EB", color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 11 }}>Now</span>
      </div>

      {loading && <Spinner />}

      {partialData && (
        <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400E", marginBottom: 16 }}>
          ⚠ {!hasBaseline ? "No data available for the Last 30 days period." : "No data available for the current (Now) period."} Showing available data only.
        </div>
      )}

      {!loading && data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
              <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#374151" }}>{data.repName || "Rep"} — last 30 days</h4>
              {!hasBaseline ? <EmptyState icon="📭" title="No data for last 30 days" body="This rep had no qualifying deals in the last 30-day period." /> : (
                baselineWarnings.map((w) => (
                  <div key={w.warningId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ width: 130, fontSize: 13, color: "#374151", flexShrink: 0 }}>{w.label}</div>
                    <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 4, height: 8, maxWidth: 160 }}>
                      <div style={{ width: `${Math.min(w.percentage ?? 0, 100)}%`, height: "100%", background: "#F59E0B", borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 36, textAlign: "right", fontWeight: 600, fontSize: 13 }}>{w.percentage != null ? `${w.percentage}%` : "—"}</div>
                  </div>
                ))
              )}
            </div>
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
              <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#374151" }}>{data.repName || "Rep"} — now</h4>
              {!hasCurrent ? <EmptyState icon="📭" title="No current data" body="This rep has no active qualifying deals at the current moment." /> : (
                currentWarnings.map((w) => {
                  const baseline = baselineWarnings.find((b) => b.warningId === w.warningId);
                  // GAP-5: direction may come directly from currentSnapshot
                  const direction = w.direction || (baseline && w.percentage != null && baseline.percentage != null ? (w.percentage < baseline.percentage ? "IMPROVED" : w.percentage > baseline.percentage ? "REGRESSED" : "UNCHANGED") : null);
                  const improved  = direction === "IMPROVED";
                  const regressed = direction === "REGRESSED";
                  return (
                    <div key={w.warningId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
                      <div style={{ width: 130, fontSize: 13, color: "#374151", flexShrink: 0 }}>{w.label}</div>
                      <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 4, height: 8, maxWidth: 160 }}>
                        <div style={{ width: `${Math.min(w.percentage ?? 0, 100)}%`, height: "100%", background: improved ? "#86EFAC" : regressed ? "#FCA5A5" : "#93C5FD", borderRadius: 4 }} />
                      </div>
                      <div style={{ width: 52, textAlign: "right", fontSize: 13, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                        <span style={{ fontWeight: 600 }}>{w.percentage != null ? `${w.percentage}%` : "—"}</span>
                        {improved  && <span style={{ color: "#16A34A", fontSize: 12 }}>↓</span>}
                        {regressed && <span style={{ color: "#DC2626", fontSize: 12 }}>↑</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {direction && (
            <div style={{ marginBottom: 12, padding: "8px 14px", borderRadius: 8, background: "#F9FAFB", display: "inline-block" }}>
              <span style={{ fontWeight: 700, color: directionStyle.color, fontSize: 14 }}>{directionStyle.icon}</span>
            </div>
          )}

          {/* FIX-5: dynamic server insight */}
          {data.insightText && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "12px 16px" }}>
              <strong style={{ fontSize: 13, color: "#166534" }}>Manager reads: </strong>
              <span style={{ fontSize: 13, color: "#166534" }}>{data.insightText}</span>
            </div>
          )}
        </>
      )}

      {!loading && !data && (
        <EmptyState icon="📈" title="Select a rep and board" body="Choose a rep and deal board above to view coaching effectiveness comparison." />
      )}
    </div>
  );
}

// ─── Board-Scoped Analysis Tab ────────────────────────────────────────────────
// FIX-1: sort state managed here; reset on board change
function BoardScopedAnalysisTab({ period, managerId }) {
  const [boards,          setBoards]          = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [matrixData,      setMatrixData]      = useState(null);
  const [boardWarnings,   setBoardWarnings]   = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [showConfirmation,setShowConfirmation] = useState(false);
  const [drawerSelection, setDrawerSelection] = useState(null);
  // FIX-1: sort state owned here
  const [sortCol, setSortCol] = useState("repName");
  const [sortDir, setSortDir] = useState("asc");

  function handleSort(col) {
    setSortDir((d) => sortCol === col ? (d === "asc" ? "desc" : "asc") : "asc");
    setSortCol(col);
  }

  function handleBoardChange(newBoardId) {
    // FIX-1: reset sort on board change
    setSortCol("repName");
    setSortDir("asc");
    setSelectedBoardId(newBoardId);
    setMatrixData(null);
  }

  useEffect(() => {
    api.getBoards().then(setBoards).catch(() => setBoards(MOCK.boards));
  }, []);

  useEffect(() => {
    if (!selectedBoardId) return;
    // GAP-8: correct path /deal-drivers/boards/:boardId/warnings
    api.getBoardWarnings(selectedBoardId).then(setBoardWarnings).catch(() => setBoardWarnings(MOCK.boardWarnings));
  }, [selectedBoardId]);

  useEffect(() => {
    if (!selectedBoardId) return;
    setLoading(true);
    Promise.all([
      api.getMatrix({ boardId: selectedBoardId, managerId, period: period || "NOW" }).catch(() => MOCK.matrix),
    ]).then(([m]) => {
      setMatrixData(m);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    }).finally(() => setLoading(false));
  }, [selectedBoardId, managerId, period]);

  const boardOptions = boards.map((b) => ({ value: b.id, label: b.name }));
  const enabledWarnings = (boardWarnings || []).filter((w) => w.isEnabled !== false);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>Deal Board</div>
          <Select value={selectedBoardId} onChange={handleBoardChange} options={boardOptions} placeholder="Select board…" />
        </div>
        {showConfirmation && <div style={{ padding: "8px 12px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, fontSize: 12, color: "#166534" }}>✓ Board loaded</div>}
      </div>

      {boardWarnings && enabledWarnings.length > 0 && (
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#64748B" }}>
          <strong>Warnings on this board:</strong> {enabledWarnings.map((w) => w.label).join(" · ")}
        </div>
      )}

      {selectedBoardId ? (
        <>
          <DealDriversMatrix
            matrixData={matrixData}
            onCellClick={(sel) => setDrawerSelection({ ...sel, boardId: selectedBoardId, period: period || "NOW" })}
            loading={loading}
            sortCol={sortCol}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <DrillDownDrawer selection={drawerSelection} onClose={() => setDrawerSelection(null)} />
        </>
      ) : (
        <EmptyState icon="📊" title="Select a deal board" body="Choose a deal board above to see the warning matrix scoped to that board's deals and warnings." />
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function DealDriversApp() {
  const user = getUser();
  const role = user?.role || user?.roles?.[0] || "cro";
  const [demoRole,       setDemoRole]       = useState(role);
  const [sessionExpired, setSessionExpired] = useState(false);
  const handleTimeout = useCallback(() => setSessionExpired(true), []);
  useSessionTimeout(handleTimeout);

  const persisted = useMemo(() => loadPersistedFilters(), []);
  const [managers,      setManagers]      = useState([]);
  const [boards,        setBoards]        = useState([]);
  const [managerId,     setManagerId]     = useState(persisted?.managerId || null);
  const [boardId,       setBoardId]       = useState(persisted?.boardId || null);
  const [period,        setPeriod]        = useState(persisted?.period || "NOW");
  const [activeTab,     setActiveTab]     = useState("overview");
  const [matrixData,    setMatrixData]    = useState(null);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [drawerSelection, setDrawerSelection] = useState(null);
  const [accessError,   setAccessError]   = useState(null);
  // FIX-1: sort state for overview tab
  const [sortCol, setSortCol] = useState("repName");
  const [sortDir, setSortDir] = useState("asc");
  // GAP-9: reps derived from last matrix load (for coaching tab rep selector)
  const [lastMatrixReps, setLastMatrixReps] = useState([]);

  function handleSort(col) {
    setSortDir((d) => sortCol === col ? (d === "asc" ? "desc" : "asc") : "asc");
    setSortCol(col);
  }

  const matrixFetchIdRef = useRef(0);

  const effectiveIsSM    = demoRole === "sales_manager";
  const effectiveIsAdmin = demoRole === "admin" || demoRole === "revops";
  const isRepRole        = demoRole === "sales_rep";

  // Tab visibility — GAP-2 & GAP-3: coaching for all; comparison for all non-rep
  const tabs = [
    { id: "overview",     label: "Executive Overview",    visible: !isRepRole },
    { id: "comparison",   label: "Deal Board Comparison", visible: !isRepRole },   // GAP-3: was CRO/Admin only
    { id: "coaching",     label: "Coaching Effectiveness", visible: !isRepRole },  // GAP-2: was SM only
    { id: "board-scoped", label: "Board-Scoped Analysis", visible: effectiveIsSM || effectiveIsAdmin },
  ].filter((t) => t.visible);

  useEffect(() => {
    if (!tabs.find((t) => t.id === activeTab)) setActiveTab("overview");
  }, [demoRole]);

  useEffect(() => {
    api.getBoards().then(setBoards).catch(() => setBoards(MOCK.boards));
    if (effectiveIsSM) {
      const me = { id: user?.sub || "self", name: user?.name || "My team" };
      setManagers([me]);
      setManagerId(me.id);
    } else {
      api.getManagers().then(setManagers).catch(() => setManagers(MOCK.managers));
    }
  }, [demoRole]);

  // GAP-9: load direct reports whenever managerId changes (for coaching tab)
  useEffect(() => {
    if (!managerId && !effectiveIsSM) return;
    api.getReps(managerId)
      .then((reps) => { if (reps?.length) setLastMatrixReps(reps); })
      .catch(() => setLastMatrixReps(MOCK.reps));
  }, [managerId, demoRole]);

  useEffect(() => {
    persistFilters({ managerId, boardId, period });
  }, [managerId, boardId, period]);

  useEffect(() => {
    if (activeTab !== "overview") return;
    if (!boardId) return;
    // GAP-6: CRO must select a manager first
    if (!managerId && !effectiveIsSM) return;

    const fetchId = ++matrixFetchIdRef.current;
    const timer = setTimeout(() => { if (fetchId === matrixFetchIdRef.current) setMatrixLoading(true); }, 500);

    const params = { boardId, period };
    if (managerId) params.managerId = managerId;

    api.getMatrix(params)
      .then((data) => {
        if (fetchId !== matrixFetchIdRef.current) return;
        setMatrixData(data);
        setAccessError(null);
        // GAP-9: extract reps from matrix for coaching tab
        if (data?.rows?.length) {
          setLastMatrixReps(data.rows.map((r) => ({ id: r.repId, name: r.repName })));
        }
      })
      .catch((err) => {
        if (fetchId !== matrixFetchIdRef.current) return;
        if (err.code === "SESSION_EXPIRED") {
            // Only show session-expired screen when a real token was in use.
            // Without a token we're in demo/mock mode — just fall through to mock data.
            if (getToken()) { setSessionExpired(true); return; }
          }
        if (err.code === "PERMISSION_DENIED") { setAccessError("PERMISSION_DENIED"); return; }
        if (err.message === "STALE_RESPONSE") return;
        setMatrixData(MOCK.matrix);
        setLastMatrixReps(MOCK.reps);
      })
      .finally(() => { clearTimeout(timer); if (fetchId === matrixFetchIdRef.current) setMatrixLoading(false); });

    return () => { clearTimeout(timer); };
  }, [managerId, boardId, period, activeTab, demoRole]);

  const selectedManager = managers.find((m) => m.id === managerId);
  const selectedBoard   = boards.find((b) => b.id === boardId);
  const teamLabel  = effectiveIsSM ? (user?.name || "My direct reports") : (selectedManager?.name || "—");
  const boardLabel = selectedBoard?.name || "—";
  const periodLabel = periodOptions.find((p) => p.value === period)?.label || "Now";

  // GAP-1: export handler
  function handleExportCsv() {
    if (!boardId) return;
    const params = { boardId, period };
    if (managerId) params.managerId = managerId;
    // Add JWT to URL as query param for download (no custom headers in file download)
    const token = getToken();
    if (token) params.token = token;
    const url = api.exportMatrixCsv(params);
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (sessionExpired && getToken()) return <AccessError code="SESSION_EXPIRED" />;

  // Reps for coaching: use live matrix reps if available, else mock
  const coachingReps = lastMatrixReps.length > 0 ? lastMatrixReps : MOCK.reps;

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif", minHeight: "100vh", background: "#F8FAFC", color: "#111827" }}>
      <style>{`@keyframes dd-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, paddingBottom: 8 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>Deal Drivers</h1>
          {/* Demo role switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>Demo role:</span>
            {[["cro","CRO"],["sales_manager","Sales Mgr"],["admin","Admin"]].map(([r,label]) => (
              <button key={r} onClick={() => setDemoRole(r)} style={{ padding: "4px 10px", border: "1px solid", borderColor: demoRole === r ? "#2563EB" : "#E5E7EB", borderRadius: 6, background: demoRole === r ? "#EFF6FF" : "#fff", color: demoRole === r ? "#2563EB" : "#6B7280", fontWeight: demoRole === r ? 600 : 400, fontSize: 12, cursor: "pointer" }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Context banner */}
        <div style={{ padding: "8px 0", fontSize: 12, color: "#6B7280", borderBottom: "1px solid #F3F4F6", marginBottom: 0 }}>
          <span style={{ fontWeight: 500, color: "#374151" }}>Team:</span> {teamLabel} &nbsp;·&nbsp; <span style={{ fontWeight: 500, color: "#374151" }}>Board:</span> {boardLabel} &nbsp;·&nbsp; <span style={{ fontWeight: 500, color: "#374151" }}>Period:</span> {periodLabel}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, padding: "12px 0", flexWrap: "wrap", alignItems: "flex-end" }}>
          {!effectiveIsSM && (
            <div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4, fontWeight: 500 }}>Team / Manager</div>
              <SearchableManagerDropdown managers={managers} value={managerId} onChange={setManagerId} placeholder="Select manager…" />
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4, fontWeight: 500 }}>Deal Board</div>
            <Select value={boardId || ""} onChange={setBoardId} options={boards.map((b) => ({ value: b.id, label: b.name }))} placeholder="Select board…" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4, fontWeight: 500 }}>Period</div>
            <Select value={period} onChange={setPeriod} options={periodOptions} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginTop: 0 }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "10px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? "#2563EB" : "#6B7280", borderBottom: activeTab === tab.id ? "2px solid #2563EB" : "2px solid transparent", transition: "all 0.15s", borderRadius: 0 }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        {accessError && <AccessError code={accessError} />}

        {/* Overview Tab */}
        {activeTab === "overview" && !accessError && (
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 24 }}>
            {/* GAP-6: CRO prompt when no manager selected */}
            {!effectiveIsSM && !managerId && (
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>👆</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1D4ED8", marginBottom: 2 }}>Select a manager to get started</div>
                  <div style={{ fontSize: 13, color: "#3B82F6" }}>Use the Team / Manager filter above to select a manager&apos;s team. No roll-up view is available in v1.</div>
                </div>
              </div>
            )}
            {!boardId && managerId && (
              <EmptyState icon="📋" title="Select a deal board" body="Choose a deal board from the filter above to load the Deal Drivers matrix." />
            )}
            {boardId && (managerId || effectiveIsSM) && (
              <DealDriversMatrix
                matrixData={matrixData}
                onCellClick={(sel) => setDrawerSelection({ ...sel, boardId, period })}
                loading={matrixLoading}
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={handleSort}
                onExport={handleExportCsv}
              />
            )}
          </div>
        )}

        {/* Board Comparison Tab — GAP-3: visible to all non-rep roles */}
        {activeTab === "comparison" && !isRepRole && (
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 24 }}>
            <div style={{ marginBottom: 4, fontSize: 13, color: "#6B7280", fontStyle: "italic" }}>&quot;Is our problem discovery, qualification, or closing?&quot;</div>
            <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#0369A1", marginBottom: 20 }}>
              Manual flow: select early-stage board → observe → switch to late-stage → compare. No charts — snapshot only.
            </div>
            <BoardComparisonTab boards={boards} role={demoRole} managerId={managerId} />
          </div>
        )}

        {/* Coaching Effectiveness Tab — GAP-2: visible to all non-rep roles */}
        {activeTab === "coaching" && !isRepRole && (
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 24 }}>
            <div style={{ marginBottom: 16, fontSize: 13, color: "#6B7280", fontStyle: "italic" }}>&quot;Did my coaching from last month actually move the needle?&quot;</div>
            {/* GAP-4 + GAP-9: pass reps (direct reports) not managers */}
            <CoachingEffectivenessTab boards={boards} reps={coachingReps} />
          </div>
        )}

        {/* Board-Scoped Analysis Tab */}
        {activeTab === "board-scoped" && (effectiveIsSM || effectiveIsAdmin) && (
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 24 }}>
            <div style={{ marginBottom: 16, fontSize: 13, color: "#6B7280", fontStyle: "italic" }}>Switch between deal boards to see how warning patterns differ across pipeline stages.</div>
            <BoardScopedAnalysisTab role={demoRole} period={period} managerId={managerId} />
          </div>
        )}
      </div>

      {/* Drill-down Drawer — Overview tab only (Board-Scoped has its own instance) */}
      {activeTab === "overview" && (
        <DrillDownDrawer selection={drawerSelection} onClose={() => setDrawerSelection(null)} />
      )}
    </div>
  );
}
