"use client";

import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";
import {
  ThumbsUp, ThumbsDown, Flag, RefreshCw, AlertCircle,
  TrendingUp, TrendingDown, BarChart3, Loader2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeedbackStats {
  total: number;
  thumbsUp: number;
  thumbsDown: number;
  flags: number;
  positiveRate: number;
  flagRate: number;
  byType: Record<string, number>;
  byReason: Record<string, number>;
  bySection: Record<string, number>;
  mostFlagged: Array<{ bullet_id: string; text: string; count: number; flags: number }>;
  recent: Array<{
    feedback_type: string;
    feedback_reason: string | null;
    bullet_text: string | null;
    section_name: string | null;
    brief_type: string | null;
    created_at: string;
  }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  thumbs_up:       { label: "Thumbs Up",       color: "text-emerald-400", bg: "bg-emerald-400/10" },
  thumbs_down:     { label: "Thumbs Down",     color: "text-red-400",     bg: "bg-red-400/10" },
  inaccuracy_flag: { label: "Inaccuracy Flag", color: "text-amber-400",   bg: "bg-amber-400/10" },
  hallucination:   { label: "Hallucination",   color: "text-orange-400",  bg: "bg-orange-400/10" },
  missing_context: { label: "Missing Context", color: "text-blue-400",    bg: "bg-blue-400/10" },
  wrong_sentiment: { label: "Wrong Sentiment", color: "text-purple-400",  bg: "bg-purple-400/10" },
  incorrect_risk:  { label: "Incorrect Risk",  color: "text-rose-400",    bg: "bg-rose-400/10" },
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="p-5 rounded-2xl border border-(--border) bg-(--bg2) space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">{label}</p>
        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", color.replace("text-", "bg-").replace("400", "400/15"))}>
          <Icon size={15} className={color} />
        </div>
      </div>
      <p className={clsx("text-3xl font-bold", color)}>{value}</p>
      {sub && <p className="text-xs text-(--text-muted)">{sub}</p>}
    </div>
  );
}

// ── Bar chart (CSS-based) ─────────────────────────────────────────────────────

function BarRow({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-(--text-muted) w-36 shrink-0 truncate">{label}</p>
      <div className="flex-1 h-2 bg-(--surface) rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs font-mono text-(--text-muted) w-8 text-right shrink-0">{count}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminFeedbackPage() {
  const [stats,   setStats]   = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tab,     setTab]     = useState<"overview" | "flagged" | "recent">("overview");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/feedback");
      const body = await res.json();
      if (!body.success) throw new Error(body.error);
      setStats(body.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      {/* Header */}
      <div className="border-b border-(--border) bg-(--bg2)/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 size={18} className="text-(--accent)" />
            <h1 className="text-base font-bold text-(--text)">AI Feedback Dashboard</h1>
            <span className="text-[11px] text-(--text-muted) bg-(--surface) border border-(--border) px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-(--text-muted) bg-(--surface) border border-(--border) rounded-lg hover:text-(--text) transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={clsx(loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {loading && !stats && (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 size={20} className="animate-spin text-(--accent)" />
            <p className="text-sm text-(--text-muted)">Loading feedback data…</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {stats && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Feedback"   value={stats.total}          sub="All time"                    icon={BarChart3}   color="text-(--accent)" />
              <StatCard label="Positive Rate"    value={`${stats.positiveRate}%`} sub={`${stats.thumbsUp} thumbs up`}  icon={TrendingUp}  color="text-emerald-400" />
              <StatCard label="Negative Rate"    value={`${100 - stats.positiveRate}%`} sub={`${stats.thumbsDown} thumbs down`} icon={TrendingDown} color="text-red-400" />
              <StatCard label="Flag Rate"        value={`${stats.flagRate}%`} sub={`${stats.flags} flags`}      icon={Flag}        color="text-amber-400" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-(--border)">
              {(["overview", "flagged", "recent"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={clsx(
                    "px-4 py-2.5 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors",
                    tab === t
                      ? "border-(--accent) text-(--accent)"
                      : "border-transparent text-(--text-muted) hover:text-(--text)"
                  )}
                >
                  {t === "flagged" ? "Most Flagged" : t === "recent" ? "Recent Activity" : "Overview"}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {tab === "overview" && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* By type */}
                <div className="p-5 rounded-2xl border border-(--border) bg-(--bg2) space-y-4">
                  <p className="text-sm font-bold text-(--text)">Feedback by Type</p>
                  <div className="space-y-3">
                    {Object.entries(stats.byType)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => {
                        const cfg = TYPE_CONFIG[type] ?? { label: type, color: "text-(--text-muted)", bg: "bg-(--surface)" };
                        return (
                          <div key={type} className="flex items-center justify-between">
                            <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full", cfg.color, cfg.bg)}>
                              {cfg.label}
                            </span>
                            <span className="text-sm font-mono text-(--text)">{count}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* By reason */}
                <div className="p-5 rounded-2xl border border-(--border) bg-(--bg2) space-y-4">
                  <p className="text-sm font-bold text-(--text)">Flag Reasons</p>
                  {Object.keys(stats.byReason).length === 0 ? (
                    <p className="text-xs text-(--text-muted)">No flags yet</p>
                  ) : (
                    <div className="space-y-2.5">
                      {Object.entries(stats.byReason)
                        .sort((a, b) => b[1] - a[1])
                        .map(([reason, count]) => (
                          <BarRow
                            key={reason}
                            label={reason.replace(/_/g, " ")}
                            count={count}
                            max={Math.max(...Object.values(stats.byReason))}
                            color="bg-amber-400"
                          />
                        ))}
                    </div>
                  )}
                </div>

                {/* By section */}
                <div className="p-5 rounded-2xl border border-(--border) bg-(--bg2) space-y-4 md:col-span-2">
                  <p className="text-sm font-bold text-(--text)">Feedback by Section</p>
                  {Object.keys(stats.bySection).length === 0 ? (
                    <p className="text-xs text-(--text-muted)">No section data yet</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-2.5">
                      {Object.entries(stats.bySection)
                        .sort((a, b) => b[1] - a[1])
                        .map(([section, count]) => (
                          <BarRow
                            key={section}
                            label={section}
                            count={count}
                            max={Math.max(...Object.values(stats.bySection))}
                            color="bg-(--accent)"
                          />
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Most flagged tab */}
            {tab === "flagged" && (
              <div className="rounded-2xl border border-(--border) bg-(--bg2) overflow-hidden">
                <div className="px-5 py-3.5 border-b border-(--border) flex items-center gap-2">
                  <Flag size={14} className="text-amber-400" />
                  <p className="text-sm font-bold text-(--text)">Most Flagged Insights</p>
                </div>
                {stats.mostFlagged.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-(--text-muted)">No flagged insights yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-(--border)/40">
                    {stats.mostFlagged.map((item, i) => (
                      <div key={i} className="px-5 py-3.5 flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono text-(--text-muted) mb-1">{item.bullet_id}</p>
                          <p className="text-sm text-(--text) line-clamp-2">{item.text || "—"}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-(--text-muted)">{item.count} total</span>
                          {item.flags > 0 && (
                            <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                              {item.flags} flags
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recent tab */}
            {tab === "recent" && (
              <div className="rounded-2xl border border-(--border) bg-(--bg2) overflow-hidden">
                <div className="px-5 py-3.5 border-b border-(--border)">
                  <p className="text-sm font-bold text-(--text)">Recent Feedback</p>
                </div>
                {stats.recent.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-(--text-muted)">No feedback yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-(--border)/40">
                    {stats.recent.map((item, i) => {
                      const cfg = TYPE_CONFIG[item.feedback_type] ?? { label: item.feedback_type, color: "text-(--text-muted)", bg: "bg-(--surface)" };
                      return (
                        <div key={i} className="px-5 py-3 flex items-start gap-4">
                          <span className={clsx("text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5", cfg.color, cfg.bg)}>
                            {cfg.label}
                          </span>
                          <div className="flex-1 min-w-0">
                            {item.bullet_text && (
                              <p className="text-xs text-(--text) line-clamp-1 mb-0.5">"{item.bullet_text}"</p>
                            )}
                            <div className="flex items-center gap-2 text-[11px] text-(--text-muted)">
                              {item.section_name && <span>{item.section_name}</span>}
                              {item.brief_type && <><span>·</span><span className="capitalize">{item.brief_type} brief</span></>}
                              {item.feedback_reason && <><span>·</span><span>{item.feedback_reason.replace(/_/g, " ")}</span></>}
                            </div>
                          </div>
                          <span className="text-[11px] text-(--text-muted) shrink-0">{formatTime(item.created_at)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
