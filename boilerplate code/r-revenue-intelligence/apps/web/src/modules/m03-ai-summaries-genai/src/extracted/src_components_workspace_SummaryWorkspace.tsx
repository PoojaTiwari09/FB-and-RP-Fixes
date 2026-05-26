"use client";

import { useState } from "react";
import type { BriefType } from "@/types/database";
import { EntityListPanel } from "./EntityListPanel";
import { SummaryDetailPanel } from "./SummaryDetailPanel";

interface SummaryWorkspaceProps {
  briefType: BriefType;
}

export function SummaryWorkspace({ briefType }: SummaryWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reset selection when brief type changes
  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Entity list — 40% */}
      <div className="w-[40%] min-w-[260px] max-w-[400px] flex-shrink-0 h-full overflow-hidden">
        <EntityListPanel
          briefType={briefType}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* Right: Summary detail — 60% */}
      <div className="flex-1 h-full overflow-hidden bg-(--bg)">
        <SummaryDetailPanel
          briefType={briefType}
          entityId={selectedId}
        />
      </div>
    </div>
  );
}
