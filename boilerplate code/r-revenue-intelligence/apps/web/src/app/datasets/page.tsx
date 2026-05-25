import { Suspense } from "react";
import { DatasetBuilderClient } from "../../components/dataset-builder-client";

export default function DatasetBuilderPage() {
  return (
    <Suspense fallback={<div className="shell">Loading Dataset Builder...</div>}>
      <DatasetBuilderClient />
    </Suspense>
  );
}
