import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import clsx from "clsx";
import {
  ChevronDown, ChevronUp, BookOpen, ShieldCheck,
  Clock, AlertCircle, Loader2, FileText,
} from "lucide-react";
import { EvidenceButton, CitationPopup } from "../components/summaries/CitationPopup";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLACEHOLDER_PATTERNS = [
  /not available in current/i,
  /no data available/i,
  /not found in/i,
  /no records found/i,
  /data not provided/i,
  /information not available/i,
];
const isPlaceholder = (t) => PLACEHOLDER_PATTERNS.some(p => p.test(t));

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// ── Sentiment badge ───────────────────────────────────────────────────────────

function SentimentBadge({ value }) {
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
      <span className="capitalize">{value}</span>
    </span>
  );
}

// ── Bullet row ────────────────────────────────────────────────────────────────

function BulletRow({ text, richCitations }) {
  if (isPlaceholder(text)) return null;
  const hasCit = richCitations && richCitations.length > 0;
  return (
    <li className="flex gap-3 py-1.5 items-start">
      <span className={clsx("mt-2 w-1.5 h-1.5 rounded-full shrink-0", hasCit ? "bg-blue-400" : "bg-gray-500/40")} />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-200 leading-relaxed">{text}</span>
        {hasCit && (
          <span className="inline-flex flex-wrap gap-1 ml-1">
            {richCitations.map((cit, i) => <EvidenceButton key={i} citation={cit} />)}
          </span>
        )}
      </div>
    </li>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({ section, index }) {
  const [open, setOpen] = useState(true);
  const bullets = (section.bullets ?? []).filter(b => !isPlaceholder(b.text));
  const citCount = bullets.reduce((n, b) => n + (b.richCitations?.length ?? 0), 0);
  if (!section.summary && bullets.length === 0) return null;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/8 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[11px] font-mono text-blue-400 opacity-60 shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-semibold text-white truncate">{section.title}</span>
          {citCount > 0 && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded-full">
              <BookOpen size={9} /> {citCount}
            </span>
          )}
        </div>
        <span className="shrink-0 ml-2 text-gray-500">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-white/10">
          {section.summary && !isPlaceholder(section.summary) && (
            <p className="text-sm text-gray-400 leading-relaxed mb-3">{section.summary}</p>
          )}
          {bullets.length > 0 && (
            <ul className="space-y-0.5">
              {bullets.map((b, i) => (
                <BulletRow key={i} text={b.text} richCitations={b.richCitations} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Error states ──────────────────────────────────────────────────────────────

function ErrorState({ message }) {
  const isRevoked  = message.toLowerCase().includes("revoked");
  const isExpired  = message.toLowerCase().includes("expired");
  const isInvalid  = message.toLowerCase().includes("invalid");

  const icon  = isRevoked ? "🔒" : isExpired ? "⏰" : "❌";
  const title = isRevoked  ? "Link Revoked"
              : isExpired  ? "Link Expired"
              : isInvalid  ? "Invalid Link"
              : "Access Denied";

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-5xl">{icon}</div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
        <div className="pt-2">
          <p className="text-xs text-gray-600">
            Contact the person who shared this link for a new one.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="text-blue-400 animate-spin" />
        <p className="text-sm text-gray-400">Validating secure link…</p>
      </div>
    </div>
  );
}

// ── Main shared view ──────────────────────────────────────────────────────────

export default function SharedBriefPage() {
  const { token } = useParams();
  const [summary,   setSummary]   = useState(null);
  const [meta,      setMeta]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [activeCit, setActiveCit] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const { citation, rect } = e.detail;
      setActiveCit(prev =>
        prev?.citation.citation_id === citation.citation_id ? null : { citation, rect }
      );
    };
    window.addEventListener("citation:open", handler);
    return () => window.removeEventListener("citation:open", handler);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const res  = await fetch(`/api/share/${token}`);
        const body = await res.json();
        if (!body.success) throw new Error(body.error || "Failed to load");
        setSummary(body.data.summary);
        setMeta({
          briefType: body.data.briefType,
          expiresAt: body.data.expiresAt,
          createdAt: body.data.createdAt,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;
  if (!summary) return <ErrorState message="Invalid or inaccessible share link" />;

  const totalCit = summary.sections?.reduce((n, s) =>
    n + (s.bullets?.filter(b => !isPlaceholder(b.text))
      .reduce((m, b) => m + (b.richCitations?.length ?? 0), 0) ?? 0), 0
  ) ?? 0;

  return (
    <>
      {activeCit && (
        <CitationPopup
          citation={activeCit.citation}
          anchorRect={activeCit.rect}
          onClose={() => setActiveCit(null)}
        />
      )}

      <div className="min-h-screen bg-[#0a0a0f] text-white overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                  <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-mono font-bold text-sm tracking-widest text-white">SMARTSUMMARY</span>
              <span className="text-[9px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">AI</span>
            </div>

            {/* Read-only badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/8 text-[11px] font-semibold text-emerald-400">
              <ShieldCheck size={11} />
              Read Only
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {/* Brief header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider capitalize">
                {meta?.briefType} Brief
              </span>
              <span className="text-gray-700">·</span>
              <SentimentBadge value={summary.sentiment ?? summary.health} />
              {totalCit > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full">
                  <BookOpen size={10} />
                  {totalCit} cited sources
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-white leading-snug">{summary.title}</h1>

            <div className="flex flex-wrap gap-2">
              {summary.contextLabels?.map((lbl, i) => (
                <span key={i} className="text-[11px] text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                  {lbl}
                </span>
              ))}
            </div>

            {/* Shared meta */}
            {meta && (
              <div className="flex items-center gap-3 text-[11px] text-gray-600 pt-1">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  Shared {formatDate(meta.createdAt)}
                </span>
                {meta.expiresAt && (
                  <>
                    <span>·</span>
                    <span>Expires {formatDate(meta.expiresAt)}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Executive summary */}
          {summary.summaryPreview && !isPlaceholder(summary.summaryPreview) && (
            <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/15">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">
                Executive Summary
              </p>
              <p className="text-sm text-gray-200 leading-relaxed">{summary.summaryPreview}</p>
            </div>
          )}

          {/* Sections */}
          <div className="space-y-3">
            {summary.sections?.map((section, i) => (
              <Section key={i} section={section} index={i} />
            ))}
          </div>

          {/* Citation hint */}
          {totalCit > 0 && (
            <p className="text-center text-[11px] text-gray-700 py-4">
              Click any <span className="font-semibold text-gray-500">Evidence</span> button to view the source record
            </p>
          )}

          {/* Footer */}
          <div className="border-t border-white/5 pt-6 pb-8 text-center space-y-2">
            <p className="text-xs text-gray-600">
              This is a read-only shared brief. You cannot edit, regenerate, or access other records.
            </p>
            <p className="text-[11px] text-gray-700">
              Powered by <span className="text-gray-500 font-semibold">SmartSummary AI</span>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
