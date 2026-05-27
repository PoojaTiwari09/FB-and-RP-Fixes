import { useEffect, useState, useCallback } from "react";
import { getBrief, generateBrief } from "../../api/m03Api";
import {
  Sparkles, ChevronDown, ChevronUp, Copy, RefreshCw,
  FileText, AlertCircle, Loader2, BookOpen, History, Share2,
} from "lucide-react";
import { EvidenceButton, CitationPopup } from "./CitationPopup";
import { BriefHistoryDrawer } from "./BriefHistoryDrawer";
import { ShareModal } from "./ShareModal";
import { FeedbackButtons } from "./FeedbackButtons";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLACEHOLDER_PATTERNS = [
  /not available in current/i,
  /no data available/i,
  /not found in/i,
  /no records found/i,
  /data not provided/i,
  /information not available/i,
];

function isPlaceholder(text) {
  return PLACEHOLDER_PATTERNS.some(p => p.test(text));
}

// ── Sentiment Badge ───────────────────────────────────────────────────────────

function SentimentBadge({ value }) {
  if (!value) return null;
  const v = value.toLowerCase();
  const isPos = v.includes("positive") || v.includes("good") || v.includes("excellent");
  const isNeg = v.includes("negative") || v.includes("poor") || v.includes("risk") || v.includes("at_risk");
  return (
    <span
      className={
        isPos
          ? "ss-sentiment-positive"
          : isNeg
          ? "ss-sentiment-positive ss-sentiment-negative"
          : "ss-sentiment-positive"
      }
      style={
        !isPos && !isNeg
          ? { background: "rgba(234,179,8,0.1)", color: "#ca8a04", borderColor: "rgba(234,179,8,0.25)" }
          : {}
      }
    >
      <span style={{ fontSize: 8 }}>●</span>
      <span style={{ textTransform: "capitalize" }}>{value}</span>
    </span>
  );
}

// ── Bullet row with evidence ──────────────────────────────────────────────────

function BulletRow({ text, owner, richCitations, feedbackCtx }) {
  if (isPlaceholder(text)) return null;
  const hasCitations = richCitations && richCitations.length > 0;

  return (
    <li className="ss-bullet">
      <span
        className={`ss-bullet-dot${hasCitations ? "" : " ss-bullet-dot-muted"}`}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="ss-bullet-text">{text}</span>

        {hasCitations && (
          <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 3, marginLeft: 4, verticalAlign: "middle" }}>
            {richCitations.map((cit, ci) => (
              <EvidenceButton key={ci} citation={cit} />
            ))}
          </span>
        )}

        {owner && (
          <span className="ss-owner-tag">@{owner}</span>
        )}

        {feedbackCtx && <FeedbackButtons ctx={feedbackCtx} />}
      </div>
    </li>
  );
}

// ── Collapsible Section ───────────────────────────────────────────────────────

function Section({ section, index, feedbackBase }) {
  const [open, setOpen] = useState(true);
  const validBullets  = (section.bullets ?? []).filter(b => !isPlaceholder(b.text));
  const citationCount = validBullets.reduce((n, b) => n + (b.richCitations?.length ?? 0), 0);
  if (!section.summary && validBullets.length === 0) return null;

  return (
    <div className="ss-section">
      <button
        onClick={() => setOpen(o => !o)}
        className="ss-section-header"
      >
        <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
          {/* section icon/bullet */}
          <span className="ss-section-icon">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
          <span className="ss-section-title">{section.title}</span>
          {citationCount > 0 && (
            <span className="ss-section-count">
              <BookOpen size={9} />
              {citationCount}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="ss-section-body">
          {section.summary && !isPlaceholder(section.summary) && (
            <p className="ss-section-summary">{section.summary}</p>
          )}
          {validBullets.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {validBullets.map((bullet, bi) => (
                <BulletRow
                  key={bi}
                  text={bullet.text}
                  owner={bullet.owner}
                  richCitations={bullet.richCitations}
                  feedbackCtx={feedbackBase ? {
                    ...feedbackBase,
                    sectionName: section.title,
                    bulletId:    bullet.bullet_id ?? `s${index}_b${bi}`,
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
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* header */}
      <div style={{ height: 18, background: "#e2e8f0", borderRadius: 4, width: "55%" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ height: 22, background: "#f1f5f9", borderRadius: 20, width: 80 }} />
        <div style={{ height: 22, background: "#f1f5f9", borderRadius: 20, width: 70 }} />
        <div style={{ height: 22, background: "#f1f5f9", borderRadius: 20, width: 100 }} />
      </div>
      {/* exec summary */}
      <div style={{ height: 72, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }} />
      {/* sections */}
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="ss-section" style={{ padding: 14 }}>
          <div style={{ height: 14, background: "#e2e8f0", borderRadius: 4, width: `${40 + i * 8}%` }} />
        </div>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      gap: 20,
      textAlign: "center",
      padding: "0 48px",
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 14,
        background: "rgba(59,130,246,0.07)",
        border: "1px solid rgba(59,130,246,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <FileText size={24} style={{ color: "#3b82f6", opacity: 0.5 }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
          Select a record to view its brief
        </p>
        <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, maxWidth: 280 }}>
          Click any item in the list panel to load its AI-generated intelligence brief with full source citations.
        </p>
      </div>
    </div>
  );
}

// ── Generate Prompt ───────────────────────────────────────────────────────────

function GeneratePrompt({ briefType, entityId, onGenerated }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
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
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
      setProgress("");
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      gap: 20,
      textAlign: "center",
      padding: "0 48px",
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 14,
        background: generating ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.07)",
        border: generating ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(59,130,246,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
      }}>
        {generating
          ? <Loader2 size={24} style={{ color: "#3b82f6", animation: "spin 1s linear infinite" }} />
          : <Sparkles size={24} style={{ color: "#3b82f6" }} />
        }
      </div>

      <div style={{ maxWidth: 280 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
          {generating ? "Generating Brief…" : "No brief generated yet"}
        </p>
        {generating ? (
          <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{progress}</p>
        ) : (
          <>
            <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>
              Generate an AI-powered intelligence brief. Every insight will include clickable evidence citations linked to real Supabase records.
            </p>

            {error && (
              <div style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 8,
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.2)",
                textAlign: "left",
              }}>
                <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 3 }}>Generation failed</p>
                <p style={{ fontSize: 11, color: "#ef4444", wordBreak: "break-word" }}>{error}</p>
              </div>
            )}

            <button
              onClick={generate}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 20px",
                background: "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <Sparkles size={13} />
              Generate Brief with Citations
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SummaryDetailPanel({ briefType, entityId }) {
  const [summary,      setSummary]      = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [noBrief,      setNoBrief]      = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [activeCitation, setActiveCitation] = useState(null);
  const [showHistory,    setShowHistory]    = useState(false);
  const [showShare,      setShowShare]      = useState(false);

  useEffect(() => {
    const handler = (e) => {
      const { citation, rect } = e.detail;
      setActiveCitation(prev =>
        prev?.citation.citation_id === citation.citation_id ? null : { citation, rect }
      );
    };
    window.addEventListener("citation:open", handler);
    return () => window.removeEventListener("citation:open", handler);
  }, []);

  const fetchBrief = useCallback(async (eid) => {
    setLoading(true);
    setError(null);
    setNoBrief(false);
    setSummary(null);
    setActiveCitation(null);

    try {
      const body = await getBrief(briefType, eid);
      if (!body?.data) {
        setNoBrief(true);
      } else {
        setSummary(body.data);
      }
    } catch (err) {
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
      const body = await generateBrief(briefType, entityId);
      if (!body?.success) throw new Error(body.error || "Generation failed");
      await fetchBrief(entityId);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!summary) return;
    const lines = [
      summary.title, "",
      summary.summaryPreview, "",
      ...(summary.sections?.flatMap(s => [
        `## ${s.title}`,
        s.summary ?? "",
        ...(s.bullets?.filter(b => !isPlaceholder(b.text)).map(b => `- ${b.text}`) ?? []),
        "",
      ]) ?? []),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
  };

  const totalCitations = summary?.sections?.reduce((total, s) =>
    total + (s.bullets?.filter(b => !isPlaceholder(b.text))
      .reduce((n, b) => n + (b.richCitations?.length ?? 0), 0) ?? 0), 0
  ) ?? 0;

  const totalBullets = summary?.sections?.reduce((total, s) =>
    total + (s.bullets?.filter(b => !isPlaceholder(b.text)).length ?? 0), 0
  ) ?? 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!entityId)  return <EmptyState />;
  if (loading)    return <DetailSkeleton />;

  if (error) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 16,
        textAlign: "center",
        padding: "0 32px",
      }}>
        <AlertCircle size={26} style={{ color: "#ef4444", opacity: 0.6 }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
            Failed to load brief
          </p>
          <p style={{ fontSize: 12, color: "#64748b", maxWidth: 280, marginBottom: 12 }}>{error}</p>
          <button
            onClick={() => fetchBrief(entityId)}
            style={{ fontSize: 12, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
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
      {activeCitation && (
        <CitationPopup
          citation={activeCitation.citation}
          anchorRect={activeCitation.rect}
          onClose={() => setActiveCitation(null)}
        />
      )}

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

      {showShare && entityId && (
        <ShareModal
          briefType={briefType}
          entityId={entityId}
          summary={summary}
          onClose={() => setShowShare(false)}
        />
      )}

      <div className="ss-detail-panel">
        {/* ── Sticky Header ── */}
        <div className="ss-detail-header">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="ss-detail-title">{summary.title}</h2>
              <div className="ss-detail-badges">
                <SentimentBadge value={summary.sentiment ?? summary.health} />
                {summary.contextLabels?.map((lbl, i) => (
                  <span key={i} className="ss-context-label">{lbl}</span>
                ))}
                {totalCitations > 0 && (
                  <span className="ss-sources-badge">
                    <BookOpen size={10} />
                    {totalCitations} sources · {totalBullets} insights
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => setShowHistory(h => !h)}
                title="Version History"
                className={showHistory ? "ss-btn-primary" : "ss-btn-ghost"}
              >
                <History size={12} />
                History
              </button>

              <button
                onClick={() => setShowShare(true)}
                title="Share Brief"
                className="ss-btn-primary"
              >
                <Share2 size={12} />
                Share
              </button>

              <button
                onClick={copyToClipboard}
                title="Copy as Markdown"
                className="ss-btn-ghost"
                style={{ padding: "5px 8px" }}
              >
                <Copy size={13} />
              </button>

              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                title="Regenerate"
                className="ss-btn-primary"
                style={{ opacity: regenerating ? 0.6 : 1 }}
              >
                <RefreshCw
                  size={12}
                  style={{ animation: regenerating ? "spin 1s linear infinite" : "none" }}
                />
                {regenerating ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: "#f8f9fc",
        }}>
          {/* Executive Summary Card */}
          {summary.summaryPreview && !isPlaceholder(summary.summaryPreview) && (
            <div className="ss-exec-summary">
              <p className="ss-exec-label">Executive Summary</p>
              <p className="ss-exec-text">{summary.summaryPreview}</p>
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
            <p style={{
              textAlign: "center",
              fontSize: 11,
              color: "#94a3b8",
              padding: "12px 0 4px",
            }}>
              Click any <strong>Evidence</strong> button to view the source record
            </p>
          )}
        </div>
      </div>
    </>
  );
}
