import { useState, useEffect } from "react";
import { EntityListPanel } from "./EntityListPanel";
import { SummaryDetailPanel } from "./SummaryDetailPanel";

export function SummaryWorkspace({ briefType }) {
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setSelectedId(null);
  }, [briefType]);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "#f8f9fc" }}>
      {/* Left: Entity list — fixed 260px */}
      <div style={{
        width: 260,
        minWidth: 220,
        maxWidth: 320,
        flexShrink: 0,
        height: "100%",
        overflow: "hidden",
        borderRight: "1px solid #e2e8f0",
      }}>
        <EntityListPanel
          briefType={briefType}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* Right: Summary detail */}
      <div style={{ flex: 1, height: "100%", overflow: "hidden" }}>
        <SummaryDetailPanel
          briefType={briefType}
          entityId={selectedId}
        />
      </div>
    </div>
  );
}
