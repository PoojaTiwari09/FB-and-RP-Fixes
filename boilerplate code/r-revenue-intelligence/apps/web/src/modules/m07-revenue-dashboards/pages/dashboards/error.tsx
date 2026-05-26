"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div style={{ padding: 40, fontFamily: "monospace" }}>
      <h2 style={{ color: "#dc2626" }}>Dashboard Error</h2>
      <pre style={{ background: "#fee2e2", padding: 16, borderRadius: 8, fontSize: 12, overflow: "auto", whiteSpace: "pre-wrap" }}>
        {error?.message || "Unknown error"}
        {"\n\n"}
        {error?.stack || ""}
      </pre>
      <button onClick={reset} style={{ marginTop: 16, padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
        Try again
      </button>
    </div>
  );
}
