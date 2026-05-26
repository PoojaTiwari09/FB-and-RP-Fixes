import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Mail, Activity, StickyNote, Phone, Database } from "lucide-react";
import clsx from "clsx";

// ── Source type config ────────────────────────────────────────────────────────

const SOURCE_CONFIG = {
  transcript: {
    label: "Transcript",
    table: "transcripts",
    icon: FileText,
    color: "text-blue-400",
    headerBg: "bg-blue-500/10 border-blue-500/20",
    badgeBg:  "bg-blue-500/10 border-blue-500/25 text-blue-400 hover:bg-blue-500/20 hover:shadow-[0_0_8px_rgba(59,130,246,0.3)]",
  },
  email: {
    label: "Email",
    table: "emails",
    icon: Mail,
    color: "text-purple-400",
    headerBg: "bg-purple-500/10 border-purple-500/20",
    badgeBg:  "bg-purple-500/10 border-purple-500/25 text-purple-400 hover:bg-purple-500/20 hover:shadow-[0_0_8px_rgba(168,85,247,0.3)]",
  },
  activity: {
    label: "Activity",
    table: "activities",
    icon: Activity,
    color: "text-amber-400",
    headerBg: "bg-amber-500/10 border-amber-500/20",
    badgeBg:  "bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/20 hover:shadow-[0_0_8px_rgba(245,158,11,0.3)]",
  },
  note: {
    label: "Note",
    table: "notes",
    icon: StickyNote,
    color: "text-emerald-400",
    headerBg: "bg-emerald-500/10 border-emerald-500/20",
    badgeBg:  "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 hover:shadow-[0_0_8px_rgba(16,185,129,0.3)]",
  },
  call: {
    label: "Call Record",
    table: "calls",
    icon: Phone,
    color: "text-cyan-400",
    headerBg: "bg-cyan-500/10 border-cyan-500/20",
    badgeBg:  "bg-cyan-500/10 border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_8px_rgba(6,182,212,0.3)]",
  },
  crm: {
    label: "CRM Record",
    table: "crm",
    icon: Database,
    color: "text-indigo-400",
    headerBg: "bg-indigo-500/10 border-indigo-500/20",
    badgeBg:  "bg-indigo-500/10 border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20 hover:shadow-[0_0_8px_rgba(99,102,241,0.3)]",
  },
};

function formatTimestamp(ms) {
  if (!ms && ms !== 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── Portal wrapper ────────────────────────────────────────────────────────────

function Portal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ── Citation Popup ────────────────────────────────────────────────────────────

export function CitationPopup({ citation, anchorRect, onClose }) {
  const popupRef = useRef(null);
  const cfg = SOURCE_CONFIG[citation.sourceType] ?? SOURCE_CONFIG.crm;
  const Icon = cfg.icon;
  const ts = formatTimestamp(citation.timestamp_ms);

  // Smart positioning — never off-screen
  const POPUP_W = 380;
  const POPUP_H = 300;
  const vw = typeof window !== "undefined" ? window.innerWidth  : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  let left = anchorRect.left;
  let top  = anchorRect.bottom + 10;

  if (top + POPUP_H > vh - 16)  top  = anchorRect.top - POPUP_H - 10;
  if (top < 16)                  top  = 16;
  if (left + POPUP_W > vw - 16) left = vw - POPUP_W - 16;
  if (left < 16)                 left = 16;

  // Close on Escape or outside click
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const onClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    // Slight delay so the opening click doesn't immediately close
    const t = setTimeout(() => {
      document.addEventListener("keydown", onKey);
      document.addEventListener("mousedown", onClick);
    }, 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [onClose]);

  return (
    <Portal>
      <div
        ref={popupRef}
        style={{
          position: "fixed",
          top,
          left,
          width: POPUP_W,
          zIndex: 99999,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid #f1f5f9",
          background: "#f8fafc",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Icon size={13} style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{cfg.label}</p>
              <p style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", marginTop: 2 }}>table: {cfg.table}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              background: "none",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              transition: "all 0.12s",
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "14px 14px 12px" }}>
          {/* Metadata chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {citation.speaker && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontWeight: 500,
                color: "#374151",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                padding: "3px 8px",
                borderRadius: 6,
              }}>
                👤 {citation.speaker}
              </span>
            )}
            {ts && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontFamily: "monospace",
                color: "#64748b",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                padding: "3px 8px",
                borderRadius: 6,
              }}>
                🕐 {ts} in call
              </span>
            )}
            {citation.entityName && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "#64748b",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                padding: "3px 8px",
                borderRadius: 6,
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                📎 {citation.entityName}
              </span>
            )}
          </div>

          {/* Evidence excerpt */}
          <div style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 10,
          }}>
            <div style={{
              padding: "6px 12px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }} />
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
                Source Evidence
              </p>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <blockquote style={{
                fontSize: 13,
                lineHeight: 1.6,
                fontStyle: "italic",
                color: "#374151",
                paddingLeft: 10,
                borderLeft: "2px solid #3b82f6",
                margin: 0,
              }}>
                "{citation.excerpt}"
              </blockquote>
            </div>
          </div>

          {/* Record ID */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", opacity: 0.6, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              ID: {citation.sourceId}
            </p>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 20,
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              color: "#3b82f6",
              marginLeft: 8,
              flexShrink: 0,
            }}>
              {cfg.label}
            </span>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ── Evidence Button (inline beside each bullet) ───────────────────────────────

export function EvidenceButton({ citation }) {
  const cfg = SOURCE_CONFIG[citation.sourceType] ?? SOURCE_CONFIG.crm;
  const Icon = cfg.icon;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent("citation:open", { detail: { citation, rect } })
    );
  };

  return (
    <button
      onClick={handleClick}
      title={`${cfg.label}: ${citation.excerpt.slice(0, 100)}…`}
      className="ss-evidence-btn"
    >
      <Icon size={9} />
      <span>Evidence</span>
    </button>
  );
}

export function CitationBadge({ citation }) {
  return <EvidenceButton citation={citation} />;
}
