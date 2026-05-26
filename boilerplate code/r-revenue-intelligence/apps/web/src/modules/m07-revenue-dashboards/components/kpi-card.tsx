type Props = {
  label:        string;
  value:        string;
  subtitle?:    string;
  target?:      number;      // raw target number e.g. 150000
  actual?:      number;      // raw actual number e.g. 87000
  attainment?:  number;      // 0-100+ pct
  /** % change vs prior period (positive = up, negative = down, undefined = N/A) */
  delta?:       number;
  /** Label shown next to delta, e.g. "vs last quarter" */
  deltaLabel?:  string;
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

export function KpiCard({ label, value, subtitle, target, actual, attainment, delta, deltaLabel }: Props) {
  const pct      = attainment ?? 0;
  const exceeded = pct >= 100;

  // Bar colour: green if hit, teal if close, amber if halfway, red if low
  const barColor =
    pct >= 100 ? "#16a34a" :
    pct >= 75  ? "#0f766e" :
    pct >= 50  ? "#f59e0b" : "#ef4444";

  // Show the attainment bar whenever we have both target and actual
  const showBar = attainment !== undefined && target !== undefined && actual !== undefined;

  // Gap remaining (negative = exceeded)
  const gap = (target !== undefined && actual !== undefined) ? target - actual : null;

  const hasDelta   = delta !== undefined;
  const deltaUp    = (delta ?? 0) > 0;
  const deltaFlat  = delta === 0;
  const deltaColor = deltaFlat ? "#94a3b8" : deltaUp ? "#16a34a" : "#ef4444";
  const deltaArrow = deltaFlat ? "→" : deltaUp ? "↑" : "↓";
  const deltaText  = deltaFlat ? "0%" : `${deltaUp ? "+" : ""}${delta}%`;

  // Milestone ticks at 25 / 50 / 75 / 100 %
  const MILESTONES = [25, 50, 75, 100];

  return (
    <div className="metric" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{label}</span>

      {/* ── Main value row ── */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
        <strong style={{ fontSize: "1.8rem", lineHeight: 1.1 }}>{value}</strong>

        {/* Over-target badge */}
        {exceeded && showBar && (
          <span style={{
            fontSize: "0.7rem", fontWeight: 700,
            background: "#dcfce7", color: "#16a34a",
            padding: "2px 8px", borderRadius: "999px",
            border: "1px solid #86efac",
          }}>
            🎯 Target hit!
          </span>
        )}

        {/* Delta badge */}
        {hasDelta && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "2px",
            fontSize: "0.78rem", fontWeight: 700,
            color: deltaColor, background: deltaColor + "18",
            padding: "1px 6px", borderRadius: "999px",
            border: `1px solid ${deltaColor}44`,
          }}>
            {deltaArrow} {deltaText}
          </span>
        )}
      </div>

      {hasDelta && deltaLabel && (
        <span style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "-2px" }}>{deltaLabel}</span>
      )}

      {/* ── Attainment progress bar ── */}
      {showBar ? (
        <>
          {/* Actual / Target ratio */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
            <span style={{ fontWeight: 600, color: "#374151" }}>
              {fmt(actual!)} <span style={{ fontWeight: 400, color: "#94a3b8" }}>/ {fmt(target!)}</span>
            </span>
            <span style={{ color: barColor, fontWeight: 700 }}>{pct}%</span>
          </div>

          {/* Bar track with milestone ticks */}
          <div style={{ position: "relative", height: "10px", borderRadius: "999px", background: "#e2e8f0", overflow: "visible", marginTop: "2px" }}>
            {/* Filled bar — capped at 100% visually */}
            <div style={{
              position:     "absolute",
              left:         0,
              top:          0,
              height:       "100%",
              width:        `${Math.min(pct, 100)}%`,
              background:   exceeded
                ? "linear-gradient(90deg, #16a34a, #22c55e)"
                : `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
              borderRadius: "999px",
              transition:   "width 0.5s ease",
              boxShadow:    exceeded ? "0 0 6px rgba(22,163,74,0.4)" : "none",
            }} />

            {/* Milestone tick marks at 25 / 50 / 75 / 100 % */}
            {MILESTONES.map(m => (
              <div
                key={m}
                title={`${m}%`}
                style={{
                  position:  "absolute",
                  top:       "-2px",
                  left:      `${m}%`,
                  width:     "2px",
                  height:    "14px",
                  background: pct >= m ? "#fff" : "#cbd5e1",
                  borderRadius: "1px",
                  opacity:   0.7,
                  transform: "translateX(-50%)",
                  pointerEvents: "none",
                  zIndex:    2,
                }}
              />
            ))}
          </div>

          {/* Gap / remaining row */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", marginTop: "3px" }}>
            <span style={{ color: "#94a3b8" }}>
              Target: {fmt(target!)}
            </span>
            {gap !== null && (
              <span style={{
                fontWeight: 600,
                color: exceeded ? "#16a34a" : "#dc2626",
              }}>
                {exceeded
                  ? `+${fmt(Math.abs(gap))} over`
                  : `${fmt(gap)} remaining`}
              </span>
            )}
          </div>
        </>
      ) : (
        subtitle && <small style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{subtitle}</small>
      )}
    </div>
  );
}
