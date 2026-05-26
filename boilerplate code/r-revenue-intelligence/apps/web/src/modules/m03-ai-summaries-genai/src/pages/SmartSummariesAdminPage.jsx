import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThumbsUp, ThumbsDown, Flag, RefreshCw, AlertCircle,
  TrendingUp, TrendingDown, BarChart3, Loader2,
  ArrowLeft, Settings, Plus, LayoutDashboard
} from "lucide-react";
import { TemplateBuilder } from "../components/summaries/TemplateBuilder";

// ── Type configs ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  thumbs_up:       { label: "Thumbs Up",       hex: "#10b981", bg: "#d1fae5" },
  thumbs_down:     { label: "Thumbs Down",     hex: "#ef4444", bg: "#fee2e2" },
  inaccuracy_flag: { label: "Inaccuracy Flag", hex: "#f59e0b", bg: "#fef3c7" },
  hallucination:   { label: "Hallucination",   hex: "#f97316", bg: "#ffedd5" },
  missing_context: { label: "Missing Context", hex: "#3b82f6", bg: "#dbeafe" },
  wrong_sentiment: { label: "Wrong Sentiment", hex: "#8b5cf6", bg: "#ede9fe" },
  incorrect_risk:  { label: "Incorrect Risk",  hex: "#f43f5e", bg: "#ffe4e6" },
};

function formatTime(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, valueColor }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </p>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: iconBg, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, color: valueColor || "#111827", lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: "#6b7280" }}>{sub}</p>}
    </div>
  );
}

// ── Bar Row ───────────────────────────────────────────────────────────────────

function BarRow({ label, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <p style={{ fontSize: 12, color: "#6b7280", width: 140, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </p>
      <div style={{ flex: 1, height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#f59e0b", borderRadius: 99, transition: "width 0.5s" }} />
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", width: 24, textAlign: "right", flexShrink: 0 }}>{count}</p>
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({ title, children }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{title}</p>
      </div>
      <div style={{ padding: "14px 18px" }}>
        {children}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SmartSummariesAdminPage() {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState("templates");

  // Templates
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templatesError, setTemplatesError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Feedback
  const [stats, setStats] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [feedbackTab, setFeedbackTab] = useState("overview");

  // ── Fetchers ──
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    setTemplatesError(null);
    try {
      const res = await fetch("/api/admin/templates");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTemplates(data || []);
    } catch (err) {
      setTemplatesError(err.message || "Failed to load templates");
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  const fetchFeedbackStats = useCallback(async () => {
    setLoadingFeedback(true);
    setFeedbackError(null);
    try {
      const res = await fetch("/api/feedback");
      const body = await res.json();
      if (!body.success) throw new Error(body.error || "Failed to load feedback stats");
      setStats(body.stats);
    } catch (err) {
      setFeedbackError(err.message || "Failed to load feedback stats");
    } finally {
      setLoadingFeedback(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);
  useEffect(() => {
    if (activeSubTab === "feedback") fetchFeedbackStats();
  }, [activeSubTab, fetchFeedbackStats]);

  // ── Template handlers ──
  const handleEditTemplate = async (templateId) => {
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSelectedTemplate(data);
      setIsEditing(true);
    } catch (err) {
      alert("Failed to load template: " + err.message);
    }
  };
  const handleCreateTemplate = () => { setSelectedTemplate(null); setIsEditing(true); };
  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchTemplates();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };
  const handleSaveComplete = () => { setIsEditing(false); setSelectedTemplate(null); fetchTemplates(); };

  if (isEditing) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", padding: 24 }} className="smart-summaries-theme">
        <TemplateBuilder
          initialData={selectedTemplate}
          onSaveComplete={handleSaveComplete}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  // Tab stats computed safely
  const total       = stats?.total        ?? 0;
  const thumbsUp    = stats?.thumbsUp     ?? 0;
  const thumbsDown  = stats?.thumbsDown   ?? 0;
  const flags       = stats?.flags        ?? 0;
  const positiveRate= stats?.positiveRate ?? 0;
  const negativeRate= total > 0 ? Math.round(((thumbsDown) / total) * 100) : 0;
  const flagRate    = stats?.flagRate     ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", background: "#f3f4f6", overflow: "hidden" }}>

      {/* ── Top Nav Bar ── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 52,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/smart-summaries")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 8, border: "1px solid #e5e7eb",
              background: "#fff", cursor: "pointer", color: "#6b7280",
            }}
          >
            <ArrowLeft size={14} />
          </button>
          <div style={{ width: 1, height: 20, background: "#e5e7eb" }} />
          <LayoutDashboard size={16} style={{ color: "#4f46e5" }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>AI Feedback Dashboard</p>
          <span style={{
            fontSize: 10, fontWeight: 600, color: "#6b7280",
            background: "#f3f4f6", border: "1px solid #e5e7eb",
            borderRadius: 6, padding: "2px 8px",
          }}>Admin</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Nav tabs */}
          {[
            { key: "templates", label: "AI Templates" },
            { key: "feedback",  label: "Feedback Metrics" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveSubTab(t.key)}
              style={{
                padding: "5px 14px",
                borderRadius: 8,
                border: "1px solid transparent",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                background: activeSubTab === t.key ? "#ede9fe" : "transparent",
                color: activeSubTab === t.key ? "#4f46e5" : "#6b7280",
                borderColor: activeSubTab === t.key ? "#c4b5fd" : "transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

        {/* ═══ TAB: Templates ═══ */}
        {activeSubTab === "templates" && (
          <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Dynamic Brief Templates</h2>
                <p style={{ fontSize: 12, color: "#6b7280" }}>Configure prompt hierarchies, sections, and source restrictions.</p>
              </div>
              <button
                onClick={handleCreateTemplate}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 16px", background: "#4f46e5", color: "#fff",
                  border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", boxShadow: "0 1px 4px rgba(79,70,229,0.3)",
                }}
              >
                <Plus size={13} />
                New Template
              </button>
            </div>

            {loadingTemplates && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 10 }}>
                <Loader2 size={18} style={{ color: "#4f46e5", animation: "spin 1s linear infinite" }} />
                <p style={{ fontSize: 12, color: "#6b7280" }}>Loading templates…</p>
              </div>
            )}

            {templatesError && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10 }}>
                <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: "#ef4444" }}>{templatesError}</p>
              </div>
            )}

            {!loadingTemplates && !templatesError && (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
                      {["Template Name", "Target Entity", "Version", "Status", "Actions"].map((h, i) => (
                        <th key={h} style={{
                          padding: "10px 16px", fontSize: 10, fontWeight: 700,
                          color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em",
                          textAlign: i === 4 ? "right" : "left",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {templates.length > 0 ? templates.map((t, idx) => (
                      <tr key={t.id} style={{ borderBottom: idx < templates.length - 1 ? "1px solid #f9fafb" : "none" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{t.template_name}</p>
                          <p style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>
                            {t.description || "No description."}
                          </p>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                            padding: "2px 8px", borderRadius: 6, background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb",
                          }}>{t.entity_type}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#9ca3af", fontFamily: "monospace" }}>
                          v{t.version_number || 1}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {t.is_active ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "#10b981", background: "#d1fae5", padding: "2px 8px", borderRadius: 99 }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} /> Active
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "#9ca3af", background: "#f3f4f6", padding: "2px 8px", borderRadius: 99 }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#9ca3af" }} /> Inactive
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button onClick={() => handleEditTemplate(t.id)} style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", background: "none", border: "none", cursor: "pointer", marginRight: 12 }}>
                            Configure
                          </button>
                          <button onClick={() => handleDeleteTemplate(t.id)} style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} style={{ padding: 40, textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
                          No templates yet. Create a new template configuration.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: Feedback Dashboard ═══ */}
        {activeSubTab === "feedback" && (
          <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 0 }}>AI Feedback Dashboard</h2>
                </div>
              </div>
              <button
                onClick={fetchFeedbackStats}
                disabled={loadingFeedback}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", background: "#fff",
                  border: "1px solid #e5e7eb", borderRadius: 8,
                  fontSize: 12, fontWeight: 600, color: "#374151",
                  cursor: loadingFeedback ? "not-allowed" : "pointer",
                  opacity: loadingFeedback ? 0.6 : 1,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                <RefreshCw size={12} style={{ animation: loadingFeedback ? "spin 1s linear infinite" : "none" }} />
                Refresh
              </button>
            </div>

            {/* Loading */}
            {loadingFeedback && !stats && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 10 }}>
                <Loader2 size={18} style={{ color: "#4f46e5", animation: "spin 1s linear infinite" }} />
                <p style={{ fontSize: 12, color: "#6b7280" }}>Loading feedback data…</p>
              </div>
            )}

            {/* Error */}
            {feedbackError && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10 }}>
                <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: "#ef4444" }}>{feedbackError}</p>
              </div>
            )}

            {/* Dashboard when stats loaded */}
            {stats && (
              <>
                {/* ── 4 Stat Cards ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                  <StatCard
                    label="Total Feedback"
                    value={total}
                    sub="All time"
                    icon={BarChart3}
                    iconBg="#ede9fe"
                    iconColor="#4f46e5"
                    valueColor="#111827"
                  />
                  <StatCard
                    label="Positive Rate"
                    value={`${positiveRate}%`}
                    sub={`${thumbsUp} thumbs up`}
                    icon={TrendingUp}
                    iconBg="#d1fae5"
                    iconColor="#10b981"
                    valueColor="#10b981"
                  />
                  <StatCard
                    label="Negative Rate"
                    value={`${negativeRate}%`}
                    sub={`${thumbsDown} thumbs down`}
                    icon={TrendingDown}
                    iconBg="#fee2e2"
                    iconColor="#ef4444"
                    valueColor="#ef4444"
                  />
                  <StatCard
                    label="Flag Rate"
                    value={`${flagRate}%`}
                    sub={`${flags} flags`}
                    icon={Flag}
                    iconBg="#fef3c7"
                    iconColor="#f59e0b"
                    valueColor="#f59e0b"
                  />
                </div>

                {/* ── Sub-tabs ── */}
                <div style={{ borderBottom: "1px solid #e5e7eb", display: "flex", gap: 0 }}>
                  {[
                    { key: "overview", label: "Overview" },
                    { key: "flagged",  label: "Most Flagged" },
                    { key: "recent",   label: "Recent Activity" },
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setFeedbackTab(t.key)}
                      style={{
                        padding: "10px 18px",
                        fontSize: 13,
                        fontWeight: 600,
                        background: "none",
                        border: "none",
                        borderBottom: feedbackTab === t.key ? "2px solid #4f46e5" : "2px solid transparent",
                        color: feedbackTab === t.key ? "#4f46e5" : "#6b7280",
                        cursor: "pointer",
                        marginBottom: -1,
                        transition: "color 0.15s, border-color 0.15s",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* ── Overview Tab ── */}
                {feedbackTab === "overview" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flexDirection: "column" }}>
                    {/* Feedback by Type */}
                    <SectionCard title="Feedback by Type">
                      {Object.keys(stats.byType).length === 0 ? (
                        <p style={{ fontSize: 12, color: "#9ca3af" }}>No feedback recorded yet</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {Object.entries(stats.byType)
                            .sort((a, b) => b[1] - a[1])
                            .map(([type, count]) => {
                              const cfg = TYPE_CONFIG[type] ?? { label: type, hex: "#6b7280", bg: "#f3f4f6" };
                              return (
                                <div key={type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <span style={{
                                    fontSize: 11, fontWeight: 600,
                                    padding: "2px 10px", borderRadius: 99,
                                    background: cfg.bg, color: cfg.hex,
                                  }}>
                                    {cfg.label}
                                  </span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>{count}</span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </SectionCard>

                    {/* Flag Reasons */}
                    <SectionCard title="Flag Reasons">
                      {Object.keys(stats.byReason).length === 0 ? (
                        <p style={{ fontSize: 12, color: "#9ca3af" }}>No flags yet</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {Object.entries(stats.byReason)
                            .sort((a, b) => b[1] - a[1])
                            .map(([reason, count]) => (
                              <BarRow
                                key={reason}
                                label={reason.replace(/_/g, " ")}
                                count={count}
                                max={Math.max(...Object.values(stats.byReason))}
                              />
                            ))}
                        </div>
                      )}
                    </SectionCard>

                    {/* Feedback by Section - full width */}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <SectionCard title="Feedback by Section">
                        {!stats.bySection || Object.keys(stats.bySection).length === 0 ? (
                          <p style={{ fontSize: 12, color: "#9ca3af" }}>No section data yet</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {Object.entries(stats.bySection)
                              .sort((a, b) => b[1] - a[1])
                              .map(([section, count]) => (
                                <div key={section} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                                  <span style={{ color: "#374151", fontWeight: 500 }}>{section}</span>
                                  <span style={{ fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>{count}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </SectionCard>
                    </div>
                  </div>
                )}

                {/* ── Most Flagged Tab ── */}
                {feedbackTab === "flagged" && (
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ padding: "12px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
                      <Flag size={13} style={{ color: "#f59e0b" }} />
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Most Flagged Insights</p>
                    </div>
                    {!stats.mostFlagged || stats.mostFlagged.length === 0 ? (
                      <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
                        No flagged items reported yet.
                      </div>
                    ) : (
                      <div>
                        {stats.mostFlagged.map((item, i) => (
                          <div key={i} style={{
                            padding: "12px 18px",
                            borderBottom: i < stats.mostFlagged.length - 1 ? "1px solid #f9fafb" : "none",
                            display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 10, fontFamily: "monospace", color: "#9ca3af", marginBottom: 4 }}>{item.bullet_id}</p>
                              <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>"{item.text || "—"}"</p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                              <span style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>{item.count} views</span>
                              {item.flags > 0 && (
                                <span style={{
                                  fontSize: 9, fontWeight: 700, color: "#f59e0b",
                                  background: "#fef3c7", padding: "2px 8px", borderRadius: 99,
                                  border: "1px solid #fde68a",
                                }}>
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

                {/* ── Recent Activity Tab ── */}
                {feedbackTab === "recent" && (
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ padding: "12px 18px", borderBottom: "1px solid #f3f4f6" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Recent Activity</p>
                    </div>
                    {!stats.recent || stats.recent.length === 0 ? (
                      <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
                        No recent activity yet.
                      </div>
                    ) : (
                      <div>
                        {stats.recent.map((item, i) => {
                          const cfg = TYPE_CONFIG[item.feedback_type] ?? { label: item.feedback_type, hex: "#6b7280", bg: "#f3f4f6" };
                          return (
                            <div key={i} style={{
                              padding: "12px 18px",
                              borderBottom: i < stats.recent.length - 1 ? "1px solid #f9fafb" : "none",
                              display: "flex", alignItems: "flex-start", gap: 12,
                            }}>
                              <span style={{
                                fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                                background: cfg.bg, color: cfg.hex, flexShrink: 0, marginTop: 2,
                              }}>
                                {cfg.label}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {item.bullet_text && (
                                  <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.5, marginBottom: 4 }}>
                                    "{item.bullet_text}"
                                  </p>
                                )}
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#9ca3af" }}>
                                  {item.section_name && <span style={{ fontWeight: 600, color: "#6b7280" }}>{item.section_name}</span>}
                                  {item.brief_type && <><span>·</span><span style={{ textTransform: "capitalize" }}>{item.brief_type} brief</span></>}
                                  {item.feedback_reason && (
                                    <>
                                      <span>·</span>
                                      <span style={{
                                        fontSize: 8, fontWeight: 700, textTransform: "uppercase",
                                        padding: "1px 6px", borderRadius: 4,
                                        background: "#fef3c7", color: "#f59e0b", border: "1px solid #fde68a",
                                      }}>
                                        {item.feedback_reason.replace(/_/g, " ")}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>{formatTime(item.created_at)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* No data yet but not loading/error */}
            {!stats && !loadingFeedback && !feedbackError && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12, textAlign: "center" }}>
                <BarChart3 size={32} style={{ color: "#d1d5db" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>No feedback data yet</p>
                <p style={{ fontSize: 12, color: "#9ca3af" }}>Feedback will appear here once users rate summary bullets.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
