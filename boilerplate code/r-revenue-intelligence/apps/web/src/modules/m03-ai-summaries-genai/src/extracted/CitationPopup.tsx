"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { RichCitation, CitationSourceType } from "@/types/database";
import { X, FileText, Mail, Activity, StickyNote, Phone, Database, ExternalLink } from "lucide-react";
import clsx from "clsx";

// ── Source type config ────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<
  CitationSourceType,
  { label: string; table: string; icon: React.ElementType; color: string; headerBg: string; badgeBg: string }
> = {
  transcript: {
    label: "Transcript", table: "transcripts",
    icon: FileText,
    color: "text-blue-400",
    headerBg: "bg-blue-500/10 border-blue-500/20",
    badgeBg:  "bg-blue-500/10 border-blue-500/25 text-blue-400 hover:bg-blue-500/20 hover:shadow-[0_0_8px_rgba(59,130,246,0.3)]",
  },
  email: {
    label: "Email", table: "emails",
    icon: Mail,
    color: "text-purple-400",
    headerBg: "bg-purple-500/10 border-purple-500/20",
    badgeBg:  "bg-purple-500/10 border-purple-500/25 text-purple-400 hover:bg-purple-500/20 hover:shadow-[0_0_8px_rgba(168,85,247,0.3)]",
  },
  activity: {
    label: "Activity", table: "activities",
    icon: Activity,
    color: "text-amber-400",
    headerBg: "bg-amber-500/10 border-amber-500/20",
    badgeBg:  "bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/20 hover:shadow-[0_0_8px_rgba(245,158,11,0.3)]",
  },
  note: {
    label: "Note", table: "notes",
    icon: StickyNote,
    color: "text-emerald-400",
    headerBg: "bg-emerald-500/10 border-emerald-500/20",
    badgeBg:  "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 hover:shadow-[0_0_8px_rgba(16,185,129,0.3)]",
  },
  call: {
    label: "Call Record", table: "calls",
    icon: Phone,
    color: "text-cyan-400",
    headerBg: "bg-cyan-500/10 border-cyan-500/20",
    badgeBg:  "bg-cyan-500/10 border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_8px_rgba(6,182,212,0.3)]",
  },
  crm: {
    label: "CRM Record", table: "crm",
    icon: Database,
    color: "text-indigo-400",
    headerBg: "bg-indigo-500/10 border-indigo-500/20",
    badgeBg:  "bg-indigo-500/10 border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20 hover:shadow-[0_0_8px_rgba(99,102,241,0.3)]",
  },
};

function formatTimestamp(ms?: number): string | null {
  if (!ms && ms !== 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── Portal wrapper ────────────────────────────────────────────────────────────

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ── Citation Popup ────────────────────────────────────────────────────────────

interface CitationPopupProps {
  citation: RichCitation;
  anchorRect: DOMRect;
  onClose: () => void;
}

export function CitationPopup({ citation, anchorRect, onClose }: CitationPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
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
    const onKey   = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const onClick = (e: MouseEvent)    => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
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
        style={{ position: "fixed", top, left, width: POPUP_W, zIndex: 99999, background: "var(--bg2)" }}
        className="rounded-2xl border border-(--border-strong) overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-2xl"
      >
        {/* Header */}
        <div className={clsx("flex items-center justify-between px-4 py-3 border-b border-(--border)", cfg.headerBg)}>
          <div className="flex items-center gap-2.5">
            <div className={clsx("w-6 h-6 rounded-md flex items-center justify-center", cfg.headerBg)}>
              <Icon size={13} className={cfg.color} />
            </div>
            <div>
              <p className={clsx("text-xs font-bold leading-none", cfg.color)}>{cfg.label}</p>
              <p className="text-[10px] text-(--text-muted) font-mono mt-0.5">table: {cfg.table}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-(--text-muted) hover:text-(--text) hover:bg-(--surface) rounded-lg transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3.5 space-y-3">
          {/* Metadata chips */}
          <div className="flex flex-wrap gap-2">
            {citation.speaker && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-(--text) bg-(--surface) border border-(--border) px-2 py-1 rounded-lg">
                👤 <span>{citation.speaker}</span>
              </span>
            )}
            {ts && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-(--text-muted) bg-(--surface) border border-(--border) px-2 py-1 rounded-lg">
                🕐 <span>{ts} in call</span>
              </span>
            )}
            {citation.entityName && (
              <span className="inline-flex items-center gap-1 text-[11px] text-(--text-muted) bg-(--surface) border border-(--border) px-2 py-1 rounded-lg max-w-[200px]">
                📎 <span className="truncate">{citation.entityName}</span>
              </span>
            )}
          </div>

          {/* Evidence excerpt */}
          <div className="rounded-xl bg-(--surface) border border-(--border) overflow-hidden">
            <div className="px-3 py-2 border-b border-(--border) flex items-center gap-1.5">
              <div className={clsx("w-1.5 h-1.5 rounded-full", cfg.color.replace("text-", "bg-"))} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-(--text-muted)">
                Source Evidence
              </p>
            </div>
            <div className="px-3 py-2.5">
              <blockquote className={clsx(
                "text-sm leading-relaxed italic pl-3 border-l-2",
                cfg.color.replace("text-", "border-")
              )}>
                "{citation.excerpt}"
              </blockquote>
            </div>
          </div>

          {/* Record ID */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-(--text-muted) font-mono opacity-40 truncate flex-1">
              ID: {citation.sourceId}
            </p>
            <span className={clsx(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border ml-2 shrink-0",
              cfg.headerBg, cfg.color
            )}>
              {cfg.label}
            </span>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ── Evidence Button (inline beside each bullet) ───────────────────────────────

interface EvidenceButtonProps {
  citation: RichCitation;
}

export function EvidenceButton({ citation }: EvidenceButtonProps) {
  const cfg = SOURCE_CONFIG[citation.sourceType] ?? SOURCE_CONFIG.crm;
  const Icon = cfg.icon;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
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
      className={clsx(
        "inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md border",
        "text-[10px] font-semibold cursor-pointer select-none",
        "transition-all duration-150 hover:scale-105 active:scale-95",
        cfg.badgeBg
      )}
    >
      <Icon size={9} />
      <span>Evidence</span>
    </button>
  );
}

// ── Legacy numbered badge (kept for backward compat) ─────────────────────────

export function CitationBadge({ citation }: { citation: RichCitation }) {
  return <EvidenceButton citation={citation} />;
}
