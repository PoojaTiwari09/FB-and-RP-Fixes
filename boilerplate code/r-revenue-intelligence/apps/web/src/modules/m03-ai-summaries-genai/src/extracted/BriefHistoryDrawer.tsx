"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BriefType, AIGeneratedSummary, BriefHistoryEntry } from "@/types/database";
import clsx from "clsx";
import {
  X, History, Clock, Cpu, ChevronRight, RotateCcw,
  GitCompare, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
    hour12: true,
  });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function countInsights(summary: AIGeneratedSummary): number {
  return summary.sections?.reduce((n, s) => n + (s.bullets?.length ?? 0), 0) ?? 0;
}

function countCitations(summary: AIGeneratedSummary): number {
  return summary.sections?.reduce((n, s) =>
    n + (s.bullets?.reduce((m, b) => m + (b.richCitations?.length ?? 0), 0) ?? 0), 0
  ) ?? 0;
}

// ── Diff helpers ──────────────────────────────────────────────────────────────

interface DiffResult {
  added:   string[];
  removed: string[];
  changed: string[];
}

function diffSummaries(older: AIGeneratedSummary, newer: AIGeneratedSummary): DiffResult {
  const getBullets = (s: AIGeneratedSummary) =>
    s.sections?.flatMap(sec => sec.bullets?.map(b => b.text) ?? []) ?? [];

  const oldSet = new Set(getBullets(older));
  const newSet = new Set(getBullets(newer));

  const added   = [...newSet].filter(t => !oldSet.has(t));
  const removed = [...oldSet].filter(t => !newSet.has(t));

  // Sentiment/health change
  const changed: string[] = [];
  if (older.sentiment !== newer.sentiment)
    changed.push(`Sentiment: ${older.sentiment ?? "—"} → ${newer.sentiment ?? "—"}`);
  if (older.health !== newer.health)
    changed.push(`Health: ${older.health ?? "—"} → ${newer.health ?? "—"}`);

  return { added, removed, changed };
}

// ── Version row ───────────────────────────────────────────────────────────────

function VersionRow({
  entry,
  isActive,
  isLatest,
  isCompareA,
  isCompareB,
  onLoad,
  onToggleCompare,
}: {
  entry: BriefHistoryEntry;
  isActive: boolean;
  isLatest: boolean;
  isCompareA: boolean;
  isCompareB: boolean;
  onLoad: () => void;
  onToggleCompare: () => void;
}) {
  const insights  = countInsights(entry.generated_summary);
  const citations = countCitations(entry.generated_summary);

  return (
    <div className={clsx(
      "group relative border-b border-(--border)/40 transition-colors",
      isActive ? "bg-(--accent)/8" : "hover:bg-(--surface)"
    )}>
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-(--accent) rounded-r" />
      )}

      <div className="px-4 py-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className={clsx(
              "text-xs font-bold font-mono px-2 py-0.5 rounded-md border",
              isLatest
                ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                : "text-(--text-muted) bg-(--surface) border-(--border)"
            )}>
              V{entry.version_number}
            </span>
            {isLatest && (
              <span className="text-[10px] font-semibold text-emerald-400">Latest</span>
            )}
            {isCompareA && (
              <span className="text-[10px] font-semibold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">A</span>
            )}
            {isCompareB && (
              <span className="text-[10px] font-semibold text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">B</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onToggleCompare}
              title="Add to compare"
              className={clsx(
                "p-1 rounded transition-colors text-[10px]",
                (isCompareA || isCompareB)
                  ? "text-blue-400 bg-blue-400/10"
                  : "text-(--text-muted) hover:text-(--text) hover:bg-(--surface)"
              )}
            >
              <GitCompare size={12} />
            </button>
            <button
              onClick={onLoad}
              title="Load this version"
              className="p-1 rounded text-(--text-muted) hover:text-(--accent) hover:bg-(--accent)/10 transition-colors"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-(--text) line-clamp-1 mb-1">
          {entry.generated_summary.title}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-(--text-muted)">
            <Clock size={10} />
            {formatRelative(entry.created_at)}
          </span>
          <span className="text-[11px] text-(--text-muted)">{insights} insights</span>
          {citations > 0 && (
            <span className="text-[11px] text-(--accent)">{citations} sources</span>
          )}
          {entry.model_used && (
            <span className="flex items-center gap-1 text-[10px] text-(--text-muted) opacity-60">
              <Cpu size={9} />
              {entry.model_used.split("-").slice(0, 2).join("-")}
            </span>
          )}
        </div>

        {/* Preview */}
        {entry.generated_summary.summaryPreview && (
          <p className="text-[11px] text-(--text-muted) line-clamp-2 mt-1.5 leading-relaxed opacity-70">
            {entry.generated_summary.summaryPreview}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Compare panel ─────────────────────────────────────────────────────────────

function ComparePanel({ a, b, onClose }: { a: BriefHistoryEntry; b: BriefHistoryEntry; onClose: () => void }) {
  const [older, newer] = a.version_number < b.version_number ? [a, b] : [b, a];
  const diff = diffSummaries(older.generated_summary, newer.generated_summary);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare size={14} className="text-(--accent)" />
          <span className="text-sm font-semibold text-(--text)">
            V{older.version_number} → V{newer.version_number}
          </span>
        </div>
        <button onClick={onClose} className="text-xs text-(--text-muted) hover:text-(--text) transition-colors">
          Exit compare
        </button>
      </div>

      {/* Changed */}
      {diff.changed.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">Changed</p>
          {diff.changed.map((c, i) => (
            <p key={i} className="text-xs text-amber-300 font-mono">{c}</p>
          ))}
        </div>
      )}

      {/* Added */}
      {diff.added.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
            + {diff.added.length} Added in V{newer.version_number}
          </p>
          <ul className="space-y-1.5">
            {diff.added.map((t, i) => (
              <li key={i} className="flex gap-2 text-xs text-emerald-300">
                <span className="shrink-0 mt-0.5">+</span>
                <span className="line-clamp-2">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Removed */}
      {diff.removed.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">
            − {diff.removed.length} Removed from V{older.version_number}
          </p>
          <ul className="space-y-1.5">
            {diff.removed.map((t, i) => (
              <li key={i} className="flex gap-2 text-xs text-red-300">
                <span className="shrink-0 mt-0.5">−</span>
                <span className="line-clamp-2">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <CheckCircle2 size={24} className="text-emerald-400 opacity-60" />
          <p className="text-sm text-(--text-muted)">No differences found between these versions</p>
        </div>
      )}
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────

interface BriefHistoryDrawerProps {
  briefType: BriefType;
  entityId: string;
  currentSummary: AIGeneratedSummary | null;
  onRestoreVersion: (summary: AIGeneratedSummary) => void;
  onClose: () => void;
}

function DrawerContent({
  briefType, entityId, currentSummary, onRestoreVersion, onClose,
}: BriefHistoryDrawerProps) {
  const [history,    setHistory]    = useState<BriefHistoryEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [activeId,   setActiveId]   = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparing,  setComparing]  = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: err } = await supabase
        .from("brief_history" as any)
        .select("id, version_number, model_used, prompt_version, generated_by, created_at, metadata, generated_summary")
        .eq("entity_id", entityId)
        .eq("brief_type", briefType)
        .order("version_number", { ascending: false })
        .limit(20);

      if (err) throw err;
      setHistory((data ?? []) as BriefHistoryEntry[]);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [entityId, briefType]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleLoad = (entry: BriefHistoryEntry) => {
    setActiveId(entry.id);
    onRestoreVersion(entry.generated_summary);
  };

  const handleToggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2)  return [prev[1], id]; // slide window
      return [...prev, id];
    });
  };

  const compareEntries = compareIds.length === 2
    ? [history.find(h => h.id === compareIds[0])!, history.find(h => h.id === compareIds[1])!].filter(Boolean)
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-(--border) shrink-0">
        <div className="flex items-center gap-2.5">
          <History size={15} className="text-(--accent)" />
          <span className="text-sm font-bold text-(--text)">Version History</span>
          {!loading && history.length > 0 && (
            <span className="text-[11px] font-mono text-(--text-muted) bg-(--surface) border border-(--border) px-1.5 py-0.5 rounded-full">
              {history.length} versions
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {compareIds.length === 2 && (
            <button
              onClick={() => setComparing(c => !c)}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors",
                comparing
                  ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
                  : "text-(--text-muted) bg-(--surface) border-(--border) hover:text-(--text)"
              )}
            >
              <GitCompare size={12} />
              Compare
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-(--text-muted) hover:text-(--text) hover:bg-(--surface) rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Compare mode */}
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
            <div className="px-4 py-2 bg-blue-500/5 border-b border-blue-500/10">
              <p className="text-[11px] text-blue-400">
                Select one more version to compare ({2 - compareIds.length} remaining)
              </p>
            </div>
          )}

          {/* Version list */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12 gap-2">
                <Loader2 size={16} className="animate-spin text-(--accent)" />
                <span className="text-sm text-(--text-muted)">Loading history…</span>
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
                <AlertCircle size={20} className="text-red-400 opacity-60" />
                <p className="text-xs text-(--text-muted)">{error}</p>
                <button onClick={fetchHistory} className="text-xs text-(--accent) hover:underline">Retry</button>
              </div>
            )}

            {!loading && !error && history.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
                <History size={24} className="text-(--text-muted) opacity-30" />
                <p className="text-sm text-(--text-muted)">No history yet</p>
                <p className="text-[11px] text-(--text-muted) opacity-60 max-w-[200px]">
                  Generate a brief to start building version history
                </p>
              </div>
            )}

            {!loading && !error && history.length > 0 && history.map((entry, idx) => (
              <VersionRow
                key={entry.id}
                entry={entry}
                isActive={activeId === entry.id}
                isLatest={idx === 0}
                isCompareA={compareIds[0] === entry.id}
                isCompareB={compareIds[1] === entry.id}
                onLoad={() => handleLoad(entry)}
                onToggleCompare={() => handleToggleCompare(entry.id)}
              />
            ))}
          </div>

          {/* Footer */}
          {!loading && history.length > 0 && (
            <div className="px-4 py-3 border-t border-(--border) shrink-0">
              <p className="text-[11px] text-(--text-muted) opacity-50 text-center">
                Click <RotateCcw size={9} className="inline" /> to restore · <GitCompare size={9} className="inline" /> to compare
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Portal wrapper ────────────────────────────────────────────────────────────

export function BriefHistoryDrawer(props: BriefHistoryDrawerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[9990]"
        onClick={props.onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[360px] z-[9991] bg-(--bg2) border-l border-(--border) shadow-[0_0_40px_rgba(0,0,0,0.4)] flex flex-col animate-[slideIn_0.25s_ease-out_forwards]">
        <DrawerContent {...props} />
      </div>
    </>,
    document.body
  );
}
