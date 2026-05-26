import { Suspense } from "react";
import { DatasetBuilderClient } from "@/modules/m07-revenue-dashboards/components/dataset-builder-client";

export default function DatasetBuilderPage() {
  return (
    <Suspense fallback={<div className="shell">Loading Dataset Builder...</div>}>
      <DatasetBuilderClient />
    </Suspense>
  );
}
