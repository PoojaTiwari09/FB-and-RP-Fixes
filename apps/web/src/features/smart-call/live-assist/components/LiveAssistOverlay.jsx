/**
 * LiveAssistOverlay — PiP Window Version (v2.0 — Production Stabilized)
 *
 * Designed to fill a Document Picture-in-Picture window that floats
 * on top of GMeet / Teams / any app. Features 3-tab navigation:
 *   Coach   — Next Best Action, Alerts, Tactical Responses, Strategic Tips
 *   Signals — Live signal meters, momentum, stage, competitor intel
 *   Transcript — Live scrolling transcript with speaker labels + chunk summaries
 *
 * All data access uses safe defaults to prevent rendering crashes.
 */

import { useState, Component } from "react";

// ── Error Boundary ──────────────────────────────────────────
class OverlayErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[LiveAssistOverlay] Render error caught by boundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: '#fca5a5', fontFamily: "'Inter', sans-serif", background: 'rgba(8,5,22,0.97)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Overlay encountered an error</div>
          <div style={{ fontSize: 11, color: '#94a3b8', maxWidth: 300, textAlign: 'center' }}>{this.state.error?.message || 'Unknown error'}</div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
          >Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Color Palette ──────────────────────────────────────────
const C = {
  purple: "#8b5cf6",
  pink: "#ec4899",
  cyan: "#0ea5e9",
  green: "#10b981",
  yellow: "#f59e0b",
  red: "#ef4444",
  bg: "rgba(8,5,22,0.97)",
  panel: "rgba(18,12,40,0.90)",
  card: "rgba(10,6,28,0.80)",
  border: "rgba(139,92,246,0.22)",
  textPrimary: "#f1f5f9",
  textMuted: "#94a3b8",
  textDim: "#475569",
};

// ── Inline Styles ──────────────────────────────────────────
const s = {
  root: (alpha) => ({
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: `linear-gradient(160deg,
      rgba(12,6,32,${alpha}) 0%,
      rgba(20,10,50,${alpha}) 60%,
      rgba(8,18,40,${alpha}) 100%)`,
    backdropFilter: alpha > 0.4 ? "blur(16px)" : alpha > 0.15 ? "blur(8px)" : "blur(2px)",
    WebkitBackdropFilter: alpha > 0.4 ? "blur(16px)" : alpha > 0.15 ? "blur(8px)" : "blur(2px)",
    fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    color: C.textPrimary,
    fontSize: 13,
    overflow: "hidden",
    transition: "background 0.15s, backdrop-filter 0.15s",
    textShadow: alpha > 0.45 ? "none" : "0 1px 2px rgba(0,0,0,0.9), 0 0 1px rgba(0,0,0,0.9)",
  }),

  header: (alpha) => ({
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 12px",
    background: alpha > 0.4 
      ? `linear-gradient(90deg, rgba(139,92,246,0.18) 0%, rgba(236,72,153,0.10) 100%)`
      : `linear-gradient(90deg, rgba(12,6,32,0.96) 0%, rgba(20,10,50,0.96) 100%)`,
    borderBottom: `1px solid ${C.border}`,
    flexShrink: 0,
    userSelect: "none",
  }),

  metricsBar: (alpha) => ({
    display: "flex",
    gap: 4,
    padding: "5px 10px",
    borderBottom: `1px solid ${C.border}`,
    flexShrink: 0,
    background: alpha > 0.4 ? "rgba(8,5,22,0.50)" : "rgba(8,5,22,0.95)",
    overflowX: "auto",
  }),

  metricChip: (color = C.purple) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    padding: "2px 7px",
    borderRadius: 6,
    fontSize: 9,
    fontWeight: 700,
    background: `${color}18`,
    color: color,
    border: `1px solid ${color}30`,
    whiteSpace: "nowrap",
    letterSpacing: "0.03em",
  }),

  tabBar: (alpha) => ({
    display: "flex",
    gap: 2,
    padding: "5px 8px 3px",
    borderBottom: `1px solid ${C.border}`,
    flexShrink: 0,
    background: alpha > 0.4 ? "rgba(8,5,22,0.60)" : "rgba(8,5,22,0.95)",
  }),

  body: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 10px 10px",
  },

  sectionTitle: (color = C.purple) => ({
    fontSize: 9,
    fontWeight: 800,
    color,
    textTransform: "uppercase",
    letterSpacing: "0.11em",
    marginBottom: 5,
    marginTop: 0,
  }),

  card: (extra = {}) => ({
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: "8px 10px",
    marginBottom: 6,
    ...extra,
  }),

  responseItem: {
    padding: "7px 10px",
    borderRadius: 8,
    marginBottom: 5,
    background: "rgba(139,92,246,0.08)",
    borderLeft: `3px solid rgba(139,92,246,0.55)`,
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 1.45,
    cursor: "pointer",
    transition: "background 0.15s",
  },

  alertItem: {
    padding: "6px 9px",
    borderRadius: 8,
    marginBottom: 5,
    background: "rgba(239,68,68,0.09)",
    borderLeft: `3px solid rgba(239,68,68,0.55)`,
    color: "#fca5a5",
    fontSize: 12,
    lineHeight: 1.4,
  },

  signalMeter: (value, max, color) => ({
    height: 4,
    borderRadius: 4,
    background: `${color}20`,
    overflow: "hidden",
    position: "relative",
  }),

  signalFill: (pct, color) => ({
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: `${Math.min(pct, 100)}%`,
    background: `linear-gradient(90deg, ${color}60, ${color})`,
    borderRadius: 4,
    transition: "width 0.4s ease-out",
  }),

  seg: (alpha) => ({
    padding: "4px 7px",
    borderRadius: 6,
    marginBottom: 4,
    background: alpha > 0.4 ? "rgba(10,6,28,0.70)" : "rgba(10,6,28,0.94)",
    border: `1px solid rgba(139,92,246,0.12)`,
    fontSize: 11,
    lineHeight: 1.4,
    display: "grid",
    gridTemplateColumns: "50px 60px 1fr",
    gap: 5,
  }),

  dot: (live) => ({
    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
    background: live ? C.green : C.textDim,
    boxShadow: live ? "0 0 0 3px rgba(16,185,129,0.20),0 0 8px rgba(16,185,129,0.4)" : "none",
    animation: live ? "pipPulse 1.2s ease-in-out infinite" : "none",
  }),

  pill: (bg, color, border) => ({
    display: "inline-block",
    padding: "1px 7px",
    borderRadius: 20,
    fontSize: 9.5,
    fontWeight: 700,
    background: bg, color,
    border: `1px solid ${border}`,
  }),

  tabBtn: (active) => ({
    flex: 1,
    padding: "5px 3px",
    background: active ? "rgba(139,92,246,0.25)" : "transparent",
    border: active ? `1px solid rgba(139,92,246,0.50)` : "1px solid transparent",
    borderRadius: 7,
    cursor: "pointer",
    color: active ? "#c4b5fd" : C.textMuted,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    transition: "all 0.15s",
  }),

  iconBtn: (color = C.textMuted) => ({
    background: "none", border: "none",
    cursor: "pointer", color,
    fontSize: 13, padding: "2px 4px",
    borderRadius: 5, lineHeight: 1,
    transition: "color 0.12s, background 0.12s",
  }),
};

function empty(msg) {
  return (
    <p style={{ color: C.textDim, fontSize: 11.5, fontStyle: "italic", margin: "4px 0" }}>
      {msg}
    </p>
  );
}

// ── Signal Meter Component ──────────────────────────────────
function SignalMeter({ label, icon, value, maxValue = 10, color }) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted }}>{icon} {label}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: value > 0 ? color : C.textDim }}>{value}</span>
      </div>
      <div style={s.signalMeter(value, maxValue, color)}>
        <div style={s.signalFill(pct, color)} />
      </div>
    </div>
  );
}

// ── Main Overlay Component ──────────────────────────────────
function LiveAssistOverlayInner({
  insights,
  isCapturing,
  status,
  analysisAt,
  segments,
  runningStats,
  chunkSummaries,
  onClose,
}) {
  const [tab, setTab] = useState("coach");
  const [copied, setCopied] = useState(null);
  const [bgAlpha, setBgAlpha] = useState(0.88);

  // Safe data access
  const safeInsights = insights || {};
  const spk = safeInsights.speakerIdentification || {};
  const repName = spk.salesRepName || "Rep";
  const clientName = spk.clientName || "Client";
  const lastSegs = (segments || []).slice(-8).reverse();
  const alerts = safeInsights.alerts || [];
  const responses = safeInsights.suggestedResponses || [];
  const tips = safeInsights.strategicTips || [];
  const competitors = safeInsights.competitorIntelligence || [];
  const momentum = safeInsights.dealMomentumScore || {};
  const stage = safeInsights.stageConfidence || {};
  const buyingIntent = safeInsights.buyingIntent || {};
  const objectionRisk = safeInsights.objectionRisk || {};
  const conv = safeInsights.conversationAnalysis || {};

  function copyText(text, idx) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(idx);
    setTimeout(() => setCopied(null), 1400);
  }

  const opacityPct = Math.round(bgAlpha * 100);
  const sliderColor = bgAlpha > 0.7 ? C.purple : bgAlpha > 0.4 ? C.cyan : bgAlpha > 0.2 ? C.yellow : "#f9a8d4";

  const criticalAlerts = alerts.filter(a => a.level === "critical" || a.level === "important");

  return (
    <div style={s.root(bgAlpha)} className="pip-fade-in">

      {/* ── HEADER ── */}
      <div style={s.header(bgAlpha)}>
        <div style={s.dot(isCapturing)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 12, color: "#c4b5fd", letterSpacing: "0.04em" }}>
            ⚡ Live AI Co-Pilot
          </div>
          <div style={{ fontSize: 9, color: C.textDim, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {status}{analysisAt ? ` · ${analysisAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
          </div>
        </div>

        {/* Speaker pills */}
        {(repName !== "Rep" || clientName !== "Client") && (
          <div style={{ display: "flex", gap: 4 }}>
            <span style={s.pill("rgba(139,92,246,0.15)", "#c4b5fd", "rgba(139,92,246,0.3)")}>🎙 {repName}</span>
            <span style={s.pill("rgba(236,72,153,0.15)", "#f9a8d4", "rgba(236,72,153,0.3)")}>👤 {clientName}</span>
          </div>
        )}

        {/* Opacity slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 11 }}>👁</span>
          <input
            type="range" min={0.05} max={1} step={0.05} value={bgAlpha}
            onChange={e => setBgAlpha(parseFloat(e.target.value))}
            title={`Transparency: ${opacityPct}%`}
            style={{ width: 50, accentColor: sliderColor, cursor: "pointer" }}
          />
          <span style={{ fontSize: 9, fontWeight: 700, color: sliderColor, minWidth: 22 }}>{opacityPct}%</span>
        </div>

        <button style={s.iconBtn("#ff6b6b")} onClick={onClose} title="Close overlay">✕</button>
      </div>

      {/* ── COMPACT METRICS BAR ── */}
      <div style={s.metricsBar(bgAlpha)}>
        {momentum.score != null && (
          <span style={s.metricChip(momentum.score >= 60 ? C.green : momentum.score >= 40 ? C.yellow : C.red)}>
            {momentum.trendDirection === 'rising' ? '📈' : momentum.trendDirection === 'declining' ? '📉' : '➡️'} {momentum.score}%
          </span>
        )}
        {stage.dominantStage && stage.dominantStage !== 'unknown' && (
          <span style={s.metricChip(C.cyan)}>
            🎯 {stage.dominantStage}
          </span>
        )}
        {buyingIntent.label && (
          <span style={s.metricChip(C.green)}>🛒 {buyingIntent.label}</span>
        )}
        {objectionRisk.label && (
          <span style={s.metricChip(C.red)}>⚠️ {objectionRisk.label}</span>
        )}
        {conv.talkRatioRep != null && (
          <span style={s.metricChip(C.purple)}>🗣 {conv.talkRatioRep}%/{conv.talkRatioCustomer || '?'}%</span>
        )}
      </div>

      {/* ── TAB BAR ── */}
      <div style={s.tabBar(bgAlpha)}>
        {[["coach", "🧠 Coach"], ["signals", "📊 Signals"], ["transcript", "📜 Transcript"]].map(([key, label]) => (
          <button key={key} style={s.tabBtn(tab === key)} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div style={s.body}>

        {/* ════════════ COACH TAB ════════════ */}
        {tab === "coach" && (
          <>
            {/* 1. 🎯 NEXT BEST ACTION */}
            {safeInsights.nextBestAction ? (
              <div style={{...s.card({ borderColor: "rgba(16,185,129,0.3)", background: bgAlpha > 0.4 ? "rgba(16,185,129,0.06)" : "rgba(10,35,22,0.92)", borderLeft: "4px solid #10b981" }), marginBottom: 10}}>
                <p style={{...s.sectionTitle(C.green), marginBottom: 4}}>🎯 Next Best Action</p>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>
                  {typeof safeInsights.nextBestAction === 'object'
                    ? (safeInsights.nextBestAction.action || safeInsights.nextBestAction.text || "")
                    : safeInsights.nextBestAction}
                </div>
                {typeof safeInsights.nextBestAction === 'object' && safeInsights.nextBestAction.reasoning && (
                  <div style={{ color: C.textMuted, fontSize: 10.5, fontStyle: "italic", marginTop: 4 }}>
                    💡 {safeInsights.nextBestAction.reasoning}
                  </div>
                )}
                {typeof safeInsights.nextBestAction === 'object' && safeInsights.nextBestAction.confidence && (
                  <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                    <span style={s.pill(
                      safeInsights.nextBestAction.confidence === 'high' ? 'rgba(16,185,129,0.15)' : safeInsights.nextBestAction.confidence === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(148,163,184,0.15)',
                      safeInsights.nextBestAction.confidence === 'high' ? '#34d399' : safeInsights.nextHigh !== 'medium' ? '#fbbf24' : '#94a3b8',
                      safeInsights.nextBestAction.confidence === 'high' ? 'rgba(16,185,129,0.3)' : safeInsights.nextBestAction.confidence === 'medium' ? 'rgba(245,158,11,0.3)' : 'rgba(148,163,184,0.3)'
                    )}>
                      {safeInsights.nextBestAction.confidence.toUpperCase()}
                    </span>
                    {Array.isArray(safeInsights.nextBestAction.supportingSignals) && safeInsights.nextBestAction.supportingSignals.map((sig, i) => (
                      <span key={i} style={s.pill("rgba(139,92,246,0.15)", "#c4b5fd", "rgba(139,92,246,0.3)")}>• {sig}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{...s.card({ borderColor: "rgba(148,163,184,0.2)", background: "rgba(148,163,184,0.03)" }), marginBottom: 10}}>
                <p style={s.sectionTitle(C.textMuted)}>🎯 Next Best Action</p>
                <div style={{ color: C.textDim, fontSize: 12, fontStyle: "italic" }}>Analyzing context for next move...</div>
              </div>
            )}

            {/* 2. 🚨 CRITICAL ALERTS */}
            {criticalAlerts.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <p style={s.sectionTitle(C.red)}>🚨 Alerts</p>
                {criticalAlerts.slice(0, 3).map((a, i) => (
                  <div key={i} style={{...s.alertItem, borderLeftWidth: 4, background: a.level === 'critical' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.1)'}}>
                    <strong style={{textTransform:'uppercase',fontSize:'8px',display:'block',marginBottom:2, color: a.level === 'critical' ? C.red : C.yellow}}>{a.level}</strong>
                    <span style={{ color: a.level === 'critical' ? '#fca5a5' : '#fde68a', fontSize: 11.5 }}>{a.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 3. 💬 TACTICAL RESPONSES */}
            <p style={s.sectionTitle(C.purple)}>💬 Tactical Responses</p>
            {responses.length > 0 ? (
              responses.slice(0, 3).map((r, i) => (
                <div
                  key={i}
                  style={{
                    ...s.responseItem,
                    background: copied === i ? "rgba(139,92,246,0.25)" : (bgAlpha > 0.4 ? "rgba(139,92,246,0.12)" : "rgba(22,12,45,0.92)"),
                    borderLeft: `4px solid ${C.purple}`,
                    marginBottom: 6
                  }}
                  onClick={() => copyText(r, i)}
                  title="Click to copy verbatim"
                >
                  {copied === i
                    ? <span style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>✓ Copied to clipboard</span>
                    : <span style={{ color: "#e2e8f0" }}>"{r}"</span>
                  }
                </div>
              ))
            ) : (
              empty("Waiting for speaking cues...")
            )}

            {/* 4. 🎯 STRATEGIC TIPS */}
            {tips.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p style={s.sectionTitle(C.cyan)}>🎯 Strategic Tips</p>
                {tips.slice(0, 2).map((tip, i) => (
                  <div key={i} style={{...s.card(), marginBottom: 6, borderLeft: `3px solid ${C.cyan}`, background: bgAlpha > 0.4 ? C.card : "rgba(10,6,28,0.95)"}}>
                    <div style={{ color: "#e2e8f0", fontSize: 11.5, fontWeight: 600, marginBottom: 3 }}>
                      {typeof tip === 'string' ? tip : (tip.tip || '')}
                    </div>
                    {tip.exactScript && (
                      <div style={{ color: "#fbbf24", fontSize: 11, fontStyle: "italic", borderLeft: "2px solid #fbbf24", paddingLeft: 6, marginTop: 3 }}>
                        💬 "{tip.exactScript}"
                      </div>
                    )}
                    {tip.reasoning && (
                      <div style={{ color: C.textDim, fontSize: 10, marginTop: 3 }}>💡 {tip.reasoning}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ════════════ SIGNALS TAB ════════════ */}
        {tab === "signals" && (
          <>
            {/* Signal Meters */}
            <p style={s.sectionTitle(C.green)}>📊 Live Signal Meters</p>
            <div style={{...s.card(), marginBottom: 10, background: bgAlpha > 0.4 ? C.card : "rgba(10,6,28,0.95)"}}>
              <SignalMeter label="Buying Intent" icon="🛒" value={buyingIntent.label ? 8 : 0} maxValue={10} color={C.green} />
              <SignalMeter label="Objection Risk" icon="⚠️" value={objectionRisk.label ? 7 : 0} maxValue={10} color={C.red} />
              <SignalMeter label="Urgency" icon="⏱️" value={safeInsights.urgency ? 6 : 0} maxValue={10} color={C.yellow} />
              <SignalMeter label="Decision Maker" icon="👤" value={safeInsights.decisionMakerPresence?.status ? 5 : 0} maxValue={10} color={C.purple} />
            </div>

            {/* Momentum */}
            {momentum.score != null && (
              <div style={{...s.card({ borderColor: momentum.score >= 60 ? 'rgba(16,185,129,0.3)' : momentum.score >= 40 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)', background: bgAlpha > 0.4 ? C.card : "rgba(10,6,28,0.95)" }), marginBottom: 10}}>
                <p style={s.sectionTitle(momentum.score >= 60 ? C.green : momentum.score >= 40 ? C.yellow : C.red)}>
                  {momentum.trendDirection === 'rising' ? '📈' : momentum.trendDirection === 'declining' ? '📉' : '➡️'} Deal Momentum
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: momentum.score >= 60 ? C.green : momentum.score >= 40 ? C.yellow : C.red }}>
                    {momentum.score}
                  </span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>/100 · {momentum.trendDirection || 'stable'}</span>
                </div>
                {momentum.drivers?.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {momentum.drivers.slice(0, 4).map((d, i) => (
                      <div key={i} style={{ fontSize: 10, color: typeof d === 'string' && d.startsWith('+') ? C.green : C.red, marginBottom: 2 }}>
                        {typeof d === 'string' && d.startsWith('+') ? '✅' : '🔴'} {typeof d === 'string' ? d.replace(/^[+-]\s*/, '') : d}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Call Stage */}
            {stage.dominantStage && stage.dominantStage !== 'unknown' && (
              <div style={{...s.card(), marginBottom: 10, background: bgAlpha > 0.4 ? C.card : "rgba(10,6,28,0.95)"}}>
                <p style={s.sectionTitle(C.cyan)}>🎯 Call Stage</p>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.cyan, textTransform: "capitalize" }}>
                  {stage.dominantStage}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                  Confidence: {stage.confidence || 'medium'}
                </div>
              </div>
            )}

            {/* Competitor Intel */}
            {competitors.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <p style={s.sectionTitle(C.red)}>⚔️ Competitor Intelligence</p>
                {competitors.slice(0, 2).map((comp, i) => (
                  <div key={i} style={{...s.card({ borderColor: 'rgba(248,113,113,0.25)', background: bgAlpha > 0.4 ? 'rgba(248,113,113,0.04)' : 'rgba(38,15,15,0.92)' }), marginBottom: 6}}>
                    <div style={{ fontWeight: 800, color: '#f87171', fontSize: 11, marginBottom: 4 }}>🆚 {comp.competitor || 'Unknown'}</div>
                    {comp.mentionedContext && <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 3 }}>📌 {comp.mentionedContext}</div>}
                    <div style={{ color: C.green, fontSize: 10.5, fontWeight: 600 }}>✅ Our Edge: {comp.ourAdvantage || '—'}</div>
                    {comp.talkTrack && (
                      <div style={{ color: '#fbbf24', fontSize: 10.5, fontStyle: 'italic', borderLeft: '2px solid #fbbf24', paddingLeft: 6, marginTop: 4 }}>
                        🗣️ "{comp.talkTrack}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ════════════ TRANSCRIPT TAB ════════════ */}
        {tab === "transcript" && (
          <>
            {/* Live Transcript */}
            <p style={s.sectionTitle(C.purple)}>📜 Live Transcript</p>
            {lastSegs.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 12 }}>
                {lastSegs.map((seg, idx) => {
                  const origIdx = (segments || []).length - lastSegs.length + (lastSegs.length - 1 - idx);
                  const isRep = origIdx % 2 === 0;
                  const speakerName = isRep ? repName : clientName;
                  const speakerColor = isRep ? "#c4b5fd" : "#f9a8d4";
                  return (
                    <div key={seg.id || idx} style={s.seg(bgAlpha)}>
                      <span style={{ color: C.textDim, fontSize: 9, fontFamily: "monospace" }}>
                        {new Date(seg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      <span style={{ color: speakerColor, fontWeight: 700, fontSize: 9.5 }}>{speakerName}</span>
                      <span style={{ color: C.textPrimary, fontSize: 11 }}>{seg.text}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              empty("No transcript yet — start speaking...")
            )}

            {/* Chunk Summaries */}
            {(chunkSummaries || []).length > 0 && (
              <>
                <p style={s.sectionTitle(C.green)}>📝 Summaries ({chunkSummaries.length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                  {[...(chunkSummaries || [])].reverse().slice(0, 5).map((chunk, i) => (
                    <div key={i} style={{...s.card({ borderLeft: '3px solid rgba(52,211,153,0.5)', background: bgAlpha > 0.4 ? 'rgba(52,211,153,0.04)' : 'rgba(10,32,22,0.92)' })}}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: C.green, fontSize: 9, fontWeight: 800 }}>
                          {chunk.time_start} → {chunk.time_end}
                        </span>
                        {chunk.competitors_mentioned?.length > 0 && (
                          <span style={{ fontSize: 8, color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '1px 5px', borderRadius: 6 }}>
                            ⚔️ {chunk.competitors_mentioned.join(", ")}
                          </span>
                        )}
                      </div>
                      <p style={{ color: "#cbd5e1", fontSize: 10.5, margin: 0, lineHeight: 1.45 }}>{chunk.summary_text}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── FOOTER STATUS ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "4px 10px 5px",
        borderTop: `1px solid ${C.border}`,
        flexShrink: 0,
        background: "rgba(8,5,22,0.60)",
      }}>
        <div style={s.dot(isCapturing)} />
        <span style={{ fontSize: 9.5, color: C.textDim, flex: 1 }}>{status}</span>
        {/* Quick preset buttons */}
        {[[0.08,"Glass"],[0.45,"Mid"],[1,"Solid"]].map(([v,label]) => (
          <button key={v} onClick={() => setBgAlpha(v)}
            style={{
              background: Math.abs(bgAlpha-v)<0.1 ? "rgba(139,92,246,0.35)" : "rgba(139,92,246,0.08)",
              border: `1px solid rgba(139,92,246,${Math.abs(bgAlpha-v)<0.1?"0.6":"0.18"})`,
              borderRadius: 5, cursor: "pointer",
              color: Math.abs(bgAlpha-v)<0.1 ? "#c4b5fd" : C.textDim,
              fontSize: 9, padding: "2px 7px", fontWeight: 700, transition: "all 0.15s",
            }}>{label}</button>
        ))}
        <span style={{
          fontSize: 8.5, fontWeight: 700, color: sliderColor,
          background: "rgba(139,92,246,0.12)", padding: "2px 6px",
          borderRadius: 20, border: "1px solid rgba(139,92,246,0.25)",
          letterSpacing: "0.06em"
        }}>ON TOP</span>
      </div>
    </div>
  );
}

// ── Exported Component (wrapped with Error Boundary) ──────────
export default function LiveAssistOverlay(props) {
  return (
    <OverlayErrorBoundary>
      <LiveAssistOverlayInner {...props} />
    </OverlayErrorBoundary>
  );
}
