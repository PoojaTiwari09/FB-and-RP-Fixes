"use client";

type Datum = {
  label: string;
  value: number;
};

type Props = {
  title: string;
  type: string;
  data: Datum[];
  /** Called when user clicks a bar / segment / funnel step — enables drill-down */
  onBarClick?: (label: string, value: number) => void;
  /** If set, draws a dashed reference line at this value (e.g. 100 for 100% attainment, or dollar target) */
  targetValue?: number;
  /** Label shown on the reference line */
  targetLabel?: string;
};

function formatValue(value: number) {
  return value > 999 ? `$${Math.round(value / 1000)}k` : `${value}`;
}

export function ChartCard({ title, type, data, onBarClick, targetValue, targetLabel }: Props) {
  const clickable = !!onBarClick;
  const max = Math.max(...data.map((item) => item.value), 1);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  // Reference line position as a percentage of the chart range
  const targetPct = (targetValue !== undefined && targetValue > 0 && max > 0)
    ? Math.min(100, (targetValue / Math.max(max, targetValue)) * 100)
    : null;

  return (
    <div className="card chart-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="section-head" style={{ marginBottom: "14px" }}>
        <h3>{title}</h3>
        <span style={{ background: "#e3f3ef", color: "var(--accent)", padding: "4px 8px", borderRadius: "999px", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
          {type}
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* BAR & WATERFALL */}
        {(type === "BAR" || type === "WATERFALL") && (
          <div className="stack" style={{ gap: "10px" }}>
            {data.map((item, i) => (
              <div key={item.label} className="bar-row"
                onClick={() => onBarClick?.(item.label, item.value)}
                style={{ display: "flex", gap: "12px", alignItems: "center", cursor: clickable ? "pointer" : "default", borderRadius: 6, padding: "2px 0", transition: "background 0.15s" }}
                onMouseEnter={e => { if (clickable) (e.currentTarget as HTMLElement).style.background = "#f0fdf4"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                <span style={{ width: "80px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", fontSize: "0.85rem" }}>{item.label}</span>
                <div style={{ flex: 1, background: "#f1f5f9", height: "12px", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
                  <div style={{
                    position: "absolute",
                    left: type === "WATERFALL" ? `${(data.slice(0, i).reduce((s, d) => s + d.value, 0) / (total || 1)) * 100}%` : "0",
                    width: `${(item.value / max) * 100}%`,
                    height: "100%",
                    background: type === "WATERFALL" ? "#f59e0b" : item.value >= (targetValue ?? Infinity) ? "#16a34a" : "#14b8a6",
                    borderRadius: "6px"
                  }} />
                  {/* Fix #4: reference line — vertical dashed bar for BAR charts */}
                  {targetPct !== null && (
                    <div style={{
                      position: "absolute", top: 0, bottom: 0,
                      left: `${targetPct}%`,
                      width: "2px",
                      background: "#ef4444",
                      zIndex: 3,
                    }} title={targetLabel ?? `Target: ${formatValue(targetValue!)}`} />
                  )}
                </div>
                <strong style={{ fontSize: "0.85rem", width: "40px", textAlign: "right" }}>{formatValue(item.value)}</strong>
              </div>
            ))}
            {/* Target legend */}
            {targetPct !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.7rem", color: "#ef4444", marginTop: 2 }}>
                <div style={{ width: 16, height: 2, background: "#ef4444", borderRadius: 1 }} />
                {targetLabel ?? `Target: ${formatValue(targetValue!)}`}
              </div>
            )}
          </div>
        )}

        {/* COLUMN, LINE, AREA, SCATTER */}
        {(type === "COLUMN" || type === "LINE" || type === "AREA" || type === "SCATTER") && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "140px", paddingTop: "20px", position: "relative", width: "100%" }}>
            {/* Fix #4: horizontal reference line for column/line/area charts */}
            {targetPct !== null && (
              <div style={{
                position: "absolute", left: 0, right: 0,
                bottom: `${targetPct}%`,
                borderTop: "2px dashed #ef4444",
                zIndex: 5, pointerEvents: "none",
              }}>
                <span style={{ position: "absolute", right: 0, top: -14, fontSize: "0.6rem", color: "#ef4444", fontWeight: 700, background: "#fff", padding: "0 3px", borderRadius: 2 }}>
                  {targetLabel ?? formatValue(targetValue!)}
                </span>
              </div>
            )}
            {data.map((item, idx) => {
              const h = `${(item.value / max) * 100}%`;
              return (
                <div key={item.label}
                  onClick={() => type === "COLUMN" && onBarClick?.(item.label, item.value)}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", position: "relative", cursor: (clickable && type === "COLUMN") ? "pointer" : "default" }}>
                  {type === "COLUMN" && (
                    <div style={{ width: "70%", height: h, background: "#3b82f6", borderRadius: "4px 4px 0 0" }} title={`${item.label}: ${item.value} (click to drill)`} />
                  )}
                  {(type === "LINE" || type === "AREA" || type === "SCATTER") && (
                    <div style={{ 
                      position: "absolute", 
                      bottom: h, 
                      width: "12px", 
                      height: "12px", 
                      borderRadius: "50%", 
                      background: type === "SCATTER" ? ["#f59e0b", "#14b8a6", "#3b82f6", "#ef4444"][idx % 4] : "#f59e0b",
                      transform: "translateY(50%)",
                      zIndex: 2
                    }} />
                  )}
                  {type === "AREA" && (
                    <div style={{ 
                      position: "absolute", 
                      bottom: 0, 
                      height: h, 
                      width: "100%", 
                      background: "linear-gradient(to top, rgba(20, 184, 166, 0.4), rgba(20, 184, 166, 0.1))",
                      zIndex: 1
                    }} />
                  )}
                  <small style={{ marginTop: "8px", fontSize: "0.7rem", color: "#64748b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%", textAlign: "center" }}>
                    {item.label}
                  </small>
                </div>
              );
            })}
          </div>
        )}

        {/* PIE, DONUT, GAUGE */}
        {(type === "PIE" || type === "DONUT" || type === "GAUGE") && (
          <div style={{ display: "flex", gap: "20px", alignItems: "center", minHeight: "150px" }}>
            <div style={{ position: "relative", width: "120px", height: "120px", flexShrink: 0 }}>
              <div style={{
                width: "120px",
                height: "120px",
                borderRadius: type === "GAUGE" ? "120px 120px 0 0" : "50%",
                background: data.length > 0 && total > 0 ? `conic-gradient(${
                  data.map((item, idx) => {
                    const start = data.slice(0, idx).reduce((sum, d) => sum + d.value, 0);
                    const startDeg = (start / total) * (type === "GAUGE" ? 180 : 360) - (type === "GAUGE" ? 90 : 0);
                    const endDeg = ((start + item.value) / total) * (type === "GAUGE" ? 180 : 360) - (type === "GAUGE" ? 90 : 0);
                    const colors = ["#0f766e", "#14b8a6", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];
                    return `${colors[idx % colors.length]} ${startDeg}deg ${endDeg}deg`;
                  }).join(", ")
                })` : "#e2e8f0",
                boxShadow: "inset 0 0 8px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                clipPath: type === "GAUGE" ? "polygon(0 0, 100% 0, 100% 50%, 0 50%)" : "none",
                transform: type === "GAUGE" ? "translateY(25%)" : "none"
              }}>
                {(type === "DONUT" || type === "GAUGE") && (
                  <div style={{
                    width: type === "GAUGE" ? "80px" : "66px",
                    height: type === "GAUGE" ? "80px" : "66px",
                    borderRadius: type === "GAUGE" ? "80px 80px 0 0" : "50%",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: type === "GAUGE" ? "flex-end" : "center",
                    justifyContent: "center",
                    paddingBottom: type === "GAUGE" ? "10px" : "0",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    color: "var(--ink)",
                    clipPath: type === "GAUGE" ? "polygon(0 0, 100% 0, 100% 50%, 0 50%)" : "none"
                  }}>
                    {formatValue(total)}
                  </div>
                )}
              </div>
            </div>

            <div className="stack" style={{ flex: 1, gap: "6px", overflow: "hidden" }}>
              {data.slice(0, 5).map((item, idx) => {
                const colors = ["#0f766e", "#14b8a6", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];
                const pct = total ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.label}
                  onClick={() => onBarClick?.(item.label, item.value)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", cursor: clickable ? "pointer" : "default", padding: "2px 4px", borderRadius: 4, transition: "background 0.15s" }}
                  onMouseEnter={e => { if (clickable) (e.currentTarget as HTMLElement).style.background = "#f0fdf4"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors[idx % colors.length], display: "inline-block", flexShrink: 0 }} />
                    <span style={{ flex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.label}</span>
                    <strong style={{ flexShrink: 0 }}>{pct}%</strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TREEMAP & MAP */}
        {(type === "TREEMAP" || type === "MAP") && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", height: "140px", width: "100%", borderRadius: "8px", overflow: "hidden", background: type === "MAP" ? "#e0f2fe" : "transparent", position: "relative", padding: type === "MAP" ? "8px" : "0" }}>
            {data.map((item, idx) => {
              const colors = ["#14b8a6", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
              const pct = total ? (item.value / total) * 100 : 0;
              if (type === "MAP") {
                // Render as bubbles on a map-like background
                const size = Math.max(20, (item.value / max) * 60);
                return (
                  <div key={item.label} style={{ 
                    width: `${size}px`, 
                    height: `${size}px`, 
                    borderRadius: "50%", 
                    background: colors[idx % colors.length],
                    opacity: 0.8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "0.6rem",
                    fontWeight: "bold",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}>
                    {formatValue(item.value)}
                  </div>
                );
              }
              // TREEMAP
              return (
                <div key={item.label} style={{ 
                  flexBasis: `${pct}%`, 
                  flexGrow: 1,
                  background: colors[idx % colors.length], 
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  color: "white",
                  minWidth: "40px"
                }}>
                  <strong style={{ fontSize: "0.8rem" }}>{formatValue(item.value)}</strong>
                  <span style={{ fontSize: "0.65rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* TABLE & MATRIX */}
        {(type === "TABLE" || type === "MATRIX") && (
          <div style={{ overflow: "auto", maxHeight: "160px", width: "100%", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
                <tr>
                  <th style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>Category</th>
                  <th style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>Value</th>
                  {type === "MATRIX" && <th style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>% Total</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={item.label} style={{ borderBottom: i === data.length - 1 ? "none" : "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px" }}>{item.label}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "bold" }}>{formatValue(item.value)}</td>
                    {type === "MATRIX" && <td style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>{total ? Math.round((item.value / total) * 100) : 0}%</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FUNNEL */}
        {type === "FUNNEL" && (
          <div className="funnel" style={{ gap: "8px", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            {data.map((item, index) => (
              <div
                key={item.label}
                className="funnel-step"
                onClick={() => onBarClick?.(item.label, item.value)}
                style={{ width: `${100 - index * 12}%`, padding: "8px 16px", borderRadius: "4px", background: `rgba(20, 184, 166, ${1 - index * 0.15})`, color: "#fff", display: "flex", justifyContent: "space-between", fontSize: "0.85rem", cursor: clickable ? "pointer" : "default" }}
              >
                <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.label}</span>
                <strong style={{ flexShrink: 0 }}>{formatValue(item.value)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
