"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BriefType, AIGeneratedSummary, BriefSection, RichCitation } from "@/types/database";
import clsx from "clsx";
import {
  Sparkles, ChevronDown, ChevronUp, Copy, RefreshCw,
  FileText, AlertCircle, Loader2, BookOpen, History, Share2,
} from "lucide-react";
import { EvidenceButton, CitationPopup } from "./CitationPopup";
import { BriefHistoryDrawer } from "./BriefHistoryDrawer";
import { ShareModal } from "./ShareModal";
import { FeedbackButtons, type FeedbackContext } from "@/components/feedback/FeedbackButtons";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Filter out AI placeholder text — only show real content */
const PLACEHOLDER_PATTERNS = [
  /not available in current/i,
  /no data available/i,
  /not found in/i,
  /no records found/i,
  /data not provided/i,
  /information not available/i,
];

function isPlaceholder(text: string): boolean {
  return PLACEHOLDER_PATTERNS.some(p => p.test(text));
}

// ── Sentiment badge ───────────────────────────────────────────────────────────

function SentimentBadge({ value }: { value?: string }) {
  if (!value) return null;
  const v = value.toLowerCase();
  const isPos = v.includes("positive") || v.includes("good") || v.includes("excellent");
  const isNeg = v.includes("negative") || v.includes("poor") || v.includes("risk") || v.includes("at_risk");
  return (
    <span className={clsx(
      "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border",
      isPos && "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
      isNeg && "bg-red-500/10 text-red-400 border-red-500/25",
      !isPos && !isNeg && "bg-amber-500/10 text-amber-400 border-amber-500/25"
    )}>
      <span className="text-[10px]">{isPos ? "●" : isNeg ? "●" : "●"}</span>
      <span className="capitalize">{value}</span>
    </span>
  );
}

// ── Single bullet with evidence button ───────────────────────────────────────

function BulletRow({ text, owner, richCitations, feedbackCtx }: {
  text: string;
  owner?: string;
  richCitations?: RichCitation[];
  feedbackCtx?: FeedbackContext;
}) {
  if (isPlaceholder(text)) return null;
  const hasCitations = richCitations && richCitations.length > 0;

  return (
    <li className="group flex gap-3 py-1.5 items-start">
      <span className={clsx(
        "mt-2 w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
        hasCitations ? "bg-(--accent)" : "bg-(--text-muted)/40"
      )} />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-(--text) leading-relaxed">{text}</span>

        {hasCitations && (
          <span className="inline-flex flex-wrap gap-1 ml-1">
            {richCitations!.map((cit, ci) => (
              <EvidenceButton key={ci} citation={cit} />
            ))}
          </span>
        )}

        {owner && (
          <span className="ml-2 text-[10px] text-(--text-muted) bg-(--surface) px-1.5 py-0.5 rounded border border-(--border)">
            @{owner}
          </span>
        )}

        {/* Feedback buttons — appear on hover */}
        {feedbackCtx && <FeedbackButtons ctx={feedbackCtx} />}
      </div>
    </li>
  );
}

// ── Collapsible section ───────────────────────────────────────────────────────

function Section({ section, index, feedbackBase }: {
  section: BriefSection;
  index: number;
  feedbackBase?: Omit<FeedbackContext, "sectionName" | "bulletId" | "bulletText">;
}) {
  const [open, setOpen] = useState(true);
  const validBullets  = (section.bullets ?? []).filter(b => !isPlaceholder(b.text));
  const citationCount = validBullets.reduce((n, b) => n + (b.richCitations?.length ?? 0), 0);
  if (!section.summary && validBullets.length === 0) return null;

  return (
    <div className="border border-(--border) rounded-xl overflow-hidden transition-all">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-(--surface) hover:bg-(--surface-hover) transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[11px] font-mono text-(--accent) opacity-50 shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-semibold text-(--text) truncate">{section.title}</span>
          {citationCount > 0 && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-(--accent) bg-(--accent)/10 border border-(--accent)/20 px-1.5 py-0.5 rounded-full">
              <BookOpen size={9} />
              {citationCount}
            </span>
          )}
        </div>
        <span className="shrink-0 ml-2 text-(--text-muted)">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {open && (
        <div className="px-4 py-3 border-t border-(--border)">
          {section.summary && !isPlaceholder(section.summary) && (
            <p className="text-sm text-(--text-muted) leading-relaxed mb-3">{section.summary}</p>
          )}
          {validBullets.length > 0 && (
            <ul className="space-y-0.5">
              {validBullets.map((bullet, bi) => (
                <BulletRow
                  key={bi}
                  text={bullet.text}
                  owner={bullet.owner}
                  richCitations={bullet.richCitations}
                  feedbackCtx={feedbackBase ? {
                    ...feedbackBase,
                    sectionName: section.title,
                    bulletId:    (bullet as any).bullet_id ?? `s${index}_b${bi}`,
                    bulletText:  bullet.text,
                  } : undefined}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-5 animate-pulse">
      <div className="h-5 bg-(--border) rounded-lg w-2/3" />
      <div className="flex gap-2">
        <div className="h-5 bg-(--border)/60 rounded-full w-20" />
        <div className="h-5 bg-(--border)/60 rounded-full w-24" />
      </div>
      <div className="h-20 bg-(--border)/40 rounded-xl" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rounded-xl border border-(--border)/50 overflow-hidden">
          <div className="h-11 bg-(--surface) px-4 flex items-center gap-3">
            <div className="h-3 bg-(--border) rounded w-6" />
            <div className="h-3 bg-(--border) rounded w-32" />
          </div>
          <div className="p-4 space-y-2.5">
            {[1, 2, 3].map(j => (
              <div key={j} className="flex gap-3 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-(--border) shrink-0" />
                <div className="h-3 bg-(--border)/60 rounded flex-1" style={{ width: `${60 + j * 10}%` }} />
                <div className="h-5 bg-(--border)/40 rounded-md w-16 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-10">
      <div className="w-16 h-16 rounded-2xl bg-(--accent)/8 border border-(--accent)/15 flex items-center justify-center">
        <FileText size={26} className="text-(--accent) opacity-50" />
      </div>
      <div>
        <p className="text-sm font-semibold text-(--text) mb-1.5">Select a record to view its brief</p>
        <p className="text-xs text-(--text-muted) leading-relaxed max-w-xs">
          Click any item in the list panel to load its AI-generated intelligence brief with full source citations.
        </p>
      </div>
    </div>
  );
}

// ── Generate prompt ───────────────────────────────────────────────────────────

function GeneratePrompt({ briefType, entityId, onGenerated }: {
  briefType: BriefType;
  entityId: string;
  onGenerated: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setProgress("Fetching records from Supabase…");

    try {
      setTimeout(() => setProgress("Assembling source evidence…"), 1500);
      setTimeout(() => setProgress("Generating AI brief with citations…"), 3000);

      const res  = await fetch(`/api/ai-summaries/${briefType}-brief/${entityId}`, { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || `HTTP ${res.status}`);
      onGenerated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
      setProgress("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-10">
      <div className={clsx(
        "w-16 h-16 rounded-2xl border flex items-center justify-center transition-all",
        generating
          ? "bg-(--accent)/15 border-(--accent)/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
          : "bg-(--accent)/8 border-(--accent)/15"
      )}>
        {generating
          ? <Loader2 size={26} className="text-(--accent) animate-spin" />
          : <Sparkles size={26} className="text-(--accent)" />
        }
      </div>

      <div className="max-w-xs">
        <p className="text-sm font-semibold text-(--text) mb-1.5">
          {generating ? "Generating Brief…" : "No brief generated yet"}
        </p>
        {generating ? (
          <p className="text-xs text-(--text-muted) leading-relaxed animate-pulse">{progress}</p>
        ) : (
          <p className="text-xs text-(--text-muted) leading-relaxed mb-5">
            Generate an AI-powered intelligence brief. Every insight will include clickable evidence citations linked to real Supabase records.
          </p>
        )}

        {error && (
          <div className="mt-3 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
            <p className="text-xs text-red-400 font-medium mb-0.5">Generation failed</p>
            <p className="text-[11px] text-red-400/80 break-words">{error}</p>
          </div>
        )}

        {!generating && (
          <button
            onClick={generate}
            className="flex items-center gap-2 px-5 py-2.5 bg-(--accent) text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 mx-auto"
          >
            <Sparkles size={14} />
            Generate Brief with Citations
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface SummaryDetailPanelProps {
  briefType: BriefType;
  entityId: string | null;
}

export function SummaryDetailPanel({ briefType, entityId }: SummaryDetailPanelProps) {
  const [summary,      setSummary]      = useState<AIGeneratedSummary | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [noBrief,      setNoBrief]      = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Active citation popup
  const [activeCitation, setActiveCitation] = useState<{ citation: RichCitation; rect: DOMRect } | null>(null);

  // History drawer
  const [showHistory, setShowHistory] = useState(false);
  // Share modal
  const [showShare, setShowShare] = useState(false);

  // Listen for citation:open events dispatched by EvidenceButton
  useEffect(() => {
    const handler = (e: Event) => {
      const { citation, rect } = (e as CustomEvent).detail;
      setActiveCitation(prev =>
        prev?.citation.citation_id === citation.citation_id ? null : { citation, rect }
      );
    };
    window.addEventListener("citation:open", handler);
    return () => window.removeEventListener("citation:open", handler);
  }, []);

  const fetchBrief = useCallback(async (eid: string) => {
    setLoading(true);
    setError(null);
    setNoBrief(false);
    setSummary(null);
    setActiveCitation(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: dbErr } = await supabase
        .from("ai_briefs")
        .select("id, generated_summary")
        .eq("brief_type", briefType)
        .eq("entity_id", eid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbErr) throw dbErr;
      if (!data) {
        setNoBrief(true);
      } else {
        setSummary((data as any).generated_summary as AIGeneratedSummary);
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to load brief");
    } finally {
      setLoading(false);
    }
  }, [briefType]);

  useEffect(() => {
    if (!entityId) {
      setSummary(null); setNoBrief(false); setError(null); setActiveCitation(null);
      return;
    }
    fetchBrief(entityId);
  }, [entityId, briefType, fetchBrief]);

  const handleRegenerate = async () => {
    if (!entityId) return;
    setRegenerating(true);
    setError(null);
    setActiveCitation(null);
    try {
      const res  = await fetch(`/api/ai-summaries/${briefType}-brief/${entityId}`, { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || `HTTP ${res.status}`);
      await fetchBrief(entityId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!summary) return;
    const lines = [
      summary.title, "", summary.summaryPreview, "",
      ...(summary.sections?.flatMap(s => [
        `## ${s.title}`,
        s.summary ?? "",
        ...(s.bullets?.filter(b => !isPlaceholder(b.text)).map(b => `- ${b.text}`) ?? []),
        "",
      ]) ?? []),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
  };

  // Stats
  const totalCitations = summary?.sections?.reduce((total, s) =>
    total + (s.bullets?.filter(b => !isPlaceholder(b.text))
      .reduce((n, b) => n + (b.richCitations?.length ?? 0), 0) ?? 0), 0
  ) ?? 0;

  const totalBullets = summary?.sections?.reduce((total, s) =>
    total + (s.bullets?.filter(b => !isPlaceholder(b.text)).length ?? 0), 0
  ) ?? 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!entityId)  return <EmptyState />;
  if (loading)    return <DetailSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
        <AlertCircle size={28} className="text-red-400 opacity-60" />
        <div>
          <p className="text-sm font-medium text-(--text) mb-1">Failed to load brief</p>
          <p className="text-xs text-(--text-muted) max-w-xs mb-3">{error}</p>
          <button onClick={() => fetchBrief(entityId!)} className="text-xs text-(--accent) hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (noBrief) {
    return <GeneratePrompt briefType={briefType} entityId={entityId} onGenerated={() => fetchBrief(entityId)} />;
  }

  if (!summary) return <EmptyState />;

  return (
    <>
      {/* Citation popup rendered in portal at body level */}
      {activeCitation && (
        <CitationPopup
          citation={activeCitation.citation}
          anchorRect={activeCitation.rect}
          onClose={() => setActiveCitation(null)}
        />
      )}

      {/* History drawer rendered in portal at body level */}
      {showHistory && entityId && (
        <BriefHistoryDrawer
          briefType={briefType}
          entityId={entityId}
          currentSummary={summary}
          onRestoreVersion={(restored) => {
            setSummary(restored);
            setShowHistory(false);
          }}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Share modal */}
      {showShare && entityId && (
        <ShareModal
          briefType={briefType}
          entityId={entityId}
          summary={summary}
          onClose={() => setShowShare(false)}
        />
      )}

      <div className="flex flex-col h-full">
        {/* ── Sticky header ── */}
        <div className="px-6 py-4 border-b border-(--border) bg-(--bg2)/95 backdrop-blur-sm shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-(--text) leading-snug mb-2.5 line-clamp-2">
                {summary.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <SentimentBadge value={summary.sentiment ?? summary.health} />
                {summary.contextLabels?.map((lbl, i) => (
                  <span key={i} className="text-[11px] text-(--text-muted) bg-(--surface) border border-(--border) px-2 py-0.5 rounded-full">
                    {lbl}
                  </span>
                ))}
                {totalCitations > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-(--accent) bg-(--accent)/10 border border-(--accent)/20 px-2 py-0.5 rounded-full">
                    <BookOpen size={10} />
                    {totalCitations} sources · {totalBullets} insights
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* History button */}
              <button
                onClick={() => setShowHistory(h => !h)}
                title="Version History"
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors",
                  showHistory
                    ? "text-(--accent) bg-(--accent)/10 border-(--accent)/20"
                    : "text-(--text-muted) bg-(--surface) border-(--border) hover:text-(--text) hover:border-(--border-strong)"
                )}
              >
                <History size={12} />
                History
              </button>

              {/* Share button */}
              <button
                onClick={() => setShowShare(true)}
                title="Share Brief"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-(--accent) bg-(--accent)/10 hover:bg-(--accent)/20 border border-(--accent)/20 rounded-lg transition-colors"
              >
                <Share2 size={12} />
                Share
              </button>

              <button
                onClick={copyToClipboard}
                title="Copy as Markdown"
                className="p-1.5 text-(--text-muted) hover:text-(--text) hover:bg-(--surface) rounded-lg transition-colors"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-(--accent) bg-(--accent)/10 hover:bg-(--accent)/20 border border-(--accent)/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={clsx(regenerating && "animate-spin")} />
                {regenerating ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">

          {/* Executive summary card */}
          {summary.summaryPreview && !isPlaceholder(summary.summaryPreview) && (
            <div className="p-4 rounded-xl bg-(--accent)/5 border border-(--accent)/15">
              <p className="text-[10px] font-bold uppercase tracking-widest text-(--accent) mb-2">
                Executive Summary
              </p>
              <p className="text-sm text-(--text) leading-relaxed">{summary.summaryPreview}</p>
            </div>
          )}

          {/* Sections */}
          {summary.sections?.map((section, i) => (
            <Section
              key={i}
              section={section}
              index={i}
              feedbackBase={entityId ? {
                entityId,
                entityType: briefType,
                briefType,
              } : undefined}
            />
          ))}

          {/* Footer hint */}
          {totalCitations > 0 && (
            <p className="text-center text-[11px] text-(--text-muted) opacity-40 py-3">
              Click any <span className="font-semibold">Evidence</span> button to view the source record
            </p>
          )}
        </div>
      </div>
    </>
  );
}
