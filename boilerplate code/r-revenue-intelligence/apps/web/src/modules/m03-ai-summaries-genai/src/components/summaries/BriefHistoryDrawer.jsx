import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { getSupabaseClient } from "../../lib/supabase";
import {
  X, History, Clock, Cpu, RotateCcw,
  GitCompare, Loader2, AlertCircle, CheckCircle2, BookOpen, Lightbulb,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function countInsights(summary) {
  return summary?.sections?.reduce((n, s) => n + (s.bullets?.length ?? 0), 0) ?? 0;
}

function countCitations(summary) {
  return summary?.sections?.reduce((n, s) =>
    n + (s.bullets?.reduce((m, b) => m + (b.richCitations?.length ?? 0), 0) ?? 0), 0
  ) ?? 0;
}

function diffSummaries(older, newer) {
  const getBullets = (s) =>
    s?.sections?.flatMap(sec => sec.bullets?.map(b => b.text) ?? []) ?? [];
  const oldSet = new Set(getBullets(older));
  const newSet = new Set(getBullets(newer));
  const added   = [...newSet].filter(t => !oldSet.has(t));
  const removed = [...oldSet].filter(t => !newSet.has(t));
  const changed = [];
  if (older?.sentiment !== newer?.sentiment)
    changed.push(`Sentiment: ${older?.sentiment ?? "—"} → ${newer?.sentiment ?? "—"}`);
  return { added, removed, changed };
}

// ── Version Card (matches screenshot) ────────────────────────────────────────

function VersionCard({ entry, isLatest, isActive, isCompareA, isCompareB, onLoad, onToggleCompare }) {
  const insights  = countInsights(entry.generated_summary);
  const citations = countCitations(entry.generated_summary);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isActive ? "#eff6ff" : hovered ? "#fafafa" : "#fff",
        border: `1px solid ${isActive ? "#bfdbfe" : "#e5e7eb"}`,
        borderRadius: 12,
        padding: "14px 16px",
        position: "relative",
        transition: "all 0.15s",
        cursor: "pointer",
      }}
    >
      {/* Active left bar */}
      {isActive && (
        <div style={{
          position: "absolute", left: 0, top: 8, bottom: 8,
          width: 3, background: "#3b82f6", borderRadius: "0 3px 3px 0",
        }} />
      )}

      {/* Top row: version badge + action buttons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Version badge like screenshot — colored circle with "V1" */}
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: isLatest ? "#3b82f6" : "#e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 800, color: isLatest ? "#fff" : "#6b7280",
              fontFamily: "monospace",
            }}>
              V{entry.version_number}
            </span>
          </div>

          {isLatest && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: "#3b82f6",
              background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 99, padding: "1px 8px",
            }}>
              Latest
            </span>
          )}
          {isCompareA && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#2563eb", background: "#dbeafe", borderRadius: 4, padding: "1px 6px" }}>A</span>
          )}
          {isCompareB && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", background: "#ede9fe", borderRadius: 4, padding: "1px 6px" }}>B</span>
          )}
        </div>

        {/* Action buttons — visible on hover */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          opacity: hovered ? 1 : 0, transition: "opacity 0.15s",
        }}>
          <button
            onClick={e => { e.stopPropagation(); onToggleCompare(); }}
            title="Add to compare"
            style={{
              width: 24, height: 24, borderRadius: 6,
              border: `1px solid ${(isCompareA || isCompareB) ? "#bfdbfe" : "#e5e7eb"}`,
              background: (isCompareA || isCompareB) ? "#eff6ff" : "#f9fafb",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: (isCompareA || isCompareB) ? "#3b82f6" : "#6b7280",
            }}
          >
            <GitCompare size={11} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onLoad(); }}
            title="Restore this version"
            style={{
              width: 24, height: 24, borderRadius: 6,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#6b7280",
            }}
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      {/* Title */}
      <p style={{
        fontSize: 13, fontWeight: 600, color: "#111827",
        marginBottom: 6, lineHeight: 1.4,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {entry.generated_summary?.title ?? "Untitled Brief"}
      </p>

      {/* Meta chips row — matching screenshot exactly */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {/* Time */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 10, color: "#6b7280",
        }}>
          <Clock size={9} style={{ color: "#9ca3af" }} />
          {formatRelative(entry.created_at)}
        </span>

        {/* Insights */}
        {insights > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 600, color: "#374151",
            background: "#f3f4f6", border: "1px solid #e5e7eb",
            borderRadius: 99, padding: "1px 7px",
          }}>
            {insights} insights
          </span>
        )}

        {/* Sources */}
        {citations > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 600, color: "#3b82f6",
            background: "#eff6ff", border: "1px solid #bfdbfe",
            borderRadius: 99, padding: "1px 7px",
          }}>
            {citations} sources
          </span>
        )}

        {/* Model */}
        {entry.model_used && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            fontSize: 10, color: "#9ca3af",
            background: "#f9fafb", border: "1px solid #f3f4f6",
            borderRadius: 99, padding: "1px 7px",
          }}>
            <Cpu size={8} />
            llama-3.1
          </span>
        )}
      </div>

      {/* Summary preview */}
      {entry.generated_summary?.summaryPreview && (
        <p style={{
          fontSize: 11, color: "#6b7280", lineHeight: 1.55,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {entry.generated_summary.summaryPreview}
        </p>
      )}
    </div>
  );
}

// ── Compare diff panel ────────────────────────────────────────────────────────

function ComparePanel({ a, b, onClose }) {
  const [older, newer] = a.version_number < b.version_number ? [a, b] : [b, a];
  const diff = diffSummaries(older.generated_summary, newer.generated_summary);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GitCompare size={14} style={{ color: "#3b82f6" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
            V{older.version_number} → V{newer.version_number}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ fontSize: 11, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          Exit compare
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {diff.changed.length > 0 && (
          <div style={{ padding: 12, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Changed</p>
            {diff.changed.map((c, i) => (
              <p key={i} style={{ fontSize: 11, color: "#92400e", fontFamily: "monospace" }}>{c}</p>
            ))}
          </div>
        )}
        {diff.added.length > 0 && (
          <div style={{ padding: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              + {diff.added.length} Added in V{newer.version_number}
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
              {diff.added.map((t, i) => (
                <li key={i} style={{ display: "flex", gap: 6, fontSize: 11, color: "#15803d" }}>
                  <span>+</span>
                  <span style={{ lineHeight: 1.4 }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {diff.removed.length > 0 && (
          <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              − {diff.removed.length} Removed from V{older.version_number}
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
              {diff.removed.map((t, i) => (
                <li key={i} style={{ display: "flex", gap: 6, fontSize: 11, color: "#dc2626" }}>
                  <span>−</span>
                  <span style={{ lineHeight: 1.4 }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "32px 0", textAlign: "center" }}>
            <CheckCircle2 size={22} style={{ color: "#10b981", opacity: 0.7 }} />
            <p style={{ fontSize: 12, color: "#6b7280" }}>No differences between these versions</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Drawer content ────────────────────────────────────────────────────────────

function DrawerContent({ briefType, entityId, currentSummary, onRestoreVersion, onClose }) {
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activeId,   setActiveId]   = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [comparing,  setComparing]  = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase client is not configured");
      const { data, error: err } = await supabase
        .from("brief_history")
        .select("id, version_number, model_used, prompt_version, generated_by, created_at, metadata, generated_summary")
        .eq("entity_id", entityId)
        .eq("brief_type", briefType)
        .order("version_number", { ascending: false })
        .limit(20);
      if (err) throw err;
      setHistory(data ?? []);
    } catch (err) {
      setError(err?.message ?? "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [entityId, briefType]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleLoad = (entry) => {
    setActiveId(entry.id);
    onRestoreVersion(entry.generated_summary);
  };

  const handleToggleCompare = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2)  return [prev[1], id];
      return [...prev, id];
    });
  };

  const compareEntries = compareIds.length === 2
    ? [history.find(h => h.id === compareIds[0]), history.find(h => h.id === compareIds[1])].filter(Boolean)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px",
        borderBottom: "1px solid #e5e7eb",
        flexShrink: 0,
        background: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <History size={15} style={{ color: "#3b82f6" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Version History</span>
          {!loading && history.length > 0 && (
            <span style={{
              fontSize: 10, color: "#6b7280",
              background: "#f3f4f6", border: "1px solid #e5e7eb",
              borderRadius: 99, padding: "1px 8px", fontFamily: "monospace",
            }}>
              {history.length} version{history.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {compareIds.length === 2 && (
            <button
              onClick={() => setComparing(c => !c)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                border: comparing ? "1px solid #bfdbfe" : "1px solid #e5e7eb",
                background: comparing ? "#eff6ff" : "#f9fafb",
                color: comparing ? "#3b82f6" : "#374151",
                cursor: "pointer",
              }}
            >
              <GitCompare size={11} />
              Compare
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: "1px solid #e5e7eb", background: "#f9fafb",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#6b7280",
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Compare mode ── */}
      {comparing && compareEntries.length === 2 ? (
        <ComparePanel
          a={compareEntries[0]}
          b={compareEntries[1]}
          onClose={() => { setComparing(false); setCompareIds([]); }}
        />
      ) : (
        <>
          {/* Compare hint */}
          {compareIds.length > 0 && compareIds.length < 2 && (
            <div style={{
              padding: "8px 18px",
              background: "#eff6ff",
              borderBottom: "1px solid #bfdbfe",
            }}>
              <p style={{ fontSize: 11, color: "#3b82f6" }}>
                Select one more version to compare ({2 - compareIds.length} remaining)
              </p>
            </div>
          )}

          {/* ── Version list ── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 8 }}>
                <Loader2 size={16} style={{ color: "#3b82f6", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>Loading history…</span>
              </div>
            )}

            {!loading && error && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "48px 0", textAlign: "center" }}>
                <AlertCircle size={20} style={{ color: "#ef4444", opacity: 0.6 }} />
                <p style={{ fontSize: 12, color: "#6b7280" }}>{error}</p>
                <button
                  onClick={fetchHistory}
                  style={{ fontSize: 12, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && history.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "48px 0", textAlign: "center" }}>
                <History size={28} style={{ color: "#d1d5db" }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>No history yet</p>
                <p style={{ fontSize: 11, color: "#9ca3af", maxWidth: 200, lineHeight: 1.5 }}>
                  Generate a brief to start building version history
                </p>
              </div>
            )}

            {!loading && !error && history.map((entry, idx) => (
              <VersionCard
                key={entry.id}
                entry={entry}
                isLatest={idx === 0}
                isActive={activeId === entry.id}
                isCompareA={compareIds[0] === entry.id}
                isCompareB={compareIds[1] === entry.id}
                onLoad={() => handleLoad(entry)}
                onToggleCompare={() => handleToggleCompare(entry.id)}
              />
            ))}
          </div>

          {/* ── Footer ── */}
          {!loading && history.length > 0 && (
            <div style={{
              padding: "10px 18px",
              borderTop: "1px solid #f3f4f6",
              background: "#fafafa",
              flexShrink: 0,
            }}>
              <p style={{ fontSize: 10, color: "#9ca3af", textAlign: "center" }}>
                Click <RotateCcw size={9} style={{ display: "inline", verticalAlign: "middle" }} /> to restore · <GitCompare size={9} style={{ display: "inline", verticalAlign: "middle" }} /> to compare
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Portal wrapper ────────────────────────────────────────────────────────────

export function BriefHistoryDrawer(props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop — semi-transparent blurred */}
      <div
        onClick={props.onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(2px)",
          zIndex: 9990,
        }}
      />
      {/* Drawer — slides in from right, white background, clean shadow */}
      <div style={{
        position: "fixed",
        right: 0, top: 0, bottom: 0,
        width: 360,
        zIndex: 9991,
        background: "#fff",
        borderLeft: "1px solid #e5e7eb",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        animation: "slideInRight 0.25s ease-out forwards",
      }}>
        <DrawerContent {...props} />
      </div>

      {/* Slide-in keyframe */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>,
    document.body
  );
}
